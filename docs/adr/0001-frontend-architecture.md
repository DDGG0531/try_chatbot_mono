# ADR 0001：前端架構（Vue 3 + Vite）

- 狀態：提案（Proposed）
- 日期：2025-09-07
- 擁有者：@web
- 關聯：ADR-0002（狀態）、ADR-0003（路由／權限）

背景（Context）

我們需要一套可維護、符合面試水準的前端架構，運行於 pnpm Monorepo。現況採用 Vue 3 + Vite、Vue Router、Tailwind CSS v4、Axios 與 Firebase Auth。頁面中存在重複的身分訂閱邏輯，且路由直接寫在 `main.ts`。我們希望在不重寫的前提下，以可擴充、好測試、易理解的方式漸進式優化結構。

決策（Decision）

採用模組化、以功能為切分（feature-oriented）的 Vue 3 架構，原則如下：

- 執行環境與工具：Vue 3 + Vite + TypeScript。
- 樣式與 UI：Tailwind CSS v4（utility-first）搭配 shadcn-vue 元件庫；
  - shadcn-vue 採本地化元件程式碼（非黑盒套件），可按需調整與版本控制。
  - 使用 class-variance-authority（CVA）與 tailwind-merge 管理變體與樣式合併；圖示採 lucide-vue-next。
  - 主題與色票以 CSS Variables 管理，支援深淺色與可及性（對比度）考量。
- 專案分層（位於 `apps/web/src`）：
  - `app/` — App Shell、`App.vue`、全域 Provider、錯誤邊界。
  - `routes/` — 路由表與守衛；頁面採延遲載入。
  - `pages/` — 頁面層（保持輕薄，邏輯下放至 features/widgets）。
  - `features/` — 垂直切分（如 `auth`、`profile`），同時擁有 UI 與邏輯。
  - `entities/` — 可重用的領域模型（如 `user`）。
  - `shared/` — 跨切面工具、UI 基礎元件、通用 composables。
  - `api/` — 具型別的 API Client 與 DTO；集中 Axios instance 與攔截器。
  - `stores/` — Pinia（僅客戶端／UI 狀態，詳見 ADR-0002）。
  - `composables/` — 通用 Hook（如 `useAuth`、`useToast`）。
  - `components/` — 共用 UI 基礎元件（以 shadcn-vue 為底），可擴充 headless 元件。
- 狀態：區分伺服器狀態與客戶端狀態（見 ADR-0002）。伺服器資料用 Vue Query，客戶端／UI 用 Pinia。
- 路由：集中於 `routes/index.ts`，以動態匯入達成 Code Splitting，並套用權限守衛（見 ADR-0003）。
- API：維持單一 Axios instance（`api/client.ts`），以環境變數決定 Base URL，並在需要時注入 Token。可選在邊界以 Zod 驗證 DTO。
- 測試：Vitest + Vue Test Utils；測試與程式碼同地（`*.test.ts`）。

評估選項（Options Considered）

- 維持既有鬆散結構
  - 優點：零遷移、開發者熟悉。
  - 缺點：身分邏輯重複、擴充困難、邊界不清。
- 受 FSD（Feature-Sliced Design）啟發的結構（採用）
  - 優點：所有權清楚、模組可擴充、符合面試標準慣例。
  - 缺點：前期需要結構化與紀律。
- 傳統分層（components/pages/services）
  - 優點：概念簡單。
  - 缺點：邊界易模糊，需求演進時常橫切多層。

影響（Consequences）

- 正面：更易上手、減少重複、單元可測、擴充性佳。
- 取捨：新增資料夾與慣例；需要小幅重構路由與身分邏輯。
- 相容性：可漸進導入，短期內不需破壞式變更。

實作備註（Implementation Notes）

- 短期
  - 建立 `routes/index.ts`，將路由自 `main.ts` 移出；頁面改為延遲載入。
  - 新增 `composables/useAuth.ts`，封裝 Firebase Auth 訂閱。
  - 維持 Tailwind 設定；如需全域樣式，移至 `shared/styles/`。
- 中期
  - 導入 Pinia（`stores/session.ts`）管理客戶端／UI 的 Session 狀態。
  - 導入 Vue Query 處理伺服器資料（快取／重試／請求去重）。
  - 新增 Axios 攔截器，自動附加 Firebase ID Token（若存在）。
- 測試
  - 為 composables 與 stores 撰寫單元測試；模擬 Firebase 與 Axios。
  - 為頁面條件式渲染撰寫元件測試。
