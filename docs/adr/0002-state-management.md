# ADR 0002：狀態管理分工（Pinia + Vue Query）

- 狀態：提案（Proposed）
- 日期：2025-09-07
- 擁有者：@web
- 關聯：ADR-0001（前端架構）、ADR-0003（路由／權限）

背景（Context）

目前以區域 `ref` 與各頁面自行訂閱 Firebase 方式管理狀態。隨著頁面、偏好設定與伺服器互動增加，需要明確的狀態邊界、快取策略，並避免重複邏輯。

決策（Decision）

採雙軌並行策略：

- 伺服器狀態：使用 `@tanstack/vue-query` 管理 API 資料（擷取、快取、重試、背景更新、去重、樂觀更新）。
- 客戶端狀態：使用 Pinia 管理純 UI／Session 狀態（登入狀態、功能開關、短暫 UI 狀態）。

準則（Guidelines）

- 將伺服器狀態視為「可重新取得的快取」，不要把伺服器資料複製到 Pinia。
- 查詢與變更邏輯與功能模組同地放置；使用具型別 DTO 與一致的錯誤處理。
- 使用 `useAuth()` composable 封裝 Firebase Auth，並提供 `session` Pinia store 供 UI 取用（例如 `isLoading`、`hasOnboarded`）。
- 統一使用 `api/client.ts` 的 Axios instance；加入攔截器於需要時注入 Firebase ID Token。

評估選項（Options Considered）

- 僅用 Pinia
  - 優點：依賴較少。
  - 缺點：需自行實作快取／請求去重／重試；樣板代碼多。
- 僅用 Vue Query
  - 優點：處理伺服器資料表現優異。
  - 缺點：不利於管理純客戶端狀態，需繞路實作。
- Pinia + Vue Query（採用）
  - 優點：各司其職，關注點分離清晰。
  - 缺點：需理解兩個函式庫與簡單整合。

影響（Consequences）

- 正面：減少重複、標準化資料擷取、測試更簡單。
- 取捨：需要初始設定；些微執行期額外負擔。

實作備註（Implementation Notes）

- 安裝：`pnpm --filter apps/web add @tanstack/vue-query pinia`。
- Provider：在 `main.ts` 以 `VueQueryPlugin` 與 `createPinia()` 包裹 App。
- Composables：建立 `features/auth/useAuth.ts`，串接 Firebase → Pinia session。
- Axios：新增 request 攔截器，附加 `Authorization: Bearer <idToken>`。
- 測試：單元測試中模擬 QueryClient 與 Pinia；驗證快取行為。
