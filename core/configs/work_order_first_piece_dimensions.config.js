/**
 * 首件尺寸檢驗模組配置
 *
 * 以配置化方式渲染頁面結構，保留原有自訂區塊。
 */
ModuleConfig.register('work_order_first_piece_dimensions', {
    id: 'work_order_first_piece_dimensions',
    dataPrefix: 'first-piece',
    title: '首件尺寸檢驗',
    subtitle: '維護工單首件量測數據與檢驗資訊',

    actions: [
        { label: '新增檢驗', icon: 'fa-plus', style: 'primary', action: 'create' },
        { label: '匯出', icon: 'fa-download', style: 'outline', action: 'export' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    filters: [
        { name: 'keyword', type: 'text', label: '關鍵字', placeholder: '工單號碼 / 客戶批號 / 備註' },
        {
            name: 'work_order_id',
            type: 'select',
            label: '工單',
            dataAttr: 'data-filter-work-order',
            options: [{ value: '', label: '-- 所有工單 --' }]
        },
        {
            name: 'measured_by_employee_id',
            type: 'select',
            label: '測量人員',
            dataAttr: 'data-filter-employee',
            options: [{ value: '', label: '-- 所有人員 --' }]
        },
        { name: 'start_date', type: 'date', label: '測量日期(起)' },
        { name: 'end_date', type: 'date', label: '測量日期(迄)' },
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
        { key: 'work_order_number', label: '工單號碼', sortable: true, selectable: true },
        { key: 'customer_batch_number', label: '客戶批號', sortable: true, selectable: true },
        { key: 'measured_at', label: '測量時間', sortable: true, selectable: true },
        { key: 'measured_by_name', label: '測量人員', sortable: true, selectable: true },
        { key: 'head_height', label: '頭高', sortable: false, selectable: true },
        { key: 'head_width', label: '頭寬', sortable: false, selectable: true },
        { key: 'length', label: '長度', sortable: false, selectable: true },
        { key: 'thread_outer_diameter', label: '牙外徑', sortable: false, selectable: true },
        { key: 'notes', label: '備註', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    customModalHtml: `
    <!-- 新增/編輯 Modal -->
    <div class="modal-overlay hidden" data-first-piece-modal>
        <div class="modal-window large">
            <button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3 data-modal-title>新增首件尺寸檢驗</h3>

            <div class="modal-alert hidden" data-first-piece-modal-alert role="alert"></div>

            <form data-first-piece-form novalidate>
                <input type="hidden" name="id">

                <div class="form-section">
                    <h4><i class="fas fa-clipboard-list"></i> 基本資訊</h4>
                    <div class="form-grid form-grid-two-columns">
                        <label class="inline-label">
                            <span>工單 <abbr title="必填">*</abbr></span>
                            <select name="work_order_id" required data-modal-work-order-select>
                                <option value="">-- 請選擇工單 --</option>
                            </select>
                        </label>
                        <label class="inline-label">
                            <span>測量時間 <abbr title="必填">*</abbr></span>
                            <input type="datetime-local" name="measured_at" required autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>測量人員</span>
                            <select name="measured_by_employee_id" data-modal-employee-select>
                                <option value="">-- 請選擇 --</option>
                            </select>
                        </label>
                        <label class="inline-label full-width">
                            <span>備註</span>
                            <textarea name="notes" placeholder="備註說明" autocomplete="off" rows="2"></textarea>
                        </label>
                    </div>
                </div>

                <!-- 工單資訊顯示區 -->
                <div class="form-section work-order-info-section hidden" data-work-order-info>
                    <h4><i class="fas fa-info-circle"></i> 工單資訊</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">客戶</span>
                            <span class="info-value" data-info-customer>-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">客戶批號</span>
                            <span class="info-value" data-info-batch>-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">受篩產品</span>
                            <span class="info-value" data-info-product>-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">工單狀態</span>
                            <span class="info-value" data-info-status>-</span>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4><i class="fas fa-ruler"></i> 尺寸數據 (mm)</h4>
                    <div class="form-grid form-grid-four-columns">
                        <label class="inline-label">
                            <span>頭高</span>
                            <input type="number" step="0.0001" name="head_height" placeholder="0.0000" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>頭寬</span>
                            <input type="number" step="0.0001" name="head_width" placeholder="0.0000" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>長度</span>
                            <input type="number" step="0.0001" name="length" placeholder="0.0000" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>牙外徑</span>
                            <input type="number" step="0.0001" name="thread_outer_diameter" placeholder="0.0000" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>華司徑</span>
                            <input type="number" step="0.0001" name="washer_diameter" placeholder="0.0000" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>外徑</span>
                            <input type="number" step="0.0001" name="outer_diameter" placeholder="0.0000" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>孔徑</span>
                            <input type="number" step="0.0001" name="hole_diameter" placeholder="0.0000" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>厚度</span>
                            <input type="number" step="0.0001" name="thickness" placeholder="0.0000" autocomplete="off">
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn outline" data-action="cancel">取消</button>
                    <button type="submit" class="btn primary">儲存</button>
                </div>
            </form>
        </div>
    </div>

    <!-- 檢視詳情 Modal -->
    <div class="modal-overlay hidden" data-first-piece-detail-modal>
        <div class="modal-window medium">
            <button type="button" class="modal-close" data-action="close-detail-modal" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3><i class="fas fa-ruler-combined"></i> 首件尺寸檢驗詳情</h3>
            <div class="modal-body" data-first-piece-detail-content>
                <!-- 詳情內容 -->
            </div>
            <div class="form-actions">
                <button type="button" class="btn outline" data-action="close-detail-modal">關閉</button>
                <button type="button" class="btn primary" data-action="edit-from-detail">
                    <i class="fas fa-edit"></i> 編輯
                </button>
            </div>
        </div>
    </div>
    `
});
