# ADR 0003：路由與權限守衛

- 狀態：提案（Proposed）
- 日期：2025-09-07
- 擁有者：@web
- 關聯：ADR-0001（前端架構）、ADR-0002（狀態）

背景（Context）

目前路由直接寫在 `main.ts`，各頁面也各自訂閱 Firebase Auth 狀態。我們希望使用延遲載入、集中式的權限守衛，以及一處作為身分狀態的「單一真實來源」。

決策（Decision）

- 將路由定義移至 `src/routes/index.ts`，頁面以動態匯入實現延遲載入。
- 受保護路由加上 `meta.requiresAuth = true`。
- 新增全域 `beforeEach` 守衛，從 session store/composable 讀取狀態，未登入者導向 `/`。
- 免登入路由維持公開存取。

評估選項（Options Considered）

- 以頁面為單位檢查權限
  - 優點：靠近使用處、顯性。
  - 缺點：重複且易產生差異，稽核困難。
- 全域守衛（採用）
  - 優點：集中且一致、易於測試。
  - 缺點：需在 Router 前準備好 store/composable。

影響（Consequences）

- 正面：減少重複、體驗一致、易於擴張保護區塊。
- 取捨：多一層間接性；守衛邏輯需輕量高效。

實作備註（Implementation Notes）

- 建立 `src/routes/index.ts`：
  - 匯出 `createAppRouter()` 用以建立 history、routes 與 guards。
  - 以動態匯入定義頁面：`component: () => import('@/pages/Profile.vue')`。
  - 透過 `useSession()` 或 `useAuth()` 取得身分狀態以執行守衛。
- 更新 `main.ts`，改用 `createAppRouter()`。
- 測試：以模擬的 store 進行單元測試；驗證導向與存取行為。
