<?php
declare(strict_types=1);

require_once __DIR__ . '/api/cache_version.php';

// 禁止快取 index.php 本身，確保每次都取得最新版本
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$cacheVersion = mesBuildFrontendCacheVersion(__DIR__);
$ver = $cacheVersion['version'];
?>
<!DOCTYPE html>
<html lang="zh-TW" data-asset-version="<?= htmlspecialchars($ver, ENT_QUOTES, 'UTF-8') ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>精密光學篩選管理系統</title>
    <link rel="stylesheet" href="styles.css?v=<?= $ver ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- FullCalendar 套件 (Dashboard 使用) -->
    <link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css" rel="stylesheet">
    <script defer src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"></script>
    <!-- Chart.js 圖表套件 (Dashboard 使用) -->
    <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
    <div class="app-container">
        <header class="top-navbar">
            <div class="top-navbar-left">
                <button type="button" class="sidebar-toggle" data-action="toggle-sidebar" aria-label="收合側邊選單" aria-expanded="true" title="收合側邊選單">
                    <i class="fas fa-angle-double-left" aria-hidden="true"></i>
                </button>
                <span class="company-name">精密光學篩選管理系統</span>
            </div>
            <div class="top-navbar-right">
                <div class="top-icon-group">
                    <a href="status_board.html?v=<?= $ver ?>" target="_blank" class="top-icon-item" title="現場狀態看板">
                        <i class="fas fa-tv"></i> 現場狀態看板
                    </a>
                    <a href="help/index.html?v=<?= $ver ?>" target="_blank" class="top-icon-item" title="系統使用指南">
                        <i class="fas fa-book"></i> 系統使用指南
                    </a>
                </div>
                <div class="user-dropdown-wrapper">
                    <button type="button" class="user-dropdown-toggle" id="user-dropdown-toggle">
                        <i class="fas fa-user-circle"></i>
                        <span class="user-name" id="current-user-name"></span>
                        <span class="dropdown-badges">
                            <span class="badge notification-badge" id="notification-badge" title="未讀通知" style="display: none;">0</span>
                            <span class="badge message-badge" id="message-badge" title="未讀留言" style="display: none;">0</span>
                        </span>
                        <i class="fas fa-caret-down dropdown-arrow"></i>
                    </button>
                    <div class="user-dropdown-menu" id="user-dropdown-menu">
                        <a href="#" class="dropdown-item" data-action="edit-profile">
                            <i class="fas fa-user-edit"></i> 修改個人資料
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" data-action="open-notifications">
                            <i class="fas fa-bell"></i> 公告通知中心
                            <span class="badge notification-badge" id="dropdown-notification-badge" style="display: none;">0</span>
                        </a>
                        <a href="#" class="dropdown-item" data-action="open-messages">
                            <i class="fas fa-comments"></i> 我的留言
                            <span class="badge message-badge" id="dropdown-message-badge" style="display: none;">0</span>
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" id="logout-button">
                            <i class="fas fa-sign-out-alt"></i> 登出
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <div class="main-content-wrapper">
            <aside class="sidebar">
                <nav>
                    <ul class="main-menu">
                        <!-- 系統儀表板 -->
                        <li class="menu-item">
                            <a href="#" class="menu-link" data-menu-id="dashboard" data-title="系統儀表板">
                                <i class="fas fa-tachometer-alt menu-icon"></i>
                                <span class="menu-text">系統儀表板</span>
                            </a>
                        </li>

                        <!-- 基本資料管理 -->
                        <li class="menu-item has-submenu active">
                            <a href="#" class="menu-link" data-menu-id="master_data">
                                <i class="fas fa-database menu-icon"></i>
                                <span class="menu-text">基本資料管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="companies" data-title="公司基本資料"><i class="fas fa-building"></i> 公司基本資料</a></li>
                                <li><a href="#" data-page="customers" data-title="客戶基本資料"><i class="fas fa-handshake"></i> 客戶基本資料</a></li>
                                <li><a href="#" data-page="suppliers" data-title="供應商基本資料"><i class="fas fa-truck"></i> 供應商基本資料</a></li>
                                <li><a href="#" data-page="employees" data-title="員工基本資料"><i class="fas fa-id-card"></i> 員工基本資料</a></li>
                                <li><a href="#" data-page="departments" data-title="部門基本資料"><i class="fas fa-sitemap"></i> 部門基本資料</a></li>
                                <li><a href="#" data-page="screening_items" data-title="受篩產品"><i class="fas fa-filter"></i> 受篩產品</a></li>
                                <li><a href="#" data-page="screening_services" data-title="篩分服務項目"><i class="fas fa-cogs"></i> 篩分服務項目</a></li>
                            </ul>
                        </li>

                        <!-- 訂單管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="order_management">
                                <i class="fas fa-file-invoice menu-icon"></i>
                                <span class="menu-text">訂單管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="orders" data-title="訂單主表管理"><i class="fas fa-file-invoice"></i> 訂單主表管理</a></li>
                                <li><a href="#" data-page="order_items" data-title="客戶批號"><i class="fas fa-list-alt"></i> 客戶批號</a></li>
                            </ul>
                        </li>

                        <!-- 生產作業 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="production_operations">
                                <i class="fas fa-industry menu-icon"></i>
                                <span class="menu-text">生產作業</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="work_orders" data-title="生產工單"><i class="fas fa-clipboard"></i> 生產工單</a></li>
                                <li><a href="#" data-page="work_order_first_piece_dimensions" data-title="首件尺寸檢驗"><i class="fas fa-ruler-combined"></i> 首件尺寸檢驗</a></li>
                                <li><a href="#" data-page="work_order_images" data-title="工單圖片"><i class="fas fa-images"></i> 工單圖片</a></li>
                                <li><a href="#" data-page="production_records" data-title="生產紀錄"><i class="fas fa-clipboard-list"></i> 生產紀錄</a></li>
                            </ul>
                        </li>

                        <!-- 設備管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="equipment_management">
                                <i class="fas fa-tools menu-icon"></i>
                                <span class="menu-text">設備管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="machines" data-title="機台設備管理"><i class="fas fa-cog"></i> 機台設備管理</a></li>
                                <li><a href="#" data-page="machine_maintenance_tasks" data-title="機台維修任務"><i class="fas fa-wrench"></i> 機台維修任務</a></li>
                                <li><a href="#" data-page="daily_machine_inspections" data-title="每日機台檢驗"><i class="fas fa-clipboard-check"></i> 每日機台檢驗</a></li>
                                <li><a href="#" data-page="daily_machine_inspection_items" data-title="機台檢驗項目明細設定"><i class="fas fa-tasks"></i> 機台檢驗項目明細設定</a></li>
                            </ul>
                        </li>

                        <!-- 品質管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="quality_management">
                                <i class="fas fa-check-circle menu-icon"></i>
                                <span class="menu-text">品質管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="production_quality_records" data-title="生產品質檢驗"><i class="fas fa-microscope"></i> 生產品質檢驗</a></li>
                                <li><a href="#" data-page="quality_issue_reports" data-title="品質異常報告"><i class="fas fa-exclamation-triangle"></i> 品質異常報告</a></li>
                                <li><a href="#" data-page="shipping_quality_inspections" data-title="出貨品質檢驗"><i class="fas fa-search"></i> 出貨品質檢驗</a></li>
                            </ul>
                        </li>

                        <!-- 出貨管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="shipping_management">
                                <i class="fas fa-shipping-fast menu-icon"></i>
                                <span class="menu-text">出貨管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="shipping_orders" data-title="出貨單"><i class="fas fa-file-export"></i> 出貨單</a></li>
                                <li><a href="#" data-page="shipping_order_items" data-title="出貨品項"><i class="fas fa-boxes"></i> 出貨品項</a></li>
                            </ul>
                        </li>

                        <!-- 退貨管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="return_management">
                                <i class="fas fa-undo-alt menu-icon"></i>
                                <span class="menu-text">退貨管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="return_orders" data-title="退貨單"><i class="fas fa-undo-alt"></i> 退貨單</a></li>
                                <li><a href="#" data-page="return_order_items" data-title="退貨品項"><i class="fas fa-box-open"></i> 退貨品項</a></li>
                            </ul>
                        </li>

                        <!-- 庫存管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="inventory_management">
                                <i class="fas fa-warehouse menu-icon"></i>
                                <span class="menu-text">庫存管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="inventory_items" data-title="庫存項目"><i class="fas fa-boxes"></i> 庫存項目</a></li>
                                <li><a href="#" data-page="inventory_transactions" data-title="庫存異動紀錄"><i class="fas fa-exchange-alt"></i> 庫存異動紀錄</a></li>
                                <li><a href="#" data-page="tools" data-title="載具管理"><i class="fas fa-dolly"></i> 載具管理</a></li>
                            </ul>
                        </li>

                        <!-- 權限管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="permission_management">
                                <i class="fas fa-user-shield menu-icon"></i>
                                <span class="menu-text">權限管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="roles" data-title="角色設定"><i class="fas fa-user-tag"></i> 角色設定</a></li>
                                <li><a href="#" data-page="permissions" data-title="權限設定"><i class="fas fa-key"></i> 權限設定</a></li>
                                <li><a href="#" data-page="role_permissions" data-title="角色權限關聯"><i class="fas fa-lock"></i> 角色權限關聯</a></li>
                                <li><a href="#" data-page="employee_roles" data-title="員工角色關聯"><i class="fas fa-users-cog"></i> 員工角色關聯</a></li>
                            </ul>
                        </li>

                        <!-- 公告與行事曆 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="notification_calendar">
                                <i class="fas fa-bell menu-icon"></i>
                                <span class="menu-text">公告與行事曆</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-action="open-notifications"><i class="fas fa-bell"></i> 公告通知中心</a></li>
                                <li><a href="#" data-action="open-messages"><i class="fas fa-comments"></i> 我的留言</a></li>
                                <li><a href="#" data-page="dashboard_calendar_events" data-title="行事曆事件"><i class="fas fa-calendar-alt"></i> 行事曆事件</a></li>
                                <li><a href="#" data-page="calendar_event_reminders" data-title="行事曆提醒"><i class="fas fa-clock"></i> 行事曆提醒</a></li>
                            </ul>
                        </li>

                        <!-- 系統設定 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="system_settings">
                                <i class="fas fa-cog menu-icon"></i>
                                <span class="menu-text">系統設定</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="lookup_domains" data-title="代碼領域"><i class="fas fa-tag"></i> 代碼領域</a></li>
                                <li><a href="#" data-page="lookup_values" data-title="代碼值"><i class="fas fa-tags"></i> 代碼值</a></li>
                                <li><a href="#" data-page="number_sequences" data-title="流水號管理"><i class="fas fa-sort-numeric-up"></i> 流水號管理</a></li>
                                <li><a href="#" data-page="system_parameters" data-title="系統參數"><i class="fas fa-sliders-h"></i> 系統參數</a></li>
                                <li><a href="#" data-page="security_settings" data-title="安全設定"><i class="fas fa-shield-alt"></i> 安全設定</a></li>
                                <li><a href="#" data-page="report_descriptions" data-title="列印報表說明"><i class="fas fa-file-alt"></i> 列印報表說明</a></li>
                                <li><a href="#" data-page="audit_logs" data-title="操作日誌"><i class="fas fa-history"></i> 操作日誌</a></li>
                                <li><a href="#" data-page="domain_event_outbox" data-title="領域事件Outbox"><i class="fas fa-inbox"></i> 領域事件Outbox</a></li>
                                <li class="menu-divider"></li>
                                <li><a href="#" data-action="show-version-info"><i class="fas fa-info-circle"></i> 關於系統</a></li>
                            </ul>
                        </li>
                    </ul>
                </nav>
            </aside>

            <main class="main-content">
                <div class="tab-container">
                    <div class="tab-headers-wrapper">
                        <div id="tab-headers" class="tab-headers">
                            <!-- Tabs will be dynamically added here -->
                        </div>
                        <button type="button" id="close-all-tabs" class="close-all-tabs-btn" title="關閉全部分頁">
                            <i class="fas fa-times-circle"></i> 關閉全部
                        </button>
                    </div>
                    <div id="tab-content-area" class="tab-content-area">
                        <!-- Tab content will be dynamically loaded here -->
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- 個人資料 Modal -->
    <div class="modal-overlay hidden" data-profile-modal>
        <div class="modal-window medium">
            <button type="button" class="modal-close" data-action="close-profile-modal" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3><i class="fas fa-user-edit"></i> 修改個人資料</h3>

            <div class="modal-alert hidden" data-profile-modal-alert role="alert"></div>

            <!-- Tab 切換 -->
            <div class="profile-tabs">
                <button type="button" class="profile-tab active" data-profile-tab="info">
                    <i class="fas fa-id-card"></i> 基本資料
                </button>
                <button type="button" class="profile-tab" data-profile-tab="password">
                    <i class="fas fa-key"></i> 修改密碼
                </button>
            </div>

            <!-- 基本資料表單 -->
            <form data-profile-info-form class="profile-tab-content active" novalidate>
                <section class="form-section">
                    <div class="form-grid">
                        <label class="inline-label">
                            <span>帳號</span>
                            <input type="text" name="account" readonly disabled>
                        </label>
                        <label class="inline-label">
                            <span>員工編號</span>
                            <input type="text" name="employee_number" readonly disabled>
                        </label>
                        <label class="inline-label">
                            <span>姓名 <abbr title="必填">*</abbr></span>
                            <input type="text" name="name" required placeholder="請輸入姓名" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>Email <abbr title="必填">*</abbr></span>
                            <input type="email" name="email" required placeholder="請輸入 Email" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>職稱</span>
                            <input type="text" name="job_title" placeholder="請輸入職稱" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>部門</span>
                            <input type="text" name="department_name" readonly disabled>
                        </label>
                        <label class="inline-label">
                            <span>狀態</span>
                            <input type="text" name="status_display" readonly disabled>
                        </label>
                        <label class="inline-label">
                            <span>角色</span>
                            <input type="text" name="roles_display" readonly disabled>
                        </label>
                    </div>
                </section>

                <div class="form-actions">
                    <button type="button" class="outline" data-action="close-profile-modal">取消</button>
                    <button type="submit" class="primary">儲存變更</button>
                </div>
            </form>

            <!-- 修改密碼表單 -->
            <form data-profile-password-form class="profile-tab-content" novalidate>
                <section class="form-section">
                    <div class="form-grid">
                        <label class="inline-label full-width">
                            <span>目前密碼 <abbr title="必填">*</abbr></span>
                            <input type="password" name="current_password" required placeholder="請輸入目前密碼" autocomplete="current-password">
                        </label>
                        <label class="inline-label full-width">
                            <span>新密碼 <abbr title="必填">*</abbr></span>
                            <input type="password" name="new_password" required placeholder="請輸入新密碼（至少 6 字元）" autocomplete="new-password">
                        </label>
                        <label class="inline-label full-width">
                            <span>確認新密碼 <abbr title="必填">*</abbr></span>
                            <input type="password" name="confirm_password" required placeholder="請再次輸入新密碼" autocomplete="new-password">
                        </label>
                    </div>
                </section>

                <div class="form-actions">
                    <button type="button" class="outline" data-action="close-profile-modal">取消</button>
                    <button type="submit" class="primary">修改密碼</button>
                </div>
            </form>
        </div>
    </div>

    <!-- 版本資訊 Modal -->
    <div class="modal-overlay hidden" data-version-modal>
        <div class="modal-window small">
            <button type="button" class="modal-close" data-action="close-version-modal" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3><i class="fas fa-info-circle"></i> 關於系統</h3>

            <div class="version-info-content">
                <div class="system-logo">
                    <i class="fas fa-cogs fa-3x"></i>
                </div>
                <h4 class="system-name">螺絲篩分管理系統</h4>
                <p class="system-subtitle">Screw Screening MES</p>

                <div class="version-details">
                    <div class="version-item">
                        <span class="version-label">版本號：</span>
                        <span class="version-value" id="system-version">v1.0.0</span>
                    </div>
                    <div class="version-item">
                        <span class="version-label">發布日期：</span>
                        <span class="version-value" id="system-release-date">2026-02-10</span>
                    </div>
                    <div class="version-item">
                        <span class="version-label">文件版本：</span>
                        <span class="version-value" id="system-file-version">v1.0.0</span>
                    </div>
                </div>

                <div class="version-features">
                    <h5>版本更新內容</h5>
                    <ul id="system-update-list" class="version-update-list">
                        <li class="version-update-empty">尚無更新紀錄。</li>
                    </ul>
                </div>

                <div class="version-links">
                    <a href="help/index.html?v=<?= $ver ?>" target="_blank" class="btn primary">
                        <i class="fas fa-book"></i> 系統使用指南
                    </a>
                </div>

                <div class="version-copyright">
                    <p>© 2026 螺絲篩分管理系統</p>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="outline" data-action="close-version-modal">關閉</button>
            </div>
        </div>
    </div>

    <!-- 模組配置系統 (必須在 script.js 之前載入) -->
    <script>
        window.APP_ASSET_VERSION = <?= json_encode($ver, JSON_UNESCAPED_SLASHES) ?>;
    </script>
    <script defer src="core/module-config.js?v=<?= $ver ?>"></script>
    <script defer src="core/module-renderer.js?v=<?= $ver ?>"></script>
    <!-- 模組配置檔 -->
    <script defer src="core/configs/companies.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/departments.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/employees.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/tools.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/machines.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/suppliers.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/screening_services.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/screening_items.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/roles.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/permissions.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/customers.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/lookup_domains.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/number_sequences.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/system_parameters.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/orders.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/return_orders.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/shipping_orders.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/shipping_order_items.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/return_order_items.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/order_items.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/inventory_items.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/inventory_transactions.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/work_orders.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/work_order_first_piece_dimensions.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/work_order_images.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/role_permissions.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/employee_roles.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/production_records.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/quality_issue_reports.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/shipping_quality_inspections.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/production_quality_records.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/machine_maintenance_tasks.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/daily_machine_inspections.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/daily_machine_inspection_items.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/audit_logs.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/lookup_values.config.js?v=<?= $ver ?>"></script>
    <!-- dashboard 使用自訂 HTML，不使用配置檔 -->
    <script defer src="core/configs/dashboard.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/messages.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/notifications.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/domain_event_outbox.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/dashboard_calendar_events.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/calendar_event_participants.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/calendar_event_reminders.config.js?v=<?= $ver ?>"></script>
    <script defer src="core/configs/report_descriptions.config.js?v=<?= $ver ?>"></script>

    <script defer src="script.js?v=<?= $ver ?>"></script>
    <!-- 跨分頁資料同步模組 -->
    <script defer src="js/data-sync.js?v=<?= $ver ?>"></script>
    <!-- 通用欄位管理器 (必須在各模組 JS 之前載入) -->
    <script defer src="api/common/column_manager.js?v=<?= $ver ?>"></script>
    <!-- 全域列表硬序號管理器 (統一替所有功能列表補序號) -->
    <script defer src="api/common/table_row_numbers.js?v=<?= $ver ?>"></script>
    <!-- 共用工具函數庫 (必須在各模組 JS 之前載入) -->
    <script defer src="js/utils.js?v=<?= $ver ?>"></script>
    <script defer src="js/companies.js?v=<?= $ver ?>"></script>
    <script defer src="js/employees.js?v=<?= $ver ?>"></script>
    <script defer src="js/customers.js?v=<?= $ver ?>"></script>
    <script defer src="js/suppliers.js?v=<?= $ver ?>"></script>
    <script defer src="js/screening_items.js?v=<?= $ver ?>"></script>
    <script defer src="js/screening_services.js?v=<?= $ver ?>"></script>
    <script defer src="js/machines.js?v=<?= $ver ?>"></script>
    <script defer src="js/tools.js?v=<?= $ver ?>"></script>
    <script defer src="js/audit_logs.js?v=<?= $ver ?>"></script>
    <script defer src="js/lookup_values.js?v=<?= $ver ?>"></script>
    <script defer src="js/orders.js?v=<?= $ver ?>"></script>
    <script defer src="js/order_items.js?v=<?= $ver ?>"></script>
    <script defer src="js/departments.js?v=<?= $ver ?>"></script>
    <script defer src="js/work_orders.js?v=<?= $ver ?>"></script>
    <script defer src="js/work_order_first_piece_dimensions.js?v=<?= $ver ?>"></script>
    <script defer src="js/work_order_images.js?v=<?= $ver ?>"></script>
    <script defer src="js/inventory_items.js?v=<?= $ver ?>"></script>
    <script defer src="js/inventory_transactions.js?v=<?= $ver ?>"></script>
    <script defer src="js/shipping_orders.js?v=<?= $ver ?>"></script>
    <script defer src="js/shipping_order_items.js?v=<?= $ver ?>"></script>
    <script defer src="js/return_orders.js?v=<?= $ver ?>"></script>
    <script defer src="js/production_quality_records.js?v=<?= $ver ?>"></script>
    <script defer src="js/dashboard.js?v=<?= $ver ?>"></script>
    <!-- 新增模組 -->
    <script defer src="js/roles.js?v=<?= $ver ?>"></script>
    <script defer src="js/permissions.js?v=<?= $ver ?>"></script>
    <script defer src="js/role_permissions.js?v=<?= $ver ?>"></script>
    <script defer src="js/employee_roles.js?v=<?= $ver ?>"></script>
    <script defer src="js/quality_issue_reports.js?v=<?= $ver ?>"></script>
    <script defer src="js/machine_maintenance_tasks.js?v=<?= $ver ?>"></script>
    <script defer src="js/daily_machine_inspections.js?v=<?= $ver ?>"></script>
    <script defer src="js/daily_machine_inspection_items.js?v=<?= $ver ?>"></script>
    <script defer src="js/shipping_quality_inspections.js?v=<?= $ver ?>"></script>
    <script defer src="js/production_records.js?v=<?= $ver ?>"></script>
    <!-- 系統設定模組 -->
    <script defer src="js/lookup_domains.js?v=<?= $ver ?>"></script>
    <script defer src="js/number_sequences.js?v=<?= $ver ?>"></script>
    <script defer src="js/system_parameters.js?v=<?= $ver ?>"></script>
    <script defer src="js/security_settings.js?v=<?= $ver ?>"></script>
    <script defer src="js/dashboard_calendar_events.js?v=<?= $ver ?>"></script>
    <script defer src="js/calendar_event_participants.js?v=<?= $ver ?>"></script>
    <script defer src="js/calendar_event_reminders.js?v=<?= $ver ?>"></script>
    <script defer src="js/domain_event_outbox.js?v=<?= $ver ?>"></script>
    <script defer src="js/report_descriptions.js?v=<?= $ver ?>"></script>
    <!-- 通知與訊息模組 -->
    <script defer src="js/notifications.js?v=<?= $ver ?>"></script>
    <script defer src="js/messages.js?v=<?= $ver ?>"></script>
</body>
</html>
