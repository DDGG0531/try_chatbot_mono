# ADR 0004：UI 元件系統（shadcn-vue + Tailwind CSS）

- 狀態：提案（Proposed）
- 日期：2025-09-07
- 擁有者：@web
- 關聯：ADR-0001（前端架構）

背景（Context）

我們需要一套可組合、可客製且易於維護的 UI 系統，能在面試場景下展現良好的元件設計能力與一致的設計語言。現況已使用 Tailwind CSS v4，並存在 `components.json` 與 `components/ui/button`，顯示已部分採納 shadcn-vue 的工作流程。

決策（Decision）

採用 shadcn-vue 作為 UI 元件庫基礎，樣式系統使用 Tailwind CSS v4，並遵循以下原則：

- 本地化元件程式碼：透過 shadcn-vue 的產生流程將元件拷貝到 `src/components/ui/`，由我們掌控程式碼與樣式，方便細節調整與版本控制。
- 設計語言一致性：以 CSS Variables 作為設計 Token（色彩、間距、邊框、陰影），於 `src/index.css` 或 `shared/styles/` 統一管理，支援暗色模式與對比度需求。
- 變體與樣式合併：使用 class-variance-authority（CVA）定義元件變體，並以 tailwind-merge 合併類名避免衝突。
- 圖示系統：採用 lucide-vue-next 作為預設圖示庫。
- 無障礙（a11y）：沿用 shadcn-vue 與基礎 ARIA 慣例，針對互動元件（Dialog、Popover、Tabs）提供焦點管理與鍵盤操作。

評估選項（Options Considered）

- shadcn-vue + Tailwind（採用）
  - 優點：原始碼在庫可控、可深度客製、與 Tailwind 生態契合、面試可展現元件抽象能力。
  - 缺點：需維護自有副本與樣式；需要遵循產生與更新流程。
- Element Plus / Naive UI 等完整元件庫
  - 優點：開箱即用、元件豐富。
  - 缺點：客製成本高、設計語言受限，難以展示元件設計能力。
- Headless + 自訂樣式（完全自建）
  - 優點：彈性最大。
  - 缺點：開發成本高、進度風險大、不利面試時限。

影響（Consequences）

- 正面：一致 UI／UX、良好可維護性、易於擴充；面試可展示元件變體與抽象能力。
- 取捨：需管理元件產生與升級流程；需維持設計 Token 與變體的一致性。

實作備註（Implementation Notes）

- 目錄與別名：
  - 元件放置於 `src/components/ui/*`；共用工具於 `src/lib/utils.ts`；
  - `components.json` 維持 alias：`ui` → `@/components/ui`、`utils` → `@/lib/utils`。
- Tailwind 設定：
  - 以 Tailwind v4（`@tailwindcss/vite`）驅動；在 `src/index.css` 引入 base/components/utilities；
  - 使用 CSS Variables 定義主題色（如 `--background`、`--foreground`），並在 `:root` 與 `.dark` 節點切換；
  - 保持原子化樣式，避免全域覆蓋；複雜樣式封裝成元件或變體。
- shadcn-vue 元件：
  - 以 CLI 新增：`npx shadcn-vue@latest add button input dialog ...`（依需求選用）；
  - 產生後統一經過 ESLint/Prettier；必要時抽出共用樣式與變體；
  - 建議新增 Story/示例頁面作為設計對照（可在 `/playground` 或 Docs 路由）。
- 圖示：
  - 使用 `lucide-vue-next`；以最小集合為原則按需載入。
- 測試：
  - 組件層級測試（Props/Slots/交互）；
  - a11y 檢查（焦點循環、鍵盤操作）；
  - 快照限於簡單展示，不作為主要回歸機制。

遷移策略（Migration）

- 舊有 UI 元件逐步改寫為 shadcn-vue 結構；保留 API 相容層（必要時）。
- 將常用元件（Button、Input、Dialog、Dropdown、Tabs、Toast）先行導入；其餘依功能需求增補。
