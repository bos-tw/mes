/**
 * 公告通知中心模組配置
 * 
 * 重新設計為統一表格式 UI
 */
ModuleConfig.register('notifications', {
    id: 'notifications',
    title: '公告通知中心',
    subtitle: '系統通知與公告管理',

    // 標題區按鈕
    actions: [
        { label: '全標已讀', icon: 'fa-check-double', style: 'outline', action: 'mark-all-read' },
        { label: '發佈公告', icon: 'fa-bullhorn', style: 'primary', action: 'create' }
    ],

    // 側欄頁籤佈局
    sidebarTabs: {
        defaultValue: 'inbox',
        items: [
            { value: 'inbox', label: '收到的通知', icon: 'fa-inbox' },
            { value: 'sent', label: '我發布的', icon: 'fa-bullhorn' },
            { value: 'drafts', label: '草稿匣', icon: 'fa-file-alt' },
            { value: 'history', label: '歷史紀錄', icon: 'fa-history' }
        ],
        searchField: null,
        extraFilters: [
            {
                name: 'notification_type',
                type: 'select',
                label: '類型',
                options: [
                    { value: '', label: '全部類型' },
                    { value: 'announcement', label: '公告' },
                    { value: 'system_alert', label: '系統通知' }
                ]
            },
            {
                name: 'unread_only',
                type: 'checkbox',
                label: '僅顯示未讀',
                dataAttr: 'data-notifications-unread-filter'
            }
        ]
    },

    // 表格欄位
    columns: [
        { key: 'checkbox', label: '', isCheckbox: true, width: '40px' },
        { key: 'is_read', label: '狀態', width: '60px', sortable: false },
        { key: 'notification_type', label: '類型', width: '100px', sortable: true },
        { key: 'title', label: '標題', sortable: true },
        { key: 'priority', label: '優先級', width: '80px', sortable: true },
        { key: 'created_by_name', label: '發佈者', width: '120px', sortable: true },
        { key: 'created_at', label: '時間', sortable: true, width: '150px' },
        { key: 'actions', label: '操作', width: '150px', sortable: false }
    ],

    // 表格設定
    rowActions: true,
    hasCheckboxColumn: true,

    // 詳情 Modal
    detailModal: {
        title: '通知詳情',
        size: 'large',
        contentDataAttr: 'data-notifications-detail-content'
    },

    // 新增/編輯 Modal
    modal: {
        createTitle: '發佈公告',
        editTitle: '編輯公告',
        size: 'large',
        formRows: [
            {
                sections: [
                    {
                        title: '公告設定',
                        fields: [
                            {
                                name: 'title',
                                label: '標題',
                                type: 'text',
                                required: true,
                                maxlength: 200,
                                placeholder: '請輸入公告標題'
                            },
                            {
                                name: 'priority',
                                label: '優先級',
                                type: 'select',
                                options: [
                                    { value: 'low', label: '低' },
                                    { value: 'normal', label: '一般', selected: true },
                                    { value: 'high', label: '高' },
                                    { value: 'urgent', label: '緊急' }
                                ]
                            },
                            {
                                name: 'expires_at',
                                label: '過期時間',
                                type: 'datetime-local'
                            }
                        ]
                    },
                    {
                        title: '發佈對象',
                        fields: [
                            {
                                name: 'target_type',
                                label: '對象類型',
                                type: 'select',
                                options: [
                                    { value: 'all', label: '全體人員' },
                                    { value: 'department', label: '特定部門' },
                                    { value: 'role', label: '特定角色' },
                                    { value: 'user', label: '特定人員' }
                                ],
                                dataAttr: 'data-target-type-select'
                            },
                            {
                                name: 'target_ids',
                                label: '選擇對象',
                                type: 'select',
                                multiple: true,
                                dataAttr: 'data-target-ids-select',
                                containerDataAttr: 'data-target-ids-container',
                                hidden: true
                            }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '公告內容',
                fields: [
                    {
                        name: 'content',
                        label: '內容',
                        type: 'textarea',
                        required: true,
                        fullWidth: true,
                        rows: 6,
                        placeholder: '請輸入公告內容'
                    }
                ]
            }
        ],
        hiddenFields: ['id'],
        // 表單按鈕
        formActions: [
            { label: '取消', icon: '', style: 'outline', action: 'cancel' },
            { label: '存草稿', icon: 'fa-save', style: 'outline', action: 'save-draft' },
            { label: '發佈公告', icon: '', style: 'primary', type: 'submit', action: 'save' }
        ]
    }
});
