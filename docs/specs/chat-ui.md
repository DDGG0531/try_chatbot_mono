聊天與後台 UI 規格（Vue）

導覽
- 公開：Home（著陸頁）、Login。
- 已登入：Chat、Conversations（側欄）、Profile、Admin（限 ADMIN）、Knowledge Base。

聊天頁（Chat）
- 版面：側欄（會話列表＋KB 選擇）＋主聊天區。
- 輸入區：多行文字框，Cmd/Ctrl+Enter 送出；模型選擇；溫度滑桿。
- 串流：顯示輸入中指示；邊到邊顯示 token；自動捲動（可暫停）。
- 操作：重產最後回覆、複製訊息、顯示/隱藏引用、刪除訊息（可選軟刪）。
- KB 選擇器：本會話使用之 KB 多選；預設取自使用者設定。

會話側欄
- 列表：分頁或無限滾動；顯示標題與時間。
- 新增：New chat 建立即時新會話。
- 搜尋：依標題/內容篩選（可後端實作）。

知識庫頁（KB）
- 列表顯示 KB 與計數（docs、chunks）；依權限新增/編輯/刪除。
- 文件：上傳檔案或新增 URL；顯示匯入狀態與錯誤。
- 重建索引：觸發重算 embeddings。

管理頁（Admin）
- 使用者表：id、email、displayName、role；下拉調整角色（USER/EDITOR/ADMIN）。
- 稽核（可選）：近期管理動作。

個人頁（Profile）
- 顯示基本資料；可設定預設模型與偏好 KB（存入 UserSetting）。

狀態與資料抓取
- 伺服器資料（會話、訊息、KB、文件）使用 Vue Query。
- UI/會話狀態（登入狀態、輸入區暫存）使用 Pinia。

無障礙與體驗
- 鍵盤：Dialog 焦點管理；跳到輸入區快捷鍵。
- 空狀態：無會話、無訊息、空 KB。
- 錯誤：短暫錯誤用 toast；表單內嵌錯誤訊息。
