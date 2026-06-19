'use strict';

const { runAudit } = require('../../audit-data-sync');

function checkDataSyncIntegration({
    reportError,
    reportInfo,
    log = console.log
}) {
    log('🔍 [DS-1] 執行 DataSync 專項審計...');

    const audit = runAudit();
    audit.results
        .filter(result => result.priority === 'P0' || result.priority === 'P1')
        .forEach((result) => {
            reportError(
                '架構',
                `js/${result.fileName}`,
                `DS-1 DataSync ${result.priority}`,
                `${result.moduleName}: ${result.issues.join('；')}`,
                '執行 node tools/audit-data-sync.js --write docs/data-sync-audit.md，依專項報告修正 DataSync 訂閱、通知或相依關係'
            );
        });

    if (audit.splitWorkOrderIssues.length > 0) {
        reportError(
            '資料完整性',
            'js/data-sync.js',
            'DS-1 拆分工單 DataSync',
            audit.splitWorkOrderIssues.join('；'),
            '補齊拆分工單、庫存、出貨與排程節點的 DataSync 相依與通知'
        );
    }

    reportInfo(
        '架構',
        'DS-1 DataSync 專項審計',
        `P0=${audit.counts.P0}、P1=${audit.counts.P1}、P2=${audit.counts.P2}；P2 詳情請查看 docs/data-sync-audit.md`
    );
}

module.exports = {
    checkDataSyncIntegration
};
