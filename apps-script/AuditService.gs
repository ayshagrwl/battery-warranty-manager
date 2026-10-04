/**
 * AuditService.gs
 * Immutable, append-only audit logging for system actions, transitions, and user events.
 */

var AuditService = (function () {
  var RECORD_TYPE = {
    TICKET: 'TICKET',
    TEST: 'TEST',
    CLAIM: 'CLAIM',
    CHALLAN: 'CHALLAN',
    DISPATCH: 'DISPATCH',
    REPLACEMENT: 'REPLACEMENT',
    STOCK: 'STOCK',
    SYSTEM: 'SYSTEM'
  };

  /**
   * Log an immutable audit record.
   *
   * @param {string} action - Action performed (e.g. INTAKE, TEST, CLAIM_CREATE, SENT_TO_COMPANY, etc.)
   * @param {string} recordType - Entity type (TICKET, CLAIM, CHALLAN, etc.)
   * @param {string} recordId - Identifier of the entity (e.g. TKT-2026-000001)
   * @param {string} oldStatus - Prior status or empty
   * @param {string} newStatus - New status or empty
   * @param {string} details - Detailed human-readable description
   * @param {string} [userEmail] - Optional user email override
   * @return {Object} The logged audit object
   */
  function log(action, recordType, recordId, oldStatus, newStatus, details, userEmail) {
    try {
      var currentYear = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');
      var auditId = 'AUD-' + currentYear + '-' + Utilities.getUuid().substring(0, 8).toUpperCase();
      var email = userEmail || Utils.getCurrentUserEmail();
      var nowIso = new Date().toISOString();

      var record = {
        audit_id: auditId,
        timestamp: nowIso,
        user_email: email,
        action: String(action || 'UNKNOWN'),
        record_type: String(recordType || 'GENERAL'),
        record_id: String(recordId || ''),
        old_status: String(oldStatus || ''),
        new_status: String(newStatus || ''),
        details: String(details || '')
      };

      Database.appendRow('Audit_Log', record);
      return record;
    } catch (e) {
      Logger.log('AuditService.log error: ' + e.toString());
      // Non-blocking fallback to avoid breaking business transactions
      return null;
    }
  }

  /**
   * Retrieve audit logs for a specific record.
   *
   * @param {string} recordType - Record type
   * @param {string} recordId - Entity ID
   * @return {Array<Object>} List of audit records
   */
  function getByRecord(recordType, recordId) {
    var rows = Database.getRows('Audit_Log');
    var targetId = String(recordId).trim();
    var filtered = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (String(r.record_id).trim() === targetId) {
        if (!recordType || String(r.record_type).trim() === String(recordType).trim()) {
          filtered.push(r);
        }
      }
    }

    filtered.sort(function (a, b) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return filtered;
  }

  /**
   * Retrieve audit logs for multiple record IDs (e.g. ticket and claim).
   *
   * @param {Array<string>} recordIds
   * @return {Array<Object>}
   */
  function getByRecordIds(recordIds) {
    if (!recordIds || recordIds.length === 0) return [];
    var set = {};
    for (var k = 0; k < recordIds.length; k++) {
      if (recordIds[k]) set[String(recordIds[k]).trim()] = true;
    }

    var rows = Database.getRows('Audit_Log');
    var filtered = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (set[String(r.record_id).trim()]) {
        filtered.push(r);
      }
    }

    filtered.sort(function (a, b) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return filtered;
  }

  /**
   * Get recent N audit logs.
   */
  function getRecentLogs(limit) {
    var max = limit || 50;
    var rows = Database.getRows('Audit_Log');
    rows.sort(function (a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return rows.slice(0, max);
  }

  return {
    RECORD_TYPE: RECORD_TYPE,
    log: log,
    getByRecord: getByRecord,
    getByRecordIds: getByRecordIds,
    getRecentLogs: getRecentLogs
  };
})();
