/**
 * Dashboard 模組配置
 *
 * 以配置化方式渲染頁面結構，保留原有 Dashboard 自訂區塊。
 */
ModuleConfig.register('dashboard', {
    id: 'dashboard',
    title: '系統儀表板',
    subtitle: '訂單、工單、出貨統計與行事曆總覽',

    actions: [
        { label: '更新資料', icon: 'fa-sync-alt', style: 'primary', action: 'refresh' }
    ],

    customHtml: `
    <!-- ========== 公告跳馬燈 ========== -->
    <section class="announcement-bar-section" data-dashboard-announcement-bar>
        <div class="announcement-bar-label">
            <i class="fas fa-bullhorn"></i>
            <span>公告</span>
        </div>
        <div class="announcement-bar-viewport">
            <div class="announcement-bar-track" data-dashboard-announcement-track>
                <span class="ticker-placeholder">載入中...</span>
            </div>
        </div>
        <div class="announcement-bar-count" data-dashboard-announcement-count></div>
    </section>

    <section class="dashboard-work-queue" aria-labelledby="dashboard-work-queue-title">
        <div class="section-header"><h3 id="dashboard-work-queue-title"><i class="fas fa-route"></i> 我的工作佇列</h3><span>依權限直接進入下一個流程節點</span></div>
        <div class="dashboard-work-queue-grid">
            <button type="button" data-dashboard-open="orders"><strong>接單待處理</strong><span>建立或確認客戶訂單</span></button>
            <button type="button" data-dashboard-open="production_work_order_schedule"><strong>待排程</strong><span>安排工單、機台與人員</span></button>
            <button type="button" data-dashboard-open="work_orders"><strong>生產執行</strong><span>記錄進度、品質與完工</span></button>
            <button type="button" data-dashboard-open="inventory_items"><strong>待入庫</strong><span>核對來源與庫存數量</span></button>
            <button type="button" data-dashboard-open="shipping_orders"><strong>待出貨</strong><span>配貨、包裝與出貨確認</span></button>
            <button type="button" data-dashboard-open="quality_issue_reports"><strong>品質異常</strong><span>追蹤異常與二次篩選</span></button>
        </div>
    </section>

    <!-- ========== 統計資料區 ========== -->
    <section class="dashboard-section" data-section="statistics">
        <div class="section-header">
            <h3><i class="fas fa-chart-pie"></i> 統計資料</h3>
        </div>

        <!-- 篩選工具列 - 參考訂單/工單風格 -->
        <div class="module-toolbar compact">
            <form class="filter-form" data-dashboard-filter>
                <div class="form-grid">
                    <label>
                        <span>統計年份</span>
                        <select name="year" data-dashboard-year></select>
                    </label>
                    <label>
                        <span>統計月份</span>
                        <select name="month" data-dashboard-month>
                            <option value="">全年</option>
                            <option value="1">1月</option>
                            <option value="2">2月</option>
                            <option value="3">3月</option>
                            <option value="4">4月</option>
                            <option value="5">5月</option>
                            <option value="6">6月</option>
                            <option value="7">7月</option>
                            <option value="8">8月</option>
                            <option value="9">9月</option>
                            <option value="10">10月</option>
                            <option value="11">11月</option>
                            <option value="12">12月</option>
                        </select>
                    </label>
                    <label>
                        <span>開始日期</span>
                        <input type="date" name="start_date" data-dashboard-start-date>
                    </label>
                    <label>
                        <span>結束日期</span>
                        <input type="date" name="end_date" data-dashboard-end-date>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn primary small">查詢</button>
                    <button type="button" class="btn outline small" data-action="reset-filter">重設</button>
                </div>
            </form>
        </div>

        <!-- 統計卡片 - 三欄 -->
        <div class="stats-cards-row">
            <!-- 訂單統計 -->
            <div class="stats-card">
                <div class="stats-card-header orders">
                    <i class="fas fa-file-invoice"></i>
                    <span>訂單統計</span>
                </div>
                <div class="stats-card-body">
                    <div class="stats-numbers">
                        <div class="stats-main">
                            <span class="stats-value" data-dashboard-orders-count>0</span>
                            <span class="stats-unit">筆</span>
                        </div>
                        <div class="stats-sub">
                            <span class="stats-label">總金額</span>
                            <span class="stats-amount" data-dashboard-orders-amount>$0</span>
                        </div>
                    </div>
                    <div class="stats-chart-small">
                        <canvas data-chart="orders-status"></canvas>
                    </div>
                </div>
            </div>

            <!-- 工單統計 -->
            <div class="stats-card">
                <div class="stats-card-header work-orders">
                    <i class="fas fa-industry"></i>
                    <span>工單統計</span>
                </div>
                <div class="stats-card-body">
                    <div class="stats-numbers">
                        <div class="stats-main">
                            <span class="stats-value" data-dashboard-work-orders-count>0</span>
                            <span class="stats-unit">筆</span>
                        </div>
                        <div class="stats-sub">
                            <span class="stats-label">進行中</span>
                            <span class="stats-highlight" data-dashboard-work-orders-active>0</span>
                        </div>
                    </div>
                    <div class="stats-chart-small">
                        <canvas data-chart="work-orders-status"></canvas>
                    </div>
                </div>
            </div>

            <!-- 出貨統計 -->
            <div class="stats-card">
                <div class="stats-card-header shipping">
                    <i class="fas fa-shipping-fast"></i>
                    <span>出貨統計</span>
                </div>
                <div class="stats-card-body">
                    <div class="stats-numbers">
                        <div class="stats-main">
                            <span class="stats-value" data-dashboard-shipping-count>0</span>
                            <span class="stats-unit">筆</span>
                        </div>
                        <div class="stats-sub">
                            <span class="stats-label">待處理</span>
                            <span class="stats-warning" data-dashboard-shipping-pending>0</span>
                        </div>
                    </div>
                    <div class="stats-chart-small">
                        <canvas data-chart="shipping-status"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- 趨勢圖表區 -->
        <div class="charts-row">
            <div class="chart-card wide">
                <div class="chart-card-header">
                    <span><i class="fas fa-chart-bar"></i> 月度趨勢</span>
                    <span class="chart-year-badge" data-dashboard-chart-year></span>
                </div>
                <div class="chart-card-body">
                    <canvas data-chart="monthly-trends"></canvas>
                </div>
            </div>
            <div class="chart-card narrow">
                <div class="chart-card-header">
                    <span><i class="fas fa-trophy"></i> Top 5 客戶</span>
                </div>
                <div class="chart-card-body">
                    <canvas data-chart="top-customers"></canvas>
                </div>
            </div>
        </div>
    </section>

    <!-- ========== 最新資訊區 ========== -->
    <section class="dashboard-section" data-section="recent">
        <div class="section-header">
            <h3><i class="fas fa-clock"></i> 最新資訊</h3>
        </div>

        <div class="recent-cards-row">
            <!-- 最新訂單 -->
            <div class="recent-card">
                <div class="recent-card-header">
                    <i class="fas fa-file-invoice"></i>
                    <span>最新訂單</span>
                </div>
                <div class="recent-card-body">
                    <div class="recent-list" data-list="recent-orders">
                        <div class="loading-message">載入中...</div>
                    </div>
                </div>
            </div>

            <!-- 最新工單 -->
            <div class="recent-card">
                <div class="recent-card-header">
                    <i class="fas fa-industry"></i>
                    <span>最新工單</span>
                </div>
                <div class="recent-card-body">
                    <div class="recent-list" data-list="recent-work-orders">
                        <div class="loading-message">載入中...</div>
                    </div>
                </div>
            </div>

            <!-- 最新出貨單 -->
            <div class="recent-card">
                <div class="recent-card-header">
                    <i class="fas fa-truck"></i>
                    <span>最新出貨單</span>
                </div>
                <div class="recent-card-body">
                    <div class="recent-list" data-list="recent-shipping">
                        <div class="loading-message">載入中...</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ========== 行事曆區 ========== -->
    <section class="dashboard-section" data-section="calendar">
        <div class="section-header">
            <h3><i class="fas fa-calendar-alt"></i> 行事曆</h3>
            <div class="section-header-actions">
                <div class="calendar-filter-control">
                    <label for="dashboard-calendar-filter-select">顯示</label>
                    <select id="dashboard-calendar-filter-select" class="calendar-filter-select" data-dashboard-calendar-filter-select>
                        <option value="order" selected>訂單</option>
                        <option value="work_order">工單</option>
                        <option value="delivery">交貨</option>
                        <option value="all">全部顯示</option>
                    </select>
                </div>
                <div class="calendar-legend">
                    <span class="legend-item"><i class="fas fa-file-alt legend-icon" aria-hidden="true"></i>訂單建立</span>
                    <span class="legend-item"><i class="fas fa-industry legend-icon" aria-hidden="true"></i>工單開始</span>
                    <span class="legend-item"><i class="fas fa-flag-checkered legend-icon" aria-hidden="true"></i>工單結束</span>
                    <span class="legend-item"><i class="fas fa-truck legend-icon" aria-hidden="true"></i>交期節點</span>
                    <span class="legend-item"><i class="fas fa-shipping-fast legend-icon" aria-hidden="true"></i>出貨節點</span>
                </div>
            </div>
        </div>
        <div class="calendar-container">
            <div data-dashboard-calendar class="dashboard-calendar"></div>
        </div>
    </section>

    <!-- 公告詳情 Modal -->
    <div class="modal-overlay hidden" data-dashboard-announcement-modal>
        <div class="modal-window medium">
            <button type="button" class="modal-close" data-action="close-announcement-modal" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3 data-dashboard-announcement-modal-title></h3>
            <div class="announcement-modal-meta" data-dashboard-announcement-modal-meta></div>
            <div class="announcement-modal-content" data-dashboard-announcement-modal-content></div>
            <div class="form-actions">
                <button type="button" class="outline" data-action="close-announcement-modal">關閉</button>
            </div>
        </div>
    </div>

    <!-- 事件詳情彈出卡片 -->
    <div class="event-popup-overlay hidden" data-dashboard-event-popup-overlay>
        <div class="event-popup-card" data-dashboard-event-popup>
            <button type="button" class="event-popup-close" data-action="close-event-popup">
                <i class="fas fa-times"></i>
            </button>
            <div class="event-popup-header" data-dashboard-event-popup-header>
                <span class="event-popup-type-badge" data-dashboard-event-popup-badge>訂單</span>
                <h4 data-dashboard-event-popup-title>事件標題</h4>
            </div>
            <div class="event-popup-body">
                <div class="event-popup-info">
                    <div class="event-popup-row">
                        <i class="fas fa-clock"></i>
                        <div class="event-popup-time">
                            <span data-dashboard-event-popup-start>開始時間</span>
                            <span class="event-popup-time-separator" data-dashboard-event-popup-end-wrapper>
                                <i class="fas fa-arrow-right"></i>
                                <span data-dashboard-event-popup-end>結束時間</span>
                            </span>
                        </div>
                    </div>
                    <div class="event-popup-row" data-dashboard-event-popup-status-row>
                        <i class="fas fa-flag"></i>
                        <span data-dashboard-event-popup-status>狀態</span>
                    </div>
                    <div class="event-popup-row" data-dashboard-event-popup-priority-row>
                        <i class="fas fa-exclamation-circle"></i>
                        <span data-dashboard-event-popup-priority>優先級</span>
                    </div>
                    <div class="event-popup-row" data-dashboard-event-popup-desc-row>
                        <i class="fas fa-align-left"></i>
                        <span data-dashboard-event-popup-description>描述內容</span>
                    </div>
                </div>
            </div>
            <div class="event-popup-footer">
                <button type="button" class="outline" data-action="close-event-popup">關閉</button>
                <button type="button" class="primary" data-action="open-event-detail">
                    <i class="fas fa-external-link-alt"></i> 查看詳情
                </button>
            </div>
        </div>
    </div>
    `
});
