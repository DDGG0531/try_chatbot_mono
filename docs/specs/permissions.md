權限與管理

角色
- USER：預設。可聊天、查看自己的會話、使用公開 KB 與自己擁有/受邀的私有 KB。
- EDITOR（可選）：可管理 KB 與文件；不可管理使用者。
- ADMIN：完整管理權；可調整使用者角色與查看稽核。

存取矩陣（重點端點）
- /me：USER/EDITOR/ADMIN
- /conversations*：僅資源擁有者
- /chat：USER/EDITOR/ADMIN
- /kb（列表）：所有人可見公開 + 自己擁有/成員之 KB
- /kb 新增/修改/刪除：EDITOR/ADMIN 或 KB 擁有者
- /kb/:id/docs*：EDITOR/ADMIN 或 KB 擁有者
- /admin/users*：僅 ADMIN

強制機制
- Middleware 由 Firebase Token 取得使用者，並自 DB 讀取角色。
- 路由守衛檢查角色與（必要時）資源擁有權。

稽核
- 紀錄管理行為：角色變更、KB 刪除、重建索引（userId、resourceId、時間）。

UI 行為
- 非 Admin 隱藏管理導覽；Editor/Admin 顯示 KB 管理功能。
- 有助發現性時，以停用按鈕 + 提示說明權限不足。
