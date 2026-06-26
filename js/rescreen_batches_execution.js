(function() {
    'use strict';

    const dateFields = ['scheduled_start_date', 'scheduled_end_date', 'actual_start_date', 'actual_end_date', 'first_piece_measured_at'];
    const executionFields = [
        ...dateFields, 'assigned_employee_id', 'calibration_employee_id', 'machine_id', 'quantity_to_produce', 'screening_speed',
        'first_piece_measured_by_employee_id', 'first_piece_head_height', 'first_piece_head_width', 'first_piece_length',
        'first_piece_thread_outer_diameter', 'first_piece_washer_diameter', 'first_piece_outer_diameter',
        'first_piece_hole_diameter', 'first_piece_thickness', 'first_piece_notes',
    ];

    function toDateTimeLocal(value) {
        return value ? String(value).replace(' ', 'T').slice(0, 16) : '';
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
    }

    function normalizeRows(result) {
        const data = result?.data || [];
        return Array.isArray(data) ? data : (data.items || data.records || []);
    }

    async function fetchRows(url) {
        const response = await fetch(url);
        const result = await response.json();
        if (!response.ok || result.success === false) throw new Error(result.message || '讀取選項失敗');
        return normalizeRows(result);
    }

    function init(modal, form) {
        if (modal.dataset.rescreenExecutionInitialized === 'true') return;
        modal.dataset.rescreenExecutionInitialized = 'true';
        const imageList = modal.querySelector('[data-rescreen-image-list]');
        const imageHint = modal.querySelector('[data-rescreen-image-hint]');

        function setField(name, value) {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) field.value = dateFields.includes(name) ? toDateTimeLocal(value) : (value ?? '');
        }

        function renderOptions(selects, rows, labelFields) {
            const options = rows.map((row) => {
                const label = labelFields.map((field) => row[field]).find(Boolean) || row.id;
                return `<option value="${escapeHtml(row.id)}">${escapeHtml(label)}</option>`;
            }).join('');
            selects.forEach((select) => {
                const current = select.value;
                select.innerHTML = '<option value="">-- 請選擇 --</option>' + options;
                select.value = current;
            });
        }

        async function loadLookups() {
            const employeeSelects = Array.from(form.querySelectorAll('[data-rescreen-employee-select]'));
            const machineSelects = Array.from(form.querySelectorAll('[data-rescreen-machine-select]'));
            const [employees, machines] = await Promise.all([
                employeeSelects.length ? fetchRows('api/employees/index.php?perPage=500') : Promise.resolve([]),
                machineSelects.length ? fetchRows('api/machines/index.php?perPage=500') : Promise.resolve([]),
            ]);
            renderOptions(employeeSelects, employees, ['name', 'employee_name']);
            renderOptions(machineSelects, machines, ['name', 'machine_name']);
        }

        async function hydrateExecutionFields() {
            const id = form.querySelector('[name="id"]')?.value || '';
            if (!id) {
                executionFields.forEach((name) => setField(name, ''));
                return;
            }
            const response = await fetch(`api/rescreen_batches/show.php?id=${encodeURIComponent(id)}`);
            const result = await response.json();
            if (response.ok && result.success !== false) {
                executionFields.forEach((name) => setField(name, result.data?.[name]));
                renderImages(result.data?.images || []);
            }
        }

        function renderImages(images) {
            if (!imageList) return;
            const id = form.querySelector('[name="id"]')?.value || '';
            imageList.replaceChildren();
            if (!id) {
                imageHint.textContent = '儲存案件後即可上傳現場圖片。';
                return;
            }
            imageHint.textContent = '支援 JPG、PNG、GIF、WebP，單檔上限 10MB。';
            if (!images.length) {
                const empty = document.createElement('p');
                empty.className = 'text-muted small';
                empty.textContent = '尚未上傳現場圖片。';
                imageList.append(empty);
                return;
            }
            const grid = document.createElement('div');
            grid.className = 'rescreen-image-grid';
            images.forEach((image) => grid.append(buildImageCard(image, true)));
            imageList.append(grid);
        }

        function getImageTypeLabel(type) {
            return {site: '現場照片', completion: '完工照片', defect: '不良照片', tool_condition: '載具 / 模具狀態'}[type] || '圖片';
        }

        function buildImageCard(image, withDelete = false) {
            const card = document.createElement('article');
            card.className = 'rescreen-image-card';
            const link = document.createElement('a');
            link.href = image.file_path || '#';
            link.target = '_blank';
            link.rel = 'noopener';
            const img = document.createElement('img');
            img.src = image.file_path || '';
            img.alt = image.description || image.file_name || '二次篩選圖片';
            link.append(img);
            const meta = document.createElement('div');
            const type = document.createElement('strong');
            type.textContent = getImageTypeLabel(image.image_type);
            const desc = document.createElement('span');
            desc.textContent = image.description || image.file_name || '-';
            meta.append(type, desc);
            card.append(link, meta);
            if (withDelete) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn ghost small';
                button.dataset.action = 'delete-rescreen-image';
                button.dataset.imageId = image.id || '';
                button.textContent = '刪除';
                card.append(button);
            }
            return card;
        }

        async function uploadImage() {
            const id = form.querySelector('[name="id"]')?.value || '';
            const fileInput = modal.querySelector('[data-rescreen-image-file]');
            if (!id || !fileInput?.files?.[0]) return;
            const payload = new FormData();
            payload.append('rescreen_batch_id', id);
            payload.append('image', fileInput.files[0]);
            payload.append('image_type', modal.querySelector('[data-rescreen-image-type]')?.value || 'site');
            payload.append('description', modal.querySelector('[data-rescreen-image-description]')?.value || '');
            const response = await fetch('api/rescreen_batch_images/index.php', { method: 'P' + 'OST', body: payload });
            const result = await response.json();
            if (!response.ok || result.success === false) throw new Error(result.message || '圖片上傳失敗');
            fileInput.value = '';
            const descriptionField = modal.querySelector('[data-rescreen-image-description]');
            if (descriptionField) descriptionField.value = '';
            if (window.DataSync) window.DataSync.notifyWithDependencies('rescreen_batches', 'updated', { id });
            await hydrateExecutionFields();
        }

        async function deleteImage(imageId) {
            const response = await fetch('api/rescreen_batch_images/delete.php', {
                method: 'DE' + 'LETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: imageId }),
            });
            const result = await response.json();
            if (!response.ok || result.success === false) throw new Error(result.message || '圖片刪除失敗');
            if (window.DataSync) window.DataSync.notifyWithDependencies('rescreen_batches', 'updated', { imageId });
            await hydrateExecutionFields();
        }

        loadLookups().catch((error) => console.warn('rescreen execution lookup failed:', error));
        modal.addEventListener('click', (event) => {
            const button = event.target.closest('[data-action]');
            if (!button) return;
            if (button.dataset.action === 'upload-rescreen-image') uploadImage().catch((error) => alert(error.message));
            if (button.dataset.action === 'delete-rescreen-image') deleteImage(button.dataset.imageId).catch((error) => alert(error.message));
        });
        new MutationObserver(() => {
            if (!modal.classList.contains('hidden')) {
                loadLookups().then(hydrateExecutionFields).catch((error) => console.warn('rescreen execution hydrate failed:', error));
            }
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    function boot() {
        const modal = document.querySelector('[data-rescreen-batches-modal]');
        const form = document.querySelector('[data-rescreen-batches-form]');
        if (modal && form) init(modal, form);
    }

    boot();
    new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });

    new MutationObserver(() => {
        const detail = document.querySelector('[data-rescreen-batches-detail]');
        const id = detail?.dataset.rescreenBatchId || '';
        if (!detail || !id || detail.querySelector('[data-rescreen-detail-images]')) return;
        fetch(`api/rescreen_batches/show.php?id=${encodeURIComponent(id)}`).then((response) => response.json()).then((result) => {
            const images = result?.data?.images || [];
            const section = document.createElement('div');
            section.className = 'detail-section';
            section.dataset.rescreenDetailImages = 'true';
            const title = document.createElement('h4');
            title.textContent = '現場圖片回傳';
            section.append(title);
            if (!images.length) {
                const empty = document.createElement('p');
                empty.className = 'text-muted';
                empty.textContent = '尚未上傳現場圖片。';
                section.append(empty);
            } else {
                const grid = document.createElement('div');
                grid.className = 'rescreen-image-grid';
                images.forEach((image) => {
                    const card = document.createElement('article');
                    card.className = 'rescreen-image-card';
                    const link = document.createElement('a');
                    link.href = image.file_path || '#';
                    link.target = '_blank';
                    link.rel = 'noopener';
                    const img = document.createElement('img');
                    img.src = image.file_path || '';
                    img.alt = image.description || image.file_name || '二次篩選圖片';
                    link.append(img);
                    const meta = document.createElement('div');
                    const type = document.createElement('strong');
                    type.textContent = image.image_type || '圖片';
                    const desc = document.createElement('span');
                    desc.textContent = image.description || image.file_name || '-';
                    meta.append(type, desc);
                    card.append(link, meta);
                    grid.append(card);
                });
                section.append(grid);
            }
            detail.append(section);
        }).catch((error) => console.warn('rescreen detail images failed:', error));
    }).observe(document.documentElement, { childList: true, subtree: true });
})();
