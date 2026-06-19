/**
 * 公告通知中心模組
 *
 * @module notifications
 * @description 統一表格式 UI - 系統通知與公告管理
 */
(function() {
    'use strict';

    function initializeNotificationsModule(container) {
        const moduleRoot = container.querySelector('[data-module="notifications"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素 - 使用標準 data 屬性選擇器
        const alertBox = moduleRoot.querySelector('[data-notifications-alert]');
        const tableBody = moduleRoot.querySelector('[data-notifications-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-notifications-pagination]');

        // 側欄頁籤元素
        const tabNav = moduleRoot.querySelector('[data-notifications-tab-nav]');
        const contentToolbar = moduleRoot.querySelector('[data-notifications-toolbar]');
        const typeFilter = contentToolbar?.querySelector('[name="notification_type"]');
        const unreadOnlyCheckbox = contentToolbar?.querySelector('[name="unread_only"]');
        const unreadFilterLabel = unreadOnlyCheckbox?.closest('label');

        // Modal 元素
        const detailModal = moduleRoot.querySelector('[data-notifications-detail-modal]');
        const detailContent = moduleRoot.querySelector('[data-notifications-detail-content]');

        const formModal = moduleRoot.querySelector('[data-notifications-modal]');
        const modalAlertBox = formModal?.querySelector('[data-notifications-modal-alert]');
        const form = moduleRoot.querySelector('[data-notifications-form]');
        const modalTitle = formModal?.querySelector('[data-modal-title]');

        const targetTypeSelect = moduleRoot.querySelector('[data-target-type-select]');
        const targetIdsContainer = moduleRoot.querySelector('[data-target-ids-container]');
        const targetIdsSelect = moduleRoot.querySelector('[data-target-ids-select]');

        // 狀態變數
        let currentTab = 'inbox'; // inbox, sent, drafts, history
        let currentPage = 1;
        let perPage = 20;
        let notifications = [];
        let sortColumn = 'created_at';
        let sortDirection = 'desc';
        let currentViewingNotificationId = null; // 當前查看的通知 ID（供詳情 Modal 編輯使用）
        let saveAsDraft = false; // 是否存為草稿
        let isFormDirty = false;
        let formInitialSnapshot = null;

        let dataSyncHelper = null;

        // 優先級對應
        const priorityLabels = {
            low: { text: '低', class: 'priority-low' },
            normal: { text: '一般', class: 'priority-normal' },
            high: { text: '高', class: 'priority-high' },
            urgent: { text: '緊急', class: 'priority-urgent' }
        };

        const typeLabels = {
            announcement: { text: '公告', icon: 'fa-bullhorn' },
            system_alert: { text: '系統', icon: 'fa-cog' }
        };

        // ====== Alert 函式 ======
        function showAlert(type, message) {
            if (!alertBox) return;
            alertBox.textContent = message;
            alertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            alertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error');
        }

        function hideAlert() {
            if (!alertBox) return;
            alertBox.classList.add('hidden');
            alertBox.textContent = '';
        }

        function showModalAlert(type, message, autoHide = true) {
            if (!modalAlertBox) {
                showAlert(type, message);
                return;
            }
            modalAlertBox.textContent = message;
            modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            modalAlertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error');

            if (autoHide && type === 'success') {
                setTimeout(() => modalAlertBox.classList.add('hidden'), 3000);
            }
        }

        function hideModalAlert() {
            if (!modalAlertBox) return;
            modalAlertBox.classList.add('hidden');
        }

        function setFieldValue(name, value) {
            if (!form) {
                return;
            }

            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || '';
            } else {
                console.warn(`notifications: 欄位不存在 - ${name}`);
            }
        }

        // ====== 切換側欄頁籤 ======
        function switchTab(tab) {
            currentTab = tab;
            currentPage = 1;

            // 更新頁籤按鈕樣式
            if (tabNav) {
                tabNav.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tabValue === tab);
                });
            }

            // 僅收件匣顯示未讀篩選
            if (unreadFilterLabel) {
                unreadFilterLabel.style.display = tab === 'inbox' ? '' : 'none';
                if (tab !== 'inbox' && unreadOnlyCheckbox) {
                    unreadOnlyCheckbox.checked = false;
                }
            }

            loadNotifications();
        }

        // ====== 載入通知列表 ======
        async function loadNotifications() {
            if (!tableBody) return;

            try {
                tableBody.innerHTML = '<tr><td colspan="8" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> 載入中...</td></tr>';

                const params = new URLSearchParams({
                    page: currentPage,
                    perPage: perPage
                });

                if (typeFilter?.value) {
                    params.append('notification_type', typeFilter.value);
                }

                // 根據 Tab 設定參數
                if (currentTab === 'sent') {
                    params.append('status', 'published');
                    params.append('created_by_me', '1');
                } else if (currentTab === 'drafts') {
                    params.append('status', 'draft');
                    params.append('created_by_me', '1');
                } else if (currentTab === 'history') {
                    params.append('status', 'published');
                    params.append('include_expired', '1');
                } else {
                    // inbox: 收件匣，只顯示已發布的通知
                    params.append('status', 'published');
                    if (unreadOnlyCheckbox?.checked) {
                        params.append('unread_only', '1');
                    }
                }

                const response = await fetch(`api/notifications/?${params}`, {
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('載入失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                notifications = result.data || [];
                renderNotifications();
                renderPagination(result.pagination);

                // 更新頂部的未讀數量
                if (typeof window.refreshUnreadCounts === 'function') {
                    window.refreshUnreadCounts();
                }

            } catch (error) {
                console.error('載入通知失敗:', error);
                tableBody.innerHTML = `<tr><td colspan="8" class="error-cell">載入失敗: ${escapeHtml(error.message)}</td></tr>`;
            }
        }

        // ====== 渲染表格 ======
        function renderNotifications() {
            if (!tableBody) return;

            if (notifications.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="empty-cell"><i class="fas fa-bell-slash"></i> 目前沒有通知</td></tr>';
                return;
            }

            tableBody.innerHTML = notifications.map(n => {
                const isUnread = !n.is_read;
                const rowClass = isUnread ? 'unread-row' : '';
                const priority = priorityLabels[n.priority] || priorityLabels.normal;
                const type = typeLabels[n.notification_type] || typeLabels.announcement;
                const isExpired = n.expires_at && new Date(n.expires_at) < new Date();

                const statusIcon = isUnread
                    ? '<span class="status-badge unread" title="未讀"><i class="fas fa-circle"></i></span>'
                    : '<span class="status-badge read" title="已讀"><i class="fas fa-check"></i></span>';

                const typeHtml = `<span class="type-badge"><i class="fas ${type.icon}"></i> ${type.text}</span>`;
                const priorityHtml = `<span class="priority-badge ${escapeHtml(priority.class)}">${escapeHtml(priority.text)}</span>`;

                let actionsHtml = `
                    <button type="button" class="btn text" data-action="view" data-id="${n.id}" title="檢視">
                        <i class="fas fa-eye"></i>
                    </button>
                `;

                if (currentTab === 'sent' || currentTab === 'drafts') {
                    actionsHtml += `
                        <button type="button" class="btn text" data-action="edit" data-id="${n.id}" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${n.id}" title="刪除">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                } else if (isUnread) {
                    actionsHtml += `
                        <button type="button" class="btn text op-action-btn op-role-mark-read" data-action="mark-read" data-id="${n.id}" title="標記已讀" aria-label="標記已讀">
                            <i class="fas fa-check"></i>
                        </button>
                    `;
                }

                return `
                    <tr class="${rowClass} ${isExpired ? 'expired-row' : ''}" data-id="${n.id}">
                        <td class="checkbox-col">
                            <input type="checkbox" data-row-checkbox value="${n.id}">
                        </td>
                        <td class="status-col">${statusIcon}</td>
                        <td class="type-col">${typeHtml}</td>
                        <td class="title-col">
                            <a href="#" class="title-link" data-action="view" data-id="${n.id}">
                                ${escapeHtml(n.title)}
                                ${isExpired ? '<span class="expired-badge">已過期</span>' : ''}
                            </a>
                        </td>
                        <td class="priority-col">${priorityHtml}</td>
                        <td class="creator-col">${escapeHtml(n.created_by_name || '系統')}</td>
                        <td class="time-col">${formatDateTime(n.created_at)}</td>
                        <td class="actions-col">${actionsHtml}</td>
                    </tr>
                `;
            }).join('');
        }

        // ====== 渲染分頁 ======
        function renderPagination(pagination) {
            if (!paginationContainer || !pagination) return;

            const { page, totalPages, total } = pagination;
            if (totalPages <= 1) {
                paginationContainer.innerHTML = `<span class="pagination-info">共 ${Number(total)} 筆</span>`;
                return;
            }

            let html = `<span class="pagination-info">共 ${total} 筆</span>`;

            if (page > 1) {
                html += `<button type="button" class="pagination-btn" data-page="${page - 1}">上一頁</button>`;
            }

            const maxVisible = 5;
            let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            startPage = Math.max(1, endPage - maxVisible + 1);

            for (let i = startPage; i <= endPage; i++) {
                html += `<button type="button" class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }

            if (page < totalPages) {
                html += `<button type="button" class="pagination-btn" data-page="${page + 1}">下一頁</button>`;
            }

            paginationContainer.innerHTML = html;
        }

        // ====== 檢視通知詳情 ======
        async function viewNotification(id) {
            if (!detailModal || !detailContent) return;

            try {
                const response = await fetch(`api/notifications/show.php?id=${id}`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('載入失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                const n = result.data;
                currentViewingNotificationId = id; // 儲存當前查看的通知 ID
                const priority = priorityLabels[n.priority] || priorityLabels.normal;
                const type = typeLabels[n.notification_type] || typeLabels.announcement;

                detailContent.innerHTML = `
                    <div class="detail-header">
                        <span class="detail-type"><i class="fas ${type.icon}"></i> ${type.text}</span>
                        <span class="priority-badge ${escapeHtml(priority.class)}">${escapeHtml(priority.text)}</span>
                    </div>
                    <h4 class="detail-title">${escapeHtml(n.title)}</h4>
                    <div class="detail-meta">
                        <span><i class="fas fa-user"></i> ${escapeHtml(n.created_by_name || '系統')}</span>
                        <span><i class="fas fa-clock"></i> ${formatDateTime(n.created_at)}</span>
                        ${n.expires_at ? `<span><i class="fas fa-hourglass-end"></i> 過期: ${formatDateTime(n.expires_at)}</span>` : ''}
                    </div>
                    <div class="detail-body">
                        ${escapeHtml(n.content).replace(/\n/g, '<br>')}
                    </div>
                `;

                detailModal.classList.remove('hidden');

                // 即時更新本地已讀狀態
                if (!n.is_read) {
                    // 先更新本地狀態和 UI（不等 API 回應）
                    const localNotif = notifications.find(item => item.id == id);
                    if (localNotif && !localNotif.is_read) {
                        localNotif.is_read = true;
                        renderNotifications();
                    }
                    // 向後端標記已讀（fire-and-forget）
                    fetch('api/notifications/mark_read.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ id })
                    }).then(() => {
                        // API 完成後刷新頂部未讀數量（此時伺服器已更新）
                        if (typeof window.refreshUnreadCounts === 'function') {
                            window.refreshUnreadCounts();
                        }
                        if (dataSyncHelper) {
                            dataSyncHelper.notifyUpdated({ id, action: 'mark_read' });
                        }
                    }).catch(err => console.warn('標記已讀失敗:', err));
                }

            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // ====== 標記已讀 ======
        async function markAsRead(id) {
            try {
                // 樂觀更新：先即時更新本地狀態和 UI，不等待 API 回應
                const notif = notifications.find(n => n.id == id);
                if (notif && !notif.is_read) {
                    notif.is_read = true;
                    renderNotifications();
                    // 立即刷新頂部未讀數量
                    if (typeof window.refreshUnreadCounts === 'function') {
                        window.refreshUnreadCounts();
                    }
                }

                await fetch('api/notifications/mark_read.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id })
                });
                if (dataSyncHelper) {
                    dataSyncHelper.notifyUpdated({ id, action: 'mark_read' });
                }
                return true;
            } catch (error) {
                console.warn('標記已讀失敗:', error);
                return false;
            }
        }

        // ====== 全部標記已讀 ======
        async function markAllAsRead() {
            try {
                const response = await fetch('api/notifications/mark_read.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ all: true })
                });
                if (!response.ok) throw new Error('操作失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                showAlert('success', `已標記 ${result.marked_count || '所有'} 則通知為已讀`);
                if (dataSyncHelper) {
                    dataSyncHelper.notifyBulkUpdated({ action: 'mark_all_read' });
                }
                loadNotifications();
            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // ====== 表單髒值追蹤 ======
        function getFormSnapshot() {
            if (!form) return {};
            return {
                title: form.elements.title?.value?.trim() || '',
                content: form.elements.content?.value?.trim() || '',
                priority: form.elements.priority?.value || '',
                target_type: form.elements.target_type?.value || '',
                expires_at: form.elements.expires_at?.value || '',
                target_ids: targetIdsSelect ? Array.from(targetIdsSelect.selectedOptions).map(o => o.value).join(',') : '',
            };
        }

        function setFormSnapshot() {
            formInitialSnapshot = getFormSnapshot();
            isFormDirty = false;
        }

        function hasUnsavedChanges() {
            if (!form || !formInitialSnapshot) return false;
            const current = getFormSnapshot();
            return Object.keys(formInitialSnapshot).some(key => formInitialSnapshot[key] !== current[key]);
        }

        function updateDirtyState() {
            isFormDirty = hasUnsavedChanges();
        }

        // ====== 開啟新增 Modal ======
        function openCreateModal() {
            if (!formModal || !form) return;

            form.reset();
            const idField = form.querySelector('[name="id"]');
            if (idField) idField.value = '';

            if (modalTitle) modalTitle.textContent = '發佈公告';
            hideModalAlert();

            targetIdsContainer?.classList.add('hidden');
            formModal.classList.remove('hidden');
            setFormSnapshot();
        }

        // ====== 開啟編輯 Modal ======
        async function openEditModal(id) {
            if (!formModal || !form) return;

            try {
                const response = await fetch(`api/notifications/show.php?id=${id}`, {
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('載入失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                const n = result.data;

                form.reset();

                const idField = form.querySelector('[name="id"]');
                if (idField) idField.value = n.id;

                form.elements.title.value = n.title;
                form.elements.content.value = n.content;
                form.elements.priority.value = n.priority;
                form.elements.target_type.value = n.target_type;

                if (n.expires_at) {
                    form.elements.expires_at.value = n.expires_at.substring(0, 16);
                }

                if (modalTitle) modalTitle.textContent = '編輯公告';
                hideModalAlert();

                if (n.target_type !== 'all') {
                    targetIdsContainer?.classList.remove('hidden');
                    await loadTargetOptions(n.target_type);
                    // 選擇已設定的目標
                    if (n.target_ids && targetIdsSelect) {
                        const ids = JSON.parse(n.target_ids || '[]');
                        Array.from(targetIdsSelect.options).forEach(opt => {
                            opt.selected = ids.includes(parseInt(opt.value));
                        });
                    }
                } else {
                    targetIdsContainer?.classList.add('hidden');
                }

                formModal.classList.remove('hidden');
                setFormSnapshot();

            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // ====== 載入目標選項 ======
        async function loadTargetOptions(type) {
            if (!targetIdsSelect) return;

            targetIdsSelect.innerHTML = '<option value="">載入中...</option>';

            try {
                let url = '';
                switch (type) {
                    case 'department':
                        url = 'api/departments/';
                        break;
                    case 'role':
                        url = 'api/roles/';
                        break;
                    case 'user':
                        url = 'api/employees/list_for_selector.php';
                        break;
                    default:
                        return;
                }

                const response = await fetch(url, { credentials: 'include' });
                if (!response.ok) throw new Error('載入失敗');

                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                const data = result.data || [];
                targetIdsSelect.innerHTML = data.map(item => {
                    const id = item.id;
                    const name = item.name || item.display_name || item.account;
                    return `<option value="${id}">${escapeHtml(name)}</option>`;
                }).join('');

            } catch (error) {
                console.warn('載入目標選項失敗:', error);
                targetIdsSelect.innerHTML = '<option value="">載入失敗</option>';
            }
        }

        // ====== 表單提交 ======
        async function handleFormSubmit(e) {
            e.preventDefault();
            hideModalAlert();

            const formData = new FormData(form);
            const idField = form.querySelector('[name="id"]');
            const id = idField?.value;
            const isEdit = id && id !== '';

            const payload = {
                title: formData.get('title')?.trim(),
                content: formData.get('content')?.trim(),
                priority: formData.get('priority'),
                notification_type: 'announcement',
                target_type: formData.get('target_type')
            };

            // 草稿/發布狀態處理
            if (isEdit) {
                // 編輯模式：直接傳 status 欄位給 update.php
                payload.status = saveAsDraft ? 'draft' : 'published';
            } else {
                // 新增模式：傳 save_as_draft 給 index.php POST
                payload.save_as_draft = saveAsDraft;
            }

            // 過期時間
            const expiresAt = formData.get('expires_at');
            if (expiresAt) {
                payload.expires_at = expiresAt;
            }

            // 目標 IDs（草稿可以不選擇）
            if (payload.target_type !== 'all') {
                const selectedOptions = Array.from(targetIdsSelect?.selectedOptions || []);
                payload.target_ids = selectedOptions.map(opt => parseInt(opt.value, 10));

                if (payload.target_ids.length === 0 && !saveAsDraft) {
                    showModalAlert('error', '請選擇至少一個目標對象');
                    return;
                }
            }

            try {
                const url = isEdit ? `api/notifications/update.php?id=${id}` : 'api/notifications/';
                const method = isEdit ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    if (result.errors) {
                        const errorMessages = Object.values(result.errors).join('、');
                        throw new Error(errorMessages);
                    }
                    throw new Error(result.message || '操作失敗');
                }

                showAlert('success', result.message || (saveAsDraft ? '草稿已儲存' : '公告發佈成功'));
                isFormDirty = false;
                closeModal(true);
                if (dataSyncHelper) {
                    if (isEdit) {
                        dataSyncHelper.notifyUpdated({ id });
                    } else {
                        dataSyncHelper.notifyCreated(payload);
                    }
                }
                
                // 切換到適當分頁（switchTab 內部會呼叫 loadNotifications）
                switchTab(saveAsDraft ? 'drafts' : 'sent');
                
                // 重設 saveAsDraft 標記
                saveAsDraft = false;

            } catch (error) {
                showModalAlert('error', error.message);
                saveAsDraft = false;
            }
        }

        // ====== 刪除通知 ======
        async function deleteNotification(id) {
            if (!confirm('確定要刪除此通知嗎？此操作無法復原。')) return;

            try {
                const response = await fetch(`api/notifications/delete.php?id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('刪除失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                showAlert('success', '通知已刪除');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
                loadNotifications();

            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // ====== Modal 關閉 ======
        function closeModal(force = false) {
            if (!formModal || formModal.classList.contains('hidden')) return;

            if (!force && isFormDirty && hasUnsavedChanges()) {
                if (!window.confirm('表單資料尚未儲存，確定要關閉嗎？')) {
                    return;
                }
            }

            formModal.classList.add('hidden');
            hideModalAlert();
            formInitialSnapshot = null;
            isFormDirty = false;
        }

        function closeDetailModal() {
            detailModal?.classList.add('hidden');
        }

        // ====== 工具函式 ======
        function formatDateTime(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            if (isToday) {
                return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) +
                   ' ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        }

        // ====== 事件綁定 ======
        function bindEvents() {
            // 標題區按鈕 & 操作
            moduleRoot.addEventListener('click', function(e) {
                const action = e.target.closest('[data-action]')?.dataset.action;
                const id = e.target.closest('[data-id]')?.dataset.id;

                switch (action) {
                    case 'mark-all-read':
                        markAllAsRead();
                        break;
                    case 'create':
                        openCreateModal();
                        break;
                    case 'view':
                        e.preventDefault();
                        if (id) viewNotification(id);
                        break;
                    case 'mark-read':
                        if (id) markAsRead(id);
                        break;
                    case 'edit':
                        if (id) openEditModal(id);
                        break;
                    case 'edit-from-detail':
                        // 從詳情 Modal 點擊編輯按鈕
                        if (currentViewingNotificationId) {
                            closeDetailModal();
                            openEditModal(currentViewingNotificationId);
                        }
                        break;
                    case 'delete':
                        if (id) deleteNotification(id);
                        break;
                    case 'close-detail-modal':
                        closeDetailModal();
                        break;
                    case 'close-modal':
                    case 'cancel':
                        closeModal();
                        break;
                    case 'save-draft':
                        // 點擊存草稿按鈕
                        saveAsDraft = true;
                        if (form) {
                            form.requestSubmit();
                        }
                        break;
                    case 'reset-filter':
                        if (typeFilter) typeFilter.selectedIndex = 0;
                        if (unreadOnlyCheckbox) unreadOnlyCheckbox.checked = false;
                        switchTab('inbox');
                        break;
                }
            });

            // 側欄頁籤點擊切換
            if (tabNav) {
                tabNav.addEventListener('click', function(e) {
                    const btn = e.target.closest('.sidebar-tab-btn');
                    if (btn) {
                        switchTab(btn.dataset.tabValue);
                    }
                });
            }

            // 未讀勾選切換
            if (unreadOnlyCheckbox) {
                unreadOnlyCheckbox.addEventListener('change', function() {
                    currentPage = 1;
                    loadNotifications();
                });
            }

            // 類型篩選
            if (typeFilter) {
                typeFilter.addEventListener('change', function() {
                    currentPage = 1;
                    loadNotifications();
                });
            }

            // 分頁點擊
            if (paginationContainer) {
                paginationContainer.addEventListener('click', function(e) {
                    const btn = e.target.closest('[data-page]');
                    if (btn) {
                        currentPage = parseInt(btn.dataset.page);
                        loadNotifications();
                    }
                });
            }

            // 表格排序
            const table = moduleRoot.querySelector('[data-notifications-table]');
            if (table) {
                table.addEventListener('click', function(e) {
                    const th = e.target.closest('[data-sort]');
                    if (th) {
                        const column = th.dataset.sort;
                        if (sortColumn === column) {
                            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                        } else {
                            sortColumn = column;
                            sortDirection = 'asc';
                        }
                        loadNotifications();
                    }
                });

                // 全選 checkbox
                const selectAllCheckbox = table.querySelector('[data-action="select-all"]');
                if (selectAllCheckbox) {
                    selectAllCheckbox.addEventListener('change', function() {
                        const checkboxes = tableBody.querySelectorAll('[data-row-checkbox]');
                        checkboxes.forEach(cb => cb.checked = this.checked);
                    });
                }
            }

            // 目標類型變更
            if (targetTypeSelect) {
                targetTypeSelect.addEventListener('change', function() {
                    const type = this.value;
                    if (type === 'all') {
                        targetIdsContainer?.classList.add('hidden');
                    } else {
                        targetIdsContainer?.classList.remove('hidden');
                        loadTargetOptions(type);
                    }
                });
            }

            // 表單提交
            if (form) {
                form.addEventListener('submit', handleFormSubmit);
                form.addEventListener('input', updateDirtyState);
                form.addEventListener('change', updateDirtyState);
            }

            // Modal 背景點擊關閉
            if (formModal) {
                formModal.addEventListener('click', function(e) {
                    if (e.target === formModal) {
                        closeModal();
                    }
                });
            }
            if (detailModal) {
                detailModal.addEventListener('click', function(e) {
                    if (e.target === detailModal) {
                        closeDetailModal();
                    }
                });
            }

            // ESC 關閉 Modal
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (!formModal?.classList.contains('hidden')) {
                        closeModal();
                    }
                    if (!detailModal?.classList.contains('hidden')) {
                        closeDetailModal();
                    }
                }
            });
        }

        // ====== 初始化 ======
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('notifications', {
                onRefresh: loadNotifications
            });
        }
        bindEvents();
        loadNotifications();
    }

    window.initializeNotificationsModule = initializeNotificationsModule;
})();
