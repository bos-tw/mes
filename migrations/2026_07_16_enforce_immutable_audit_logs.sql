DROP TRIGGER IF EXISTS trg_audit_logs_block_update;
DROP TRIGGER IF EXISTS trg_audit_logs_block_delete;
DROP TRIGGER IF EXISTS trg_workflow_transitions_block_update;
DROP TRIGGER IF EXISTS trg_workflow_transitions_block_delete;

CREATE TRIGGER trg_audit_logs_block_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_logs are immutable';

CREATE TRIGGER trg_audit_logs_block_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_logs are immutable';

CREATE TRIGGER trg_workflow_transitions_block_update
BEFORE UPDATE ON workflow_status_transitions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'workflow transitions are immutable';

CREATE TRIGGER trg_workflow_transitions_block_delete
BEFORE DELETE ON workflow_status_transitions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'workflow transitions are immutable';
