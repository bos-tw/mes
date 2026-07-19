<?php

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
    <script src="core/ui-preferences.js?v=<?= $ver ?>"></script>
    <link rel="stylesheet" href="styles/tokens.css?v=<?= $ver ?>">
    <link rel="stylesheet" href="styles/shell.css?v=<?= $ver ?>">
    <link rel="stylesheet" href="styles.css?v=<?= $ver ?>">
    <link rel="stylesheet" href="styles/components.css?v=<?= $ver ?>">
    <link rel="stylesheet" href="styles/utilities.css?v=<?= $ver ?>">
    <link rel="stylesheet" href="styles/workspaces.css?v=<?= $ver ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" integrity="sha384-5e2ESR8Ycmos6g3gAKr1Jvwye8sW4U1u/cAKulfVJnkakCcMqhOudbtPnvJ+nbv7" crossorigin="anonymous" referrerpolicy="no-referrer">
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
                    <a href="mobile/?v=<?= $ver ?>" target="_blank" class="top-icon-item" title="生產工單手機版">
                        <i class="fas fa-mobile-alt"></i> 生產工單手機版
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
                                <span class="menu-text">常用基礎資料</span>
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

                        <!-- 設備管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="equipment_management">
                                <i class="fas fa-tools menu-icon"></i>
                                <span class="menu-text">設備管理</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="machines" data-title="機台設備管理"><i class="fas fa-cog"></i> 機台設備管理</a></li>
                                <li><a href="#" data-page="machine_capabilities" data-title="機台能力管理"><i class="fas fa-layer-group"></i> 機台能力管理</a></li>
                                <li><a href="#" data-page="machine_maintenance_tasks" data-title="機台維修任務"><i class="fas fa-wrench"></i> 機台維修任務</a></li>
                                <li><a href="#" data-page="daily_machine_inspections" data-title="每日機台檢驗"><i class="fas fa-clipboard-check"></i> 每日機台檢驗</a></li>
                                <li><a href="#" data-page="daily_machine_inspection_items" data-title="機台檢驗項目明細設定"><i class="fas fa-tasks"></i> 機台檢驗項目明細設定</a></li>
                            </ul>
                        </li>

                        <!-- 系統設定 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="system_settings">
                                <i class="fas fa-cog menu-icon"></i>
                                <span class="menu-text">系統設定</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="basic_settings" data-title="基本設定"><i class="fas fa-sliders-h"></i> 基本設定</a></li>
                                <li><a href="#" data-page="lookup_domains" data-title="代碼領域"><i class="fas fa-tag"></i> 代碼領域</a></li>
                                <li><a href="#" data-page="lookup_values" data-title="代碼值"><i class="fas fa-tags"></i> 代碼值</a></li>
                                <li><a href="#" data-page="number_sequences" data-title="流水號管理"><i class="fas fa-sort-numeric-up"></i> 流水號管理</a></li>
                                <li><a href="#" data-page="system_parameters" data-title="系統參數"><i class="fas fa-sliders-h"></i> 系統參數</a></li>
                                <li><a href="#" data-page="security_settings" data-title="安全設定"><i class="fas fa-shield-alt"></i> 安全設定</a></li>
                                <li><a href="#" data-page="report_descriptions" data-title="列印報表說明"><i class="fas fa-file-alt"></i> 列印報表說明</a></li>
                                <li><a href="#" data-page="audit_logs" data-title="操作日誌"><i class="fas fa-history"></i> 操作日誌</a></li>
                                <li class="menu-divider"></li>
                                <li><a href="#" data-action="show-version-info"><i class="fas fa-info-circle"></i> 關於系統</a></li>
                            </ul>
                        </li>

                        <!-- 訂單管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="order_management">
                                <i class="fas fa-file-invoice menu-icon"></i>
                                <span class="menu-text">接單作業</span>
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
                                <span class="menu-text">排程與生產</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="work_orders" data-title="生產工單"><i class="fas fa-clipboard"></i> 生產工單</a></li>
                                <li><a href="#" data-page="production_work_order_schedule" data-title="生產工單排程"><i class="fas fa-calendar-alt"></i> 生產工單排程</a></li>
                                <li><a href="#" data-page="work_order_first_piece_dimensions" data-title="首件尺寸檢驗"><i class="fas fa-ruler-combined"></i> 首件尺寸檢驗</a></li>
                                <li><a href="#" data-page="production_records" data-title="生產紀錄"><i class="fas fa-clipboard-list"></i> 生產紀錄</a></li>
                                <li><a href="#" data-page="work_order_images" data-title="工單圖片"><i class="fas fa-images"></i> 工單圖片</a></li>
                            </ul>
                        </li>

                        <!-- 品質管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="quality_management">
                                <i class="fas fa-check-circle menu-icon"></i>
                                <span class="menu-text">品質與異常</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="production_quality_records" data-title="生產品質檢驗"><i class="fas fa-microscope"></i> 生產品質檢驗</a></li>
                                <li><a href="#" data-page="defect_history_records" data-title="不良品歷史紀錄"><i class="fas fa-history"></i> 不良品歷史紀錄</a></li>
                                <li><a href="#" data-page="rescreen_batches" data-title="二次篩選紀錄"><i class="fas fa-redo"></i> 二次篩選紀錄</a></li>
                                <li><a href="#" data-page="shipping_quality_inspections" data-title="出貨品質檢驗"><i class="fas fa-search"></i> 出貨品質檢驗</a></li>
                                <li><a href="#" data-page="quality_issue_reports" data-title="品質異常報告"><i class="fas fa-exclamation-triangle"></i> 品質異常報告</a></li>
                            </ul>
                        </li>

                        <!-- 庫存管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="inventory_management">
                                <i class="fas fa-warehouse menu-icon"></i>
                                <span class="menu-text">入庫與庫存</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="inventory_items" data-title="庫存項目"><i class="fas fa-boxes"></i> 庫存項目</a></li>
                                <li><a href="#" data-page="inventory_transactions" data-title="庫存異動紀錄"><i class="fas fa-exchange-alt"></i> 庫存異動紀錄</a></li>
                                <li><a href="#" data-page="tools" data-title="載具管理"><i class="fas fa-dolly"></i> 載具管理</a></li>
                            </ul>
                        </li>

                        <!-- 出貨管理 -->
                        <li class="menu-item has-submenu">
                            <a href="#" class="menu-link" data-menu-id="shipping_management">
                                <i class="fas fa-shipping-fast menu-icon"></i>
                                <span class="menu-text">出貨作業</span>
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
                                <span class="menu-text">退貨作業</span>
                            </a>
                            <ul class="submenu">
                                <li><a href="#" data-page="return_orders" data-title="退貨單"><i class="fas fa-undo-alt"></i> 退貨單</a></li>
                                <li><a href="#" data-page="return_order_items" data-title="退貨品項"><i class="fas fa-box-open"></i> 退貨品項</a></li>
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
                        <span class="version-value" id="system-version">讀取中</span>
                    </div>
                    <div class="version-item">
                        <span class="version-label">發布日期：</span>
                        <span class="version-value" id="system-release-date">讀取中</span>
                    </div>
                    <div class="version-item">
                        <span class="version-label">文件版本：</span>
                        <span class="version-value" id="system-file-version">讀取中</span>
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

    <!-- 僅載入登入後 shell 所需核心；業務模組由 module-assets 按需載入。 -->
    <script>
        window.APP_ASSET_VERSION = <?= json_encode($ver, JSON_UNESCAPED_SLASHES) ?>;
    </script>
    <script defer src="core/module-config.js?v=<?= $ver ?>"></script>
    <script defer src="core/module-renderer.js?v=<?= $ver ?>"></script>
    <script defer src="core/module-assets.js?v=<?= $ver ?>"></script>
    <script defer src="core/feedback.js?v=<?= $ver ?>"></script>
    <script defer src="core/workspace-navigation.js?v=<?= $ver ?>"></script>
    <script defer src="js/data-sync.js?v=<?= $ver ?>"></script>
    <script defer src="api/common/column_manager.js?v=<?= $ver ?>"></script>
    <script defer src="api/common/table_row_numbers.js?v=<?= $ver ?>"></script>
    <script defer src="js/utils.js?v=<?= $ver ?>"></script>
    <script defer src="script.js?v=<?= $ver ?>"></script>
</body>
</html>
