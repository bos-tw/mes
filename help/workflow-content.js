/**
 * 精密光學篩選管理系統 - 完整業務流程補充內容
 *
 * @version 1.0.0
 * @date 2026-02-10
 * @description 補充核心業務流程的詳細說明
 */

// 這些內容需要整合到 content.js 的 articles 部分
const WORKFLOW_ARTICLES = {
    'operation-production-flow': {
        title: '系統操作及生管流程圖',
        content: `
<h1>系統操作及生管流程圖</h1>

<p>本頁用一張流程圖串起日常操作與生管主流程，適合新進人員、跨部門交接或排查訂單卡關點時快速對照。</p>

<div class="info">
    <div><strong>閱讀方式：</strong>由左至右、由上而下看主流程；每一個節點下方列出主要操作模組與產出資料。若只需要處理客戶批號完整資料，可從訂單細項的「開啟完整明細」進入客戶批號頁。</div>
</div>

<h2>主流程圖</h2>

<div class="process-map" aria-label="系統操作及生管主流程圖">
    <section class="process-lane">
        <h3>前置設定</h3>
        <div class="process-row">
            <article class="process-node setup">
                <span class="node-step">01</span>
                <h4>建立基礎資料</h4>
                <p>公司、客戶、員工、部門、受篩產品、篩分服務、機台、載具。</p>
                <div class="node-output">輸出：可被訂單與工單引用的主檔</div>
            </article>
            <article class="process-node setup">
                <span class="node-step">02</span>
                <h4>設定系統規則</h4>
                <p>代碼、流水號、系統參數、角色與權限。</p>
                <div class="node-output">輸出：狀態、單號與操作權限基準</div>
            </article>
        </div>
    </section>

    <section class="process-lane">
        <h3>接單與生管</h3>
        <div class="process-row">
            <article class="process-node order">
                <span class="node-step">03</span>
                <h4>建立訂單主表</h4>
                <p>輸入客戶、訂單日期、預計交期、客戶訂單編號與備註。</p>
                <div class="node-output">模組：訂單主表</div>
                <div class="node-print">列印：客戶代工委託確認單</div>
            </article>
            <article class="process-node order">
                <span class="node-step">04</span>
                <h4>建立客戶批號</h4>
                <p>輸入客戶批號、受篩產品、重量、單價、服務項目、載具、圖面與附件。</p>
                <div class="node-output">模組：訂單展開細項 / 客戶批號</div>
            </article>
            <article class="process-node plan">
                <span class="node-step">05</span>
                <h4>轉生產工單</h4>
                <p>由客戶批號建立工單，安排機台、作業人員、預計日期與工作內容。</p>
                <div class="node-output">輸出：生產工單、現場工作單</div>
                <div class="node-print">列印：現場工作單 / 生產命令單</div>
            </article>
        </div>
    </section>

    <section class="process-lane">
        <h3>現場生產</h3>
        <div class="process-row">
            <article class="process-node production">
                <span class="node-step">06</span>
                <h4>首件檢驗</h4>
                <p>記錄頭高、頭寬、全長、牙外徑等尺寸，確認可量產。</p>
                <div class="node-output">模組：首件檢驗</div>
            </article>
            <article class="process-node production">
                <span class="node-step">07</span>
                <h4>登錄生產紀錄</h4>
                <p>依載具或批次登錄卡號、重量、良品與不良品數量。</p>
                <div class="node-output">模組：生產紀錄</div>
            </article>
            <article class="process-node quality">
                <span class="node-step">08</span>
                <h4>品質檢驗與異常</h4>
                <p>記錄生產品質檢驗；若超規或客訴，建立品質異常報告。</p>
                <div class="node-output">模組：品質管理</div>
            </article>
        </div>
    </section>

    <section class="process-lane">
        <h3>完工、庫存與出貨</h3>
        <div class="process-row">
            <article class="process-node inventory">
                <span class="node-step">09</span>
                <h4>工單完工入庫</h4>
                <p>工單完成後建立庫存品項與入庫異動，保留來源工單與客戶批號追溯。</p>
                <div class="node-output">模組：生產工單 / 庫存管理</div>
                <div class="node-print">列印：品質檢驗報表</div>
            </article>
            <article class="process-node shipping">
                <span class="node-step">10</span>
                <h4>建立出貨單</h4>
                <p>依可出貨庫存建立出貨單與出貨明細，確認後扣減庫存。</p>
                <div class="node-output">模組：出貨管理</div>
                <div class="node-print">列印：出貨單</div>
            </article>
            <article class="process-node shipping">
                <span class="node-step">11</span>
                <h4>出貨品檢與列印</h4>
                <p>需要時執行出貨品質檢驗，列印出貨單與品質檢驗報表。</p>
                <div class="node-output">輸出：出貨單、檢驗報表</div>
            </article>
        </div>
    </section>

    <section class="process-lane">
        <h3>例外與追蹤</h3>
        <div class="process-row">
            <article class="process-node exception">
                <span class="node-step">12</span>
                <h4>退貨與重工</h4>
                <p>發生退貨、補篩或重工時，建立退貨單並回溯原出貨、庫存、工單與客戶批號。</p>
                <div class="node-output">模組：退貨管理 / 品質異常</div>
                <div class="node-print">列印：退貨單</div>
            </article>
            <article class="process-node exception">
                <span class="node-step">13</span>
                <h4>查詢與稽核</h4>
                <p>使用儀表板、操作日誌、訊息通知與各列表篩選追蹤進度。</p>
                <div class="node-output">模組：儀表板 / 操作日誌</div>
            </article>
        </div>
    </section>
</div>

<h2>流程列印表單對照表</h2>

<table>
    <thead>
        <tr>
            <th>流程時點</th>
            <th>列印表單</th>
            <th>列印入口</th>
            <th>主要用途</th>
            <th>交付對象</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>訂單建立並確認內容後</td>
            <td><strong>客戶代工委託確認單</strong></td>
            <td>訂單主表列表 → 列印</td>
            <td>讓客戶確認訂單、批號、受篩產品、服務項目、重量與備註</td>
            <td>客戶 / 業務留存</td>
        </tr>
        <tr>
            <td>客戶批號轉成生產工單後</td>
            <td><strong>現場工作單 / 生產命令單</strong></td>
            <td>生產工單列表 → 列印工單</td>
            <td>提供現場作業依據，包含工單資料、產品規格、載具、服務項目與空白紀錄欄</td>
            <td>現場人員 / 生管</td>
        </tr>
        <tr>
            <td>工單完工、品質資料完成後</td>
            <td><strong>品質檢驗報表</strong></td>
            <td>生產工單列表 → 列印篩分檢驗報表</td>
            <td>彙整篩分結果、不良分類、品質統計與檢驗說明</td>
            <td>客戶 / 品管 / 業務</td>
        </tr>
        <tr>
            <td>建立並確認出貨單後</td>
            <td><strong>出貨單</strong></td>
            <td>出貨管理列表 → 列印</td>
            <td>作為隨貨文件，記錄出貨單號、客戶、出貨品項與數量</td>
            <td>客戶 / 倉管 / 司機</td>
        </tr>
        <tr>
            <td>發生退貨並建立退貨單後</td>
            <td><strong>退貨單</strong></td>
            <td>退貨管理列表 → 列印</td>
            <td>記錄退貨來源、退貨原因、退貨品項與後續處理依據</td>
            <td>客戶 / 品管 / 倉管</td>
        </tr>
    </tbody>
</table>

<div class="warning">
    <div><strong>列印原則：</strong>委託確認單在接單確認時列印；現場工作單在排程派工時列印；品質檢驗報表在工單完工且品質資料完整後列印；出貨單在出貨確認後列印；退貨單在退貨資料建立後列印。</div>
</div>

<h2>角色與主要操作</h2>

<table>
    <thead>
        <tr>
            <th>角色</th>
            <th>主要負責流程</th>
            <th>常用模組</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>業務 / 接單</td>
            <td>建立訂單主表、確認客戶訂單資訊、列印委託確認單</td>
            <td>客戶管理、訂單主表、客戶批號</td>
        </tr>
        <tr>
            <td>生管</td>
            <td>檢查交期與產能、由客戶批號轉工單、追蹤工單狀態</td>
            <td>訂單主表、客戶批號、生產工單、機台管理</td>
        </tr>
        <tr>
            <td>現場</td>
            <td>依工作單生產、登錄卡號重量、回報不良數量</td>
            <td>生產工單、生產紀錄、首件檢驗</td>
        </tr>
        <tr>
            <td>品管</td>
            <td>首件、生產與出貨檢驗；建立品質異常報告</td>
            <td>首件檢驗、生產品質檢驗、出貨品質檢驗、品質異常報告</td>
        </tr>
        <tr>
            <td>倉管 / 出貨</td>
            <td>查詢可出貨庫存、建立出貨單、處理退貨</td>
            <td>庫存管理、庫存異動、出貨管理、退貨管理</td>
        </tr>
    </tbody>
</table>

<h2>日常操作檢核表</h2>

<ol class="steps">
    <li><strong>開工前：</strong>確認基礎資料、機台、載具、受篩產品與服務項目已建立。</li>
    <li><strong>接單時：</strong>先建訂單主表，再建立客戶批號；一張訂單可包含多個客戶批號，內容確認後列印客戶代工委託確認單。</li>
    <li><strong>排程時：</strong>由客戶批號建立工單，避免直接建立無來源工單，確保後續可追溯；派工前列印現場工作單。</li>
    <li><strong>生產中：</strong>首件檢驗與生產紀錄要跟工單綁定，不良類別要即時記錄。</li>
    <li><strong>完工後：</strong>確認工單狀態與庫存入庫資料，避免已完工但未形成可出貨庫存；品質資料完成後列印品質檢驗報表。</li>
    <li><strong>出貨前：</strong>確認可出貨數量、出貨品檢與出貨單列印需求。</li>
    <li><strong>異常時：</strong>從品質異常或退貨單回溯到出貨、庫存、工單、客戶批號與訂單；退貨成立時列印退貨單。</li>
</ol>

<h2>使用指南內容檢討</h2>

<div class="tip">
    <div>目前指南已涵蓋快速入門、完整業務流程、各功能模組、權限、FAQ 與故障排除；對新手來說，加入本流程圖後，入口導覽更完整。</div>
</div>

<table>
    <thead>
        <tr>
            <th>檢查項目</th>
            <th>目前狀況</th>
            <th>建議</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>整體流程理解</td>
            <td>已有文字版業務流程，這次補上視覺流程圖</td>
            <td>已改善</td>
        </tr>
        <tr>
            <td>模組操作說明</td>
            <td>主要模組皆有章節</td>
            <td>後續新功能上線時同步補圖例與操作截圖</td>
        </tr>
        <tr>
            <td>角色分工</td>
            <td>權限章節有說明，本頁新增流程角色對照</td>
            <td>已改善</td>
        </tr>
        <tr>
            <td>例外流程</td>
            <td>退貨、品質異常已有章節，但可再加案例</td>
            <td>建議後續補「客訴退貨到重工」情境教學</td>
        </tr>
        <tr>
            <td>畫面截圖</td>
            <td>目前多為文字與表格</td>
            <td>建議待 UI 穩定後補常用流程截圖</td>
        </tr>
    </tbody>
</table>
        `
    },

    'workflow-overview': {
        title: '業務流程總覽',
        content: `
<h1>業務流程總覽</h1>

<div class="info">
    <div><strong>本章節概述精密光學篩選管理系統的完整業務流程，幫助您快速理解系統運作邏輯。</strong></div>
</div>

<h2>精密光學篩選業務簡介</h2>

<p>精密光學篩選工廠接收客戶（通常是螺絲製造商或貿易商）的委託，對螺絲進行品質檢驗與篩選，確保出貨品質符合規格要求。主要業務流程包括：</p>

<ol>
    <li><strong>接收訂單</strong>：客戶下訂單，指定篩選規格與公差標準</li>
    <li><strong>安排生產</strong>：建立工單，分配機台與人力</li>
    <li><strong>執行篩選</strong>：現場人員操作精密篩選設備，登記品質數據</li>
    <li><strong>入庫管理</strong>：篩選完成後，良品自動入庫</li>
    <li><strong>出貨作業</strong>：依客戶需求出貨，扣減庫存</li>
</ol>

<h2>系統五大核心流程圖</h2>

<ol class="steps-alpha">
    <li>
        <strong>訂單管理</strong><br>
        接收客戶訂單 → 建立訂單主表 → 建立客戶批號（訂單明細）
        <ol class="steps-sub">
            <li>填寫：數量、規格、公差、PPM、服務項目</li>
            <li>列印：委託確認單（給客戶確認）</li>
        </ol>
    </li>
    <li>
        <strong>生產工單</strong><br>
        選擇客戶批號 → 建立生產工單 → 分配機台/員工/載具
        <ol class="steps-sub">
            <li>列印：現場工作單（A4，給現場人員）</li>
            <li>現場作業：填寫卡號、重量、篩分不良數量</li>
            <li>首件檢驗：記錄頭高、頭寬、全長、牙外徑等尺寸</li>
        </ol>
    </li>
    <li>
        <strong>工單完工 → 自動入庫</strong>
        <ol class="steps-sub">
            <li>工單狀態 = 「已完成」→ 觸發自動入庫</li>
            <li>計算良品支數 = 總支數 - 不良品支數</li>
            <li>建立庫存品項（inventory_items）</li>
            <li>建立庫存異動記錄（inventory_transactions，direction = inbound）</li>
            <li>庫存品項包含：良品支數、不良品支數、總重量</li>
        </ol>
    </li>
    <li>
        <strong>出貨作業</strong><br>
        檢查庫存可出貨數量 → 建立出貨單 → 選擇庫存品項
        <ol class="steps-sub">
            <li>出貨確認 → 扣減庫存（inventory_transactions，direction = outbound）</li>
            <li>更新客戶批號的累計已出貨數量（total_shipped_quantity）</li>
            <li>列印：出貨單、品質檢驗報表</li>
        </ol>
    </li>
    <li>
        <strong>品質追蹤</strong>
        <ol class="steps-sub">
            <li>生產階段：記錄篩分不良品數量與類別</li>
            <li>工單完工：計算不良率、產生圓餅圖</li>
            <li>出貨階段：可選進行出貨品質檢驗</li>
            <li>異常處理：建立品質異常報告</li>
        </ol>
    </li>
</ol>

<h2>關鍵單據與時機</h2>

<table>
    <thead>
        <tr>
            <th>單據名稱</th>
            <th>產生時機</th>
            <th>用途</th>
            <th>規格</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>委託確認單</strong></td>
            <td>建立訂單後</td>
            <td>給客戶確認訂單內容與規格</td>
            <td>A4</td>
        </tr>
        <tr>
            <td><strong>現場工作單</strong></td>
            <td>建立工單後</td>
            <td>給現場人員執行篩分作業</td>
            <td>A4</td>
        </tr>
        <tr>
            <td><strong>出貨單</strong></td>
            <td>出貨確認時</td>
            <td>隨貨附上，記錄出貨內容</td>
            <td>A4 一半（連續報表紙）</td>
        </tr>
        <tr>
            <td><strong>品質檢驗報表</strong></td>
            <td>工單完工/出貨時</td>
            <td>提供客戶，顯示品質數據與不良率</td>
            <td>A4</td>
        </tr>
    </tbody>
</table>

<h2>狀態轉換邏輯</h2>

<h3>訂單狀態</h3>
<ul>
    <li><strong>Draft（草稿）</strong> → 訂單建立中，尚未確認</li>
    <li><strong>Confirmed（已確認）</strong> → 訂單確認，可建立工單</li>
    <li><strong>In Production（生產中）</strong> → 至少一張工單開始生產</li>
    <li><strong>Completed（已完工）</strong> → 所有工單完成</li>
    <li><strong>Closed（已結案）</strong> → 已出貨且結案</li>
</ul>

<h3>工單狀態</h3>
<ul>
    <li><strong>Pending（待開始）</strong> → 工單建立，尚未開始生產</li>
    <li><strong>In Progress（進行中）</strong> → 現場作業中</li>
    <li><strong>Completed（已完成）</strong> → 工單完成 → <strong>觸發自動入庫</strong></li>
    <li><strong>Closed（已結案）</strong> → 工單結案</li>
</ul>

<h3>庫存狀態</h3>
<ul>
    <li><strong>Available（可用）</strong> → 可正常出貨</li>
    <li><strong>Reserved（已保留）</strong> → 已分配給特定訂單</li>
    <li><strong>On Hold（暫停）</strong> → 品質問題，暫不出貨</li>
</ul>

<h2>資料關聯圖</h2>

<ul>
    <li>
        <strong>orders（訂單主表）</strong>
        <ul>
            <li>
                <strong>order_items（客戶批號）</strong> — 1 張訂單可有多個批號
                <ul>
                    <li>order_item_screening_details（篩分服務項目明細）</li>
                    <li>order_item_tools（載具配置）</li>
                    <li>order_item_drawings（圖面）</li>
                    <li>order_item_attachments（附件）</li>
                </ul>
            </li>
            <li>
                <strong>work_orders（工單）</strong> — 1 個客戶批號可建立多張工單
                <ul>
                    <li>work_order_screening_defects（篩分不良記錄）</li>
                    <li>work_order_first_piece_dimensions（首件檢驗尺寸）</li>
                    <li>production_records（生產記錄）</li>
                    <li>
                        <strong>inventory_items（庫存品項）</strong> — 工單完工後自動建立
                        <ul>
                            <li>
                                <strong>inventory_transactions（庫存異動）</strong>
                                <ul>
                                    <li>inbound（入庫）</li>
                                    <li>outbound（出庫）</li>
                                </ul>
                            </li>
                            <li>
                                <strong>shipping_order_items（出貨單明細）</strong>
                                <ul>
                                    <li>shipping_orders（出貨單主表）</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </li>
</ul>

<h2>權限控制</h2>

<table>
    <thead>
        <tr>
            <th>角色</th>
            <th>可執行操作</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>管理員</strong></td>
            <td>所有功能</td>
        </tr>
        <tr>
            <td><strong>生管人員</strong></td>
            <td>訂單管理、工單排程、庫存查詢</td>
        </tr>
        <tr>
            <td><strong>現場人員</strong></td>
            <td>工單查詢、生產記錄登錄、品質記錄</td>
        </tr>
        <tr>
            <td><strong>品管人員</strong></td>
            <td>品質檢驗、異常報告、品質統計</td>
        </tr>
        <tr>
            <td><strong>倉管人員</strong></td>
            <td>庫存管理、出貨作業、退貨處理</td>
        </tr>
    </tbody>
</table>

<div class="tip">
    <div><strong>提示：</strong>建議新進人員先閱讀本章節，理解整體流程後，再深入學習各功能模組的詳細操作。</div>
</div>

<h2>常見業務場景</h2>

<h3>場景 1：接收新訂單</h3>
<ol>
    <li>客戶來電或 Email 詢價 → 業務人員報價</li>
    <li>客戶下單 → 在系統建立訂單主表</li>
    <li>輸入客戶批號、規格、數量、公差、PPM</li>
    <li>列印委託確認單給客戶確認簽名</li>
    <li>客戶確認後，訂單狀態改為「已確認」</li>
</ol>

<h3>場景 2：安排生產</h3>
<ol>
    <li>生管人員檢視已確認的訂單</li>
    <li>依交期與產能，建立工單</li>
    <li>分配機台（如：大型玻璃盤 A-01）</li>
    <li>分配載具（如：10kg標準桶）</li>
    <li>指定負責員工</li>
    <li>列印現場工作單給現場人員</li>
</ol>

<h3>場景 3：現場作業</h3>
<ol>
    <li>現場人員依現場工作單操作精密篩選設備</li>
    <li>填寫卡號、重量</li>
    <li>記錄篩分不良品數量（如：頭高不良 50 支、牙外徑不良 30 支）</li>
    <li>首件檢驗：量測頭高、頭寬、全長、牙外徑</li>
    <li>作業完成後，工單狀態改為「已完成」</li>
</ol>

<h3>場景 4：自動入庫</h3>
<ol>
    <li>工單狀態變更為「已完成」→ 系統自動觸發入庫</li>
    <li>計算良品支數 = 總支數 - 不良品支數</li>
    <li>建立庫存品項，記錄良品/不良品數量、總重量</li>
    <li>建立庫存異動記錄（方向：inbound）</li>
    <li>庫存可用數量增加</li>
</ol>

<h3>場景 5：出貨作業</h3>
<ol>
    <li>倉管人員依交期建立出貨單</li>
    <li>選擇庫存品項（檢查可出貨數量）</li>
    <li>輸入出貨數量（可部分出貨）</li>
    <li>出貨確認 → 扣減庫存（建立 outbound 異動記錄）</li>
    <li>更新客戶批號的累計已出貨數量</li>
    <li>列印出貨單、品質檢驗報表</li>
</ol>

<h2>下一步</h2>

<ul>
    <li>閱讀 <a href="#workflow-order-to-shipping">訂單到出貨完整流程</a> 了解詳細操作步驟</li>
    <li>閱讀 <a href="#workflow-inventory">庫存入庫機制</a> 了解自動入庫邏輯</li>
    <li>閱讀 <a href="#workflow-printing">單據列印完整指南</a> 了解列印功能</li>
    <li>閱讀 <a href="#workflow-quality">品質檢驗流程</a> 了解品質管理</li>
</ul>
        `
    },

    'workflow-order-to-shipping': {
        title: '訂單到出貨完整流程',
        content: `
<h1>訂單到出貨完整流程</h1>

<div class="info">
    <div><strong>本章節詳細說明從接收訂單到出貨的完整操作流程，包含所有關鍵步驟與注意事項。</strong></div>
</div>

<h2>流程概覽（5 個階段）</h2>

<div class="workflow-diagram">
    <pre class="flow-overview-diagram">
階段 1：訂單建立    → 階段 2：工單排程    → 階段 3：現場生產
     ↓                     ↓                     ↓
階段 4：自動入庫    → 階段 5：出貨作業
    </pre>
</div>

<h2>階段 1：訂單建立</h2>

<h3>1.1 建立訂單主表</h3>

<ol class="steps">
    <li>
        <strong>開啟訂單管理</strong><br>
        側邊選單 → 訂單管理 → 訂單主表
    </li>
    <li>
        <strong>點擊「新增」按鈕</strong>
    </li>
    <li>
        <strong>填寫訂單基本資料</strong>
        <ul>
            <li><strong>客戶</strong>：選擇客戶（必填）</li>
            <li><strong>訂單日期</strong>：系統自動帶入當日日期</li>
            <li><strong>交貨日期</strong>：與客戶約定的交期</li>
            <li><strong>PO單號</strong>：客戶的採購單號（選填）</li>
            <li><strong>訂單狀態</strong>：預設為「草稿」</li>
            <li><strong>付款條件</strong>：如「月結30天」</li>
            <li><strong>備註</strong>：特殊要求或注意事項</li>
        </ul>
    </li>
    <li>
        <strong>點擊「儲存」</strong><br>
        系統自動產生訂單編號（如：ORD-20260210-0001）
    </li>
</ol>

<div class="warning">
    <div><strong>重要：</strong>建立訂單主表後，需要繼續建立「客戶批號」（訂單明細），訂單才算完整。</div>
</div>

<h3>1.2 建立客戶批號（訂單明細）</h3>

<ol class="steps">
    <li>
        <strong>在訂單主表列表中，點擊訂單的「詳情」按鈕</strong>
    </li>
    <li>
        <strong>在客戶批號區塊，點擊「新增」</strong>
    </li>
    <li>
        <strong>填寫客戶批號資料</strong>
        <ul>
            <li><strong>客戶批號</strong>：客戶提供的批次編號（必填）</li>
            <li><strong>受篩產品</strong>：選擇螺絲規格（如：M3x10 十字圓頭螺絲）</li>
            <li><strong>預估數量</strong>：客戶委託的總支數</li>
            <li><strong>預估重量</strong>：來料總重量（kg）</li>
            <li><strong>預估單重</strong>：每支螺絲的重量（g），可自動計算</li>
            <li><strong>備註</strong>：特殊要求</li>
        </ul>
    </li>
    <li>
        <strong>設定篩分服務項目</strong><br>
        在「篩分服務項目」區塊，點擊「新增」：
        <ul>
            <li><strong>篩分項目</strong>：如「頭高」、「全長」、「牙外徑」</li>
            <li><strong>標準值</strong>：規格標準值（mm）</li>
            <li><strong>公差</strong>：允許誤差範圍（mm）</li>
            <li><strong>單價</strong>：該服務項目的單價</li>
            <li><strong>PPM</strong>：允許的不良率 (Parts Per Million)</li>
        </ul>
    </li>
    <li>
        <strong>設定載具配置（選填）</strong><br>
        指定生產時使用的桶或船：
        <ul>
            <li><strong>工具</strong>：選擇載具（如：10kg標準桶）</li>
            <li><strong>數量</strong>：需要幾個</li>
            <li><strong>單位重量</strong>：每個載具的重量（kg）</li>
        </ul>
    </li>
    <li>
        <strong>上傳圖面或附件（選填）</strong>
    </li>
    <li>
        <strong>點擊「儲存」</strong>
    </li>
</ol>

<h3>1.3 列印委託確認單</h3>

<ol class="steps">
    <li>在訂單主表列表中，點擊訂單的「列印」按鈕</li>
    <li>系統開啟列印預覽頁面，顯示：
        <ul>
            <li>公司資訊與 LOGO</li>
            <li>客戶資訊</li>
            <li>訂單基本資料（訂單編號、日期、交期）</li>
            <li>客戶批號列表</li>
            <li>篩分服務項目與規格</li>
            <li>載具配置</li>
            <li>備註</li>
        </ul>
    </li>
    <li>點擊瀏覽器的「列印」按鈕</li>
    <li>列印後給客戶確認簽名</li>
</ol>

<h3>1.4 確認訂單</h3>

<ol class="steps">
    <li>客戶簽名確認後，回到訂單主表</li>
    <li>點擊訂單的「編輯」按鈕</li>
    <li>將「訂單狀態」改為「已確認」</li>
    <li>點擊「儲存」</li>
</ol>

<div class="tip">
    <div><strong>提示：</strong>只有「已確認」狀態的訂單，才能建立工單進行生產。</div>
</div>

<h2>階段 2：工單排程</h2>

<h3>2.1 建立生產工單</h3>

<ol class="steps">
    <li>
        <strong>開啟工單管理</strong><br>
        側邊選單 → 生產作業 → 生產工單
    </li>
    <li>
        <strong>點擊「新增」按鈕</strong>
    </li>
    <li>
        <strong>選擇客戶批號</strong><br>
        從下拉選單選擇要生產的客戶批號（只會顯示「已確認」狀態的訂單）
    </li>
    <li>
        <strong>填寫工單資料</strong>
        <ul>
            <li><strong>工單編號</strong>：系統自動產生（如：WO-20260210-0001）</li>
            <li><strong>機台</strong>：選擇精密篩選設備（如：大型玻璃盤 A-01）</li>
            <li><strong>指定員工</strong>：選擇負責的現場人員</li>
            <li><strong>總支數</strong>：本次工單要篩選的支數</li>
            <li><strong>總重量</strong>：預估總重量（kg）</li>
            <li><strong>預計開始日期</strong>：排程開始日期</li>
            <li><strong>預計結束日期</strong>：預計完工日期</li>
            <li><strong>工單狀態</strong>：預設為「待開始」</li>
        </ul>
    </li>
    <li>
        <strong>設定載具配置</strong><br>
        系統會自動帶入客戶批號設定的載具，可手動調整數量
    </li>
    <li>
        <strong>點擊「儲存」</strong>
    </li>
</ol>

<div class="info">
    <div><strong>彈性生產：</strong>一個客戶批號可以建立多張工單，分批次生產。例如客戶訂 10 萬支，可以建立 2 張工單，每張 5 萬支。</div>
</div>

<h3>2.2 列印現場工作單</h3>

<ol class="steps">
    <li>在工單列表中，點擊工單的「列印」按鈕</li>
    <li>系統開啟列印預覽頁面（A4 直印），顯示：
        <ul>
            <li><strong>工單基本資訊</strong>：工單編號、客戶批號、機台、員工</li>
            <li><strong>產品規格</strong>：受篩產品名稱、預估單重</li>
            <li><strong>篩分服務項目</strong>：檢驗項目、標準值、公差、PPM</li>
            <li><strong>載具統計</strong>：桶/船數量與單位重量</li>
            <li><strong>生產記錄表格</strong>：卡號、重量（現場填寫）</li>
            <li><strong>篩分不良品記錄表格</strong>：各項目不良品數量（現場填寫）</li>
            <li><strong>首件檢驗表格</strong>：頭高、頭寬、全長、牙外徑（現場量測填寫）</li>
        </ul>
    </li>
    <li>點擊列印，交給現場人員</li>
</ol>

<h3>2.3 變更工單狀態為「進行中」</h3>

<ol class="steps">
    <li>現場開始作業時，回到工單列表</li>
    <li>點擊工單的「編輯」按鈕</li>
    <li>將「工單狀態」改為「進行中」</li>
    <li>填寫「實際開始日期」</li>
    <li>點擊「儲存」</li>
</ol>

<h2>階段 3：現場生產</h2>

<h3>3.1 記錄生產數據</h3>

<p>現場人員依現場工作單操作精密篩選設備，並在系統中登記生產數據。</p>

<ol class="steps">
    <li>
        <strong>開啟工單詳情</strong><br>
        在工單列表中，點擊工單的「詳情」按鈕
    </li>
    <li>
        <strong>記錄生產記錄</strong><br>
        在「生產記錄」區塊，點擊「新增」：
        <ul>
            <li><strong>卡號</strong>：系統自動計算（第 1 卡、第 2 卡...）</li>
            <li><strong>毛重</strong>：含載具的重量（kg）</li>
            <li><strong>皮重</strong>：載具重量（kg）</li>
            <li><strong>淨重</strong>：毛重 - 皮重（自動計算）</li>
            <li><strong>支數</strong>：該卡的螺絲支數（由淨重 / 單重計算）</li>
        </ul>
    </li>
    <li>
        <strong>記錄篩分不良品</strong><br>
        在「篩分不良記錄」區塊，記錄各檢驗項目的不良品數量：
        <ul>
            <li>頭高不良：50 支</li>
            <li>牙外徑不良：30 支</li>
            <li>全長不良：20 支</li>
        </ul>
        系統會自動計算：
        <ul>
            <li><strong>不良品總數</strong>：100 支</li>
            <li><strong>良品支數</strong>：總支數 - 不良品總數</li>
            <li><strong>不良率</strong>：(不良品總數 / 總支數) × 100%</li>
        </ul>
    </li>
    <li>
        <strong>首件檢驗（選填）</strong><br>
        量測第一批螺絲的尺寸，記錄在「首件檢驗」區塊：
        <ul>
            <li>頭高：2.00 mm</li>
            <li>頭寬：5.50 mm</li>
            <li>全長：10.05 mm</li>
            <li>牙外徑：2.98 mm</li>
        </ul>
    </li>
</ol>

<h3>3.2 完成工單</h3>

<ol class="steps">
    <li>現場作業完成後，回到工單列表</li>
    <li>點擊工單的「編輯」按鈕</li>
    <li>將「工單狀態」改為<strong>「已完成」</strong></li>
    <li>填寫「實際結束日期」</li>
    <li>點擊「儲存」</li>
</ol>

<div class="warning">
    <div><strong>關鍵步驟！</strong>將工單狀態改為「已完成」後，系統會<strong>自動觸發入庫流程</strong>，建立庫存品項與庫存異動記錄。</div>
</div>

<h2>階段 4：自動入庫</h2>

<p>工單狀態變更為「已完成」時，系統會自動執行以下動作：</p>

<h3>4.1 系統自動執行的步驟</h3>

<ol>
    <li>
        <strong>計算良品支數</strong><br>
        良品支數 = 工單總支數 - 不良品總數
        <ul>
            <li>範例：總支數 10,000 支，不良品 100 支 → 良品 9,900 支</li>
        </ul>
    </li>
    <li>
        <strong>產生庫存編號</strong><br>
        系統自動產生庫存編號（如：INV-20260210-0001）
    </li>
    <li>
        <strong>建立庫存品項（inventory_items）</strong>
        <ul>
            <li><strong>庫存編號</strong>：INV-20260210-0001</li>
            <li><strong>客戶批號</strong>：關聯到原訂單的客戶批號</li>
            <li><strong>受篩產品</strong>：螺絲規格</li>
            <li><strong>良品支數</strong>：9,900 支</li>
            <li><strong>不良品支數</strong>：100 支</li>
            <li><strong>總重量</strong>：工單記錄的總重量</li>
            <li><strong>庫存狀態</strong>：可用（Available）</li>
            <li><strong>可出貨數量</strong>：9,900 支（初始值等於良品支數）</li>
        </ul>
    </li>
    <li>
        <strong>建立庫存異動記錄（inventory_transactions）</strong>
        <ul>
            <li><strong>異動類型</strong>：工單入庫（Work Order Inbound）</li>
            <li><strong>方向</strong>：inbound（入庫）</li>
            <li><strong>異動數量</strong>：9,900 支</li>
            <li><strong>異動後庫存</strong>：9,900 支</li>
            <li><strong>關聯工單</strong>：WO-20260210-0001</li>
        </ul>
    </li>
</ol>

<h3>4.2 確認入庫結果</h3>

<ol class="steps">
    <li>
        <strong>開啟庫存管理</strong><br>
        側邊選單 → 庫存與出貨 → 庫存管理
    </li>
    <li>
        <strong>檢查新建的庫存品項</strong><br>
        確認庫存編號、良品支數、可出貨數量是否正確
    </li>
    <li>
        <strong>查看庫存異動記錄</strong><br>
        側邊選單 → 庫存與出貨 → 庫存異動<br>
        確認有一筆 inbound（入庫）記錄
    </li>
</ol>

<div class="tip">
    <div><strong>提示：</strong>自動入庫無需人工操作，系統會在工單完成時自動執行。如果發現入庫數量錯誤，請檢查工單的總支數與不良品數量是否正確登記。</div>
</div>

<h2>階段 5：出貨作業</h2>

<h3>5.1 建立出貨單</h3>

<ol class="steps">
    <li>
        <strong>開啟出貨管理</strong><br>
        側邊選單 → 庫存與出貨 → 出貨管理
    </li>
    <li>
        <strong>點擊「新增」按鈕</strong>
    </li>
    <li>
        <strong>填寫出貨單基本資料</strong>
        <ul>
            <li><strong>出貨單號</strong>：系統自動產生（如：SHIP-20260210-0001）</li>
            <li><strong>客戶</strong>：選擇客戶</li>
            <li><strong>出貨日期</strong>：預設當日日期</li>
            <li><strong>收貨地址</strong>：客戶地址</li>
            <li><strong>出貨狀態</strong>：預設「待出貨」</li>
        </ul>
    </li>
    <li>
        <strong>點擊「儲存」</strong>
    </li>
</ol>

<h3>5.2 選擇庫存品項</h3>

<ol class="steps">
    <li>在出貨單詳情的「出貨明細」區塊，點擊「新增」</li>
    <li>
        <strong>選擇庫存品項</strong><br>
        從下拉選單選擇要出貨的庫存品項<br>
        系統會顯示：
        <ul>
            <li>庫存編號：INV-20260210-0001</li>
            <li>客戶批號：BATCH-001</li>
            <li>可出貨數量：9,900 支</li>
        </ul>
    </li>
    <li>
        <strong>輸入出貨數量</strong>
        <ul>
            <li>可全部出貨（9,900 支）</li>
            <li>可部分出貨（如：5,000 支）</li>
            <li>系統會檢查：出貨數量不可超過可出貨數量</li>
        </ul>
    </li>
    <li>
        <strong>填寫備註</strong>（選填）
    </li>
    <li>
        <strong>點擊「儲存」</strong>
    </li>
</ol>

<div class="info">
    <div><strong>部分出貨：</strong>如果本次只出貨 5,000 支，剩餘 4,900 支留在庫存，下次可以繼續出貨。</div>
</div>

<h3>5.3 確認出貨</h3>

<ol class="steps">
    <li>回到出貨單列表，點擊出貨單的「編輯」按鈕</li>
    <li>確認出貨明細無誤後，將「出貨狀態」改為<strong>「已出貨」</strong></li>
    <li>填寫「實際出貨日期」</li>
    <li>點擊「儲存」</li>
</ol>

<div class="warning">
    <div><strong>關鍵步驟！</strong>將出貨狀態改為「已出貨」後，系統會<strong>自動扣減庫存</strong>，並更新客戶批號的累計已出貨數量。</div>
</div>

<h3>5.4 系統自動執行的步驟</h3>

<ol>
    <li>
        <strong>扣減庫存</strong>
        <ul>
            <li>庫存品項的「可出貨數量」減少（9,900 → 4,900 支）</li>
            <li>如果可出貨數量變成 0，庫存狀態自動改為「已出清」</li>
        </ul>
    </li>
    <li>
        <strong>建立庫存異動記錄（inventory_transactions）</strong>
        <ul>
            <li><strong>異動類型</strong>：出貨（Shipment Outbound）</li>
            <li><strong>方向</strong>：outbound（出庫）</li>
            <li><strong>異動數量</strong>：5,000 支</li>
            <li><strong>異動後庫存</strong>：4,900 支</li>
            <li><strong>關聯出貨單</strong>：SHIP-20260210-0001</li>
        </ul>
    </li>
    <li>
        <strong>更新客戶批號的累計已出貨數量</strong>
        <ul>
            <li>客戶批號的 <code>total_shipped_quantity</code> 增加 5,000 支</li>
            <li>系統自動計算出貨狀態：
                <ul>
                    <li><strong>未出貨（Not Shipped）</strong>：累計已出貨 = 0</li>
                    <li><strong>部分出貨（Partial Shipped）</strong>：0 < 累計已出貨 < 預估數量</li>
                    <li><strong>已出貨（Fully Shipped）</strong>：累計已出貨 = 預估數量</li>
                </ul>
            </li>
        </ul>
    </li>
</ol>

<h3>5.5 列印出貨單與品質檢驗報表</h3>

<ol class="steps">
    <li>
        <strong>列印出貨單</strong><br>
        在出貨單列表中，點擊出貨單的「列印」按鈕<br>
        系統開啟列印預覽頁面（A4 一半，適合連續報表紙），顯示：
        <ul>
            <li>公司資訊與 LOGO</li>
            <li>客戶資訊</li>
            <li>出貨單基本資料（出貨單號、日期）</li>
            <li>出貨明細（庫存編號、客戶批號、數量）</li>
        </ul>
    </li>
    <li>
        <strong>列印品質檢驗報表</strong><br>
        在工單列表中，點擊工單的「列印報表」按鈕<br>
        系統開啟列印預覽頁面（A4），顯示：
        <ul>
            <li><strong>訂單資料</strong>：客戶批號、訂單編號</li>
            <li><strong>篩分項目</strong>：檢驗項目、標準值、公差、PPM</li>
            <li><strong>不良品記錄</strong>：各項目的不良品數量</li>
            <li><strong>結果報告</strong>：
                <ul>
                    <li>總數量：10,000 支</li>
                    <li>良品數量：9,900 支</li>
                    <li>不良品數量：100 支</li>
                    <li>不良率：1.00%</li>
                </ul>
            </li>
            <li><strong>圓餅圖</strong>：不良品種類分布（使用 Chart.js 產生）</li>
        </ul>
    </li>
    <li>點擊列印，隨貨附上給客戶</li>
</ol>

<h2>常見問題</h2>

<h3>Q1：工單完成後沒有自動入庫？</h3>
<p><strong>A：</strong>請確認以下：</p>
<ul>
    <li>工單狀態是否已改為「已完成」</li>
    <li>工單是否有填寫總支數</li>
    <li>檢查瀏覽器 Console 是否有錯誤訊息</li>
    <li>確認後端 API <code>api/work_orders/update.php</code> 是否正常運作</li>
</ul>

<h3>Q2：出貨時顯示「可出貨數量不足」？</h3>
<p><strong>A：</strong>請確認：</p>
<ul>
    <li>庫存品項的「可出貨數量」是否足夠</li>
    <li>是否有其他出貨單已經出貨但尚未確認</li>
    <li>庫存狀態是否為「可用」（不是「已保留」或「暫停」）</li>
</ul>

<h3>Q3：可以取消已出貨的出貨單嗎？</h3>
<p><strong>A：</strong>不建議取消已出貨的出貨單，因為會影響庫存數據的正確性。如果貨物退回，請使用「退貨管理」功能建立退貨單。</p>

<h3>Q4：客戶批號的「預估數量」與工單的「總支數」不一致？</h3>
<p><strong>A：</strong>這是正常的。客戶批號的預估數量是客戶委託的總支數，而工單的總支數是本次生產的支數。一個客戶批號可以建立多張工單，分批次生產。</p>

<h3>Q5：如何查詢某個客戶批號的完整生產與出貨記錄？</h3>
<p><strong>A：</strong>步驟如下：</p>
<ol>
    <li>開啟「訂單管理」→「訂單主表」</li>
    <li>找到該訂單，點擊「詳情」</li>
    <li>在客戶批號區塊，點擊客戶批號的「詳情」</li>
    <li>可以看到：
        <ul>
            <li>關聯的工單清單</li>
            <li>庫存品項清單</li>
            <li>出貨記錄</li>
            <li>累計已出貨數量與出貨狀態</li>
        </ul>
    </li>
</ol>

<h2>下一步</h2>

<ul>
    <li>閱讀 <a href="#workflow-inventory">庫存入庫機制</a> 深入了解自動入庫邏輯</li>
    <li>閱讀 <a href="#workflow-printing">單據列印完整指南</a> 了解列印功能細節</li>
    <li>閱讀 <a href="#workflow-quality">品質檢驗流程</a> 了解品質管理</li>
</ul>
        `
    }
};

// 注意：此檔案在瀏覽器環境中透過 script.js 的 init() 合併至 HELP_CONTENT.articles
// 不使用 module.exports（非 Node.js 環境）
