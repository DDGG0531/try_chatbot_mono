RAG 規格

目標
- 允許使用者透過知識庫（KB）為聊天增加領域知識。
- 提供引用與可選引用片段，提升透明度。

匯入管線（Ingestion）
- 來源：檔案上傳（PDF/TXT/MD）、URL 抓取（HTML/Markdown）、手動文字。
- 解析：以 LangChain Document Loaders（或自研解析器）抽取文字，保留結構資訊。
- 切塊：以 LangChain Text Splitter（Markdown-aware）；每塊 500–1000 tokens、重疊 50–100。
- 向量：以 LangChain Embeddings（OpenAI 等）產生向量，存入 pgvector。
- 中繼資料：`kbId`、`docId`、`uri`、`title`、`heading`、`position`、`hash`，供去重與引用。
- 工作：非同步匯入工作入列；以 `Document.status` 與（可選）Jobs 表追蹤狀態。

檢索（Retrieval）
- Retriever：以 LangChain VectorStore Retriever（pgvector 後端）執行相似度搜尋。
- 參數：topK=8–12、相似度門檻，選配 MMR。
- 重排序：必要時以 rerank 模組進行重排。

提示組合（Prompt）
- 使用 LangChain PromptTemplate；插入系統規範、檢索片段、使用者訊息。
- 總上下文上限約 6–8k tokens（依模型）。
- 工具（後續）：可透過 LangChain Tools/Agents 擴充；結果以 tool message 或函式呼叫補充。

回覆與引用
- 串流回傳助手 token；最終在 `metadata` 附上引用（doc id 與 offset）。
- 可選在內容內嵌 [1]、[2] 標記並對應側欄引用區。

品質與評估
- 追蹤檢索指標：命中率、MRR、每查詢平均片段數。
- 反饋：訊息層級的 👍/👎，供品質迭代。

安全與隱私
- 私有 KB 僅限擁有者/成員；權限嚴格檢查。
- 清理 HTML、檢查檔案型態/大小；（可選）病毒掃描。
- URL 抓取遵守 robots.txt；失敗退避。

運維備註
- 在 `Embedding.vector` 建立 `ivfflat` 或 `hnsw` 索引以加速。
- 初期以簡單排程在 API 程序內處理背景工作；後續可遷移至訊息佇列。
