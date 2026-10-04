/**
 * TicketService.gs
 * Battery intake operations, active serial duplicate checks, ticket management, and status updates.
 */

var TicketService = (function () {
  var STATUS = {
    RECEIVED: 'RECEIVED',
    TESTING: 'TESTING',
    PASSED: 'PASSED',
    REJECTED_RETURN_PENDING: 'REJECTED_RETURN_PENDING',
    REJECTED_RETURNED: 'REJECTED_RETURNED',
    CLAIM_CREATED: 'CLAIM_CREATED',
    READY_FOR_COMPANY: 'READY_FOR_COMPANY',
    SENT_TO_COMPANY: 'SENT_TO_COMPANY',
    REPLACEMENT_RECEIVED: 'REPLACEMENT_RECEIVED',
    STOCK_UPDATE_REQUIRED: 'STOCK_UPDATE_REQUIRED',
    STOCK_UPDATED: 'STOCK_UPDATED',
    CLOSED: 'CLOSED'
  };

  /**
   * Check if a battery serial number is already active in an open ticket or claim.
   *
   * @param {string} serialNo - Battery serial number
   * @param {string} [excludeTicketNo] - Optional ticket ID to ignore during self-edits
   * @return {Object} Validation result { isDuplicate: boolean, ticket: Object|null }
   */
  function checkDuplicateSerial(serialNo, excludeTicketNo) {
    var cleanSerial = Utils.sanitizeSerial(serialNo);
    if (!cleanSerial) return { isDuplicate: false, ticket: null };

    var tickets = Database.getRows('Tickets');
    var terminalStatuses = [STATUS.CLOSED, STATUS.REJECTED_RETURNED];

    for (var i = 0; i < tickets.length; i++) {
      var t = tickets[i];
      if (excludeTicketNo && t.ticket_no === excludeTicketNo) continue;

      if (Utils.sanitizeSerial(t.original_serial_no) === cleanSerial) {
        if (terminalStatuses.indexOf(t.status) === -1) {
          return {
            isDuplicate: true,
            ticket: t,
            message: 'Serial ' + cleanSerial + ' is already active under ' + t.ticket_no + ' (' + t.status + ')'
          };
        }
      }
    }
    return { isDuplicate: false, ticket: null };
  }

  /**
   * Create a new battery complaint / intake ticket.
   */
  function createTicket(data) {
    if (!data.battery_model) throw new Error('Battery model is required');
    if (!data.original_serial_no) throw new Error('Battery serial number is required');

    var cleanSerial = Utils.sanitizeSerial(data.original_serial_no);
    if (!cleanSerial) throw new Error('Valid battery serial number is required');

    // Duplicate Serial Enforcement
    var dupCheck = checkDuplicateSerial(cleanSerial);
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.message);
    }

    var sourceType = String(data.source_type || 'CUSTOMER').toUpperCase();
    if (sourceType !== 'CUSTOMER' && sourceType !== 'DEALER') {
      sourceType = 'CUSTOMER';
    }

    var customerName = String(data.customer_name || '').trim();
    if (!customerName) throw new Error('Customer or garage name is required');
    var mobile = String(data.mobile || '').trim();
    var address = String(data.address || '').trim();
    var vehicleNumber = String(data.vehicle_number || '').trim().toUpperCase();

    // Customer profile synchronization
    var customerId = '';
    if (mobile) {
      var customers = Database.getRows('Customers');
      for (var c = 0; c < customers.length; c++) {
        if (String(customers[c].mobile).trim() === mobile) {
          customerId = customers[c].customer_id;
          break;
        }
      }
      if (!customerId) {
        customerId = 'CUST-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy') + '-' + Utilities.getUuid().substring(0, 6).toUpperCase();
        Database.appendRow('Customers', {
          customer_id: customerId,
          name: customerName,
          mobile: mobile,
          address: address,
          vehicle_number: vehicleNumber,
          created_at: new Date().toISOString()
        });
      }
    }

    // Dealer lookup if dealer source
    var dealerId = '';
    var dealerName = '';
    if (sourceType === 'DEALER') {
      dealerName = String(data.dealer_name || '').trim();
      if (!dealerName) throw new Error('Dealer name is required for dealer intake');

      var dealers = Database.getRows('Dealers');
      for (var d = 0; d < dealers.length; d++) {
        if (dealers[d].dealer_name.toLowerCase() === dealerName.toLowerCase()) {
          dealerId = dealers[d].dealer_id;
          break;
        }
      }
    }

    // Service Battery handling
    var serviceIssued = (data.service_battery_issued === true || String(data.service_battery_issued).toLowerCase() === 'true');
    var serviceModel = serviceIssued ? String(data.service_battery_model || '').trim() : '';
    var serviceSerial = serviceIssued ? Utils.sanitizeSerial(data.service_battery_serial) : '';
    var serviceDate = serviceIssued ? (data.service_battery_date ? Utils.toIsoDate(data.service_battery_date) : Utils.toIsoDate(new Date())) : '';

    var ticketNo = Utils.getNextId('TICKET_PREFIX', 'TICKET_SEQ', 6);
    var dateReceived = data.date_received ? Utils.toIsoDate(data.date_received) : Utils.toIsoDate(new Date());
    var userEmail = Utils.getCurrentUserEmail();
    var nowIso = new Date().toISOString();

    var ticketRecord = {
      ticket_no: ticketNo,
      source_type: sourceType,
      customer_id: customerId,
      customer_name: customerName,
      dealer_id: dealerId,
      dealer_name: dealerName,
      mobile: mobile,
      address: address,
      vehicle_number: vehicleNumber,
      battery_model: data.battery_model,
      original_serial_no: cleanSerial,
      date_received: dateReceived,
      service_battery_issued: serviceIssued,
      service_battery_model: serviceModel,
      service_battery_serial: serviceSerial,
      service_battery_date: serviceDate,
      status: STATUS.RECEIVED,
      remarks: String(data.remarks || '').trim(),
      created_at: nowIso,
      updated_at: nowIso,
      created_by: userEmail
    };

    Database.appendRow('Tickets', ticketRecord);

    AuditService.log(
      'INTAKE',
      AuditService.RECORD_TYPE.TICKET,
      ticketNo,
      '',
      STATUS.RECEIVED,
      'Intake ticket created for ' + customerName + ' (' + data.battery_model + ' - ' + cleanSerial + ')' +
      (serviceIssued ? '. Service battery issued: ' + serviceSerial : ''),
      userEmail
    );

    return ticketRecord;
  }

  /**
   * List tickets with optional status, keyword, and date filters.
   */
  function getTickets(filter) {
    var rows = Database.getRows('Tickets');
    var filterObj = filter || {};
    var results = [];

    for (var i = rows.length - 1; i >= 0; i--) {
      var t = rows[i];

      if (filterObj.status && t.status !== filterObj.status) continue;
      if (filterObj.source_type && t.source_type !== filterObj.source_type) continue;

      if (filterObj.search) {
        var q = String(filterObj.search).trim().toLowerCase();
        var match = (
          (t.ticket_no && t.ticket_no.toLowerCase().indexOf(q) !== -1) ||
          (t.customer_name && t.customer_name.toLowerCase().indexOf(q) !== -1) ||
          (t.dealer_name && t.dealer_name.toLowerCase().indexOf(q) !== -1) ||
          (t.mobile && t.mobile.indexOf(q) !== -1) ||
          (t.vehicle_number && t.vehicle_number.toLowerCase().indexOf(q) !== -1) ||
          (t.original_serial_no && t.original_serial_no.toLowerCase().indexOf(q) !== -1) ||
          (t.battery_model && t.battery_model.toLowerCase().indexOf(q) !== -1)
        );
        if (!match) continue;
      }

      t.date_received_formatted = Utils.formatDateIndian(t.date_received);
      results.push(t);
    }
    return results;
  }

  /**
   * Retrieve full details of a single ticket.
   */
  function getTicketByNo(ticketNo) {
    var ticket = Database.getRowById('Tickets', 'ticket_no', ticketNo);
    if (!ticket) return null;

    ticket.date_received_formatted = Utils.formatDateIndian(ticket.date_received);
    ticket.tests = BatteryTestService.getTestsByTicket(ticketNo);
    ticket.claim = Database.getRowById('Claims', 'ticket_no', ticketNo);
    ticket.audit = AuditService.getByRecord(AuditService.RECORD_TYPE.TICKET, ticketNo);

    return ticket;
  }

  /**
   * Update status of a ticket.
   */
  function updateTicketStatus(ticketNo, newStatus, remarks) {
    var ticket = Database.getRowById('Tickets', 'ticket_no', ticketNo);
    if (!ticket) throw new Error('Ticket ' + ticketNo + ' not found');

    var oldStatus = ticket.status;
    Database.updateRow('Tickets', 'ticket_no', ticketNo, {
      status: newStatus,
      updated_at: new Date().toISOString()
    });

    AuditService.log(
      'STATUS_CHANGE',
      AuditService.RECORD_TYPE.TICKET,
      ticketNo,
      oldStatus,
      newStatus,
      remarks || ('Status updated to ' + newStatus)
    );

    return true;
  }

  return {
    STATUS: STATUS,
    checkDuplicateSerial: checkDuplicateSerial,
    createTicket: createTicket,
    getTickets: getTickets,
    getTicketByNo: getTicketByNo,
    updateTicketStatus: updateTicketStatus
  };
})();
