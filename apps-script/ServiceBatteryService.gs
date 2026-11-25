/**
 * ServiceBatteryService.gs
 * Standby / Loaner Service Battery Stock Pool, Customer Assignment, Blocking, and Rotation Tracking.
 */

var ServiceBatteryService = (function () {
  var STATUS = {
    AVAILABLE: 'AVAILABLE',
    ASSIGNED: 'ASSIGNED',
    BLOCKED: 'BLOCKED'
  };

  function isTruthyFlag(val) {
    return val === true || String(val).toUpperCase() === 'TRUE' || String(val).toUpperCase() === 'YES';
  }

  function findBattery(sbIdOrSerial) {
    if (!sbIdOrSerial) return null;
    var raw = String(sbIdOrSerial).trim();
    var cleanSerial = Utils.sanitizeSerial(raw).toLowerCase();
    var rows = Database.getRows('Service_Batteries');

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (String(r.sb_id || '').trim().toLowerCase() === raw.toLowerCase()) {
        return r;
      }
      if (Utils.sanitizeSerial(r.serial_no).toLowerCase() === cleanSerial && cleanSerial !== '') {
        return r;
      }
    }
    return null;
  }

  function appendLog(sb, actionType, ticketNo, customerName, mobile, assignedDate, returnedDate, daysRotated, remarks) {
    try {
      var currentYear = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');
      var logId = 'SBL-' + currentYear + '-' + Utils.generateId(6);
      var userEmail = Utils.getCurrentUserEmail();
      var nowIso = new Date().toISOString();

      Database.appendRow('Service_Battery_Logs', {
        log_id: logId,
        sb_id: sb.sb_id || '',
        serial_no: sb.serial_no || '',
        model_name: sb.model_name || '',
        action_type: actionType,
        ticket_no: ticketNo || '',
        customer_name: customerName || '',
        mobile: mobile || '',
        assigned_date: assignedDate || '',
        returned_date: returnedDate || '',
        days_rotated: (daysRotated !== undefined && daysRotated !== null) ? daysRotated : '',
        performed_by: userEmail,
        remarks: remarks || '',
        created_at: nowIso
      });
    } catch (e) {
      Logger.log('ServiceBatteryService.appendLog error: ' + e.message);
    }
  }

  /**
   * List all service batteries enriched with days currently out.
   */
  function listServiceBatteries() {
    var rows = Database.getRows('Service_Batteries');
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      r.is_blocked = isTruthyFlag(r.is_blocked) || String(r.status).toUpperCase() === STATUS.BLOCKED;
      r.rotation_count = parseInt(r.rotation_count, 10) || 0;
      r.days_out = (r.status === STATUS.ASSIGNED && r.assigned_date) ? Utils.diffDays(r.assigned_date) : 0;
      r.assigned_date_formatted = r.assigned_date ? Utils.formatDateIndian(r.assigned_date) : '-';
      r.last_rotated_formatted = r.last_rotated_date ? Utils.formatDateIndian(r.last_rotated_date) : '-';
    }
    return rows;
  }

  /**
   * Add or update a service battery in the available stock pool.
   */
  function addServiceBattery(data) {
    if (!data || !data.serial_no) {
      throw new Error('Service battery serial number is required.');
    }
    var cleanSerial = Utils.sanitizeSerial(data.serial_no);
    if (!cleanSerial) {
      throw new Error('Valid service battery serial number is required.');
    }

    var existing = findBattery(data.sb_id || cleanSerial);
    var nowIso = new Date().toISOString();

    if (existing && !data.sb_id) {
      throw new Error('Service battery serial ' + cleanSerial + ' already exists in stock (' + existing.sb_id + ').');
    }

    if (existing && data.sb_id) {
      var updates = {
        serial_no: cleanSerial,
        brand: String(data.brand || existing.brand || 'Amaron').trim(),
        model_name: String(data.model_name || existing.model_name || 'Standby Service Battery').trim(),
        capacity_ah: parseInt(data.capacity_ah, 10) || existing.capacity_ah || 35,
        condition_notes: String(data.condition_notes !== undefined ? data.condition_notes : (existing.condition_notes || '')).trim(),
        updated_at: nowIso
      };
      Database.updateRow('Service_Batteries', 'sb_id', existing.sb_id, updates);
      var updated = Object.assign({}, existing, updates);
      AuditService.log('SB_UPDATED', 'SERVICE_BATTERY', existing.sb_id, existing.status, existing.status, 'Updated service battery ' + cleanSerial);
      return updated;
    }

    var shouldBlock = isTruthyFlag(data.is_blocked);
    var row = {
      sb_id: 'SB-' + Utils.generateId(6),
      serial_no: cleanSerial,
      brand: String(data.brand || 'Amaron').trim(),
      model_name: String(data.model_name || 'Standby Service Battery').trim(),
      capacity_ah: parseInt(data.capacity_ah, 10) || 35,
      status: shouldBlock ? STATUS.BLOCKED : STATUS.AVAILABLE,
      is_blocked: shouldBlock,
      block_reason: shouldBlock ? String(data.block_reason || 'Added as Blocked').trim() : '',
      current_ticket_no: '',
      current_customer_name: '',
      current_mobile: '',
      assigned_date: '',
      rotation_count: parseInt(data.rotation_count, 10) || 0,
      last_rotated_date: '',
      condition_notes: String(data.condition_notes || 'Ready & Charged').trim(),
      created_at: nowIso,
      updated_at: nowIso
    };

    Database.appendRow('Service_Batteries', row);
    appendLog(row, 'STOCK_ADDED', '', '', '', '', '', 0, 'Added to service battery stock (' + row.model_name + ')');
    AuditService.log('SB_ADDED', 'SERVICE_BATTERY', row.sb_id, '', row.status, 'Added service battery ' + cleanSerial + ' (' + row.model_name + ')');
    return row;
  }

  /**
   * Assign an available service battery to a customer and lock/block it from reuse.
   */
  function assignServiceBattery(data) {
    if (!data) throw new Error('Assignment payload is required.');
    var lookupKey = data.sb_id || data.serial_no || data.service_battery_serial;
    if (!lookupKey) throw new Error('Service battery ID or serial number is required.');

    var sb = findBattery(lookupKey);
    var cleanSerial = Utils.sanitizeSerial(data.serial_no || data.service_battery_serial || lookupKey);

    if (!sb) {
      if (data.auto_create) {
        sb = addServiceBattery({
          serial_no: cleanSerial,
          brand: data.brand || 'Amaron',
          model_name: data.model_name || data.service_battery_model || 'Standby Service Battery',
          capacity_ah: data.capacity_ah || 35,
          condition_notes: 'Auto-registered during customer issue'
        });
      } else {
        throw new Error('Service battery "' + lookupKey + '" not found in stock.');
      }
    }

    var currentStatus = String(sb.status || STATUS.AVAILABLE).toUpperCase();
    var blockedFlag = isTruthyFlag(sb.is_blocked);

    if (currentStatus === STATUS.BLOCKED || blockedFlag) {
      throw new Error('Service battery ' + sb.serial_no + ' is BLOCKED (' + (sb.block_reason || 'Unavailable') + ') and cannot be assigned.');
    }
    if (currentStatus === STATUS.ASSIGNED) {
      throw new Error('Service battery ' + sb.serial_no + ' is already ASSIGNED to ' + (sb.current_customer_name || sb.current_ticket_no || 'another customer') + ' and locked until returned.');
    }

    var ticketNo = String(data.ticket_no || '').trim();
    var customerName = String(data.customer_name || '').trim();
    var mobile = String(data.mobile || '').trim();

    if (ticketNo && (!customerName || !mobile)) {
      var ticket = Database.getRowById('Tickets', 'ticket_no', ticketNo);
      if (ticket) {
        if (!customerName) customerName = (ticket.source_type === 'DEALER' && ticket.dealer_name) ? ticket.dealer_name : ticket.customer_name;
        if (!mobile) mobile = ticket.mobile || '';
      }
    }

    if (!customerName) {
      throw new Error('Customer or party name is required to assign a service battery.');
    }

    var assignedDate = data.assigned_date ? Utils.toIsoDate(data.assigned_date) : Utils.toIsoDate(new Date());
    var nextRotation = (parseInt(sb.rotation_count, 10) || 0) + 1;
    var nowIso = new Date().toISOString();

    var updates = {
      status: STATUS.ASSIGNED,
      is_blocked: false,
      block_reason: '',
      current_ticket_no: ticketNo,
      current_customer_name: customerName,
      current_mobile: mobile,
      assigned_date: assignedDate,
      rotation_count: nextRotation,
      last_rotated_date: assignedDate,
      updated_at: nowIso
    };

    Database.updateRow('Service_Batteries', 'sb_id', sb.sb_id, updates);

    // Sync linked ticket if assigned after intake
    if (ticketNo && !data.skip_ticket_update) {
      var linkedTicket = Database.getRowById('Tickets', 'ticket_no', ticketNo);
      if (linkedTicket) {
        Database.updateRow('Tickets', 'ticket_no', ticketNo, {
          service_battery_issued: true,
          service_battery_model: sb.model_name || linkedTicket.service_battery_model || 'Standby Service Battery',
          service_battery_serial: sb.serial_no,
          service_battery_date: assignedDate,
          updated_at: nowIso
        });
      }
    }

    var remarks = String(data.remarks || ('Assigned to ' + customerName + (ticketNo ? ' (' + ticketNo + ')' : '') + ' — Battery locked from other assignments')).trim();
    appendLog(sb, 'ASSIGNED', ticketNo, customerName, mobile, assignedDate, '', 0, remarks);
    AuditService.log('SB_ASSIGNED', 'SERVICE_BATTERY', sb.sb_id, STATUS.AVAILABLE, STATUS.ASSIGNED,
      'Assigned service battery ' + sb.serial_no + ' to ' + customerName + (ticketNo ? ' for ' + ticketNo : '') + ' (Rotation #' + nextRotation + ')');

    return Object.assign({}, sb, updates);
  }

  /**
   * Mark an assigned service battery returned back to shop stock (or blocked for recharge/inspection).
   */
  function returnServiceBattery(data) {
    if (!data) throw new Error('Return payload is required.');
    var sb = null;
    if (data.sb_id || data.serial_no || data.service_battery_serial) {
      sb = findBattery(data.sb_id || data.serial_no || data.service_battery_serial);
    }
    if (!sb && data.ticket_no) {
      var rows = Database.getRows('Service_Batteries');
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i].current_ticket_no || '').trim() === String(data.ticket_no).trim()) {
          sb = rows[i];
          break;
        }
      }
    }
    if (!sb) {
      throw new Error('Assigned service battery not found for return.');
    }

    var returnDate = data.returned_date ? Utils.toIsoDate(data.returned_date) : Utils.toIsoDate(new Date());
    var daysRotated = sb.assigned_date ? Utils.diffDays(sb.assigned_date, returnDate) : 0;
    var blockAfterReturn = isTruthyFlag(data.block_after_return) || isTruthyFlag(sb.is_blocked);
    var nextStatus = blockAfterReturn ? STATUS.BLOCKED : STATUS.AVAILABLE;
    var blockReason = blockAfterReturn ? String(data.block_reason || sb.block_reason || 'Pending Recharge / Inspection').trim() : '';
    var nowIso = new Date().toISOString();

    var prevCustomer = sb.current_customer_name || '';
    var prevMobile = sb.current_mobile || '';
    var prevTicket = sb.current_ticket_no || '';
    var prevAssignedDate = sb.assigned_date || '';

    var updates = {
      status: nextStatus,
      is_blocked: blockAfterReturn,
      block_reason: blockReason,
      current_ticket_no: '',
      current_customer_name: '',
      current_mobile: '',
      assigned_date: '',
      last_rotated_date: returnDate,
      condition_notes: data.condition_notes ? String(data.condition_notes).trim() : sb.condition_notes,
      updated_at: nowIso
    };

    Database.updateRow('Service_Batteries', 'sb_id', sb.sb_id, updates);

    var remarks = String(data.remarks || ('Returned by ' + (prevCustomer || 'Customer') + ' after ' + daysRotated + ' day(s)' + (blockAfterReturn ? ' [Blocked: ' + blockReason + ']' : ' [Available in stock]'))).trim();
    appendLog(sb, 'RETURNED', prevTicket, prevCustomer, prevMobile, prevAssignedDate, returnDate, daysRotated, remarks);
    AuditService.log('SB_RETURNED', 'SERVICE_BATTERY', sb.sb_id, sb.status, nextStatus,
      'Service battery ' + sb.serial_no + ' returned from ' + (prevCustomer || 'customer') + ' (' + daysRotated + ' days). Status: ' + nextStatus);

    return Object.assign({}, sb, updates);
  }

  /**
   * Manually block or unblock a service battery.
   */
  function blockServiceBattery(data) {
    if (!data) throw new Error('Block payload is required.');
    var lookupKey = data.sb_id || data.serial_no;
    var sb = findBattery(lookupKey);
    if (!sb) throw new Error('Service battery not found: ' + lookupKey);

    var shouldBlock = (data.blocked !== undefined) ? isTruthyFlag(data.blocked) : true;
    var nowIso = new Date().toISOString();
    var oldStatus = sb.status;
    var reason = shouldBlock ? String(data.reason || data.block_reason || 'Manually Blocked').trim() : '';

    var nextStatus;
    if (shouldBlock) {
      nextStatus = (String(sb.status).toUpperCase() === STATUS.ASSIGNED) ? STATUS.ASSIGNED : STATUS.BLOCKED;
    } else {
      nextStatus = (sb.current_customer_name || sb.current_ticket_no) ? STATUS.ASSIGNED : STATUS.AVAILABLE;
    }

    var updates = {
      status: nextStatus,
      is_blocked: shouldBlock,
      block_reason: reason,
      updated_at: nowIso
    };

    Database.updateRow('Service_Batteries', 'sb_id', sb.sb_id, updates);

    var actionType = shouldBlock ? 'BLOCKED' : 'UNBLOCKED';
    appendLog(sb, actionType, sb.current_ticket_no || '', sb.current_customer_name || '', sb.current_mobile || '', sb.assigned_date || '', '', 0,
      shouldBlock ? ('Blocked: ' + reason) : 'Unblocked and made available');
    AuditService.log('SB_' + actionType, 'SERVICE_BATTERY', sb.sb_id, oldStatus, nextStatus,
      (shouldBlock ? 'Blocked' : 'Unblocked') + ' service battery ' + sb.serial_no + (reason ? ' (' + reason + ')' : ''));

    return Object.assign({}, sb, updates);
  }

  /**
   * Remove a service battery from stock (cannot remove while actively assigned to a customer).
   */
  function deleteServiceBattery(sbIdOrSerial) {
    var sb = findBattery(sbIdOrSerial);
    if (!sb) throw new Error('Service battery not found: ' + sbIdOrSerial);
    if (String(sb.status).toUpperCase() === STATUS.ASSIGNED) {
      throw new Error('Cannot remove service battery ' + sb.serial_no + ' while it is assigned to ' + (sb.current_customer_name || 'a customer') + '. Mark it returned first.');
    }

    var ok = Database.deleteRow('Service_Batteries', 'sb_id', sb.sb_id);
    if (!ok) throw new Error('Failed to delete service battery ' + sb.serial_no);

    appendLog(sb, 'REMOVED', '', '', '', '', '', 0, 'Removed from service battery stock pool');
    AuditService.log('SB_REMOVED', 'SERVICE_BATTERY', sb.sb_id, sb.status, 'REMOVED', 'Removed service battery ' + sb.serial_no + ' from stock');

    return { sb_id: sb.sb_id, serial_no: sb.serial_no, removed: true };
  }

  return {
    STATUS: STATUS,
    findBattery: findBattery,
    listServiceBatteries: listServiceBatteries,
    addServiceBattery: addServiceBattery,
    assignServiceBattery: assignServiceBattery,
    returnServiceBattery: returnServiceBattery,
    blockServiceBattery: blockServiceBattery,
    deleteServiceBattery: deleteServiceBattery
  };
})();
