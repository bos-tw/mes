<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/bootstrap.php';

ensureSession((bool)($_SESSION['remember_me'] ?? false));

$employee = (isset($_SESSION['employee']) && is_array($_SESSION['employee'])) ? $_SESSION['employee'] : null;
$isAuthenticated = $employee !== null;
$csrfToken = $isAuthenticated ? generateCsrfToken() : '';
$bootstrapPayload = [
    'authenticated' => $isAuthenticated,
    'csrfToken' => $csrfToken,
    'currentUser' => $employee,
    'basePath' => '../',
    'mobilePath' => '/mobile',
];
$reason = trim((string)($_GET['reason'] ?? ''));
$requestedWorkOrderId = isset($_GET['work_order_id']) ? max(0, (int)$_GET['work_order_id']) : 0;
$requestedSection = trim((string)($_GET['section'] ?? 'work_orders'));
?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>生產工單手機版 - 精密光學篩選管理系統</title>
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="../login-fui.css">
    <link rel="stylesheet" href="mobile.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body class="<?php echo $isAuthenticated ? 'mobile-app-page' : 'login-page mobile-login-page'; ?>" data-mobile-mode="<?php echo $isAuthenticated ? 'app' : 'guest'; ?>">
    <script id="mobile-bootstrap" type="application/json"><?php echo json_encode(array_merge($bootstrapPayload, ['requestedSection' => $requestedSection]), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>

    <?php if (!$isAuthenticated): ?>
        <div class="login-wrapper mobile-login-wrapper">
            <div class="login-card mobile-login-card">
                <div class="fui-corner-tr"></div>
                <div class="fui-corner-bl"></div>
                <div class="fui-scanline"></div>
                <div class="login-brand">
                    <div class="brand-logo" id="company-logo-wrap">
                        <i class="fas fa-bolt" id="company-logo-fallback"></i>
                    </div>
                    <h1 id="company-full-name">螺絲篩分管理系統</h1>
                    <p class="system-subtitle">Precision Optical Sorting MES</p>
                    <p class="login-hint">請使用員工帳號登入生產工單手機版</p>
                    <div
                        class="login-timeout-notice"
                        id="login-timeout-notice"
                        role="alert"
                        aria-live="polite"
                        data-login-reason="<?php echo escapeHtml($reason); ?>"
                    ></div>
                    <div class="mobile-login-badge">手機版 / 平板版現場入口</div>
                    <div class="fui-status">
                        <span class="fui-status-dot"></span>
                        <span class="fui-status-dot"></span>
                        <span class="fui-status-dot"></span>
                        <span class="fui-status-text">MOBILE WORK ORDER PORTAL</span>
                    </div>
                </div>

                <form id="mobile-login-form" novalidate>
                    <input type="hidden" id="mobile-requested-work-order-id" value="<?php echo $requestedWorkOrderId; ?>">

                    <div class="form-group">
                        <label for="mobile-account">帳號</label>
                        <input type="text" id="mobile-account" name="account" class="form-control" placeholder="輸入員工帳號" autocomplete="username" required>
                    </div>

                    <div class="form-group password-field">
                        <label for="mobile-password">密碼</label>
                        <input type="password" id="mobile-password" name="password" class="form-control" placeholder="輸入密碼" autocomplete="current-password" required>
                        <button type="button" class="toggle-password" id="mobile-toggle-password" aria-label="顯示或隱藏密碼">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>

                    <div class="login-actions mobile-login-actions">
                        <label class="remember-me">
                            <input type="checkbox" id="mobile-remember-me"> 記住我
                        </label>
                        <span class="mobile-login-caption">登入後可直接進入現場工單清單</span>
                    </div>

                    <button type="submit" class="login-button mobile-login-button">登入手機版</button>

                    <div class="login-error" id="mobile-login-error" role="alert"></div>
                    <div class="login-success" id="mobile-login-success" role="status"></div>
                </form>

                <div class="login-footer">
                    © <span id="mobile-login-year"></span> YuCyuan Industrial Co., Ltd. 保留所有權利。
                </div>
            </div>
        </div>
        <div id="fui-particles"></div>
    <?php else: ?>
        <div class="mobile-app-shell" data-mobile-app>
            <header class="mobile-topbar">
                <div class="mobile-topbar-main">
                    <div class="mobile-brand-block">
                        <p class="mobile-brand-kicker">MES MOBILE</p>
                        <h1>精密光學篩選管理系統</h1>
                        <p class="mobile-brand-subtitle">生產工單手機版 / 手機與平板現場入口</p>
                    </div>
                    <button type="button" class="mobile-icon-button" id="mobile-menu-button" aria-label="開啟選單" aria-expanded="false" aria-controls="mobile-drawer">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
                <div class="mobile-topbar-meta">
                    <div class="mobile-user-chip">
                        <span class="mobile-user-chip-label">登入人員</span>
                        <strong id="mobile-current-user-name"><?php echo escapeHtml((string)($employee['name'] ?? '')); ?></strong>
                    </div>
                    <div class="mobile-user-chip">
                        <span class="mobile-user-chip-label">帳號</span>
                        <strong><?php echo escapeHtml((string)($employee['account'] ?? '')); ?></strong>
                    </div>
                </div>
            </header>

            <main class="mobile-main">
                <section class="mobile-panel mobile-filter-panel" id="mobile-work-orders-page" data-mobile-section="work_orders">
                    <div class="mobile-panel-heading">
                        <div>
                            <p class="mobile-panel-kicker">FILTERS</p>
                            <h2>現場工單清單</h2>
                        </div>
                        <button type="button" class="mobile-secondary-button" id="mobile-refresh-button">
                            <i class="fas fa-rotate-right"></i>
                            重新整理
                        </button>
                    </div>

                    <form id="mobile-filter-form" class="mobile-filter-grid">
                        <label class="mobile-field">
                            <span>搜尋</span>
                            <input type="search" id="mobile-filter-keyword" placeholder="工單號 / 訂單 / 客戶 / 品名">
                        </label>
                        <label class="mobile-field">
                            <span>狀態</span>
                            <select id="mobile-filter-status">
                                <option value="">全部狀態</option>
                            </select>
                        </label>
                        <label class="mobile-field">
                            <span>機台</span>
                            <select id="mobile-filter-machine">
                                <option value="">全部機台</option>
                            </select>
                        </label>
                        <label class="mobile-field">
                            <span>開始日期</span>
                            <input type="date" id="mobile-filter-start-date">
                        </label>
                        <label class="mobile-field">
                            <span>結束日期</span>
                            <input type="date" id="mobile-filter-end-date">
                        </label>
                        <div class="mobile-filter-actions">
                            <button type="submit" class="mobile-primary-button">
                                <i class="fas fa-magnifying-glass"></i>
                                查詢工單
                            </button>
                            <button type="button" class="mobile-secondary-button" id="mobile-filter-reset-button">
                                清除條件
                            </button>
                        </div>
                    </form>
                </section>

                <section class="mobile-panel mobile-summary-panel" data-mobile-section="work_orders">
                    <div class="mobile-summary-grid">
                        <article class="mobile-summary-card">
                            <span>工單總數</span>
                            <strong id="mobile-summary-total">0</strong>
                        </article>
                        <article class="mobile-summary-card">
                            <span>進行中</span>
                            <strong id="mobile-summary-in-progress">0</strong>
                        </article>
                        <article class="mobile-summary-card">
                            <span>暫停中</span>
                            <strong id="mobile-summary-paused">0</strong>
                        </article>
                        <article class="mobile-summary-card">
                            <span>已完成</span>
                            <strong id="mobile-summary-completed">0</strong>
                        </article>
                    </div>
                </section>

                <section class="mobile-panel mobile-list-panel" data-mobile-section="work_orders">
                    <div class="mobile-list-state" id="mobile-list-state">載入工單中...</div>
                    <div class="mobile-card-list" id="mobile-work-order-list" data-initialised="false"></div>
                </section>

                <section class="mobile-panel mobile-inspection-panel hidden" id="mobile-inspections-page" data-mobile-section="daily_machine_inspections">
                    <div class="mobile-panel-heading">
                        <div>
                            <p class="mobile-panel-kicker">DAILY INSPECTIONS</p>
                            <h2>每日機台檢驗</h2>
                            <p class="mobile-brand-subtitle">手機版現場巡檢入口，可直接建立每日機台檢驗紀錄。</p>
                        </div>
                        <div class="mobile-inline-actions">
                            <button type="button" class="mobile-secondary-button" id="mobile-inspections-refresh-button">
                                <i class="fas fa-rotate-right"></i>
                                重新整理
                            </button>
                            <button type="button" class="mobile-primary-button" id="mobile-inspections-create-button">
                                <i class="fas fa-plus"></i>
                                新增檢驗
                            </button>
                        </div>
                    </div>

                    <form id="mobile-inspections-filter-form" class="mobile-filter-grid">
                        <label class="mobile-field">
                            <span>機台</span>
                            <select id="mobile-inspections-filter-machine">
                                <option value="">全部機台</option>
                            </select>
                        </label>
                        <label class="mobile-field">
                            <span>檢驗結果</span>
                            <select id="mobile-inspections-filter-qualified">
                                <option value="">全部結果</option>
                                <option value="1">合格</option>
                                <option value="0">不合格</option>
                            </select>
                        </label>
                        <label class="mobile-field">
                            <span>開始日期</span>
                            <input type="date" id="mobile-inspections-filter-date-from">
                        </label>
                        <label class="mobile-field">
                            <span>結束日期</span>
                            <input type="date" id="mobile-inspections-filter-date-to">
                        </label>
                        <div class="mobile-filter-actions">
                            <button type="submit" class="mobile-primary-button">
                                <i class="fas fa-magnifying-glass"></i>
                                查詢檢驗
                            </button>
                            <button type="button" class="mobile-secondary-button" id="mobile-inspections-filter-reset-button">
                                清除條件
                            </button>
                        </div>
                    </form>
                </section>

                <section class="mobile-panel mobile-inspection-list-panel hidden" data-mobile-section="daily_machine_inspections">
                    <div class="mobile-list-state" id="mobile-inspections-list-state">載入每日機台檢驗中...</div>
                    <div class="mobile-card-list" id="mobile-inspections-list"></div>
                </section>

                <section class="mobile-panel mobile-schedule-panel hidden" id="mobile-schedule-page" data-mobile-section="production_work_order_schedule">
                    <div class="mobile-panel-heading">
                        <div>
                            <p class="mobile-panel-kicker">WORK ORDER SCHEDULE</p>
                            <h2>生產工單排程</h2>
                            <p class="mobile-brand-subtitle">手機版排程檢視，可快速查看待排程與已排機台工單。</p>
                        </div>
                        <button type="button" class="mobile-secondary-button" id="mobile-schedule-refresh-button">
                            <i class="fas fa-rotate-right"></i>
                            重新整理
                        </button>
                    </div>

                    <form id="mobile-schedule-filter-form" class="mobile-filter-grid">
                        <label class="mobile-field">
                            <span>機台</span>
                            <select id="mobile-schedule-filter-machine">
                                <option value="">全部機台</option>
                            </select>
                        </label>
                        <label class="mobile-field">
                            <span>排程狀態</span>
                            <select id="mobile-schedule-filter-bucket">
                                <option value="">全部排程</option>
                                <option value="queued">待排程</option>
                                <option value="scheduled">已排機台</option>
                            </select>
                        </label>
                        <label class="mobile-field">
                            <span>工單狀態</span>
                            <select id="mobile-schedule-filter-status">
                                <option value="">全部工單狀態</option>
                            </select>
                        </label>
                        <label class="mobile-field">
                            <span>開始日期</span>
                            <input type="date" id="mobile-schedule-filter-date-from">
                        </label>
                        <label class="mobile-field">
                            <span>結束日期</span>
                            <input type="date" id="mobile-schedule-filter-date-to">
                        </label>
                        <div class="mobile-filter-actions">
                            <button type="submit" class="mobile-primary-button">
                                <i class="fas fa-magnifying-glass"></i>
                                查詢排程
                            </button>
                            <button type="button" class="mobile-secondary-button" id="mobile-schedule-filter-reset-button">
                                清除條件
                            </button>
                        </div>
                    </form>
                </section>

                <section class="mobile-panel mobile-schedule-list-panel hidden" data-mobile-section="production_work_order_schedule">
                    <div class="mobile-list-state" id="mobile-schedule-list-state">載入生產工單排程中...</div>
                    <div class="mobile-card-list" id="mobile-schedule-list"></div>
                </section>

                <section class="mobile-panel mobile-placeholder-panel hidden" id="mobile-placeholder-panel" data-mobile-section="placeholder">
                    <div class="mobile-panel-heading">
                        <div>
                            <p class="mobile-panel-kicker" id="mobile-placeholder-kicker">MOBILE MODULE</p>
                            <h2 id="mobile-placeholder-title">手機版模組</h2>
                            <p class="mobile-brand-subtitle" id="mobile-placeholder-subtitle">此頁面已建立入口，後續可逐步補齊手機操作流程。</p>
                        </div>
                    </div>
                    <div class="mobile-empty-state">
                        <strong id="mobile-placeholder-empty-title">此功能正在接續建置中</strong>
                        <p class="mobile-empty-text" id="mobile-placeholder-empty-text">目前已先完成手機版頁面入口與切換，後續可依模組逐步補上手機友善操作介面。</p>
                    </div>
                    <div class="mobile-inline-actions">
                        <a href="../index.php" target="_blank" rel="noopener" class="mobile-primary-button" id="mobile-placeholder-desktop-link">
                            <i class="fas fa-up-right-from-square"></i>
                            開啟桌面版系統
                        </a>
                    </div>
                </section>
            </main>
        </div>

        <aside class="mobile-drawer hidden" id="mobile-drawer" aria-hidden="true">
            <div class="mobile-drawer-backdrop" data-action="close-drawer"></div>
            <div class="mobile-drawer-panel">
                <header class="mobile-drawer-header">
                    <div>
                        <p class="mobile-panel-kicker">MENU</p>
                        <h2>系統選單</h2>
                    </div>
                    <button type="button" class="mobile-icon-button" data-action="close-drawer" aria-label="關閉選單">
                        <i class="fas fa-xmark"></i>
                    </button>
                </header>
                <nav class="mobile-drawer-nav" aria-label="手機版系統選單">
                    <a href="?section=machines" class="mobile-drawer-link" data-section="machines">
                        <i class="fas fa-cog"></i>
                        <span>機台設備管理</span>
                    </a>
                    <a href="?section=machine_capabilities" class="mobile-drawer-link" data-section="machine_capabilities">
                        <i class="fas fa-layer-group"></i>
                        <span>機台能力管理</span>
                    </a>
                    <a href="?section=machine_maintenance_tasks" class="mobile-drawer-link" data-section="machine_maintenance_tasks">
                        <i class="fas fa-wrench"></i>
                        <span>機台維修任務</span>
                    </a>
                    <a href="?section=daily_machine_inspections" class="mobile-drawer-link" data-section="daily_machine_inspections">
                        <i class="fas fa-clipboard-check"></i>
                        <span>每日機台檢驗</span>
                    </a>
                    <a href="?section=work_orders" class="mobile-drawer-link" data-section="work_orders">
                        <i class="fas fa-clipboard"></i>
                        <span>生產工單</span>
                    </a>
                    <a href="?section=production_work_order_schedule" class="mobile-drawer-link" data-section="production_work_order_schedule">
                        <i class="fas fa-calendar-alt"></i>
                        <span>生產工單排程</span>
                    </a>
                </nav>
                <div class="mobile-drawer-footer">
                    <button type="button" class="mobile-primary-button mobile-drawer-logout" id="mobile-logout-button">
                        <i class="fas fa-right-from-bracket"></i>
                        登出
                    </button>
                </div>
            </div>
        </aside>

        <aside class="mobile-detail-sheet hidden" id="mobile-detail-sheet" aria-hidden="true">
            <div class="mobile-detail-backdrop" data-action="close-detail"></div>
            <div class="mobile-detail-panel">
                <header class="mobile-detail-header">
                    <div>
                        <p class="mobile-panel-kicker">WORK ORDER</p>
                        <h2 id="mobile-detail-title">工單詳情</h2>
                        <p class="mobile-detail-subtitle" id="mobile-detail-subtitle">讀取中...</p>
                    </div>
                    <button type="button" class="mobile-icon-button" data-action="close-detail" aria-label="關閉詳情">
                        <i class="fas fa-xmark"></i>
                    </button>
                </header>

                <div class="mobile-detail-content" id="mobile-detail-content">
                    <div class="mobile-detail-loading">載入工單明細中...</div>
                </div>
            </div>
        </aside>

        <div class="mobile-action-modal hidden" id="mobile-action-modal" aria-hidden="true">
            <div class="mobile-action-backdrop" data-action="close-modal"></div>
            <div class="mobile-action-dialog">
                <header class="mobile-action-header">
                    <div>
                        <p class="mobile-panel-kicker" id="mobile-action-kicker">ACTION</p>
                        <h3 id="mobile-action-title">執行動作</h3>
                    </div>
                    <button type="button" class="mobile-icon-button" data-action="close-modal" aria-label="關閉視窗">
                        <i class="fas fa-xmark"></i>
                    </button>
                </header>
                <form id="mobile-action-form" class="mobile-action-form">
                    <div class="mobile-action-body" id="mobile-action-body"></div>
                    <div class="mobile-action-feedback" id="mobile-action-feedback" role="alert"></div>
                    <div class="mobile-action-footer">
                        <button type="button" class="mobile-secondary-button" data-action="close-modal">取消</button>
                        <button type="submit" class="mobile-primary-button" id="mobile-action-submit">確認送出</button>
                    </div>
                </form>
            </div>
        </div>
    <?php endif; ?>

    <script src="mobile.js"></script>
</body>
</html>
