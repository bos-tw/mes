/**
 * 我的留言模組配置
 * 
 * 重新設計為統一表格式 UI，支援全體員工發送、附件上傳、簡易文字編輯器
 */
ModuleConfig.register('messages', {
    id: 'messages',
    title: '我的留言',
    subtitle: '收發留言與訊息管理',

    // 標題區按鈕
    actions: [
        { label: '全標已讀', icon: 'fa-check-double', style: 'outline', action: 'mark-all-read' },
        { label: '發送留言', icon: 'fa-paper-plane', style: 'primary', action: 'compose-message' }
    ],

    // 側欄頁籤佈局
    sidebarTabs: {
        defaultValue: 'inbox',
        items: [
            { value: 'inbox', label: '收件匣', icon: 'fa-inbox' },
            { value: 'sent', label: '寄件匣', icon: 'fa-paper-plane' },
            { value: 'drafts', label: '草稿匣', icon: 'fa-file-alt' },
            { value: 'trash', label: '垃圾桶', icon: 'fa-trash-alt' }
        ],
        searchField: {
            name: 'search',
            placeholder: '搜尋主旨或內容...'
        },
        extraFilters: [
            {
                name: 'unread_only',
                type: 'checkbox',
                label: '僅顯示未讀',
                dataAttr: 'data-messages-unread-filter'
            }
        ]
    },

    // 表格欄位
    columns: [
        { key: 'checkbox', label: '', isCheckbox: true, width: '40px' },
        { key: 'is_read', label: '狀態', width: '60px', sortable: false },
        { key: 'sender_name', label: '寄件人', sortable: true },
        { key: 'subject', label: '主旨', sortable: true },
        { key: 'has_attachment', label: '', width: '40px', sortable: false },
        { key: 'created_at', label: '時間', sortable: true, width: '150px' },
        { key: 'actions', label: '操作', width: '120px', sortable: false }
    ],

    // 表格設定
    rowActions: true,
    hasCheckboxColumn: true,

    // 詳情 Modal
    detailModal: {
        title: '留言詳情',
        size: 'large',
        contentDataAttr: 'data-messages-detail-content',
        buttons: [
            { label: '關閉', style: 'outline', action: 'close-detail-modal' },
            { label: '回覆', icon: 'fa-reply', style: 'primary', action: 'reply-message', dataAttr: 'data-reply-btn' }
        ]
    },

    // 發送留言 Modal - 使用簡易文字編輯器
    modal: {
        createTitle: '發送留言',
        editTitle: '回覆留言',
        size: 'large',
        sections: [
            {
                title: '收件人',
                fields: [
                    {
                        name: 'send_to_all',
                        type: 'checkbox',
                        checkboxLabel: '發送給全體員工',
                        fullWidth: true,
                        dataAttr: 'data-send-to-all-checkbox'
                    },
                    {
                        name: 'recipient_ids',
                        label: '選擇收件人',
                        type: 'select',
                        required: true,
                        multiple: true,
                        fullWidth: true,
                        dataAttr: 'data-recipients-select',
                        helpText: '按住 Ctrl 可多選，或勾選上方「發送給全體員工」',
                        attributes: { style: 'height: 120px;' },
                        containerDataAttr: 'data-recipients-wrapper'
                    }
                ]
            },
            {
                title: '留言內容',
                fields: [
                    {
                        name: 'subject',
                        label: '主旨',
                        type: 'text',
                        required: true,
                        fullWidth: true,
                        maxlength: 200,
                        placeholder: '請輸入主旨'
                    },
                    {
                        name: 'content',
                        label: '內容',
                        type: 'richtext',
                        required: true,
                        fullWidth: true,
                        dataAttr: 'data-message-content-editor'
                    }
                ]
            },
            {
                title: '附件',
                fields: [
                    {
                        name: 'attachments',
                        label: '上傳附件',
                        type: 'file',
                        multiple: true,
                        fullWidth: true,
                        accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar',
                        helpText: '支援 PDF、Word、Excel、圖片、壓縮檔，每個檔案最大 10MB',
                        dataAttr: 'data-attachment-input'
                    },
                    {
                        name: 'attachment_list',
                        type: 'custom',
                        fullWidth: true,
                        customHtml: '<div class="attachment-preview-list" data-attachment-preview></div>'
                    }
                ]
            }
        ],
        hiddenFields: ['reply_to_id'],
        // 表單按鈕
        formActions: [
            { label: '取消', icon: '', style: 'outline', action: 'cancel' },
            { label: '存草稿', icon: 'fa-save', style: 'outline', action: 'save-draft' },
            { label: '發送', icon: '', style: 'primary', type: 'submit', action: 'save' }
        ]
    }
});
