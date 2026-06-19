/**
 * 我的留言模組
 *
 * @module messages
 * @description 統一表格式 UI - 收發留言功能，支援全體員工發送、附件上傳、簡易文字編輯器
 */
(function() {
    'use strict';

    function initializeMessagesModule(container) {
        const moduleRoot = container.querySelector('[data-module="messages"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素 - 使用標準 data 屬性選擇器
        const alertBox = moduleRoot.querySelector('[data-messages-alert]');
        const tableBody = moduleRoot.querySelector('[data-messages-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-messages-pagination]');

        // 側欄頁籤元素
        const tabNav = moduleRoot.querySelector('[data-messages-tab-nav]');
        const contentToolbar = moduleRoot.querySelector('[data-messages-toolbar]');
        const searchInput = contentToolbar?.querySelector('[name="search"]');
        const unreadOnlyCheckbox = contentToolbar?.querySelector('[name="unread_only"]');
        const unreadFilterLabel = unreadOnlyCheckbox?.closest('label');

        // Modal 元素
        const detailModal = moduleRoot.querySelector('[data-messages-detail-modal]');
        const detailContent = moduleRoot.querySelector('[data-messages-detail-content]');
        const replyButton = detailModal?.querySelector('[data-reply-btn]');

        const formModal = moduleRoot.querySelector('[data-messages-modal]');
        const modalAlertBox = formModal?.querySelector('[data-messages-modal-alert]');
        const form = moduleRoot.querySelector('[data-messages-form]');
        const modalTitle = formModal?.querySelector('[data-modal-title]');
        const recipientsSelect = moduleRoot.querySelector('[data-recipients-select]');

        // 新增元素 - 全體員工、附件、編輯器
        const sendToAllCheckbox = moduleRoot.querySelector('[data-send-to-all-checkbox]');
        const recipientsWrapper = moduleRoot.querySelector('[data-recipients-wrapper]');
        const attachmentInput = moduleRoot.querySelector('[data-attachment-input]');
        const attachmentPreview = moduleRoot.querySelector('[data-attachment-preview]');
        const contentEditor = moduleRoot.querySelector('[data-message-content-editor]');

        // 狀態變數
        let currentFolder = 'inbox';
        let currentPage = 1;
        let perPage = 20;
        let messages = [];
        let employeeList = [];
        let currentViewingMessageId = null;
        let sortColumn = 'created_at';
        let sortDirection = 'desc';
        let pendingAttachments = []; // 待上傳的附件
        let existingAttachments = []; // 已在伺服器上的附件（編輯草稿用）
        let deleteAttachmentIds = []; // 要刪除的已存在附件 IDs
        let richTextEditor = null;   // 富文本編輯器實例
        let saveAsDraft = false;      // 是否存為草稿
        let isFormDirty = false;
        let formInitialSnapshot = null;

        let dataSyncHelper = null;

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
                console.warn(`messages: 欄位不存在 - ${name}`);
            }
        }

        // ====== 載入員工列表 ======
        async function loadEmployees() {
            try {
                const response = await fetch('api/employees/list_for_selector.php', {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('載入失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                employeeList = result.data || [];
                renderRecipientOptions();
            } catch (error) {
                console.warn('載入員工列表失敗:', error);
            }
        }

        function renderRecipientOptions() {
            if (!recipientsSelect) return;
            // 依部門分組
            const groupedByDept = {};
            employeeList.forEach(emp => {
                const deptName = emp.department_name || '未指定部門';
                if (!groupedByDept[deptName]) {
                    groupedByDept[deptName] = [];
                }
                groupedByDept[deptName].push(emp);
            });

            let html = '';
            Object.keys(groupedByDept).sort().forEach(deptName => {
                html += `<optgroup label="${escapeHtml(deptName)}">`;
                groupedByDept[deptName].forEach(emp => {
                    html += `<option value="${emp.id}">${escapeHtml(emp.name)} (${escapeHtml(emp.employee_number || '')})</option>`;
                });
                html += '</optgroup>';
            });
            recipientsSelect.innerHTML = html;
        }

        // ====== 全體員工切換 ======
        function handleSendToAllToggle() {
            if (!sendToAllCheckbox || !recipientsWrapper) return;

            const isAll = sendToAllCheckbox.checked;
            if (recipientsSelect) {
                recipientsSelect.disabled = isAll;
                if (isAll) {
                    // 選中所有選項
                    Array.from(recipientsSelect.options).forEach(opt => opt.selected = true);
                }
            }
            recipientsWrapper.style.opacity = isAll ? '0.5' : '1';
        }

        // ====== 切換側欄頁籤 ======
        function switchFolder(folder) {
            currentFolder = folder;
            currentPage = 1;

            // 更新頁籤按鈕樣式
            if (tabNav) {
                tabNav.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tabValue === folder);
                });
            }

            // 僅收件匣顯示未讀篩選
            if (unreadFilterLabel) {
                unreadFilterLabel.style.display = folder === 'inbox' ? '' : 'none';
                if (folder !== 'inbox' && unreadOnlyCheckbox) {
                    unreadOnlyCheckbox.checked = false;
                }
            }

            loadMessages();
        }

        // ====== 載入留言列表 ======
        async function loadMessages() {
            if (!tableBody) return;

            try {
                tableBody.innerHTML = '<tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> 載入中...</td></tr>';

                const params = new URLSearchParams({
                    folder: currentFolder,
                    page: currentPage,
                    perPage: perPage
                });

                if (searchInput?.value) {
                    params.append('search', searchInput.value);
                }
                if (unreadOnlyCheckbox?.checked && currentFolder === 'inbox') {
                    params.append('unread_only', '1');
                }

                const response = await fetch(`api/messages/?${params}`, {
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('載入失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                messages = result.data || [];
                renderMessages();
                renderPagination(result.pagination);
                updateUnreadBadge();

            } catch (error) {
                console.error('載入留言失敗:', error);
                tableBody.innerHTML = `<tr><td colspan="6" class="error-cell">載入失敗: ${escapeHtml(error.message)}</td></tr>`;
            }
        }

        // ====== 渲染表格 ======
        function renderMessages() {
            if (!tableBody) return;

            // 更新欄位標籤（收件匣顯示寄件人，寄件匣顯示收件人）
            const userColumnHeader = moduleRoot.querySelector('[data-messages-table] thead th[data-column="sender_name"]');
            if (userColumnHeader) {
                userColumnHeader.textContent = currentFolder === 'inbox' ? '寄件人' : '收件人';
            }

            if (messages.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell"><i class="fas fa-envelope-open"></i> 目前沒有留言</td></tr>';
                return;
            }

            tableBody.innerHTML = messages.map(m => {
                const isUnread = currentFolder === 'inbox' && !m.is_read;
                const rowClass = isUnread ? 'unread-row' : '';

                // 收件匣顯示寄件人，寄件匣顯示收件人
                let displayUser = '';
                if (currentFolder === 'inbox') {
                    displayUser = escapeHtml(m.sender_name || '未知');
                    // 標記全體員工發送
                    if (m.send_to_all) {
                        displayUser += ' <span class="badge-sm info">全體</span>';
                    }
                } else {
                    if (m.send_to_all) {
                        displayUser = '<span class="badge-sm info">全體員工</span>';
                    } else if (m.recipients && m.recipients.length > 0) {
                        const names = m.recipients.map(r => escapeHtml(r.name)).slice(0, 2).join(', ');
                        displayUser = m.recipients.length > 2 ? names + '...' : names;
                    } else {
                        displayUser = '未知';
                    }
                }

                const statusIcon = isUnread
                    ? '<span class="status-badge unread" title="未讀"><i class="fas fa-circle"></i></span>'
                    : '<span class="status-badge read" title="已讀"><i class="fas fa-check"></i></span>';

                // 附件圖示
                const attachmentIcon = (m.attachment_count && m.attachment_count > 0)
                    ? `<span class="attachment-indicator" title="${m.attachment_count} 個附件"><i class="fas fa-paperclip"></i></span>`
                    : '';

                return `
                    <tr class="${rowClass}" data-id="${m.id}">
                        <td class="checkbox-col">
                            <input type="checkbox" data-row-checkbox value="${m.id}">
                        </td>
                        <td class="status-col">${statusIcon}</td>
                        <td class="user-col">${displayUser}</td>
                        <td class="subject-col">
                            <a href="#" class="subject-link" data-action="view" data-id="${m.id}">
                                ${escapeHtml(m.subject)}
                            </a>
                        </td>
                        <td class="attachment-col">${attachmentIcon}</td>
                        <td class="time-col">${formatDateTime(m.created_at)}</td>
                        <td class="actions-col">
                            <button type="button" class="btn text" data-action="view" data-id="${m.id}" title="檢視">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${currentFolder === 'inbox' ? `
                                <button type="button" class="btn text op-action-btn op-role-reply" data-action="reply" data-id="${m.id}" title="回覆" aria-label="回覆">
                                    <i class="fas fa-reply"></i>
                                </button>
                            ` : ''}
                            ${currentFolder === 'drafts' ? `
                                <button type="button" class="btn text" data-action="edit-draft" data-id="${m.id}" title="編輯">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
                            <button type="button" class="btn text danger" data-action="delete" data-id="${m.id}" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
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

        // ====== 更新未讀 Badge ======
        async function updateUnreadBadge() {
            try {
                const response = await fetch('api/messages/unread_count.php', {
                    credentials: 'include'
                });
                if (!response.ok) return;
                const result = await response.json();
                if (result.success) {
                    const count = result.data?.unread_count || 0;
                    // 更新頁面上的 badge（如果有）
                    const badges = document.querySelectorAll('.message-badge');
                    badges.forEach(badge => {
                        badge.textContent = count;
                        badge.style.display = count > 0 ? '' : 'none';
                    });
                }
            } catch (error) {
                console.warn('更新未讀數失敗:', error);
            }
        }

        // 判斷是否為圖片檔案
        function isImageFile(fileName) {
            const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
            return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
        }

        // 開啟圖片燈箱預覽
        function openImageLightbox(src, fileName) {
            const overlay = document.createElement('div');
            overlay.className = 'image-lightbox-overlay';
            overlay.innerHTML = `
                <button class="image-lightbox-close" title="關閉">&times;</button>
                <img src="${src}" alt="${escapeHtml(fileName)}" />
            `;
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay || e.target.classList.contains('image-lightbox-close')) {
                    overlay.remove();
                }
            });
            document.addEventListener('keydown', function handler(e) {
                if (e.key === 'Escape' && document.contains(overlay)) {
                    overlay.remove();
                    document.removeEventListener('keydown', handler);
                }
            });
            document.body.appendChild(overlay);
        }

        // ====== 檢視留言詳情 ======
        async function viewMessage(id) {
            if (!detailModal || !detailContent) return;

            try {
                const response = await fetch(`api/messages/show.php?id=${id}`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('載入失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                const m = result.data;
                currentViewingMessageId = id;

                // 寄件人/收件人資訊
                let recipientInfo = '';
                if (currentFolder === 'inbox') {
                    recipientInfo = `<strong>寄件人：</strong>${escapeHtml(m.sender_name || '未知')}`;
                    if (m.send_to_all) {
                        recipientInfo += ' <span class="badge-sm info">發送給全體員工</span>';
                    }
                } else {
                    if (m.send_to_all) {
                        recipientInfo = '<strong>收件人：</strong><span class="badge-sm info">全體員工</span>';
                    } else {
                        recipientInfo = `<strong>收件人：</strong>${m.recipients?.map(r => escapeHtml(r.name)).join(', ') || '未知'}`;
                    }
                }

                // 附件列表
                let attachmentsHtml = '';
                if (m.attachments && m.attachments.length > 0) {
                    const imageAttachments = m.attachments.filter(att => isImageFile(att.file_name));
                    const otherAttachments = m.attachments.filter(att => !isImageFile(att.file_name));

                    // 圖片預覽區
                    let imagePreviewHtml = '';
                    if (imageAttachments.length > 0) {
                        imagePreviewHtml = `
                            <div class="attachment-image-preview">
                                ${imageAttachments.map(att => `
                                    <img class="preview-thumb"
                                        src="api/messages/download_attachment.php?id=${att.id}&inline=1"
                                        alt="${escapeHtml(att.file_name)}"
                                        data-attachment-id="${att.id}"
                                        data-file-name="${escapeHtml(att.file_name)}"
                                        title="點擊預覽 ${escapeHtml(att.file_name)}" />
                                `).join('')}
                            </div>
                        `;
                    }

                    // 檔案列表
                    let fileListHtml = '';
                    if (otherAttachments.length > 0) {
                        fileListHtml = `
                            <ul class="attachment-list">
                                ${otherAttachments.map(att => `
                                    <li>
                                        <a href="api/messages/download_attachment.php?id=${att.id}" target="_blank" class="attachment-link">
                                            <i class="${getFileIcon(att.file_name)}"></i>
                                            ${escapeHtml(att.file_name)}
                                            <span class="file-size">(${formatFileSize(att.file_size)})</span>
                                        </a>
                                    </li>
                                `).join('')}
                            </ul>
                        `;
                    }

                    // 圖片也提供下載連結
                    let imageLinksHtml = '';
                    if (imageAttachments.length > 0) {
                        imageLinksHtml = `
                            <ul class="attachment-list">
                                ${imageAttachments.map(att => `
                                    <li>
                                        <a href="api/messages/download_attachment.php?id=${att.id}" target="_blank" class="attachment-link">
                                            <i class="${getFileIcon(att.file_name)}"></i>
                                            ${escapeHtml(att.file_name)}
                                            <span class="file-size">(${formatFileSize(att.file_size)})</span>
                                            <span class="attachment-actions">
                                                <button type="button" data-preview-attachment="${att.id}" data-file-name="${escapeHtml(att.file_name)}" title="預覽"><i class="fas fa-eye"></i></button>
                                            </span>
                                        </a>
                                    </li>
                                `).join('')}
                            </ul>
                        `;
                    }

                    attachmentsHtml = `
                        <div class="message-attachments">
                            <strong><i class="fas fa-paperclip"></i> 附件 (${m.attachments.length})</strong>
                            ${imagePreviewHtml}
                            ${imageLinksHtml}
                            ${fileListHtml}
                        </div>
                    `;
                }

                detailContent.innerHTML = `
                    <div class="message-detail-header">
                        <h4 class="message-subject">${escapeHtml(m.subject)}</h4>
                        <div class="message-meta">
                            <span>${recipientInfo}</span>
                            <span><strong>時間：</strong>${formatDateTime(m.created_at)}</span>
                        </div>
                    </div>
                    <div class="message-detail-body">
                        ${escapeHtml(m.content || '').replace(/\n/g, '<br>')}
                    </div>
                    ${attachmentsHtml}
                    ${m.reply_to_id ? `
                        <div class="message-reply-info">
                            <i class="fas fa-reply"></i> 此為回覆留言
                        </div>
                    ` : ''}
                `;

                // 更新回覆按鈕狀態
                if (replyButton) {
                    replyButton.dataset.replyId = id;
                    replyButton.dataset.senderId = m.sender_id;
                    replyButton.dataset.subject = m.subject;
                    replyButton.style.display = currentFolder === 'inbox' ? '' : 'none';
                }

                // 顯示 Modal
                detailModal.classList.remove('hidden');

                // 即時更新本地已讀狀態（show.php 已在伺服器端標記已讀）
                if (currentFolder === 'inbox') {
                    const localMsg = messages.find(msg => msg.id == id);
                    if (localMsg && !localMsg.is_read) {
                        localMsg.is_read = true;
                        renderMessages();
                        // 立即更新未讀 badge
                        const badges = document.querySelectorAll('.message-badge');
                        badges.forEach(badge => {
                            const count = Math.max(0, (parseInt(badge.textContent) || 0) - 1);
                            badge.textContent = count;
                            badge.style.display = count > 0 ? '' : 'none';
                        });
                        updateUnreadBadge();
                        if (dataSyncHelper) {
                            dataSyncHelper.notifyUpdated({ id, action: 'mark_read' });
                        }
                    }
                }

            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // 根據檔案名稱取得對應圖示
        function getFileIcon(fileName) {
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const iconMap = {
                'pdf': 'fas fa-file-pdf',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'xls': 'fas fa-file-excel',
                'xlsx': 'fas fa-file-excel',
                'ppt': 'fas fa-file-powerpoint',
                'pptx': 'fas fa-file-powerpoint',
                'jpg': 'fas fa-file-image',
                'jpeg': 'fas fa-file-image',
                'png': 'fas fa-file-image',
                'gif': 'fas fa-file-image',
                'zip': 'fas fa-file-archive',
                'rar': 'fas fa-file-archive',
                '7z': 'fas fa-file-archive',
                'txt': 'fas fa-file-alt',
                'csv': 'fas fa-file-csv'
            };
            return iconMap[ext] || 'fas fa-file';
        }

        // 格式化檔案大小
        function formatFileSize(bytes) {
            if (!bytes) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            while (bytes >= 1024 && i < units.length - 1) {
                bytes /= 1024;
                i++;
            }
            return bytes.toFixed(1) + ' ' + units[i];
        }

        // ====== 標記已讀 ======
        async function markAsRead(id) {
            try {
                // 樂觀更新：先即時更新本地狀態和 UI，不等待 API 回應
                const msg = messages.find(m => m.id == id);
                if (msg && !msg.is_read) {
                    msg.is_read = true;
                    renderMessages();
                    // 樂觀更新未讀 badge（立即 -1）
                    const badges = document.querySelectorAll('.message-badge');
                    badges.forEach(badge => {
                        const count = Math.max(0, (parseInt(badge.textContent) || 0) - 1);
                        badge.textContent = count;
                        badge.style.display = count > 0 ? '' : 'none';
                    });
                }

                await fetch('api/messages/mark_read.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id })
                });

                // API 完成後同步確認正確數量
                updateUnreadBadge();
                if (dataSyncHelper) {
                    dataSyncHelper.notifyUpdated({ id, action: 'mark_read' });
                }
            } catch (error) {
                console.warn('標記已讀失敗:', error);
            }
        }

        // ====== 全部標記已讀 ======
        async function markAllAsRead() {
            try {
                const response = await fetch('api/messages/mark_read.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ all: true })
                });
                if (!response.ok) throw new Error('操作失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                showAlert('success', `已標記 ${result.marked_count || '所有'} 則留言為已讀`);
                if (dataSyncHelper) {
                    dataSyncHelper.notifyBulkUpdated({ action: 'mark_all_read' });
                }
                loadMessages();
            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // ====== 表單髒值追蹤 ======
        function getFormSnapshot() {
            if (!form) return {};
            return {
                subject: form.elements.subject?.value?.trim() || '',
                content: getEditorContent() || '',
                send_to_all: sendToAllCheckbox?.checked ? '1' : '0',
                recipients: recipientsSelect ? Array.from(recipientsSelect.selectedOptions).map(o => o.value).join(',') : '',
                draft_id: form.querySelector('[name="draft_id"]')?.value || '',
                attachments_count: String(pendingAttachments.length),
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

        // ====== 發送/回覆留言 ======
        function openComposeModal(options = {}) {
            if (!formModal || !form) return;

            hideModalAlert();
            form.reset();
            pendingAttachments = [];
            existingAttachments = [];
            deleteAttachmentIds = [];
            renderAttachmentPreview();

            // 重置全體員工選項
            if (sendToAllCheckbox) {
                sendToAllCheckbox.checked = false;
                handleSendToAllToggle();
            }

            // 設定隱藏欄位
            const replyToIdField = form.querySelector('[name="reply_to_id"]');
            if (replyToIdField) {
                replyToIdField.value = options.replyToId || '';
            }

            if (modalTitle) {
                modalTitle.textContent = options.replyToId ? '回覆留言' : '發送留言';
            }

            // 如果是回覆，預設選中寄件人
            if (options.senderId && recipientsSelect) {
                // 先清除所有選取
                Array.from(recipientsSelect.options).forEach(opt => opt.selected = false);
                const option = recipientsSelect.querySelector(`option[value="${options.senderId}"]`);
                if (option) option.selected = true;
            }

            // 如果是回覆，預設主旨
            if (options.subject && form.elements.subject) {
                const prefix = options.subject.startsWith('Re: ') ? '' : 'Re: ';
                form.elements.subject.value = prefix + options.subject;
            }

            // 初始化富文本編輯器
            initRichTextEditor();
            // 清空編輯器殘留內容
            setEditorContent('');

            // 清除可能殘留的草稿 ID
            const existingDraftField = form.querySelector('[name="draft_id"]');
            if (existingDraftField) existingDraftField.value = '';

            formModal.classList.remove('hidden');
            setFormSnapshot();
        }

        // ====== 開啟草稿編輯 Modal ======
        async function openEditDraftModal(id) {
            if (!formModal || !form) return;

            try {
                const response = await fetch(`api/messages/show.php?id=${id}`, {
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('載入失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                const m = result.data;

                hideModalAlert();
                form.reset();
                pendingAttachments = [];
                existingAttachments = [];
                deleteAttachmentIds = [];

                // 載入已存在的附件
                if (m.attachments && m.attachments.length > 0) {
                    existingAttachments = m.attachments.map(att => ({
                        id: att.id,
                        file_name: att.file_name,
                        file_size: att.file_size,
                        mime_type: att.mime_type
                    }));
                }
                renderAttachmentPreview();

                // 重置全體員工選項
                if (sendToAllCheckbox) {
                    sendToAllCheckbox.checked = m.send_to_all || false;
                    handleSendToAllToggle();
                }

                // 設定隱藏欄位
                const replyToIdField = form.querySelector('[name="reply_to_id"]');
                if (replyToIdField) {
                    replyToIdField.value = m.reply_to_id || '';
                }

                // 設定草稿 ID（新增 hidden field 或使用已有的）
                let draftIdField = form.querySelector('[name="draft_id"]');
                if (!draftIdField) {
                    draftIdField = document.createElement('input');
                    draftIdField.type = 'hidden';
                    draftIdField.name = 'draft_id';
                    form.prepend(draftIdField);
                }
                draftIdField.value = m.id;

                // 填入表單資料
                if (form.elements.subject) {
                    form.elements.subject.value = m.subject || '';
                }

                if (modalTitle) {
                    modalTitle.textContent = '編輯草稿';
                }

                // 選擇收件人
                if (recipientsSelect && m.recipients && m.recipients.length > 0) {
                    Array.from(recipientsSelect.options).forEach(opt => {
                        opt.selected = m.recipients.some(r => r.id == opt.value);
                    });
                }

                // 初始化富文本編輯器並設定內容
                initRichTextEditor();
                setEditorContent(m.content || '');

                formModal.classList.remove('hidden');
                setFormSnapshot();

            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // 初始化簡易富文本編輯器
        function initRichTextEditor() {
            // 找到富文本編輯器容器（可能是 .rich-editor-container 或直接用 data 屬性）
            let editorContainer = moduleRoot.querySelector('[data-message-content-editor]');
            if (!editorContainer) return;

            // 如果是 label 內的容器，取得實際的 container
            if (editorContainer.classList.contains('rich-editor-container')) {
                // 已經是正確的容器
            } else {
                // 可能需要找子元素
                const innerContainer = editorContainer.querySelector('.rich-editor-container');
                if (innerContainer) {
                    editorContainer = innerContainer;
                }
            }

            if (editorContainer.dataset.editorInit === 'true') return;
            editorContainer.dataset.editorInit = 'true';

            // 建立工具列和編輯區
            editorContainer.innerHTML = `
                <div class="rich-editor-toolbar">
                    <button type="button" data-format="bold" title="粗體"><i class="fas fa-bold"></i></button>
                    <button type="button" data-format="italic" title="斜體"><i class="fas fa-italic"></i></button>
                    <button type="button" data-format="underline" title="底線"><i class="fas fa-underline"></i></button>
                    <button type="button" data-format="strikeThrough" title="刪除線"><i class="fas fa-strikethrough"></i></button>
                    <span class="toolbar-separator"></span>
                    <button type="button" data-format="justifyLeft" title="靠左對齊"><i class="fas fa-align-left"></i></button>
                    <button type="button" data-format="justifyCenter" title="置中對齊"><i class="fas fa-align-center"></i></button>
                    <button type="button" data-format="justifyRight" title="靠右對齊"><i class="fas fa-align-right"></i></button>
                    <span class="toolbar-separator"></span>
                    <button type="button" data-format="insertUnorderedList" title="項目清單"><i class="fas fa-list-ul"></i></button>
                    <button type="button" data-format="insertOrderedList" title="編號清單"><i class="fas fa-list-ol"></i></button>
                    <span class="toolbar-separator"></span>
                    <button type="button" data-format="removeFormat" title="清除格式"><i class="fas fa-eraser"></i></button>
                    <span class="toolbar-separator"></span>
                    <select data-format="formatBlock" title="格式">
                        <option value="">格式</option>
                        <option value="p">段落</option>
                        <option value="h3">標題 3</option>
                        <option value="h4">標題 4</option>
                    </select>
                    <select data-format="foreColor" title="文字顏色">
                        <option value="">顏色</option>
                        <option value="#000000">黑色</option>
                        <option value="#e74c3c">紅色</option>
                        <option value="#3498db">藍色</option>
                        <option value="#27ae60">綠色</option>
                        <option value="#f39c12">橙色</option>
                    </select>
                </div>
                <div class="rich-editor-content" contenteditable="true" data-editor-content></div>
            `;

            const editorArea = editorContainer.querySelector('[data-editor-content]');

            // 設定預設段落分隔符為 <p>，避免 <div> 或其他問題
            document.execCommand('defaultParagraphSeparator', false, 'p');

            // 綁定工具列事件
            const toolbar = editorContainer.querySelector('.rich-editor-toolbar');

            // 更新工具列按鈕的啟用狀態
            function updateToolbarState() {
                const buttons = toolbar.querySelectorAll('button[data-format]');
                buttons.forEach(btn => {
                    const format = btn.dataset.format;
                    // 只針對 toggle 類型的格式命令檢查狀態
                    if (['bold', 'italic', 'underline', 'strikeThrough',
                         'insertUnorderedList', 'insertOrderedList',
                         'justifyLeft', 'justifyCenter', 'justifyRight'].includes(format)) {
                        try {
                            if (document.queryCommandState(format)) {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        } catch(e) {
                            // 忽略不支援的命令
                        }
                    }
                });
            }

            toolbar.addEventListener('click', function(e) {
                const btn = e.target.closest('button[data-format]');
                if (btn) {
                    e.preventDefault();
                    const format = btn.dataset.format;
                    document.execCommand(format, false, null);
                    editorArea.focus();
                    updateToolbarState();
                }
            });

            toolbar.addEventListener('change', function(e) {
                const select = e.target.closest('[data-format]');
                if (select && select.tagName === 'SELECT') {
                    const format = select.dataset.format;
                    const value = select.value;
                    if (value) {
                        if (format === 'formatBlock') {
                            document.execCommand(format, false, `<${value}>`);
                        } else {
                            document.execCommand(format, false, value);
                        }
                    }
                    select.selectedIndex = 0;
                    editorArea.focus();
                    updateToolbarState();
                }
            });

            // 監聽編輯器內容變更以追蹤表單髒值 & 更新工具列狀態
            if (editorArea) {
                editorArea.addEventListener('input', function() {
                    updateDirtyState();
                    updateToolbarState();
                });
                // 選取範圍變更時更新工具列
                editorArea.addEventListener('keyup', updateToolbarState);
                editorArea.addEventListener('mouseup', updateToolbarState);
                // 聚焦時確保不會預設粗體
                editorArea.addEventListener('focus', function() {
                    if (editorArea.innerHTML === '' || editorArea.innerHTML === '<br>') {
                        // 確保初始輸入時不帶任何格式
                        document.execCommand('removeFormat', false, null);
                    }
                    updateToolbarState();
                });
            }
        }

        // 取得編輯器內容
        function getEditorContent() {
            const editorContent = moduleRoot.querySelector('[data-editor-content]');
            return editorContent ? editorContent.innerHTML : '';
        }

        // 設定編輯器內容
        function setEditorContent(html) {
            const editorContent = moduleRoot.querySelector('[data-editor-content]');
            if (editorContent) {
                editorContent.innerHTML = html || '';
            }
        }

        // 附件處理
        function handleAttachmentChange(e) {
            const files = Array.from(e.target.files || []);
            const maxSize = 10 * 1024 * 1024; // 10MB

            files.forEach(file => {
                if (file.size > maxSize) {
                    showModalAlert('error', `檔案 "${file.name}" 超過 10MB 限制`);
                    return;
                }
                pendingAttachments.push(file);
            });

            renderAttachmentPreview();
            if (attachmentInput) attachmentInput.value = '';
            updateDirtyState();
        }

        function renderAttachmentPreview() {
            if (!attachmentPreview) return;

            const parts = [];

            // 渲染已存在的伺服器附件（編輯草稿時）
            if (existingAttachments.length > 0) {
                parts.push(existingAttachments.map(att => {
                    const isDeleted = deleteAttachmentIds.includes(att.id);
                    return `
                        <div class="existing-attachment-item${isDeleted ? ' marked-for-delete' : ''}" data-attachment-id="${att.id}">
                            <i class="${getFileIcon(att.file_name)}"></i>
                            <span class="file-name">${escapeHtml(att.file_name)}</span>
                            <span class="file-size">(${formatFileSize(att.file_size)})</span>
                            <span class="existing-badge">已上傳</span>
                            ${isDeleted
                                ? `<button type="button" class="remove-attachment" data-restore-id="${att.id}" title="復原"><i class="fas fa-undo"></i></button>`
                                : `<button type="button" class="remove-attachment" data-delete-id="${att.id}" title="移除"><i class="fas fa-times"></i></button>`
                            }
                        </div>
                    `;
                }).join(''));
            }

            // 渲染待上傳的新附件
            if (pendingAttachments.length > 0) {
                parts.push(pendingAttachments.map((file, index) => `
                    <div class="attachment-preview-item">
                        <i class="${getFileIcon(file.name)}"></i>
                        <span class="file-name">${escapeHtml(file.name)}</span>
                        <span class="file-size">(${formatFileSize(file.size)})</span>
                        <button type="button" class="remove-attachment" data-index="${index}" title="移除">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join(''));
            }

            attachmentPreview.innerHTML = parts.join('');
        }

        function removeAttachment(index) {
            pendingAttachments.splice(index, 1);
            renderAttachmentPreview();
            updateDirtyState();
        }

        function markExistingAttachmentForDelete(attachmentId) {
            if (!deleteAttachmentIds.includes(attachmentId)) {
                deleteAttachmentIds.push(attachmentId);
            }
            renderAttachmentPreview();
            updateDirtyState();
        }

        function restoreExistingAttachment(attachmentId) {
            deleteAttachmentIds = deleteAttachmentIds.filter(id => id !== attachmentId);
            renderAttachmentPreview();
            updateDirtyState();
        }

        async function handleFormSubmit(e) {
            e.preventDefault();
            hideModalAlert();

            const formData = new FormData();
            const sendToAll = sendToAllCheckbox?.checked || false;

            // 檢查是否為草稿編輯模式
            const draftIdField = form.querySelector('[name="draft_id"]');
            const draftId = draftIdField?.value;
            const isEditDraft = draftId && draftId !== '';

            // 收件人處理（草稿可以沒有收件人）
            let selectedRecipients = [];
            if (sendToAll) {
                formData.append('send_to_all', '1');
                selectedRecipients = employeeList.map(emp => emp.id);
            } else {
                selectedRecipients = Array.from(recipientsSelect?.selectedOptions || []).map(opt => opt.value);
            }

            if (selectedRecipients.length === 0 && !saveAsDraft) {
                showModalAlert('error', '請選擇至少一位收件人');
                return;
            }

            // 加入收件人
            selectedRecipients.forEach(id => {
                formData.append('recipient_ids[]', id);
            });

            // 主旨和內容
            const subject = form.elements.subject?.value?.trim() || '';
            const content = getEditorContent();

            if (!subject) {
                showModalAlert('error', '請輸入主旨');
                return;
            }
            if (!content || content === '<br>' || content.replace(/<[^>]*>/g, '').trim() === '') {
                showModalAlert('error', '請輸入內容');
                return;
            }

            formData.append('subject', subject);
            formData.append('content', content);

            // 草稿/發送狀態處理
            if (isEditDraft) {
                // 編輯草稿模式：傳 status 欄位給 update.php
                formData.append('status', saveAsDraft ? 'draft' : 'sent');
            } else {
                // 新增模式：傳 save_as_draft 給 index.php POST
                if (saveAsDraft) {
                    formData.append('save_as_draft', '1');
                }
            }

            // 回覆對象
            const replyToId = form.elements.reply_to_id?.value;
            if (replyToId) {
                formData.append('reply_to_id', replyToId);
            }

            // 附件
            pendingAttachments.forEach(file => {
                formData.append('attachments[]', file);
            });

            // 要刪除的已存在附件
            if (deleteAttachmentIds.length > 0) {
                deleteAttachmentIds.forEach(id => {
                    formData.append('delete_attachment_ids[]', id);
                });
            }

            try {
                const url = isEditDraft
                    ? `api/messages/update_multipart.php?id=${draftId}`
                    : 'api/messages/';

                const response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    if (result.errors) {
                        const errorMessages = Object.values(result.errors).join('、');
                        throw new Error(errorMessages);
                    }
                    throw new Error(result.message || '操作失敗');
                }

                showAlert('success', result.message || (saveAsDraft ? '草稿已儲存' : '留言發送成功'));
                isFormDirty = false;
                closeModal(true);
                if (dataSyncHelper) {
                    if (isEditDraft) {
                        dataSyncHelper.notifyUpdated({ id: draftId });
                    } else {
                        dataSyncHelper.notifyCreated({ subject, send_to_all: sendToAll });
                    }
                }

                // 切換到適當資料夾（switchFolder 內部會呼叫 loadMessages）
                switchFolder(saveAsDraft ? 'drafts' : 'sent');
                
                // 重設狀態
                saveAsDraft = false;
                if (draftIdField) draftIdField.value = '';

            } catch (error) {
                showModalAlert('error', error.message);
                saveAsDraft = false;
            }
        }

        // ====== 刪除留言 ======
        async function deleteMessage(id) {
            if (!confirm('確定要刪除此留言嗎？')) return;

            try {
                const response = await fetch(`api/messages/delete.php?id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('刪除失敗');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                showAlert('success', '留言已刪除');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
                loadMessages();
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
            currentViewingMessageId = null;
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
                    case 'compose-message':
                        openComposeModal();
                        break;
                    case 'view':
                        e.preventDefault();
                        if (id) viewMessage(id);
                        break;
                    case 'reply':
                        if (id) {
                            const msg = messages.find(m => m.id == id);
                            openComposeModal({ replyToId: id, senderId: msg?.sender_id, subject: msg?.subject || '' });
                        }
                        break;
                    case 'delete':
                        if (id) deleteMessage(id);
                        break;
                    case 'reply-message':
                        const replyId = replyButton?.dataset.replyId;
                        const senderId = replyButton?.dataset.senderId;
                        const subject = replyButton?.dataset.subject;
                        closeDetailModal();
                        openComposeModal({ replyToId: replyId, senderId, subject });
                        break;
                    case 'edit-draft':
                        if (id) openEditDraftModal(id);
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
                        if (searchInput) searchInput.value = '';
                        if (unreadOnlyCheckbox) unreadOnlyCheckbox.checked = false;
                        switchFolder('inbox');
                        break;
                }
            });

            // 側欄頁籤點擊切換
            if (tabNav) {
                tabNav.addEventListener('click', function(e) {
                    const btn = e.target.closest('.sidebar-tab-btn');
                    if (btn) {
                        switchFolder(btn.dataset.tabValue);
                    }
                });
            }

            // 搜尋輸入 Enter 觸發
            if (searchInput) {
                searchInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        currentPage = 1;
                        loadMessages();
                    }
                });
            }

            // 未讀勾選切換
            if (unreadOnlyCheckbox) {
                unreadOnlyCheckbox.addEventListener('change', function() {
                    currentPage = 1;
                    loadMessages();
                });
            }

            // 分頁點擊
            if (paginationContainer) {
                paginationContainer.addEventListener('click', function(e) {
                    const btn = e.target.closest('[data-page]');
                    if (btn) {
                        currentPage = parseInt(btn.dataset.page);
                        loadMessages();
                    }
                });
            }

            // 表格排序
            const table = moduleRoot.querySelector('[data-messages-table]');
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
                        loadMessages();
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

            // 表單提交
            if (form) {
                form.addEventListener('submit', handleFormSubmit);
                form.addEventListener('input', updateDirtyState);
                form.addEventListener('change', updateDirtyState);
            }

            // 全體員工切換
            if (sendToAllCheckbox) {
                sendToAllCheckbox.addEventListener('change', handleSendToAllToggle);
            }

            // 附件上傳
            if (attachmentInput) {
                attachmentInput.addEventListener('change', handleAttachmentChange);
            }

            // 附件移除（支援新檔案和已存在附件）
            if (attachmentPreview) {
                attachmentPreview.addEventListener('click', function(e) {
                    const removeBtn = e.target.closest('.remove-attachment');
                    if (!removeBtn) return;

                    const index = removeBtn.dataset.index;
                    const deleteId = removeBtn.dataset.deleteId;
                    const restoreId = removeBtn.dataset.restoreId;

                    if (index !== undefined) {
                        removeAttachment(parseInt(index));
                    } else if (deleteId) {
                        markExistingAttachmentForDelete(parseInt(deleteId));
                    } else if (restoreId) {
                        restoreExistingAttachment(parseInt(restoreId));
                    }
                });
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

                    // 圖片縮圖點擊預覽
                    const thumb = e.target.closest('.preview-thumb');
                    if (thumb) {
                        e.preventDefault();
                        const attId = thumb.dataset.attachmentId;
                        const fileName = thumb.dataset.fileName;
                        openImageLightbox(`api/messages/download_attachment.php?id=${attId}&inline=1`, fileName);
                        return;
                    }

                    // 預覽按鈕點擊
                    const previewBtn = e.target.closest('[data-preview-attachment]');
                    if (previewBtn) {
                        e.preventDefault();
                        e.stopPropagation();
                        const attId = previewBtn.dataset.previewAttachment;
                        const fileName = previewBtn.dataset.fileName;
                        openImageLightbox(`api/messages/download_attachment.php?id=${attId}&inline=1`, fileName);
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
            dataSyncHelper = DataSync.createModuleHelper('messages', {
                onRefresh: loadMessages,
                onDependencyUpdate: (sourceModule) => {
                    if (sourceModule === 'employees') {
                        loadEmployees();
                    }
                    loadMessages();
                }
            });
        }
        bindEvents();
        loadEmployees();
        loadMessages();
    }

    window.initializeMessagesModule = initializeMessagesModule;
})();
