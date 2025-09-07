import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validate';
import { authMiddleware } from '@/middleware/auth';
import type { AuthUser } from '@/types/user';
import { prisma } from '@/prisma';
import { makeSimpleGraph, toLcMessages } from '@/llm/graph';
import { vectorStore } from '@/rag/vector-store';

export const chatRouter = Router();

const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  kbId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant', 'tool']),
        content: z.string().min(1),
      }),
    )
    .min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

type ChatReq = z.infer<typeof chatRequestSchema>;

function sseWrite(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

chatRouter.post(
  '/chat',
  authMiddleware,
  validate({ body: chatRequestSchema }),
  async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // 簡化：不額外送開場或 keepalive，避免不必要複雜度

    const user = req.user as AuthUser;
    const vbody = (req as any).validated!.body as ChatReq;
    const { conversationId, kbId, messages, model, temperature } = vbody;

    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await prisma.conversation.create({
          data: {
            userId: user.id,
            title:
              (messages as any).findLast?.((m: any) => m.role === 'user')?.content?.slice(0, 50) ||
              '新的會話',
          },
        });
        convId = conv.id;
      }

      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        await prisma.message.create({
          data: {
            conversationId: convId!,
            role: 'user',
            content: lastUserMsg.content,
            reference: 'user',
          },
        });
      }

      let assistantContent = '';
      const replyInZhHant = '請以繁體中文回答，簡潔扼要。';

      // 若指定了 kbId，先檢查擁有權並檢索相關文件
      let contextText = '';
      let citations: Array<{ id: string; score: number }> = [];
      if (kbId) {
        // 允許使用公開 KB 或自己的 KB
        const kbAccess = await prisma.knowledgeBase.findFirst({ where: { id: kbId, OR: [{ userId: user.id }, { isPublic: true }] } });
        if (kbAccess && process.env.OPENAI_API_KEY) {
          const lastUser = [...messages].reverse().find((m) => m.role === 'user');
          const query = lastUser?.content?.slice(0, 2000) || '';
          try {
            // 依 kbId 過濾文件
            const results = (await (vectorStore as any).similaritySearchWithScore(query, 6, {
              kbId: { equals: kbId },
            })) as Array<[any, number]>;
            citations = results
              .map(([doc, score]) => ({ id: doc.id || doc?.metadata?.id, score }))
              .filter((c) => typeof c.id === 'string')
              .slice(0, 6);
            contextText = results
              .map(([doc]) => String(doc.pageContent || doc.content || ''))
              .filter(Boolean)
              .join('\n---\n')
              .slice(0, 8000);
          } catch (_e) {
            // 檢索錯誤不應中斷聊天流程
          }
        }
      }

      if (!process.env.OPENAI_API_KEY) {
        // 模擬逐字串流：不依賴外部 API
        const demo = `${replyInZhHant}\n（模擬）系統目前未設定 OpenAI API Key。這是一段逐字串流的示意文字。`;
        for (const ch of demo) {
          assistantContent += ch;
          sseWrite(res, { type: 'delta', content: ch });
          await new Promise((r) => setTimeout(r, 10));
        }
      } else {
        const graph = makeSimpleGraph({ model, temperature });
        const systemPrefix = contextText
          ? `${replyInZhHant}\n以下為知識庫內容，請盡量引用且勿捏造：\n${contextText}`
          : `${replyInZhHant}`;
        const lcMessages = toLcMessages([
          { role: 'system', content: systemPrefix },
          ...messages,
        ]);
        const stream = await (graph as any).stream({ messages: lcMessages }, { streamMode: 'messages' });
        for await (const evt of stream as any) {
          // 嘗試從事件中萃取文本內容（不同版本結構略有差異）
          const maybeMessages = Array.isArray(evt) ? evt : (evt?.messages ?? evt?.data ?? [evt]);
          const arr = Array.isArray(maybeMessages) ? maybeMessages : [maybeMessages];
          for (const msg of arr) {
            const content = (msg?.content ?? '') as any;
            let piece = '';
            if (typeof content === 'string') piece = content;
            else if (Array.isArray(content)) piece = content.map((p: any) => p?.text ?? '').join('');
            if (piece) {
              assistantContent += piece;
              sseWrite(res, { type: 'delta', content: piece });
            }
          }
        }
      }

      const saved = await prisma.message.create({
        data: {
          conversationId: convId!,
          role: 'assistant',
          content: assistantContent,
          reference: 'assistant',
          citations: citations as any,
        },
      });

      sseWrite(res, { type: 'metadata', citations, usage: undefined });
      sseWrite(res, { type: 'done', messageId: saved.id, conversationId: convId });
      res.end();
    } catch (_err) {
      sseWrite(res, { type: 'error', message: 'Chat failed' });
      try { res.end(); } catch {}
    }
  },
);
