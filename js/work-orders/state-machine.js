(function () {
    'use strict';

    const transitions = Object.freeze({
        pending: ['in_progress', 'cancelled'],
        in_progress: ['paused', 'completed', 'cancelled'],
        paused: ['in_progress', 'cancelled'],
        completed: [],
        cancelled: []
    });
    const stageByStatus = Object.freeze({ pending: 'basic', scheduled: 'schedule', in_progress: 'production', paused: 'production', completed: 'completion', cancelled: 'trace' });

    window.WorkOrderStateMachine = Object.freeze({
        transitions,
        canTransition(from, to) {
            return from === to || (transitions[from] || []).includes(to);
        },
        suggestedStage(status) {
            return stageByStatus[status] || 'basic';
        }
    });
})();
