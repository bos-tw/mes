/**
 * 工單圖片模組配置
 *
 * 以配置化方式渲染頁面結構，保留原有自訂區塊。
 */
ModuleConfig.register('work_order_images', {
    id: 'work_order_images',
    dataPrefix: 'image',
    title: '工單圖片',
    subtitle: '快速檢視與搜尋工單相關圖片（圖片上傳請至「生產工單」操作）',

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    filters: [
        { name: 'keyword', type: 'text', label: '關鍵字', placeholder: '工單號碼 / 備註' },
        {
            name: 'image_type',
            type: 'select',
            label: '圖片類型',
            options: [
                { value: '', label: '全部' },
                { value: 'general', label: '一般紀錄' },
                { value: 'defect', label: '缺失/不良' },
                { value: 'setup', label: '機台設定' },
                { value: 'sample', label: '樣品/客戶提供' }
            ]
        },
        { name: 'start_date', type: 'date', label: '上傳日期(起)' },
        { name: 'end_date', type: 'date', label: '上傳日期(迄)' },
        {
            name: 'perPage',
            type: 'select',
            label: '每頁筆數',
            options: [
                { value: '10', label: '10' },
                { value: '20', label: '20', selected: true },
                { value: '50', label: '50' }
            ]
        }
    ],

    columns: [
        { key: 'work_order_number', label: '工單號碼', sortable: false, selectable: true },
        { key: 'thumbnail', label: '預覽', sortable: false, selectable: true },
        { key: 'image_type', label: '類型', sortable: false, selectable: true },
        { key: 'description', label: '說明', sortable: false, selectable: true },
        { key: 'uploaded_at', label: '上傳時間', sortable: false, selectable: true },
        { key: 'uploaded_by_name', label: '上傳人員', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    customModalHtml: `
    <!-- 圖片預覽 Modal -->
    <div class="modal-overlay hidden" data-preview-modal>
        <div class="modal-window xlarge">
            <button type="button" class="modal-close" data-action="close-preview" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3 data-preview-title>圖片預覽</h3>
            <div class="image-preview-container" style="text-align: center; padding: 20px;">
                <img src="" alt="Preview" data-preview-image style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                <p data-preview-description style="margin-top: 10px; color: #666;"></p>
            </div>
        </div>
    </div>
    `
});
