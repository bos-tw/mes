# v2.1.2 變更摘要

發布日期：2026-06-16
基底 commit：edb4176

## 本輪修正重點

- 全系統 tab 關閉前的未儲存偵測補強，降低空白表單或儲存流程造成的誤判提醒，並修正退貨單儲存時仍觸發未儲存提示的問題。
- 流水號管理改為可管理訂單、工單、庫存、出貨、退貨與部分入庫等前綴，日期範圍改為啟用時間與停用時間，讓影響期間更明確。
- 新增設備管理底下的機台能力管理，可 CRUD 維護一般、連續、玻璃、分割等能力，並在機台設備管理以一對多方式指定單一篩分能力。
- 修正配置化 modal 在單欄表單時內容擠到左側的版面問題，套用到流水號與機台能力等共用 modal。
- 修正工單列印的載具統計與載具數量一致性，避免「載具統計」與「載具數量」呈現不一致。
- 訂單確認單列印新增批號淨重顯示，並補強淨重來源與格式化邏輯。

## 資料庫異動

- `migrations/2026_06_16_rebuild_number_sequences_management.sql`
  - 重整 `number_sequences` 欄位與索引，新增前綴、啟用時間、停用時間與最後產生日期管理。
  - 補齊 `ORDER`、`WO`、`INV`、`SO`、`RO`、`WOPR` 等序列設定。
- `migrations/2026_06_16_add_machine_capabilities_management.sql`
  - 新增 `machine_capabilities` 機台能力主檔。
  - 建立預設能力：連續、玻璃、分割。
- `migrations/2026_06_16_add_machine_capability_to_machines.sql`
  - 新增 `machines.machine_capability_id`，建立機台設備到機台能力的一對多關聯。
  - 建立預設「一般」能力，並指派既有未設定能力的機台。

## 更新包

- 版本號：`v2.1.2`
- 檔案版本：`v2.1.2`
- ReleaseDate：`2026-06-16`
- Release note：`release-notes/2026-06-16-v2.1.2.txt`
