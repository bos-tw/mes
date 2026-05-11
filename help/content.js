/**
 * 精密光學篩選管理系統 - 系統使用指南內容
 *
 * @version 1.1.1
 * @date 2026-05-06
 * @description 完整的系統使用指南，涵蓋所有功能模組與業務流程
 * 
 * 文件結構定義
 */

const HELP_VERSION = 'v1.1.1';
const HELP_RELEASE_DATE = '2026-05-06';

const HELP_CONTENT = {
    // 版本資訊
    version: HELP_VERSION,
    releaseDate: HELP_RELEASE_DATE,
    
    // 導航結構
    navigation: [
        {
            group: '快速入門',
            items: [
                { id: 'operation-production-flow', title: '系統操作及生管流程圖', icon: 'fa-sitemap' },
                { id: 'introduction', title: '系統簡介', icon: 'fa-home' },
                { id: 'quick-start', title: '快速開始', icon: 'fa-rocket' },
                { id: 'interface-overview', title: '介面總覽', icon: 'fa-desktop' },
                { id: 'login-logout', title: '登入與登出', icon: 'fa-sign-in-alt' }
            ]
        },
        {
            group: '完整業務流程',
            items: [
                { id: 'workflow-overview', title: '業務流程總覽', icon: 'fa-project-diagram' },
                { id: 'workflow-order-to-shipping', title: '訂單到出貨完整流程', icon: 'fa-route' },
                { id: 'workflow-inventory', title: '庫存入庫機制', icon: 'fa-cubes' },
                { id: 'workflow-printing', title: '單據列印完整指南', icon: 'fa-print' },
                { id: 'workflow-quality', title: '品質檢驗流程', icon: 'fa-check-circle' }
            ]
        },
        {
            group: '基本資料管理',
            items: [
                { id: 'companies', title: '公司資料', icon: 'fa-building' },
                { id: 'customers', title: '客戶管理', icon: 'fa-users' },
                { id: 'suppliers', title: '供應商管理', icon: 'fa-truck' },
                { id: 'employees', title: '員工管理', icon: 'fa-user-tie' },
                { id: 'departments', title: '部門管理', icon: 'fa-sitemap' },
                { id: 'screening-items', title: '受篩產品', icon: 'fa-cogs' },
                { id: 'screening-services', title: '篩分服務項目', icon: 'fa-tasks' }
            ]
        },
        {
            group: '訂單管理',
            items: [
                { id: 'orders-overview', title: '訂單管理總覽', icon: 'fa-file-invoice' },
                { id: 'orders', title: '訂單主表', icon: 'fa-clipboard-list' },
                { id: 'order-items', title: '客戶批號', icon: 'fa-barcode' }
            ]
        },
        {
            group: '生產作業',
            items: [
                { id: 'production-overview', title: '生產作業總覽', icon: 'fa-industry' },
                { id: 'work-orders', title: '生產工單', icon: 'fa-file-alt' },
                { id: 'work-order-print', title: '工單列印', icon: 'fa-print' },
                { id: 'production-records', title: '生產紀錄', icon: 'fa-clipboard-check' },
                { id: 'first-piece-inspection', title: '首件檢驗', icon: 'fa-ruler' }
            ]
        },
        {
            group: '設備管理',
            items: [
                { id: 'machines', title: '機台管理', icon: 'fa-server' },
                { id: 'tools', title: '載具管理', icon: 'fa-box' },
                { id: 'machine-inspections', title: '機台巡檢', icon: 'fa-clipboard-check' },
                { id: 'machine-maintenance', title: '機台保養', icon: 'fa-wrench' }
            ]
        },
        {
            group: '庫存與出貨',
            items: [
                { id: 'inventory-items', title: '庫存管理', icon: 'fa-warehouse' },
                { id: 'inventory-transactions', title: '庫存異動', icon: 'fa-exchange-alt' },
                { id: 'shipping-orders', title: '出貨管理', icon: 'fa-shipping-fast' },
                { id: 'return-orders', title: '退貨管理', icon: 'fa-undo' }
            ]
        },
        {
            group: '品質管理',
            items: [
                { id: 'quality-overview', title: '品質管理總覽', icon: 'fa-award' },
                { id: 'production-quality', title: '生產品質檢驗', icon: 'fa-check-double' },
                { id: 'shipping-quality', title: '出貨品質檢驗', icon: 'fa-clipboard-check' },
                { id: 'quality-issues', title: '品質異常報告', icon: 'fa-exclamation-triangle' }
            ]
        },
        {
            group: '系統設定',
            items: [
                { id: 'lookup-values', title: '代碼管理', icon: 'fa-list' },
                { id: 'number-sequences', title: '流水號管理', icon: 'fa-sort-numeric-up' },
                { id: 'system-parameters', title: '系統參數', icon: 'fa-sliders-h' },
                { id: 'audit-logs', title: '操作日誌', icon: 'fa-history' }
            ]
        },
        {
            group: '權限管理',
            items: [
                { id: 'rbac-overview', title: '權限系統說明', icon: 'fa-shield-alt' },
                { id: 'roles', title: '角色管理', icon: 'fa-user-tag' },
                { id: 'permissions', title: '權限設定', icon: 'fa-key' }
            ]
        },
        {
            group: '其他功能',
            items: [
                { id: 'notifications', title: '公告通知中心', icon: 'fa-bell' },
                { id: 'messages', title: '訊息留言', icon: 'fa-comments' },
                { id: 'profile', title: '個人資料', icon: 'fa-user-cog' },
                { id: 'dashboard', title: '系統儀表板', icon: 'fa-tachometer-alt' }
            ]
        },
        {
            group: '常見問題',
            items: [
                { id: 'faq', title: 'FAQ 常見問題', icon: 'fa-question-circle' },
                { id: 'troubleshooting', title: '故障排除', icon: 'fa-tools' }
            ]
        }
    ],

    // 文章內容
    articles: {
        // ==================== 快速入門 ====================
        'introduction': {
            title: '系統簡介',
            content: `
<h1>系統簡介</h1>

<p>歡迎使用<strong>精密光學篩選管理系統</strong>（Precision Optical Screening Management System, MES）。本系統專為精密光學篩選加工產業設計，提供完整的生產管理解決方案。</p>

<h2>什麼是精密光學篩選？</h2>

<p>精密光學篩選是精密零件製造產業中重要的品質控制環節。當零件製造商生產完成後，會將產品送至專業的篩選工廠，利用光學選別機等精密設備進行以下檢驗：</p>

<ul>
    <li><strong>外觀檢驗</strong>：使用光學選別機檢查零件是否有裂痕、變形、電鍍不良等問題</li>
    <li><strong>尺寸檢驗</strong>：利用精密量測設備檢測頭高、頭寬、全長、牙外徑等是否符合規格</li>
    <li><strong>功能檢驗</strong>：確認零件的扭力、強度等是否達標</li>
</ul>

<div class="info">
    <div>篩選工廠使用專業的光學選別機、精密篩選機等設備，依據客戶指定的規格與公差進行嚴格檢驗，將不良品篩出，確保出貨品質。</div>
</div>

<h2>系統功能概述</h2>

<p>本系統涵蓋篩分作業的完整流程：</p>

<table>
    <thead>
        <tr>
            <th>功能模組</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>基本資料管理</td>
            <td>管理客戶、供應商、員工、受篩產品等基礎資料</td>
        </tr>
        <tr>
            <td>訂單管理</td>
            <td>建立與追蹤客戶訂單、管理客戶批號</td>
        </tr>
        <tr>
            <td>生產作業</td>
            <td>生產工單排程、現場生產紀錄、品質檢驗</td>
        </tr>
        <tr>
            <td>設備管理</td>
            <td>機台與載具管理、每日巡檢、保養記錄</td>
        </tr>
        <tr>
            <td>庫存與出貨</td>
            <td>庫存管理、出貨單、退貨處理</td>
        </tr>
        <tr>
            <td>品質管理</td>
            <td>品質檢驗記錄、異常報告、統計分析</td>
        </tr>
    </tbody>
</table>

<h2>系統特色</h2>

<ul>
    <li><strong>Web-based 架構</strong>：透過瀏覽器即可使用，無需安裝額外軟體</li>
    <li><strong>分頁式操作</strong>：可同時開啟多個功能頁面，提高工作效率</li>
    <li><strong>即時資料同步</strong>：跨分頁資料自動同步更新</li>
    <li><strong>權限控管</strong>：基於角色的存取控制（RBAC），確保資料安全</li>
    <li><strong>列印功能</strong>：支援生產命令單、出貨單等文件列印</li>
    <li><strong>公司品牌識別</strong>：登入頁動態顯示公司名稱與 LOGO，強化品牌形象</li>
    <li><strong>儀表板公告跑馬燈</strong>：系統公告自動輪播於儀表板頂部，不遺漏重要訊息</li>
    <li><strong>自動版本更新提醒</strong>：每小時自動檢查系統版本，有更新時提示使用者重新整理</li>
</ul>

<h2>適用對象</h2>

<ul>
    <li><strong>管理階層</strong>：掌握生產進度、品質狀況、營運數據</li>
    <li><strong>生管人員</strong>：排程生產工單、追蹤訂單狀態</li>
    <li><strong>現場人員</strong>：登錄生產紀錄、回報品質問題</li>
    <li><strong>品管人員</strong>：執行品質檢驗、分析不良原因</li>
    <li><strong>倉管人員</strong>：管理庫存、處理出貨作業</li>
</ul>
            `
        },

        'quick-start': {
            title: '快速開始',
            content: `
<h1>快速開始</h1>

<p>本章節將引導您快速了解系統的基本操作流程。</p>

<h2>第一次使用</h2>

<ol class="steps">
    <li>
        <strong>登入系統</strong><br>
        使用管理員提供的帳號密碼登入系統。預設管理員帳號為 <code>admin</code>。
    </li>
    <li>
        <strong>修改密碼</strong><br>
        首次登入後，建議立即至「個人資料」修改密碼，確保帳號安全。
    </li>
    <li>
        <strong>熟悉介面</strong><br>
        瀏覽左側選單，了解各功能模組的位置。
    </li>
</ol>

<h2>典型作業流程</h2>

<p>以下是一般篩分作業的標準流程：</p>

<h3>1. 建立基礎資料</h3>

<p>首次使用系統前，需先建立必要的基礎資料：</p>

<ul>
    <li>建立<strong>客戶資料</strong>：記錄客戶公司名稱、聯絡資訊</li>
    <li>建立<strong>受篩產品</strong>：定義螺絲規格、單重等資訊</li>
    <li>建立<strong>篩分服務項目</strong>：定義各種檢驗項目與標準</li>
    <li>建立<strong>機台資料</strong>：登錄篩選機、光學選別機等設備</li>
    <li>建立<strong>載具資料</strong>：登錄盛裝螺絲的桶、箱等容器</li>
</ul>

<h3>2. 接單作業</h3>

<ol class="steps">
    <li>
        <strong>建立訂單</strong><br>
        收到客戶訂單後，至「訂單主表管理」建立新訂單，填寫客戶、交期等資訊。
    </li>
    <li>
        <strong>建立客戶批號</strong><br>
        在訂單下建立「客戶批號」，記錄每批螺絲的重量、數量、篩分服務明細。
    </li>
</ol>

<h3>3. 生產排程</h3>

<ol class="steps">
    <li>
        <strong>建立生產工單</strong><br>
        依據客戶批號建立生產工單，指派機台與作業人員。
    </li>
    <li>
        <strong>列印生產命令單</strong><br>
        列印紙本生產命令單，交給現場人員。
    </li>
</ol>

<h3>4. 現場作業</h3>

<ol class="steps">
    <li>
        <strong>首件檢驗</strong><br>
        開始生產前，量測首件尺寸並登錄系統。
    </li>
    <li>
        <strong>執行篩分</strong><br>
        依照生產命令單進行篩選作業。
    </li>
    <li>
        <strong>登錄生產紀錄</strong><br>
        每完成一個載具，登錄卡號、重量等資訊。
    </li>
    <li>
        <strong>記錄不良品</strong><br>
        篩出的不良品依類別統計數量。
    </li>
</ol>

<h3>5. 入庫與出貨</h3>

<ol class="steps">
    <li>
        <strong>良品入庫</strong><br>
        完成篩分後，良品入庫建立庫存。
    </li>
    <li>
        <strong>建立出貨單</strong><br>
        依據客戶需求建立出貨單。
    </li>
    <li>
        <strong>出貨品檢</strong><br>
        出貨前執行最終品質檢驗。
    </li>
</ol>

<div class="tip">
    <div>建議先從「系統儀表板」開始，可以快速掌握目前的訂單、生產、出貨狀況。</div>
</div>
            `
        },

        'interface-overview': {
            title: '介面總覽',
            content: `
<h1>介面總覽</h1>

<p>系統採用現代化的 Web 介面設計，以下說明各區域的功能。</p>

<h2>整體佈局</h2>

<p>系統介面分為以下幾個主要區域：</p>

<table>
    <thead>
        <tr>
            <th>區域</th>
            <th>位置</th>
            <th>功能</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>頂部導航列</td>
            <td>畫面最上方</td>
            <td>系統名稱、系統使用指南、使用者選單</td>
        </tr>
        <tr>
            <td>側邊選單</td>
            <td>畫面左側</td>
            <td>功能模組導航，可展開/收合</td>
        </tr>
        <tr>
            <td>分頁區域</td>
            <td>主內容區上方</td>
            <td>顯示已開啟的功能頁面分頁</td>
        </tr>
        <tr>
            <td>主內容區</td>
            <td>畫面中央</td>
            <td>顯示目前功能的操作介面</td>
        </tr>
    </tbody>
</table>

<h2>頂部導航列</h2>

<h3>左側區域</h3>

<ul>
    <li><strong>收合按鈕</strong>：點擊可收合/展開側邊選單</li>
    <li><strong>系統名稱</strong>：顯示「精密光學篩選管理系統」</li>
</ul>

<h3>右側區域</h3>

<ul>
    <li><strong>系統使用指南</strong>：開啟本使用指南（即您現在閱讀的這份文件）</li>
    <li><strong>使用者選單</strong>：點擊使用者名稱展開下拉選單
        <ul>
            <li>修改個人資料</li>
            <li>公告通知中心（顯示未讀數量）</li>
            <li>我的留言（顯示未讀數量）</li>
            <li>登出</li>
        </ul>
    </li>
</ul>

<h2>側邊選單</h2>

<p>側邊選單以樹狀結構組織所有功能模組：</p>

<ul>
    <li>點擊<strong>群組標題</strong>可展開/收合該群組</li>
    <li>點擊<strong>功能項目</strong>會在主內容區開啟對應頁面</li>
    <li>已展開的群組會以視覺效果標示</li>
</ul>

<h3>功能群組</h3>

<ol>
    <li><strong>系統儀表板</strong> - 營運數據總覽</li>
    <li><strong>基本資料管理</strong> - 客戶、員工、產品等基礎資料</li>
    <li><strong>訂單管理</strong> - 訂單與客戶批號</li>
    <li><strong>生產作業</strong> - 生產工單與紀錄</li>
    <li><strong>設備管理</strong> - 機台與載具</li>
    <li><strong>庫存管理</strong> - 庫存與異動</li>
    <li><strong>出貨管理</strong> - 出貨與退貨</li>
    <li><strong>品質管理</strong> - 品質檢驗與異常</li>
    <li><strong>系統設定</strong> - 參數與代碼設定</li>
    <li><strong>權限管理</strong> - 角色與權限</li>
</ol>

<h2>分頁操作</h2>

<p>系統支援多分頁操作，您可以同時開啟多個功能頁面：</p>

<ul>
    <li><strong>開啟新分頁</strong>：點擊側邊選單的功能項目</li>
    <li><strong>切換分頁</strong>：點擊分頁標籤</li>
    <li><strong>關閉分頁</strong>：點擊分頁標籤上的 × 按鈕</li>
    <li><strong>關閉全部</strong>：點擊「關閉全部」按鈕</li>
</ul>

<div class="info">
    <div>分頁狀態會自動儲存，下次登入時會自動恢復上次開啟的分頁。</div>
</div>

<h2>通用操作元件</h2>

<h3>資料表格</h3>

<p>大多數功能頁面都包含資料表格，常見操作：</p>

<ul>
    <li><strong>新增</strong>：點擊「新增」按鈕開啟表單</li>
    <li><strong>編輯</strong>：點擊資料列的「編輯」按鈕</li>
    <li><strong>刪除</strong>：點擊「刪除」按鈕（需確認）</li>
    <li><strong>檢視</strong>：點擊「詳情」按鈕查看完整資料</li>
    <li><strong>搜尋</strong>：使用搜尋框篩選資料</li>
    <li><strong>欄位設定</strong>：自訂顯示/隱藏欄位</li>
</ul>

<h3>表單操作</h3>

<ul>
    <li><strong>必填欄位</strong>：標示 <span class="text-danger-inline">*</span> 為必填</li>
    <li><strong>儲存</strong>：填寫完成後點擊「儲存」</li>
    <li><strong>取消</strong>：放棄編輯，關閉表單</li>
</ul>

<h3>鍵盤快捷鍵</h3>

<table>
    <thead>
        <tr>
            <th>快捷鍵</th>
            <th>功能</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><kbd>Esc</kbd></td>
            <td>關閉彈窗/取消操作</td>
        </tr>
        <tr>
            <td><kbd>Enter</kbd></td>
            <td>確認/送出表單</td>
        </tr>
    </tbody>
</table>
            `
        },

        'login-logout': {
            title: '登入與登出',
            content: `
<h1>登入與登出</h1>

<h2>登入頁面介紹</h2>

<p>系統登入頁採用現代化的科技風格介面設計，包含以下視覺元素：</p>

<ul>
    <li><strong>公司名稱與 LOGO</strong>：自動從系統資料庫載入，並動態顯示於登入頁頂部</li>
    <li><strong>系統副標題</strong>：顯示「精密光學篩選管理系統」，讓使用者確認所在系統</li>
    <li><strong>狀態指示燈</strong>：「SYSTEM ONLINE」三個小圓點表示系統正常運作中</li>
    <li><strong>HUD 科技動畫</strong>：淡藍白色主題，包含移動格線背景、四角框架、掃描線等視覺效果</li>
</ul>

<div class="tip">
    <div>若公司 LOGO 尚未設定，登入頁將顯示預設閃電圖示。如需設定 LOGO，請至「公司資料」模組上傳。</div>
</div>

<h2>登入步驟</h2>

<ol class="steps">
    <li>
        <strong>開啟登入頁面</strong><br>
        使用瀏覽器開啟系統網址，會自動導向登入頁面。建議使用 Chrome、Edge 或 Firefox 最新版本。
    </li>
    <li>
        <strong>輸入帳號</strong><br>
        在「帳號」欄位輸入您的員工帳號（由系統管理員設定）。
    </li>
    <li>
        <strong>輸入密碼</strong><br>
        在「密碼」欄位輸入您的登入密碼。
    </li>
    <li>
        <strong>點擊登入</strong><br>
        點擊「登入」按鈕或按 <kbd>Enter</kbd> 鍵送出。
    </li>
</ol>

<div class="warning">
    <div>如果連續登入失敗多次，帳號可能會被暫時鎖定，請聯繫系統管理員解鎖。</div>
</div>

<h2>登出系統</h2>

<ol class="steps">
    <li>點擊右上角的<strong>使用者名稱</strong>展開下拉選單</li>
    <li>點擊<strong>「登出」</strong></li>
    <li>系統會清除登入狀態並自動返回登入頁面</li>
</ol>

<div class="tip">
    <div>建議在使用共用電腦時，每次使用完畢後確實登出，避免他人存取您的帳號資料。</div>
</div>

<h2>忘記密碼</h2>

<p>目前系統不提供自助式密碼重設，如果忘記密碼，請聯繫系統管理員協助重設。</p>

<h2>修改密碼</h2>

<ol class="steps">
    <li>點擊右上角的<strong>使用者名稱</strong></li>
    <li>選擇<strong>「修改個人資料」</strong></li>
    <li>切換到<strong>「修改密碼」</strong>分頁</li>
    <li>輸入<strong>目前密碼</strong></li>
    <li>輸入<strong>新密碼</strong>（至少 6 個字元）</li>
    <li>再次輸入新密碼確認</li>
    <li>點擊<strong>「修改密碼」</strong></li>
</ol>

<div class="tip">
    <div>建議密碼使用英文字母大小寫、數字的組合，長度至少 8 個字元，提高帳號安全性。</div>
</div>

<h2>Session 逾時</h2>

<p>為了安全考量，如果長時間未操作系統，登入狀態會自動失效，需要重新登入。</p>

<p>逾時時間預設為 <strong>30 分鐘</strong>。如果在操作過程中收到「登入已過期」的訊息，請重新登入。</p>

<h2>系統版本更新提醒</h2>

<p>系統會在背景每隔 <strong>1 小時</strong>自動檢查是否有新版本。若有更新，頁面頂部會出現提示橫幅，建議點擊「重新整理」以載入最新版本，確保功能正常運作。</p>
            `
        },

        // ==================== 完整業務流程 ====================
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

<h2>系統五大核心流程</h2>

<h3>流程 1：訂單管理</h3>
<p>接收客戶訂單 → 建立訂單主表 → 建立客戶批號（訂單明細） → 列印委託確認單</p>

<h3>流程 2：生產工單</h3>
<p>選擇客戶批號 → 建立生產工單 → 分配機台/員工/載具 → 列印現場工作單</p>

<h3>流程 3：工單完工自動入庫</h3>
<p>工單狀態 = "已完成" → 觸發自動入庫 → 計算良品支數 = 總支數 - 不良品支數 → 建立庫存品項</p>

<h3>流程 4：出貨作業</h3>
<p>檢查庫存 → 建立出貨單 → 選擇庫存品項 → 出貨確認 → 扣減庫存 → 列印出貨單與篩分檢驗結果報表</p>

<h3>流程 5：品質追蹤</h3>
<p>生產階段記錄不良品 → 工單完工計算不良率 → 出貨品質檢驗 → 異常報告</p>

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
            <td><strong>篩分檢驗結果報表</strong></td>
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
    <li><strong>Completed（已完成）</strong> → 工單完成，<strong>觸發自動入庫</strong></li>
    <li><strong>Closed（已結案）</strong> → 工單結案</li>
</ul>

<h3>庫存狀態</h3>
<ul>
    <li><strong>Available（可用）</strong> → 可正常出貨</li>
    <li><strong>Reserved（已保留）</strong> → 已分配給特定訂單</li>
    <li><strong>On Hold（暫停）</strong> → 品質問題，暫不出貨</li>
</ul>

<div class="tip">
    <div><strong>提示：</strong>建議新進人員先閱讀本章節，理解整體流程後，再深入學習各功能模組的詳細操作。</div>
</div>
            `
        },

        'workflow-order-to-shipping': {
            title: '訂單到出貨完整流程',
            content: `
<h1>訂單到出貨完整流程</h1>

<div class="info">
    <div><strong>本章節詳細說明從接收訂單到出貨的完整操作流程，包含所有關鍵步驟與注意事項。</strong></div>
</div>

<h2>完整流程（5 個階段）</h2>

<p><strong>階段 1：訂單建立</strong> → <strong>階段 2：工單排程</strong> → <strong>階段 3：現場生產</strong> → <strong>階段 4：自動入庫</strong> → <strong>階段 5：出貨作業</strong></p>

<h2>階段 1：訂單建立</h2>

<h3>建立訂單主表</h3>
<ol class="steps">
    <li>側邊選單 → 訂單管理 → 訂單主表</li>
    <li>點擊「新增」按鈕</li>
    <li>填寫基本資料：客戶、訂單日期、交貨日期、PO單號</li>
    <li>點擊「儲存」，系統自動產生訂單編號</li>
</ol>

<h3>建立客戶批號</h3>
<ol class="steps">
    <li>在訂單詳情中，點擊「新增」客戶批號</li>
    <li>填寫：客戶批號、受篩產品、預估數量、預估重量</li>
    <li>設定篩分服務項目：項目、標準值、公差、PPM</li>
    <li>設定載具配置（選填）</li>
    <li>點擊「儲存」</li>
</ol>

<h3>列印委託確認單</h3>
<ol class="steps">
    <li>在訂單列表中，點擊「列印」按鈕</li>
    <li>系統開啟列印預覽，顯示公司資訊、客戶資訊、訂單內容</li>
    <li>列印後給客戶確認簽名</li>
    <li>確認後，將訂單狀態改為「已確認」</li>
</ol>

<h2>階段 2：工單排程</h2>

<h3>建立生產工單</h3>
<ol class="steps">
    <li>側邊選單 → 生產作業 → 生產工單</li>
    <li>點擊「新增」</li>
    <li>選擇客戶批號（只會顯示已確認的訂單）</li>
    <li>填寫：機台、指定員工、總支數、總重量、預計開始/結束日期</li>
    <li>設定載具配置</li>
    <li>點擊「儲存」</li>
</ol>

<h3>列印現場工作單</h3>
<ol class="steps">
    <li>在工單列表中，點擊「列印」按鈕</li>
    <li>系統開啟列印預覽（A4），包含：工單資訊、產品規格、篩分服務項目、載具統計、生產記錄表格、不良品記錄表格、首件檢驗表格</li>
    <li>列印後交給現場人員</li>
    <li>現場開始作業時，將工單狀態改為「進行中」</li>
</ol>

<h2>階段 3：現場生產</h2>

<h3>記錄生產數據</h3>
<ol class="steps">
    <li>在工單詳情中，記錄生產記錄：卡號、毛重、皮重、淨重、支數</li>
    <li>記錄篩分不良品：各檢驗項目的不良品數量</li>
    <li>系統自動計算：不良品總數、良品支數、不良率</li>
    <li>首件檢驗（選填）：記錄頭高、頭寬、全長、牙外徑</li>
</ol>

<h3>完成工單</h3>
<ol class="steps">
    <li>現場作業完成後，將工單狀態改為<strong>「已完成」</strong></li>
    <li>填寫實際結束日期</li>
    <li>點擊「儲存」</li>
</ol>

<div class="warning">
    <div><strong>關鍵！</strong>將工單狀態改為「已完成」後，系統會<strong>自動觸發入庫流程</strong>。</div>
</div>

<h2>階段 4：自動入庫</h2>

<p>工單狀態變更為「已完成」時，系統自動執行：</p>

<ol>
    <li><strong>計算良品支數</strong>：良品支數 = 工單總支數 - 不良品總數</li>
    <li><strong>產生庫存編號</strong>：如 INV-20260210-0001</li>
    <li><strong>建立庫存品項</strong>：記錄良品/不良品數量、總重量、可出貨數量</li>
    <li><strong>建立庫存異動記錄</strong>：方向 inbound，關聯工單</li>
</ol>

<h3>確認入庫結果</h3>
<ol class="steps">
    <li>側邊選單 → 庫存與出貨 → 庫存管理</li>
    <li>檢查新建的庫存品項（庫存編號、良品支數、可出貨數量）</li>
    <li>查看庫存異動記錄，確認有 inbound（入庫）記錄</li>
</ol>

<h2>階段 5：出貨作業</h2>

<h3>建立出貨單</h3>
<ol class="steps">
    <li>側邊選單 → 庫存與出貨 → 出貨管理</li>
    <li>點擊「新增」</li>
    <li>填寫：客戶、出貨日期、收貨地址</li>
    <li>點擊「儲存」</li>
</ol>

<h3>選擇庫存品項</h3>
<ol class="steps">
    <li>在出貨單詳情的「出貨明細」區塊，點擊「新增」</li>
    <li>選擇庫存品項，系統顯示可出貨數量</li>
    <li>輸入出貨數量（可全部或部分出貨）</li>
    <li>點擊「儲存」</li>
</ol>

<h3>確認出貨</h3>
<ol class="steps">
    <li>確認出貨明細無誤後，將出貨狀態改為<strong>「已出貨」</strong></li>
    <li>填寫實際出貨日期</li>
    <li>點擊「儲存」</li>
</ol>

<div class="warning">
    <div><strong>關鍵！</strong>將出貨狀態改為「已出貨」後，系統會<strong>自動扣減庫存</strong>。</div>
</div>

<h3>系統自動執行</h3>
<ol>
    <li><strong>扣減庫存</strong>：庫存品項的可出貨數量減少</li>
    <li><strong>建立庫存異動記錄</strong>：方向 outbound，關聯出貨單</li>
    <li><strong>更新客戶批號</strong>：累計已出貨數量增加，更新出貨狀態</li>
</ol>

<h3>列印單據</h3>
<ol class="steps">
    <li>列印出貨單（A4 一半）：公司資訊、客戶資訊、出貨明細</li>
    <li>列印篩分檢驗結果報表（A4）：訂單資料、篩分項目、不良品記錄、結果報告、圓餅圖</li>
</ol>

<h2>常見問題</h2>

<h3>Q：工單完成後沒有自動入庫？</h3>
<p><strong>A：</strong>請確認工單狀態是否已改為「已完成」，工單是否有填寫總支數。</p>

<h3>Q：出貨時顯示「可出貨數量不足」？</h3>
<p><strong>A：</strong>請確認庫存品項的可出貨數量是否足夠，庫存狀態是否為「可用」。</p>

<h3>Q：可以取消已出貨的出貨單嗎？</h3>
<p><strong>A：</strong>不建議取消，如果貨物退回，請使用「退貨管理」功能建立退貨單。</p>
            `
        },

        'workflow-inventory': {
            title: '庫存入庫機制',
            content: `
<h1>庫存入庫機制</h1>

<p>本章節詳細說明工單完成後的自動入庫機制，這是系統的核心邏輯之一。</p>

<h2>觸發條件</h2>

<p>當工單狀態變更為<strong>「已完成」(Completed)</strong>時，系統會自動觸發入庫流程。</p>

<h2>自動入庫步驟</h2>

<ol>
    <li><strong>計算良品支數</strong>：良品支數 = 工單總支數 - 不良品總數</li>
    <li><strong>產生庫存編號</strong>：系統自動產生（如：INV-20260210-0001）</li>
    <li><strong>建立庫存品項</strong>：記錄所有相關資訊</li>
    <li><strong>建立庫存異動記錄</strong>：記錄入庫交易</li>
</ol>

<h2>庫存品項內容</h2>

<ul>
    <li><strong>庫存編號</strong>：自動產生</li>
    <li><strong>客戶批號</strong>：關聯到原訂單的客戶批號</li>
    <li><strong>受篩產品</strong>：螺絲規格</li>
    <li><strong>良品支數</strong>：總支數 - 不良品支數</li>
    <li><strong>不良品支數</strong>：篩分出的不良品</li>
    <li><strong>總重量</strong>：工單記錄的總重量</li>
    <li><strong>庫存狀態</strong>：可用（Available）</li>
    <li><strong>可出貨數量</strong>：初始值等於良品支數</li>
</ul>

<div class="tip">
    <div><strong>提示：</strong>自動入庫無需人工操作，系統會在工單完成時自動執行。</div>
</div>
            `
        },

        'workflow-printing': {
            title: '單據列印完整指南',
            content: `
<h1>單據列印完整指南</h1>

<p>本章節說明系統中所有可列印的單據，包含用途、時機與內容。</p>

<h2>1. 委託確認單（Order Confirmation）</h2>

<h3>用途</h3>
<p>給客戶確認訂單內容與規格，需客戶簽名確認。</p>

<h3>列印時機</h3>
<p>建立訂單後，確認前。</p>

<h3>包含內容</h3>
<ul>
    <li>公司資訊與 LOGO</li>
    <li>客戶資訊</li>
    <li>訂單基本資料（訂單編號、日期、交期）</li>
    <li>客戶批號列表</li>
    <li>篩分服務項目與規格</li>
    <li>載具配置</li>
    <li>備註</li>
</ul>

<h3>規格</h3>
<p>A4 直印</p>

<h2>2. 現場工作單（Work Order）</h2>

<h3>用途</h3>
<p>給現場人員執行篩分作業，包含所有需要填寫的欄位。</p>

<h3>列印時機</h3>
<p>建立工單後，開始生產前。</p>

<h3>包含內容</h3>
<ul>
    <li>工單基本資訊（工單編號、客戶批號、機台、員工）</li>
    <li>產品規格與預估單重</li>
    <li>篩分服務項目（檢驗項目、標準值、公差、PPM）</li>
    <li>載具統計</li>
    <li>生產記錄表格（卡號、重量 - 現場填寫）</li>
    <li>篩分不良品記錄表格（各項目不良品數量 - 現場填寫）</li>
    <li>首件檢驗表格（頭高、頭寬、全長、牙外徑 - 現場量測填寫）</li>
</ul>

<h3>規格</h3>
<p>A4 直印</p>

<h2>3. 出貨單（Shipping Order）</h2>

<h3>用途</h3>
<p>隨貨附上，記錄出貨內容。</p>

<h3>列印時機</h3>
<p>出貨確認時。</p>

<h3>包含內容</h3>
<ul>
    <li>公司資訊與 LOGO</li>
    <li>客戶資訊</li>
    <li>出貨單基本資料（出貨單號、日期）</li>
    <li>出貨明細（庫存編號、客戶批號、數量）</li>
</ul>

<h3>規格</h3>
<p>A4 一半（適合連續報表紙）</p>

<h2>4. 篩分檢驗結果報表（Inspection Report）</h2>

<h3>用途</h3>
<p>提供客戶，顯示品質數據與不良率。</p>

<h3>列印時機</h3>
<p>工單完工或出貨時。</p>

<h3>包含內容</h3>
<ul>
    <li>訂單資料（委託確認單內的基本資料）</li>
    <li>篩分項目、公差值、PPM</li>
    <li>篩分項目不良品項目及數量</li>
    <li>結果報告：總數量、良品數量、不良品數量、不良率(%)</li>
    <li>不良品種類圓餅圖</li>
</ul>

<h3>規格</h3>
<p>A4 直印</p>
            `
        },

        'workflow-quality': {
            title: '品質檢驗流程',
            content: `
<h1>品質檢驗流程</h1>

<p>本章節說明系統的品質檢驗流程，包含生產品質檢驗與出貨品質檢驗。</p>

<h2>生產品質檢驗</h2>

<h3>檢驗項目</h3>
<p>依客戶訂單的篩分服務項目設定，常見項目包括：</p>
<ul>
    <li>頭高（Head Height）</li>
    <li>頭寬（Head Diameter）</li>
    <li>全長（Total Length）</li>
    <li>牙外徑（Thread Outer Diameter）</li>
    <li>其他依客戶指定項目</li>
</ul>

<h3>標準與公差</h3>
<p>每個檢驗項目都有：</p>
<ul>
    <li><strong>標準值</strong>：規格要求的尺寸（mm）</li>
    <li><strong>公差</strong>：允許的誤差範圍（±mm）</li>
    <li><strong>PPM</strong>：允許的不良率（Parts Per Million）</li>
</ul>

<h3>檢驗記錄</h3>
<p>現場人員在工單中記錄：</p>
<ol>
    <li>各檢驗項目的不良品數量</li>
    <li>系統自動計算不良品總數</li>
    <li>系統自動計算良品支數 = 總支數 - 不良品總數</li>
    <li>系統自動計算不良率 = (不良品總數 / 總支數) × 100%</li>
</ol>

<h3>首件檢驗</h3>
<p>生產開始時，量測第一批螺絲的實際尺寸，確認是否符合規格。</p>

<h2>品質報表</h2>

<p>工單完成後，可列印「篩分檢驗結果報表」，包含：</p>
<ul>
    <li>檢驗項目與標準</li>
    <li>不良品數量統計</li>
    <li>不良率計算</li>
    <li>不良品種類圓餅圖</li>
</ul>

<h2>品質異常處理</h2>

<p>如果不良率超過 PPM 標準，可建立「品質異常報告」，記錄：</p>
<ul>
    <li>異常項目</li>
    <li>異常原因分析</li>
    <li>改善措施</li>
    <li>責任單位</li>
</ul>
            `
        },

        // ==================== 基本資料管理 ====================
        'companies': {
            title: '公司資料',
            content: `
<h1>公司資料</h1>

<p>「公司資料」用於設定自家公司的基本資訊，這些資料會顯示在列印文件（如生產命令單、出貨單）的表頭。</p>

<h2>功能說明</h2>

<ul>
    <li>設定公司名稱（中文/英文）</li>
    <li>設定公司地址、電話、傳真</li>
    <li>設定統一編號</li>
    <li>上傳公司 LOGO</li>
</ul>

<h2>操作步驟</h2>

<h3>編輯公司資料</h3>

<ol class="steps">
    <li>從側邊選單進入「基本資料管理」>「公司基本資料」</li>
    <li>點擊公司資料列的「編輯」按鈕</li>
    <li>修改需要更新的欄位</li>
    <li>點擊「儲存」</li>
</ol>

<h3>上傳公司 LOGO</h3>

<ol class="steps">
    <li>在編輯公司資料的表單中</li>
    <li>找到「公司 LOGO」欄位</li>
    <li>點擊「選擇檔案」上傳圖片</li>
    <li>支援 JPG、PNG 格式，建議尺寸 200x60 像素</li>
    <li>儲存後 LOGO 會顯示在列印文件上</li>
</ol>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>公司名稱</td>
            <td>是</td>
            <td>公司中文全名</td>
        </tr>
        <tr>
            <td>英文名稱</td>
            <td>否</td>
            <td>公司英文名稱</td>
        </tr>
        <tr>
            <td>統一編號</td>
            <td>否</td>
            <td>8 碼統一編號</td>
        </tr>
        <tr>
            <td>地址</td>
            <td>否</td>
            <td>公司地址</td>
        </tr>
        <tr>
            <td>電話</td>
            <td>否</td>
            <td>公司電話</td>
        </tr>
        <tr>
            <td>傳真</td>
            <td>否</td>
            <td>公司傳真</td>
        </tr>
        <tr>
            <td>Email</td>
            <td>否</td>
            <td>公司電子郵件</td>
        </tr>
        <tr>
            <td>公司 LOGO</td>
            <td>否</td>
            <td>用於列印文件的公司標誌</td>
        </tr>
    </tbody>
</table>
            `
        },

        'customers': {
            title: '客戶管理',
            content: `
<h1>客戶管理</h1>

<p>「客戶管理」用於建立與維護客戶基本資料，是建立訂單的必要前置作業。</p>

<h2>功能說明</h2>

<ul>
    <li>新增、編輯、刪除客戶資料</li>
    <li>設定客戶聯絡人資訊</li>
    <li>啟用/停用客戶</li>
    <li>查看客戶歷史訂單</li>
    <li><strong>設定單筆最低委託額度</strong>：設定該客戶的最低接單金額門檻</li>
    <li><strong>設定重量公差百分比</strong>：設定該客戶可接受的重量誤差範圍（預設 3%）</li>
</ul>

<h2>操作步驟</h2>

<h3>新增客戶</h3>

<ol class="steps">
    <li>從側邊選單進入「基本資料管理」>「客戶基本資料」</li>
    <li>點擊「新增」按鈕</li>
    <li>填寫客戶基本資料</li>
    <li>點擊「儲存」</li>
</ol>

<h3>搜尋客戶</h3>

<ul>
    <li>使用搜尋框輸入客戶名稱或編號</li>
    <li>系統會即時篩選符合的客戶</li>
</ul>

<h3>停用客戶</h3>

<div class="warning">
    <div>停用客戶後，將無法選擇該客戶建立新訂單，但不影響既有訂單。</div>
</div>

<ol class="steps">
    <li>找到要停用的客戶</li>
    <li>點擊「編輯」</li>
    <li>將「狀態」改為「停用」</li>
    <li>點擊「儲存」</li>
</ol>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>客戶編號</td>
            <td>自動</td>
            <td>系統自動產生，格式 CUST-XXX</td>
        </tr>
        <tr>
            <td>客戶名稱</td>
            <td>是</td>
            <td>客戶公司名稱</td>
        </tr>
        <tr>
            <td>簡稱</td>
            <td>否</td>
            <td>客戶簡稱，方便識別</td>
        </tr>
        <tr>
            <td>統一編號</td>
            <td>否</td>
            <td>客戶的統一編號</td>
        </tr>
        <tr>
            <td>聯絡人</td>
            <td>否</td>
            <td>主要聯絡窗口姓名</td>
        </tr>
        <tr>
            <td>電話</td>
            <td>否</td>
            <td>聯絡電話</td>
        </tr>
        <tr>
            <td>Email</td>
            <td>否</td>
            <td>電子郵件</td>
        </tr>
        <tr>
            <td>地址</td>
            <td>否</td>
            <td>公司地址</td>
        </tr>
        <tr>
            <td>付款條件</td>
            <td>否</td>
            <td>如：月結30天</td>
        </tr>
        <tr>
            <td>單筆最低委託額度</td>
            <td>否</td>
            <td>該客戶的最低接單金額，低於此金額時系統會顯示警示</td>
        </tr>
        <tr>
            <td>重量公差百分比</td>
            <td>否</td>
            <td>允許的重量誤差範圍（預設 3%），用於三階段重量追蹤的公差判斷</td>
        </tr>
        <tr>
            <td>狀態</td>
            <td>是</td>
            <td>啟用/停用</td>
        </tr>
        <tr>
            <td>備註</td>
            <td>否</td>
            <td>其他說明事項</td>
        </tr>
    </tbody>
</table>
            `
        },

        'suppliers': {
            title: '供應商管理',
            content: `
<h1>供應商管理</h1>

<p>「供應商管理」用於建立與維護供應商資料，如設備廠商、耗材供應商等。</p>

<h2>功能說明</h2>

<ul>
    <li>新增、編輯、刪除供應商</li>
    <li>記錄供應商聯絡資訊</li>
    <li>管理供應商分類</li>
</ul>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>供應商編號</td>
            <td>自動</td>
            <td>系統自動產生</td>
        </tr>
        <tr>
            <td>供應商名稱</td>
            <td>是</td>
            <td>供應商公司名稱</td>
        </tr>
        <tr>
            <td>聯絡人</td>
            <td>否</td>
            <td>主要聯絡窗口</td>
        </tr>
        <tr>
            <td>電話</td>
            <td>否</td>
            <td>聯絡電話</td>
        </tr>
        <tr>
            <td>Email</td>
            <td>否</td>
            <td>電子郵件</td>
        </tr>
        <tr>
            <td>地址</td>
            <td>否</td>
            <td>公司地址</td>
        </tr>
        <tr>
            <td>供應商類型</td>
            <td>否</td>
            <td>如：設備、耗材、服務</td>
        </tr>
        <tr>
            <td>狀態</td>
            <td>是</td>
            <td>啟用/停用</td>
        </tr>
    </tbody>
</table>
            `
        },

        'employees': {
            title: '員工管理',
            content: `
<h1>員工管理</h1>

<p>「員工管理」用於建立員工資料與系統登入帳號。</p>

<h2>功能說明</h2>

<ul>
    <li>新增、編輯員工資料</li>
    <li>建立系統登入帳號</li>
    <li>指派員工角色（權限）</li>
    <li>啟用/停用員工帳號</li>
</ul>

<h2>操作步驟</h2>

<h3>新增員工</h3>

<ol class="steps">
    <li>進入「基本資料管理」>「員工基本資料」</li>
    <li>點擊「新增」</li>
    <li>填寫員工基本資料</li>
    <li>設定登入帳號與初始密碼</li>
    <li>選擇所屬部門</li>
    <li>點擊「儲存」</li>
</ol>

<h3>指派角色</h3>

<ol class="steps">
    <li>進入「權限管理」>「員工角色」</li>
    <li>選擇要指派的員工</li>
    <li>勾選要指派的角色</li>
    <li>儲存變更</li>
</ol>

<div class="info">
    <div>員工必須被指派至少一個角色，才能擁有系統操作權限。</div>
</div>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>員工編號</td>
            <td>自動</td>
            <td>系統自動產生</td>
        </tr>
        <tr>
            <td>姓名</td>
            <td>是</td>
            <td>員工姓名</td>
        </tr>
        <tr>
            <td>帳號</td>
            <td>是</td>
            <td>系統登入帳號，不可重複</td>
        </tr>
        <tr>
            <td>密碼</td>
            <td>是</td>
            <td>新增時必填，編輯時留空表示不修改</td>
        </tr>
        <tr>
            <td>部門</td>
            <td>否</td>
            <td>所屬部門</td>
        </tr>
        <tr>
            <td>職稱</td>
            <td>否</td>
            <td>員工職稱</td>
        </tr>
        <tr>
            <td>Email</td>
            <td>否</td>
            <td>電子郵件</td>
        </tr>
        <tr>
            <td>狀態</td>
            <td>是</td>
            <td>啟用/停用</td>
        </tr>
    </tbody>
</table>

<div class="warning">
    <div>停用員工帳號後，該員工將無法登入系統。</div>
</div>
            `
        },

        'departments': {
            title: '部門管理',
            content: `
<h1>部門管理</h1>

<p>「部門管理」用於建立公司的組織架構。</p>

<h2>功能說明</h2>

<ul>
    <li>新增、編輯、刪除部門</li>
    <li>設定部門層級關係</li>
</ul>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>部門名稱</td>
            <td>是</td>
            <td>部門名稱</td>
        </tr>
        <tr>
            <td>部門代碼</td>
            <td>否</td>
            <td>部門代碼</td>
        </tr>
        <tr>
            <td>上級部門</td>
            <td>否</td>
            <td>上級部門（若為最上層則留空）</td>
        </tr>
        <tr>
            <td>部門主管</td>
            <td>否</td>
            <td>部門主管（選擇員工）</td>
        </tr>
        <tr>
            <td>狀態</td>
            <td>是</td>
            <td>啟用/停用</td>
        </tr>
    </tbody>
</table>
            `
        },

        'screening-items': {
            title: '受篩產品',
            content: `
<h1>受篩產品</h1>

<p>「受篩產品」用於定義客戶送來篩選的螺絲產品規格。</p>

<h2>功能說明</h2>

<ul>
    <li>建立產品規格資料</li>
    <li>定義產品單重（用於計算支數）</li>
    <li>記錄產品尺寸規格</li>
</ul>

<h2>重要概念</h2>

<div class="info">
    <div>
        <strong>單重與支數計算</strong><br>
        總支數 = 淨重 ÷ 單重<br>
        例如：淨重 100 kg、單重 0.5 g → 總支數 = 100,000 ÷ 0.5 = 200,000 支
    </div>
</div>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>產品編號</td>
            <td>自動</td>
            <td>系統自動產生</td>
        </tr>
        <tr>
            <td>產品名稱</td>
            <td>是</td>
            <td>產品名稱，如「M3x8 十字槽」</td>
        </tr>
        <tr>
            <td>產品類別</td>
            <td>否</td>
            <td>如：機械螺絲、木螺絲、自攻螺絲</td>
        </tr>
        <tr>
            <td>規格</td>
            <td>否</td>
            <td>如：M3x8</td>
        </tr>
        <tr>
            <td>材質</td>
            <td>否</td>
            <td>如：鐵、不鏽鋼</td>
        </tr>
        <tr>
            <td>表面處理</td>
            <td>否</td>
            <td>如：鍍鋅、鍍鎳</td>
        </tr>
        <tr>
            <td>單重(g)</td>
            <td>是</td>
            <td>每支螺絲的重量（公克）</td>
        </tr>
        <tr>
            <td>備註</td>
            <td>否</td>
            <td>其他說明</td>
        </tr>
    </tbody>
</table>
            `
        },

        'screening-services': {
            title: '篩分服務項目',
            content: `
<h1>篩分服務項目</h1>

<p>「篩分服務項目」定義各種檢驗項目，建立訂單時可選擇需要的篩分服務。</p>

<h2>功能說明</h2>

<ul>
    <li>建立標準檢驗項目</li>
    <li>定義公差標準</li>
    <li>設定 PPM 標準</li>
    <li>設定單價</li>
</ul>

<h2>常見篩分服務</h2>

<table>
    <thead>
        <tr>
            <th>項目類別</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>外觀檢驗</td>
            <td>裂痕、刮傷、變形、電鍍不良</td>
        </tr>
        <tr>
            <td>尺寸檢驗</td>
            <td>頭高、頭寬、全長、牙外徑</td>
        </tr>
        <tr>
            <td>功能檢驗</td>
            <td>扭力測試、硬度測試</td>
        </tr>
        <tr>
            <td>特殊檢驗</td>
            <td>混料挑選、混規格挑選</td>
        </tr>
    </tbody>
</table>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>服務名稱</td>
            <td>是</td>
            <td>檢驗項目名稱</td>
        </tr>
        <tr>
            <td>服務類別</td>
            <td>否</td>
            <td>外觀/尺寸/功能/特殊</td>
        </tr>
        <tr>
            <td>公差上限</td>
            <td>否</td>
            <td>正公差值</td>
        </tr>
        <tr>
            <td>公差下限</td>
            <td>否</td>
            <td>負公差值</td>
        </tr>
        <tr>
            <td>PPM 標準</td>
            <td>否</td>
            <td>不良率標準（百萬分之幾）</td>
        </tr>
        <tr>
            <td>單價</td>
            <td>否</td>
            <td>每公斤/每千支的服務費用</td>
        </tr>
        <tr>
            <td>計價單位</td>
            <td>否</td>
            <td>公斤/千支</td>
        </tr>
    </tbody>
</table>

<div class="info">
    <div>
        <strong>什麼是 PPM？</strong><br>
        PPM = Parts Per Million（百萬分之幾）<br>
        例如：PPM 100 表示每百萬支螺絲中，允許有 100 支不良品
    </div>
</div>
            `
        },

        // ==================== 訂單管理 ====================
        'orders-overview': {
            title: '訂單管理總覽',
            content: `
<h1>訂單管理總覽</h1>

<p>訂單管理是系統的核心功能，用於記錄客戶委託的篩分作業。</p>

<h2>訂單結構</h2>

<p>系統的訂單採用兩層架構：</p>

<table>
    <thead>
        <tr>
            <th>層級</th>
            <th>名稱</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>第一層</td>
            <td>訂單主表</td>
            <td>記錄客戶、交期、總金額等訂單層級資訊</td>
        </tr>
        <tr>
            <td>第二層</td>
            <td>客戶批號</td>
            <td>記錄每批螺絲的規格、重量、篩分服務明細</td>
        </tr>
    </tbody>
</table>

<h2>訂單流程</h2>

<ol class="steps">
    <li>
        <strong>建立訂單</strong><br>
        收到客戶訂單後，先建立訂單主表
    </li>
    <li>
        <strong>新增客戶批號</strong><br>
        在訂單下新增每批螺絲的資料
    </li>
    <li>
        <strong>設定篩分服務</strong><br>
        為每個批號指定需要的檢驗項目
    </li>
    <li>
        <strong>建立生產工單</strong><br>
        依據客戶批號建立生產工單
    </li>
</ol>

<h2>訂單狀態</h2>

<table>
    <thead>
        <tr>
            <th>狀態</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>草稿</td>
            <td>訂單建立中，尚未確認</td>
        </tr>
        <tr>
            <td>已確認</td>
            <td>訂單已確認，可進行後續作業</td>
        </tr>
        <tr>
            <td>生產中</td>
            <td>有工單正在生產</td>
        </tr>
        <tr>
            <td>已完成</td>
            <td>所有批號都已完成篩分</td>
        </tr>
        <tr>
            <td>已取消</td>
            <td>訂單已取消</td>
        </tr>
    </tbody>
</table>
            `
        },

        'orders': {
            title: '訂單主表',
            content: `
<h1>訂單主表</h1>

<p>訂單主表記錄訂單的基本資訊，是建立客戶批號的前置作業。</p>

<h2>新功能：最低委託額度警示</h2>

<div class="warning">
    <div>
        <strong>自動檢查最低委託額度</strong><br>
        當訂單總金額低於該客戶設定的「單筆最低委託額度」時，系統會顯示<span class="text-warning-inline">橘色警告</span>，提醒業務人員注意。此警示不會阻擋操作，僅作為提醒。
    </div>
</div>

<h2>操作步驟</h2>

<h3>新增訂單</h3>

<ol class="steps">
    <li>進入「訂單管理」>「訂單主表管理」</li>
    <li>點擊「新增」按鈕</li>
    <li>選擇客戶</li>
    <li>填寫客戶訂單號（客戶的採購單號）</li>
    <li>選擇預計交期</li>
    <li>填寫其他資訊（選填）</li>
    <li>點擊「儲存」</li>
</ol>

<h3>檢視訂單明細</h3>

<ol class="steps">
    <li>在訂單列表找到目標訂單</li>
    <li>點擊「詳情」按鈕</li>
    <li>可查看訂單的所有客戶批號</li>
</ol>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>訂單編號</td>
            <td>自動</td>
            <td>系統自動產生，格式 ORD-YYYYMMDD-XXXX</td>
        </tr>
        <tr>
            <td>客戶</td>
            <td>是</td>
            <td>下單客戶</td>
        </tr>
        <tr>
            <td>客戶訂單號</td>
            <td>否</td>
            <td>客戶的採購單號/PO號</td>
        </tr>
        <tr>
            <td>訂單日期</td>
            <td>是</td>
            <td>訂單成立日期</td>
        </tr>
        <tr>
            <td>預計交期</td>
            <td>否</td>
            <td>客戶要求的交貨日期</td>
        </tr>
        <tr>
            <td>備註</td>
            <td>否</td>
            <td>訂單備註事項</td>
        </tr>
    </tbody>
</table>
            `
        },

        'order-items': {
            title: '客戶批號',
            content: `
<h1>客戶批號</h1>

<p>「客戶批號」記錄每批送來篩分的螺絲詳細資料，包含重量、數量、篩分服務等。</p>

<h2>新功能：三階段重量追蹤</h2>

<div class="info">
    <div>
        <strong>重量追蹤功能</strong><br>
        系統現在支援三階段重量記錄，方便追蹤從收貨到完工的重量變化：
        <ol>
            <li><strong>客戶提供重量</strong>：客戶委外單上標示的重量</li>
            <li><strong>我方確認重量</strong>：收貨時實際秤重確認的重量</li>
            <li><strong>實際生產重量</strong>：篩分完成後的最終重量</li>
        </ol>
    </div>
</div>

<div class="warning">
    <div>
        <strong>重量公差警示</strong><br>
        當「實際生產重量」與「我方確認重量」的差異超過客戶設定的公差百分比時，系統會顯示<span class="text-danger-inline">紅色警告</span>，提醒人員檢查是否有異常（如漏料、計量錯誤等）。
    </div>
</div>

<h2>新功能：部分出貨追蹤</h2>

<div class="info">
    <div>
        <strong>出貨狀態追蹤</strong><br>
        系統會自動追蹤每個客戶批號的出貨狀態：
        <ul>
            <li><strong>未出貨</strong>：尚未建立任何出貨單</li>
            <li><strong>部分出貨</strong>：已出貨部分數量，仍有餘額</li>
            <li><strong>全部出貨</strong>：已全數出貨完畢</li>
        </ul>
        業務人員可一目了然知道哪些批號還有餘額未出。
    </div>
</div>

<h2>重要概念</h2>

<div class="info">
    <div>
        <strong>客戶批號的意義</strong><br>
        客戶每次送來的螺絲會有批號標示，同一批號的螺絲來自相同的生產批次，需要一起處理。
    </div>
</div>

<h2>操作步驟</h2>

<h3>新增客戶批號</h3>

<ol class="steps">
    <li>進入「訂單管理」>「客戶批號管理」</li>
    <li>點擊「新增」按鈕</li>
    <li>選擇所屬訂單</li>
    <li>填寫客戶批號（客戶標示的批號）</li>
    <li>選擇受篩產品</li>
    <li>填寫入貨重量、載具資訊</li>
    <li><strong>填寫重量追蹤資訊</strong>（客戶提供重量、確認重量）</li>
    <li>新增篩分服務明細</li>
    <li>點擊「儲存」</li>
</ol>

<h3>設定篩分服務明細</h3>

<p>每個客戶批號可以設定多項篩分服務，每項服務可以自訂公差與 PPM 標準。</p>

<ol class="steps">
    <li>在客戶批號表單中</li>
    <li>找到「篩分服務明細」區塊</li>
    <li>點擊「新增服務」</li>
    <li>選擇篩分服務項目</li>
    <li>可修改公差值（若與標準不同）</li>
    <li>可修改 PPM 標準（若與標準不同）</li>
</ol>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>所屬訂單</td>
            <td>是</td>
            <td>選擇訂單主表</td>
        </tr>
        <tr>
            <td>客戶批號</td>
            <td>是</td>
            <td>客戶標示的批號</td>
        </tr>
        <tr>
            <td>受篩產品</td>
            <td>是</td>
            <td>螺絲產品規格</td>
        </tr>
        <tr>
            <td>入貨重量(kg)</td>
            <td>是</td>
            <td>客戶送來的總重量</td>
        </tr>
        <tr>
            <td>載具數量</td>
            <td>否</td>
            <td>使用幾個載具盛裝</td>
        </tr>
        <tr>
            <td>載具重量(kg)</td>
            <td>否</td>
            <td>載具的總重量</td>
        </tr>
        <tr>
            <td>料號</td>
            <td>否</td>
            <td>客戶的料號</td>
        </tr>
        <tr>
            <td>圖面號碼</td>
            <td>否</td>
            <td>產品圖面編號</td>
        </tr>
    </tbody>
</table>

<h3>重量追蹤欄位（新功能）</h3>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>客戶提供重量</td>
            <td>否</td>
            <td>客戶委外單上標示的重量</td>
        </tr>
        <tr>
            <td>我方確認重量</td>
            <td>否</td>
            <td>收貨時實際秤重確認的重量</td>
        </tr>
        <tr>
            <td>實際生產重量</td>
            <td>否</td>
            <td>篩分完成後的最終重量</td>
        </tr>
    </tbody>
</table>

<h3>出貨追蹤欄位（新功能，系統自動維護）</h3>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>累計已出貨數量</td>
            <td>所有出貨單的出貨數量加總</td>
        </tr>
        <tr>
            <td>出貨狀態</td>
            <td>未出貨 / 部分出貨 / 全部出貨</td>
        </tr>
    </tbody>
</table>

<h3>計算邏輯</h3>

<ul>
    <li><strong>淨重</strong> = 入貨重量 - 載具重量</li>
    <li><strong>總支數</strong> = 淨重(g) ÷ 單重(g)</li>
    <li><strong>總金額</strong> = Σ(各服務數量 × 單價)</li>
    <li><strong>重量差異率</strong> = |實際生產重量 - 我方確認重量| ÷ 我方確認重量 × 100%</li>
</ul>
            `
        },

        // ==================== 生產作業 ====================
        'production-overview': {
            title: '生產作業總覽',
            content: `
<h1>生產作業總覽</h1>

<p>生產作業模組管理從工單建立到完工的整個生產流程。</p>

<h2>生產流程</h2>

<ol class="steps">
    <li>
        <strong>建立工單</strong><br>
        依據客戶批號建立生產工單
    </li>
    <li>
        <strong>排程指派</strong><br>
        指派機台、作業員工、預定時間
    </li>
    <li>
        <strong>列印命令單</strong><br>
        列印紙本生產命令單給現場
    </li>
    <li>
        <strong>首件檢驗</strong><br>
        開始前量測首件尺寸
    </li>
    <li>
        <strong>執行生產</strong><br>
        依命令單進行篩分作業
    </li>
    <li>
        <strong>登錄紀錄</strong><br>
        每完成一載具，登錄卡號與重量
    </li>
    <li>
        <strong>品質檢驗</strong><br>
        記錄各項不良品數量
    </li>
    <li>
        <strong>完工入庫</strong><br>
        完成後良品入庫
    </li>
</ol>

<h2>工單狀態</h2>

<table>
    <thead>
        <tr>
            <th>狀態</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>待排程</td>
            <td>工單已建立，等待排程</td>
        </tr>
        <tr>
            <td>已排程</td>
            <td>已指派機台與人員</td>
        </tr>
        <tr>
            <td>生產中</td>
            <td>正在執行篩分作業</td>
        </tr>
        <tr>
            <td>已完成</td>
            <td>篩分作業完成</td>
        </tr>
        <tr>
            <td>已取消</td>
            <td>工單已取消</td>
        </tr>
    </tbody>
</table>
            `
        },

        'work-orders': {
            title: '生產工單',
            content: `
<h1>生產工單</h1>

<p>生產工單是現場作業的依據，記錄每批螺絲的篩分任務。</p>

<h2>操作步驟</h2>

<h3>建立工單</h3>

<ol class="steps">
    <li>進入「生產作業」>「生產工單」</li>
    <li>點擊「新增」按鈕</li>
    <li>選擇客戶批號（會自動帶入相關資訊）</li>
    <li>填寫工單資訊</li>
    <li>點擊「儲存」</li>
</ol>

<h3>排程工單</h3>

<ol class="steps">
    <li>選擇要排程的工單</li>
    <li>點擊「編輯」</li>
    <li>指派機台</li>
    <li>指派作業員工</li>
    <li>指派校機人員（選填）</li>
    <li>設定預定開始/結束時間</li>
    <li>儲存</li>
</ol>

<h3>開始生產</h3>

<ol class="steps">
    <li>找到要開始的工單</li>
    <li>點擊「開始生產」按鈕</li>
    <li>系統會記錄實際開始時間</li>
</ol>

<h3>完成工單</h3>

<ol class="steps">
    <li>所有生產紀錄都已登錄</li>
    <li>點擊「完成」按鈕</li>
    <li>系統會記錄實際結束時間</li>
</ol>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>工單編號</td>
            <td>自動</td>
            <td>格式 WO-YYYYMMDD-XXXX</td>
        </tr>
        <tr>
            <td>客戶批號</td>
            <td>是</td>
            <td>關聯的客戶批號</td>
        </tr>
        <tr>
            <td>指派機台</td>
            <td>否</td>
            <td>執行篩分的機台</td>
        </tr>
        <tr>
            <td>指派員工</td>
            <td>否</td>
            <td>負責作業的員工</td>
        </tr>
        <tr>
            <td>校機人員</td>
            <td>否</td>
            <td>負責校機的員工</td>
        </tr>
        <tr>
            <td>篩選速度</td>
            <td>否</td>
            <td>機台篩選速度設定</td>
        </tr>
        <tr>
            <td>預定開始</td>
            <td>否</td>
            <td>預定開始時間</td>
        </tr>
        <tr>
            <td>預定結束</td>
            <td>否</td>
            <td>預定結束時間</td>
        </tr>
    </tbody>
</table>
            `
        },

        'work-order-print': {
            title: '工單列印',
            content: `
<h1>工單列印</h1>

<p>生產命令單是給現場人員的作業指示，包含所有必要的生產資訊。</p>

<h2>列印方式</h2>

<h3>單張列印</h3>

<ol class="steps">
    <li>在工單列表找到目標工單</li>
    <li>點擊「列印」按鈕</li>
    <li>開啟列印預覽頁面</li>
    <li>點擊「列印生產命令單(A4)」</li>
</ol>

<h3>批次列印</h3>

<ol class="steps">
    <li>勾選多張工單</li>
    <li>點擊「批次列印」</li>
    <li>所有工單會一起開啟預覽</li>
</ol>

<h2>列印內容</h2>

<p>生產命令單包含以下資訊：</p>

<table>
    <thead>
        <tr>
            <th>區塊</th>
            <th>內容</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>訂單資訊</td>
            <td>客戶、批號、料號、交期</td>
        </tr>
        <tr>
            <td>生產資訊</td>
            <td>入貨重量、載具數量、總支數</td>
        </tr>
        <tr>
            <td>排程資訊</td>
            <td>機台、員工、預定時間</td>
        </tr>
        <tr>
            <td>篩分服務明細</td>
            <td>檢驗項目、公差、PPM、<strong>不良品數量欄位</strong></td>
        </tr>
        <tr>
            <td>卡號與重量記錄</td>
            <td>卡號、目標支數、<strong>實際重量欄位</strong></td>
        </tr>
        <tr>
            <td>首件尺寸</td>
            <td>首件量測數據</td>
        </tr>
        <tr>
            <td>交辦備註</td>
            <td>客戶交辦事項、其他備註</td>
        </tr>
    </tbody>
</table>

<div class="info">
    <div>
        <strong>卡號說明</strong><br>
        卡號是根據「總支數 ÷ 載具數量」計算的累計支數，方便現場人員判斷何時該換載具。<br>
        例如：總支數 305、載具 3 個 → 卡號 1: 102、卡號 2: 204、卡號 3: 305
    </div>
</div>

<h2>現場填寫</h2>

<p>列印的生產命令單包含空白欄位供現場人員填寫：</p>

<ul>
    <li><strong>不良品數量</strong>：每項篩分服務的不良品數量</li>
    <li><strong>實際重量</strong>：每個卡號（載具）的實際過磅重量</li>
    <li><strong>日期/時間</strong>：完成時間</li>
</ul>

<p>現場人員填寫後，可至系統登錄生產紀錄。</p>
            `
        },

        'production-records': {
            title: '生產紀錄',
            content: `
<h1>生產紀錄</h1>

<p>生產紀錄用於登錄每個載具（卡號）的實際生產資料。</p>

<h2>操作步驟</h2>

<h3>登錄生產紀錄</h3>

<ol class="steps">
    <li>進入「生產作業」>「生產紀錄」</li>
    <li>點擊「新增」</li>
    <li>選擇工單</li>
    <li>填寫卡號（目標支數）</li>
    <li>填寫實際重量</li>
    <li>選擇機台（若與工單不同）</li>
    <li>填寫備註（選填）</li>
    <li>儲存</li>
</ol>

<div class="tip">
    <div>也可以從工單詳情頁面直接新增生產紀錄，會自動帶入工單資訊。</div>
</div>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>工單</td>
            <td>是</td>
            <td>關聯的生產工單</td>
        </tr>
        <tr>
            <td>卡號</td>
            <td>是</td>
            <td>目標支數/累計支數</td>
        </tr>
        <tr>
            <td>重量(kg)</td>
            <td>是</td>
            <td>實際過磅重量（含載具）</td>
        </tr>
        <tr>
            <td>生產日期</td>
            <td>否</td>
            <td>生產完成日期</td>
        </tr>
        <tr>
            <td>生產時間</td>
            <td>否</td>
            <td>生產完成時間</td>
        </tr>
        <tr>
            <td>機台</td>
            <td>否</td>
            <td>實際使用的機台</td>
        </tr>
        <tr>
            <td>備註</td>
            <td>否</td>
            <td>其他說明</td>
        </tr>
    </tbody>
</table>
            `
        },

        'first-piece-inspection': {
            title: '首件檢驗',
            content: `
<h1>首件檢驗</h1>

<p>首件檢驗是在開始大量篩分前，先量測一顆螺絲的尺寸，確認符合規格。</p>

<h2>操作步驟</h2>

<ol class="steps">
    <li>進入「生產作業」>「首件尺寸檢驗」</li>
    <li>選擇工單</li>
    <li>使用量具量測螺絲各項尺寸</li>
    <li>輸入量測數據</li>
    <li>儲存</li>
</ol>

<h2>量測項目</h2>

<table>
    <thead>
        <tr>
            <th>項目</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>頭高</td>
            <td>螺絲頭部高度</td>
        </tr>
        <tr>
            <td>頭寬</td>
            <td>螺絲頭部寬度/直徑</td>
        </tr>
        <tr>
            <td>全長</td>
            <td>螺絲總長度</td>
        </tr>
        <tr>
            <td>牙外徑</td>
            <td>螺紋外徑</td>
        </tr>
        <tr>
            <td>華司徑</td>
            <td>華司外徑（若有）</td>
        </tr>
        <tr>
            <td>外徑</td>
            <td>一般外徑</td>
        </tr>
        <tr>
            <td>孔徑</td>
            <td>孔洞直徑（若有）</td>
        </tr>
        <tr>
            <td>厚度</td>
            <td>厚度尺寸</td>
        </tr>
    </tbody>
</table>

<div class="tip">
    <div>首件尺寸會顯示在列印的生產命令單上，方便對照。</div>
</div>
            `
        },

        // ==================== 設備管理 ====================
        'machines': {
            title: '機台管理',
            content: `
<h1>機台管理</h1>

<p>「機台管理」用於維護篩選機、光學選別機等設備資料。</p>

<h2>功能說明</h2>

<ul>
    <li>建立機台資料</li>
    <li>記錄機台規格</li>
    <li>追蹤機台狀態</li>
    <li>記錄保養紀錄</li>
</ul>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>機台編號</td>
            <td>自動</td>
            <td>系統自動產生</td>
        </tr>
        <tr>
            <td>機台名稱</td>
            <td>是</td>
            <td>機台名稱</td>
        </tr>
        <tr>
            <td>機台類型</td>
            <td>否</td>
            <td>篩選機/光學選別機/其他</td>
        </tr>
        <tr>
            <td>品牌</td>
            <td>否</td>
            <td>設備品牌</td>
        </tr>
        <tr>
            <td>型號</td>
            <td>否</td>
            <td>設備型號</td>
        </tr>
        <tr>
            <td>購入日期</td>
            <td>否</td>
            <td>設備購入日期</td>
        </tr>
        <tr>
            <td>狀態</td>
            <td>是</td>
            <td>正常/維修中/停用</td>
        </tr>
    </tbody>
</table>
            `
        },

        'tools': {
            title: '載具管理',
            content: `
<h1>載具管理</h1>

<p>「載具」是用來盛裝螺絲的容器，如桶、箱等。</p>

<h2>功能說明</h2>

<ul>
    <li>建立載具資料</li>
    <li>記錄載具重量（用於計算淨重）</li>
    <li>追蹤載具狀態</li>
</ul>

<h2>欄位說明</h2>

<table>
    <thead>
        <tr>
            <th>欄位</th>
            <th>必填</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>載具編號</td>
            <td>自動</td>
            <td>系統自動產生</td>
        </tr>
        <tr>
            <td>載具名稱</td>
            <td>是</td>
            <td>載具名稱，如「大桶」「小箱」</td>
        </tr>
        <tr>
            <td>載具類型</td>
            <td>否</td>
            <td>桶/箱/其他</td>
        </tr>
        <tr>
            <td>皮重(kg)</td>
            <td>是</td>
            <td>空載具的重量</td>
        </tr>
        <tr>
            <td>容量(kg)</td>
            <td>否</td>
            <td>載具可裝載的最大重量</td>
        </tr>
        <tr>
            <td>狀態</td>
            <td>是</td>
            <td>正常/損壞/報廢</td>
        </tr>
    </tbody>
</table>

<div class="info">
    <div>
        <strong>淨重計算</strong><br>
        淨重 = 總重 - 載具重量<br>
        準確的載具皮重對於計算產品支數非常重要。
    </div>
</div>
            `
        },

        'machine-inspections': {
            title: '機台巡檢',
            content: `
<h1>機台巡檢</h1>

<p>每日機台巡檢用於記錄設備的運作狀況，及早發現問題。</p>

<h2>操作步驟</h2>

<ol class="steps">
    <li>進入「設備管理」>「每日機台巡檢」</li>
    <li>選擇要巡檢的機台</li>
    <li>依檢查項目逐項檢查</li>
    <li>記錄檢查結果（正常/異常）</li>
    <li>異常項目填寫說明</li>
    <li>儲存巡檢紀錄</li>
</ol>

<h2>常見檢查項目</h2>

<ul>
    <li>外觀清潔狀況</li>
    <li>運轉聲音是否正常</li>
    <li>油位是否正常</li>
    <li>安全裝置是否正常</li>
    <li>感測器是否正常</li>
</ul>
            `
        },

        'machine-maintenance': {
            title: '機台保養',
            content: `
<h1>機台保養</h1>

<p>機台保養任務用於排程與追蹤設備的定期保養作業。</p>

<h2>功能說明</h2>

<ul>
    <li>建立保養任務</li>
    <li>設定保養週期</li>
    <li>追蹤保養進度</li>
    <li>記錄保養結果</li>
</ul>

<h2>保養類型</h2>

<table>
    <thead>
        <tr>
            <th>類型</th>
            <th>週期</th>
            <th>內容</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>日常保養</td>
            <td>每日</td>
            <td>清潔、基本檢查</td>
        </tr>
        <tr>
            <td>週保養</td>
            <td>每週</td>
            <td>潤滑、零件檢查</td>
        </tr>
        <tr>
            <td>月保養</td>
            <td>每月</td>
            <td>深度清潔、校正</td>
        </tr>
        <tr>
            <td>年保養</td>
            <td>每年</td>
            <td>全面檢修、零件更換</td>
        </tr>
    </tbody>
</table>
            `
        },

        // ==================== FAQ ====================
        'faq': {
            title: 'FAQ 常見問題',
            content: `
<h1>FAQ 常見問題</h1>

<h2>登入問題</h2>

<h3>Q: 忘記密碼怎麼辦？</h3>
<p>A: 請聯繫系統管理員重設密碼。</p>

<h3>Q: 登入時顯示「帳號已被停用」？</h3>
<p>A: 您的帳號可能被管理員停用，請聯繫管理員確認。</p>

<h2>訂單問題</h2>

<h3>Q: 如何查詢特定客戶的訂單？</h3>
<p>A: 在訂單列表使用搜尋框輸入客戶名稱，或使用進階篩選功能。</p>

<h3>Q: 訂單可以修改嗎？</h3>
<p>A: 草稿狀態的訂單可以修改。已確認或已開工的訂單，修改會受到限制。</p>

<h2>生產問題</h2>

<h3>Q: 工單列印出來沒有公司 LOGO？</h3>
<p>A: 請至「公司資料」上傳公司 LOGO 圖片。</p>

<h3>Q: 卡號是如何計算的？</h3>
<p>A: 卡號 = 累計支數 = (總支數 ÷ 載具數量) × 卡號序號</p>

<h3>Q: 生產紀錄的重量要含載具嗎？</h3>
<p>A: 是的，登錄的是過磅後的總重量（含載具），系統會自動計算淨重。</p>

<h2>系統問題</h2>

<h3>Q: 資料可以匯出嗎？</h3>
<p>A: 大多數列表都支援 Excel 匯出功能，請點擊「匯出」按鈕。</p>

<h3>Q: 分頁狀態會儲存嗎？</h3>
<p>A: 是的，下次登入會自動恢復上次開啟的分頁。</p>
            `
        },

        'troubleshooting': {
            title: '故障排除',
            content: `
<h1>故障排除</h1>

<h2>頁面無法載入</h2>

<ol class="steps">
    <li>確認網路連線正常</li>
    <li>嘗試重新整理頁面（按 <kbd>F5</kbd>）</li>
    <li>清除瀏覽器快取</li>
    <li>嘗試使用其他瀏覽器</li>
</ol>

<h2>登入後自動登出</h2>

<p>可能原因：</p>
<ul>
    <li>Session 已逾時（超過 30 分鐘未操作）</li>
    <li>在其他裝置登入同一帳號</li>
    <li>瀏覽器封鎖了 Cookie</li>
</ul>

<p>解決方法：重新登入，並確認瀏覽器允許 Cookie。</p>

<h2>列印問題</h2>

<h3>列印出來是空白</h3>
<ul>
    <li>確認印表機連線正常</li>
    <li>確認選擇了正確的印表機</li>
    <li>嘗試先存成 PDF 再列印</li>
</ul>

<h3>列印版面跑掉</h3>
<ul>
    <li>確認紙張大小設定為 A4</li>
    <li>確認列印比例為 100%</li>
    <li>取消「縮放至適合頁面」選項</li>
</ul>

<h2>資料異常</h2>

<h3>資料沒有即時更新</h3>
<ul>
    <li>嘗試重新整理頁面</li>
    <li>關閉分頁再重新開啟</li>
</ul>

<h3>計算結果不正確</h3>
<ul>
    <li>檢查輸入的數值是否正確</li>
    <li>確認產品單重設定正確</li>
    <li>確認載具重量設定正確</li>
</ul>

<h2>聯絡支援</h2>

<p>如果以上方法都無法解決問題，請聯絡系統管理員，並提供：</p>
<ul>
    <li>問題發生的時間</li>
    <li>您的帳號</li>
    <li>問題的詳細描述</li>
    <li>錯誤訊息截圖（如有）</li>
</ul>
            `
        },

        // 其他模組的簡要說明
        'inventory-items': {
            title: '庫存管理',
            content: `
<h1>庫存管理</h1>

<p>「庫存管理」用於追蹤良品的庫存狀況。</p>

<h2>功能說明</h2>

<ul>
    <li>查看庫存品項清單</li>
    <li>追蹤庫存數量</li>
    <li>管理倉位資訊</li>
</ul>

<h2>庫存來源</h2>

<p>庫存品項主要來自生產工單完工後的良品入庫。</p>

<h2>庫存狀態</h2>

<table>
    <thead>
        <tr>
            <th>狀態</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>在庫</td>
            <td>可用庫存</td>
        </tr>
        <tr>
            <td>已配貨</td>
            <td>已分配給出貨單，等待出貨</td>
        </tr>
        <tr>
            <td>已出貨</td>
            <td>已出貨給客戶</td>
        </tr>
    </tbody>
</table>
            `
        },

        'inventory-transactions': {
            title: '庫存異動',
            content: `
<h1>庫存異動</h1>

<p>「庫存異動」記錄所有庫存的進出紀錄。</p>

<h2>異動類型</h2>

<table>
    <thead>
        <tr>
            <th>類型</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>入庫</td>
            <td>良品入庫</td>
        </tr>
        <tr>
            <td>出庫</td>
            <td>出貨給客戶</td>
        </tr>
        <tr>
            <td>調整</td>
            <td>盤點調整</td>
        </tr>
        <tr>
            <td>退貨入庫</td>
            <td>客戶退貨</td>
        </tr>
    </tbody>
</table>
            `
        },

        'shipping-orders': {
            title: '出貨管理',
            content: `
<h1>出貨管理</h1>

<p>「出貨管理」用於建立與追蹤出貨單。</p>

<h2>新功能：訂單項目關聯</h2>

<div class="info">
    <div>
        <strong>完整追蹤鏈</strong><br>
        出貨單項目現在會關聯到原始的「客戶批號」（order_item），實現完整的追蹤鏈：
        <ul>
            <li>客戶訂單 → 客戶批號 → 出貨單項目</li>
            <li>可追溯每批出貨的來源訂單與客戶批號</li>
            <li>出貨時會自動更新客戶批號的「累計已出貨數量」</li>
        </ul>
    </div>
</div>

<h2>新功能：部分出貨追蹤</h2>

<div class="info">
    <div>
        <strong>自動沖帳功能</strong><br>
        每次建立出貨單時，系統會自動：
        <ol>
            <li>更新客戶批號的「累計已出貨數量」</li>
            <li>更新客戶批號的「出貨狀態」（未出貨/部分出貨/全部出貨）</li>
            <li>檢查可出貨數量是否足夠</li>
        </ol>
    </div>
</div>

<h2>操作步驟</h2>

<h3>建立出貨單</h3>

<ol class="steps">
    <li>進入「出貨管理」>「出貨單」</li>
    <li>點擊「新增」</li>
    <li>選擇客戶</li>
    <li>選擇要出貨的庫存品項（會顯示可出貨數量）</li>
    <li>填寫出貨數量（系統會檢查是否超過可出貨數量）</li>
    <li>儲存</li>
</ol>

<h2>出貨單狀態</h2>

<table>
    <thead>
        <tr>
            <th>狀態</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>草稿</td>
            <td>建立中</td>
        </tr>
        <tr>
            <td>待出貨</td>
            <td>等待出貨</td>
        </tr>
        <tr>
            <td>已出貨</td>
            <td>已完成出貨</td>
        </tr>
        <tr>
            <td>已取消</td>
            <td>出貨單已取消</td>
        </tr>
    </tbody>
</table>
            `
        },

        'return-orders': {
            title: '退貨管理',
            content: `
<h1>退貨管理</h1>

<p>「退貨管理」用於處理客戶退貨。</p>

<h2>操作步驟</h2>

<ol class="steps">
    <li>進入「出貨管理」>「退貨單」</li>
    <li>點擊「新增」</li>
    <li>選擇原出貨單</li>
    <li>填寫退貨原因</li>
    <li>填寫退貨數量</li>
    <li>儲存</li>
</ol>

<h2>退貨處理</h2>

<p>退貨品經檢驗後，可：</p>
<ul>
    <li><strong>重新入庫</strong>：品質合格，重新入庫</li>
    <li><strong>報廢</strong>：品質不合格，報廢處理</li>
    <li><strong>重工</strong>：需要重新篩選</li>
</ul>
            `
        },

        'quality-overview': {
            title: '品質管理總覽',
            content: `
<h1>品質管理總覽</h1>

<p>品質管理模組用於記錄與追蹤產品品質狀況。</p>

<h2>品質管理範圍</h2>

<ul>
    <li><strong>生產品質檢驗</strong>：篩分過程中的品質檢驗</li>
    <li><strong>出貨品質檢驗</strong>：出貨前的最終檢驗</li>
    <li><strong>品質異常報告</strong>：記錄品質問題與處理</li>
</ul>

<h2>品質指標</h2>

<h3>PPM（Parts Per Million）</h3>
<p>不良率的計算方式，表示每百萬件中的不良品數量。</p>
<p>PPM = (不良品數 ÷ 總數量) × 1,000,000</p>

<h3>良率</h3>
<p>良率 = (良品數 ÷ 總數量) × 100%</p>
            `
        },

        'production-quality': {
            title: '生產品質檢驗',
            content: `
<h1>生產品質檢驗</h1>

<p>記錄篩分過程中各項檢驗項目的不良品數量。</p>

<h2>操作步驟</h2>

<ol class="steps">
    <li>進入「品質管理」>「生產品質檢驗」</li>
    <li>選擇工單</li>
    <li>依篩分服務項目填寫不良品數量</li>
    <li>填寫備註說明（如有特殊狀況）</li>
    <li>儲存</li>
</ol>
            `
        },

        'shipping-quality': {
            title: '出貨品質檢驗',
            content: `
<h1>出貨品質檢驗</h1>

<p>出貨前的最終品質確認。</p>

<h2>檢驗內容</h2>

<ul>
    <li>外觀抽檢</li>
    <li>尺寸抽檢</li>
    <li>數量確認</li>
    <li>包裝確認</li>
</ul>
            `
        },

        'quality-issues': {
            title: '品質異常報告',
            content: `
<h1>品質異常報告</h1>

<p>記錄與追蹤品質異常事件。</p>

<h2>異常類型</h2>

<ul>
    <li>來料異常</li>
    <li>製程異常</li>
    <li>客訴</li>
    <li>出貨異常</li>
</ul>

<h2>處理流程</h2>

<ol class="steps">
    <li>發現異常，建立報告</li>
    <li>分析原因</li>
    <li>制定改善措施</li>
    <li>執行改善</li>
    <li>驗證效果</li>
    <li>結案</li>
</ol>
            `
        },

        'lookup-values': {
            title: '代碼管理',
            content: `
<h1>代碼管理</h1>

<p>「代碼管理」用於維護系統中的下拉選單選項。</p>

<h2>代碼領域</h2>

<p>系統預設的代碼領域包括：</p>

<ul>
    <li>訂單狀態</li>
    <li>工單狀態</li>
    <li>機台類型</li>
    <li>載具類型</li>
    <li>篩分服務類別</li>
    <li>等等...</li>
</ul>

<h2>操作說明</h2>

<div class="warning">
    <div>修改代碼可能影響系統運作，請謹慎操作。如有疑問請聯繫系統管理員。</div>
</div>
            `
        },

        'number-sequences': {
            title: '流水號管理',
            content: `
<h1>流水號管理</h1>

<p>「流水號管理」用於設定各種單據的自動編號規則。</p>

<h2>編號格式</h2>

<p>系統支援的編號格式元素：</p>

<ul>
    <li><code>{PREFIX}</code> - 固定前綴</li>
    <li><code>{YYYY}</code> - 四位年份</li>
    <li><code>{MM}</code> - 兩位月份</li>
    <li><code>{DD}</code> - 兩位日期</li>
    <li><code>{####}</code> - 流水號（位數依 # 數量）</li>
</ul>

<h3>範例</h3>
<ul>
    <li><code>ORD-{YYYYMMDD}-{####}</code> → ORD-20260129-0001</li>
    <li><code>WO-{YYYYMMDD}-{####}</code> → WO-20260129-0001</li>
</ul>
            `
        },

        'system-parameters': {
            title: '系統參數',
            content: `
<h1>系統參數</h1>

<p>「系統參數」用於設定系統的全域設定值。</p>

<div class="warning">
    <div>修改系統參數可能影響系統運作，請謹慎操作。</div>
</div>
            `
        },

        'audit-logs': {
            title: '操作日誌',
            content: `
<h1>操作日誌</h1>

<p>「操作日誌」記錄所有使用者在系統中的操作紀錄。</p>

<h2>記錄內容</h2>

<ul>
    <li>操作時間</li>
    <li>操作人員</li>
    <li>操作類型（新增/修改/刪除）</li>
    <li>操作對象</li>
    <li>變更內容</li>
    <li>IP 位址</li>
</ul>

<h2>用途</h2>

<ul>
    <li>追蹤資料變更歷史</li>
    <li>稽核使用者操作</li>
    <li>問題追蹤</li>
</ul>
            `
        },

        'rbac-overview': {
            title: '權限系統說明',
            content: `
<h1>權限系統說明</h1>

<p>系統採用 RBAC（Role-Based Access Control）角色權限控制機制。</p>

<h2>基本概念</h2>

<ul>
    <li><strong>權限（Permission）</strong>：定義可執行的操作，如「管理訂單」</li>
    <li><strong>角色（Role）</strong>：權限的集合，如「生管人員」角色包含訂單、工單相關權限</li>
    <li><strong>員工角色</strong>：將角色指派給員工</li>
</ul>

<h2>權限繼承</h2>

<p>員工 → 角色 → 權限</p>

<p>一個員工可以擁有多個角色，其權限為所有角色權限的聯集。</p>

<h2>預設角色</h2>

<table>
    <thead>
        <tr>
            <th>角色</th>
            <th>說明</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>admin</td>
            <td>系統管理員，擁有所有權限</td>
        </tr>
    </tbody>
</table>

<div class="tip">
    <div>建議依據公司組織建立適當的角色，如：生管人員、現場人員、品管人員、倉管人員等。</div>
</div>
            `
        },

        'roles': {
            title: '角色管理',
            content: `
<h1>角色管理</h1>

<p>「角色管理」用於建立與維護系統角色。</p>

<h2>操作步驟</h2>

<h3>建立角色</h3>

<ol class="steps">
    <li>進入「權限管理」>「角色管理」</li>
    <li>點擊「新增」</li>
    <li>輸入角色名稱與說明</li>
    <li>儲存</li>
</ol>

<h3>設定角色權限</h3>

<ol class="steps">
    <li>進入「權限管理」>「角色權限」</li>
    <li>選擇角色</li>
    <li>勾選要授予的權限</li>
    <li>儲存</li>
</ol>
            `
        },

        'permissions': {
            title: '權限設定',
            content: `
<h1>權限設定</h1>

<p>「權限設定」用於查看系統所有可用的權限。</p>

<h2>權限列表</h2>

<p>系統預設權限包括：</p>

<ul>
    <li>管理客戶資料</li>
    <li>管理供應商資料</li>
    <li>管理員工資料</li>
    <li>管理訂單資料</li>
    <li>管理生產工單</li>
    <li>管理生產紀錄</li>
    <li>管理出貨單</li>
    <li>管理品質檢驗</li>
    <li>等等...</li>
</ul>

<div class="info">
    <div>權限項目由系統預設，一般使用者不需要也不應該修改。</div>
</div>
            `
        },

        'notifications': {
            title: '公告通知中心',
            content: `
<h1>公告通知中心</h1>

<p>「公告通知中心」用於接收與管理系統公告及個人通知。</p>

<h2>儀表板公告跑馬燈</h2>

<p>系統在<strong>儀表板頂部</strong>設有公告跑馬燈，自動輪播最新的系統公告（<code>notification_type = announcement</code>）。無需手動開啟，進入儀表板即可看到最新公告。</p>

<ul>
    <li>每 4.5 秒自動切換一則公告</li>
    <li>點擊公告標題可開啟詳情視窗並自動標記為已讀</li>
    <li>沒有公告時跑馬燈自動隱藏</li>
</ul>

<h2>通知類型</h2>

<ul>
    <li><strong>系統公告（announcement）</strong>：管理員發布的全體公告，會顯示在儀表板跑馬燈</li>
    <li><strong>個人通知</strong>：發送給特定人員的通知</li>
    <li><strong>部門通知</strong>：發送給特定部門的通知</li>
    <li><strong>維護通知（maintenance）</strong>：系統維護或更新公告</li>
</ul>

<h2>功能說明</h2>

<ul>
    <li><strong>收件匣</strong>：查看所有收到的通知（依時間排序，最新在前）</li>
    <li><strong>寄件備份</strong>：查看自己發送的通知</li>
    <li><strong>歷史紀錄</strong>：查看已讀或已過期的通知</li>
</ul>

<h2>操作說明</h2>

<h3>查看通知</h3>
<ul>
    <li>頂部導航列的<strong>鈴鐺圖示</strong>會顯示未讀通知數量</li>
    <li>點擊通知列表中的標題即可查看詳細內容，同時標記為已讀</li>
    <li>儀表板上的公告跑馬燈亦可點擊查看公告詳情</li>
</ul>

<h3>發送公告（管理員）</h3>

<ol class="steps">
    <li>進入「公告通知中心」模組</li>
    <li>點擊<strong>「新增公告」</strong></li>
    <li>填寫通知類型（選「announcement」即可出現在儀表板跑馬燈）</li>
    <li>填寫標題與內容</li>
    <li>選擇接收對象（全員/特定部門/特定人員）</li>
    <li>設定有效期限（可選）</li>
    <li>點擊<strong>「送出」</strong></li>
</ol>

<h3>刪除通知</h3>
<ul>
    <li>僅可刪除自己發送的通知</li>
    <li>刪除後接收端也會看不到該通知</li>
</ul>

<div class="warning">
    <div>系統公告類型（announcement）的通知會顯示在儀表板公告跑馬燈，請確認內容正確再送出。</div>
</div>
            `
        },

        'messages': {
            title: '訊息留言',
            content: `
<h1>訊息留言</h1>

<p>「訊息留言」提供員工之間的內部訊息功能。</p>

<h2>功能說明</h2>

<ul>
    <li><strong>收件匣</strong>：收到的訊息</li>
    <li><strong>寄件備份</strong>：已發送的訊息</li>
    <li><strong>垃圾桶</strong>：已刪除的訊息</li>
</ul>

<h2>操作說明</h2>

<h3>發送訊息</h3>

<ol class="steps">
    <li>點擊「撰寫留言」</li>
    <li>選擇收件人</li>
    <li>輸入主旨與內容</li>
    <li>點擊「送出」</li>
</ol>

<h3>回覆訊息</h3>

<ol class="steps">
    <li>開啟訊息</li>
    <li>點擊「回覆」</li>
    <li>輸入回覆內容</li>
    <li>送出</li>
</ol>
            `
        },

        'profile': {
            title: '個人資料',
            content: `
<h1>個人資料</h1>

<p>「個人資料」用於查看與修改自己的帳號資訊。</p>

<h2>可修改項目</h2>

<ul>
    <li>姓名</li>
    <li>Email</li>
    <li>職稱</li>
    <li>密碼</li>
</ul>

<h2>不可修改項目</h2>

<ul>
    <li>帳號</li>
    <li>員工編號</li>
    <li>部門（需由管理員修改）</li>
    <li>角色（需由管理員修改）</li>
</ul>

<h2>修改密碼</h2>

<ol class="steps">
    <li>點擊右上角使用者名稱</li>
    <li>選擇「修改個人資料」</li>
    <li>切換到「修改密碼」分頁</li>
    <li>輸入目前密碼</li>
    <li>輸入新密碼（至少 6 字元）</li>
    <li>確認新密碼</li>
    <li>點擊「修改密碼」</li>
</ol>
            `
        },

        'dashboard': {
            title: '系統儀表板',
            content: `
<h1>系統儀表板</h1>

<p>「系統儀表板」是進入系統後的第一個頁面，提供整廠營運狀況的快速總覽。</p>

<h2>公告跑馬燈</h2>

<p>儀表板最頂部有一條<strong>公告跑馬燈</strong>，自動顯示最新的系統公告：</p>

<ul>
    <li>每 <strong>4.5 秒</strong>自動輪播切換下一則公告</li>
    <li>左側顯示公告類型標籤（如：公告、維護、緊急）</li>
    <li>中間顯示公告標題與日期</li>
    <li>右側顯示目前是第幾則/共幾則</li>
</ul>

<h3>查看公告詳情</h3>

<ol class="steps">
    <li>在跑馬燈上<strong>點擊公告標題</strong></li>
    <li>彈出視窗顯示完整的公告標題、類型、日期與內文</li>
    <li>系統同時自動將該公告標記為<strong>已讀</strong></li>
    <li>點擊視窗右上角「×」或按 <kbd>Esc</kbd> 關閉</li>
</ol>

<div class="tip">
    <div>若目前沒有任何公告，跑馬燈區域會自動隱藏，不佔用畫面空間。</div>
</div>

<h2>統計卡片（KPI）</h2>

<p>儀表板顯示多個關鍵績效指標（KPI）統計卡片：</p>

<ul>
    <li><strong>訂單統計</strong>：本月訂單數、金額</li>
    <li><strong>生產統計</strong>：進行中工單、今日產量</li>
    <li><strong>出貨統計</strong>：待出貨數量、本月出貨</li>
    <li><strong>品質統計</strong>：不良率、品質異常件數</li>
</ul>

<h2>行事曆功能</h2>

<p>行事曆顯示重要日期與事件提醒：</p>

<ul>
    <li>顯示訂單交期</li>
    <li>顯示生產排程</li>
    <li>顯示預定維護事件</li>
    <li>可新增自訂事件（點擊日期格即可新增）</li>
</ul>

<h3>新增事件</h3>

<ol class="steps">
    <li>在行事曆中點擊要新增的<strong>日期格</strong></li>
    <li>填寫事件標題、時間、說明</li>
    <li>可設定參與人員與提醒</li>
    <li>點擊<strong>「儲存」</strong></li>
</ol>

<h2>儀表板篩選</h2>

<p>部分統計數據可透過頁面上的篩選條件調整顯示範圍，例如選擇特定日期區間或機台。</p>
            `
        }
    }
};

// 將內容匯出供 script.js 使用
if (typeof window !== 'undefined') {
    window.HELP_CONTENT = HELP_CONTENT;
}
