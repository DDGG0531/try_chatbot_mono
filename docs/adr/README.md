# 架構決策記錄（ADR）

此資料夾紀錄整個 Monorepo 中的重要技術與架構決策。

- 編號：補零遞增（0001、0002…）。
- 狀態：提案（Proposed）→ 已採納（Accepted）/已拒絕（Rejected）→ 已取代（Superseded）。
- 範圍：每份 ADR 聚焦單一議題；必要時相互連結。

新增 ADR 流程

1. 複製 `0000-adr-template.md` 為下一個編號檔案。
2. 依序填寫「背景、決策、評估選項、影響、實作備註」。
3. 送出 PR 並在敘述中引用該 ADR，請相關負責人審閱。

索引（Index）

- 0001 — 前端架構（Vue 3 + Vite）— 提案
- 0002 — 狀態管理分工（Pinia + Vue Query）— 提案
- 0003 — 路由與權限守衛 — 提案
- 0004 — UI 元件系統（shadcn-vue + Tailwind CSS）— 提案
