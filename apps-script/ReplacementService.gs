/**
 * ReplacementService.gs
 * Receiving replacement batteries, separate replacement serial storage, generating STOCK_UPDATE_REQUIRED tasks,
 * marking stock updated with ERP voucher references, and final claim closure.
 */

var ReplacementService = (function () {
  /**
   * Record arrival of a replacement battery from the manufacturer.
   * STRICT RULE: Original serial number is NEVER overwritten. Replacement serial is stored in a separate column.
   */
  function recordReplacementReceived(data) {
    if (!data.claim_no) throw new Error('Claim number is required');
    var claim = Database.getRowById('Claims', 'claim_no', data.claim_no);
    if (!claim) throw new Error('Claim ' + data.claim_no + ' not found');

    if (!data.replacement_serial_no) throw new Error('Replacement battery serial number is required');
    var cleanReplSerial = Utils.sanitizeSerial(data.replacement_serial_no);
    if (!cleanReplSerial) throw new Error('Valid replacement serial number is required');

    var replModel = String(data.replacement_model || claim.battery_model || '').trim();
    var receivedDate = data.received_date ? Utils.toIsoDate(data.received_date) : Utils.toIsoDate(new Date());
    var userEmail = Utils.getCurrentUserEmail();
    var nowIso = new Date().toISOString();

    // 1. Update Claim with separate replacement serial
    var oldStatus = claim.status;
    Database.updateRow('Claims', 'claim_no', claim.claim_no, {
      replacement_model: replModel,
      replacement_serial_no: cleanReplSerial, // Saved as strict text
      replacement_received_date: receivedDate,
      status: 'REPLACEMENT_RECEIVED',
      stock_status: 'UPDATE_REQUIRED',
      updated_at: nowIso
    });

    // 2. Update originating Ticket
    if (claim.ticket_no) {
      Database.updateRow('Tickets', 'ticket_no', claim.ticket_no, {
        status: 'REPLACEMENT_RECEIVED',
        updated_at: nowIso
      });
    }

    // 3. Generate automated Stock Reconciliation Task in Stock_Update_Log
    var currentYear = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');
    var taskId = 'STK-' + currentYear + '-' + Utilities.getUuid().substring(0, 6).toUpperCase();

    var stockTask = {
      stock_task_id: taskId,
      claim_no: claim.claim_no,
      replacement_model: replModel,
      replacement_serial_no: cleanReplSerial,
      received_date: receivedDate,
      stock_status: 'UPDATE_REQUIRED',
      accounting_ref_no: '',
      updated_at: '',
      updated_by: '',
      remarks: 'Automated task generated upon receiving replacement from company. Physical stock voucher entry required in Tally/Busy/ERP.'
    };
    Database.appendRow('Stock_Update_Log', stockTask);

    // 4. Record Replacement Receipts log
    try {
      var receiptId = 'REC-' + currentYear + '-' + Utilities.getUuid().substring(0, 6).toUpperCase();
      Database.appendRow('Replacement_Receipts', {
        receipt_id: receiptId,
        claim_no: claim.claim_no,
        replacement_model: replModel,
        replacement_serial_no: cleanReplSerial,
        received_date: receivedDate,
        received_by: userEmail,
        remarks: String(data.remarks || 'Replacement battery inward')
      });
    } catch (e) {
      // Non-blocking
    }

    // 5. Audit Log
    AuditService.log(
      'REPLACEMENT_RECEIVE',
      AuditService.RECORD_TYPE.CLAIM,
      claim.claim_no,
      oldStatus,
      'REPLACEMENT_RECEIVED',
      'Replacement battery received: ' + replModel + ' (Serial: ' + cleanReplSerial +
      '). Original Serial ' + claim.original_serial_no + ' preserved. Stock update task created: ' + taskId,
      userEmail
    );

    return {
      claim_no: claim.claim_no,
      stock_task_id: taskId,
      status: 'REPLACEMENT_RECEIVED',
      replacement_serial_no: cleanReplSerial
    };
  }

  /**
   * Get all active stock update tasks pending ERP entry.
   */
  function getStockPendingTasks() {
    var tasks = Database.getRows('Stock_Update_Log');
    var pending = [];

    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      if (t.stock_status === 'UPDATE_REQUIRED') {
        t.received_date_formatted = Utils.formatDateIndian(t.received_date);
        t.days_pending = Utils.diffDays(t.received_date);

        // Enrich with claim info
        var claim = Database.getRowById('Claims', 'claim_no', t.claim_no);
        if (claim) {
          t.customer_name = claim.customer_name;
          t.mobile = claim.mobile;
          t.original_serial_no = claim.original_serial_no;
          t.dealer_name = claim.dealer_name;
        }
        pending.push(t);
      }
    }

    pending.sort(function (a, b) {
      return new Date(a.received_date).getTime() - new Date(b.received_date).getTime();
    });

    return pending;
  }

  /**
   * Mark physical stock reconciled by entering the ERP/Tally/Busy voucher reference.
   */
  function markStockUpdated(data) {
    if (!data.claim_no) throw new Error('Claim number is required');
    var voucherRef = String(data.accounting_ref_no || '').trim();
    if (!voucherRef) throw new Error('ERP/Tally voucher reference number is required');

    var claim = Database.getRowById('Claims', 'claim_no', data.claim_no);
    if (!claim) throw new Error('Claim ' + data.claim_no + ' not found');

    var nowIso = new Date().toISOString();
    var todayIso = Utils.toIsoDate(new Date());
    var userEmail = data.updated_by || Utils.getCurrentUserEmail();

    // 1. Update Stock_Update_Log
    var tasks = Database.getRows('Stock_Update_Log');
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].claim_no === data.claim_no && tasks[i].stock_status === 'UPDATE_REQUIRED') {
        Database.updateRow('Stock_Update_Log', 'stock_task_id', tasks[i].stock_task_id, {
          stock_status: 'UPDATED',
          accounting_ref_no: voucherRef,
          updated_at: nowIso,
          updated_by: userEmail,
          remarks: String(data.remarks || tasks[i].remarks)
        });
      }
    }

    // 2. Update Claim
    var oldStatus = claim.status;
    Database.updateRow('Claims', 'claim_no', claim.claim_no, {
      stock_status: 'UPDATED',
      stock_ref_no: voucherRef,
      stock_updated_date: todayIso,
      stock_updated_by: userEmail,
      status: 'STOCK_UPDATED',
      updated_at: nowIso
    });

    // 3. Update Ticket
    if (claim.ticket_no) {
      Database.updateRow('Tickets', 'ticket_no', claim.ticket_no, {
        status: 'STOCK_UPDATED',
        updated_at: nowIso
      });
    }

    // 4. Audit Log
    AuditService.log(
      'STOCK_UPDATE',
      AuditService.RECORD_TYPE.CLAIM,
      claim.claim_no,
      oldStatus,
      'STOCK_UPDATED',
      'Stock reconciled with ERP voucher: ' + voucherRef + ' by ' + userEmail,
      userEmail
    );

    return {
      claim_no: claim.claim_no,
      stock_status: 'UPDATED',
      stock_ref_no: voucherRef
    };
  }

  /**
   * Final handover of replacement battery to customer/dealer and claim closure.
   */
  function closeClaim(data) {
    if (!data.claim_no) throw new Error('Claim number is required');
    var claim = Database.getRowById('Claims', 'claim_no', data.claim_no);
    if (!claim) throw new Error('Claim ' + data.claim_no + ' not found');

    // Verified Closure Gate: Block closure if stock reconciliation is pending
    if (claim.stock_status === 'UPDATE_REQUIRED') {
      throw new Error('Cannot close claim ' + data.claim_no + ': Physical stock reconciliation is pending (STOCK_UPDATE_REQUIRED). Please log accounting voucher reference first.');
    }

    var todayIso = Utils.toIsoDate(new Date());
    var nowIso = new Date().toISOString();
    var userEmail = Utils.getCurrentUserEmail();
    var closureNotes = String(data.remarks || 'Replacement battery handed over to customer/dealer. Claim closed.').trim();

    var oldStatus = claim.status;
    Database.updateRow('Claims', 'claim_no', claim.claim_no, {
      status: 'CLOSED',
      closed_date: todayIso,
      remarks: closureNotes,
      updated_at: nowIso
    });

    if (claim.ticket_no) {
      Database.updateRow('Tickets', 'ticket_no', claim.ticket_no, {
        status: 'CLOSED',
        updated_at: nowIso
      });
    }

    AuditService.log(
      'CLOSE_CLAIM',
      AuditService.RECORD_TYPE.CLAIM,
      claim.claim_no,
      oldStatus,
      'CLOSED',
      closureNotes,
      userEmail
    );

    return {
      claim_no: claim.claim_no,
      status: 'CLOSED',
      closed_date: todayIso
    };
  }

  return {
    recordReplacementReceived: recordReplacementReceived,
    getStockPendingTasks: getStockPendingTasks,
    markStockUpdated: markStockUpdated,
    closeClaim: closeClaim
  };
})();
