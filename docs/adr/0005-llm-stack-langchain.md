# 0005 – 採用 LangChain 作為 LLM/RAG 編排層

狀態: Accepted
日期: 2025-09-07

背景
- 專案需要聊天（串流）與 RAG 能力，且未來可能擴充工具使用、不同 LLM 供應商、Retrieval 策略。
- 需避免過度綁定單一 Provider SDK，並希望有健全的 Prompt/Retriever 抽象與社群生態。

決策
- 採用 LangChain（Node/TS）作為 LLM/RAG 編排層：
  - 使用 PromptTemplate 管理提示模板與變數注入。
  - 使用 Runnable/Chain 組裝流程（Retriever → Prompt → LLM）。
  - 使用 VectorStore Retriever（pgvector）進行相似度檢索。
  - 使用 Provider 套件（如 `@langchain/openai`）接入 LLM 與 Embeddings。
  - 使用 streaming 介面將 token 事件透過 SSE 回傳前端。

影響
- API `/chat` 將以 LangChain 進行串流生成；RAG 以 LangChain Retriever。
- 文件匯入/切塊/嵌入流程可沿用 LangChain 標準元件，降低自維護成本。
- 依賴新增：`langchain`、`@langchain/openai`（或其他 Provider 套件）。

替代方案
- 直接使用 OpenAI SDK 或 `ai-sdk`：
  - 優點：更輕量、直觀。
  - 缺點：RAG 與工具鏈需自建抽象，長期維護成本高。
- 自研框架：
  - 優點：完全掌控；最低依賴。
  - 缺點：開發/維護成本高；生態與社群資源不足。

後續
- 在 M2/M3 中以 LangChain 實作 `/chat` 串流與 RAG 檢索。
- 將 Prompt 與 Chain 配置化（版本化）以利 A/B 與調參。

