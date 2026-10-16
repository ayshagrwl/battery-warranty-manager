/**
 * ChallanService.gs
 * Battery Return Delivery Challan (strictly NO price/tax/weight, Qty 1) and Return Acknowledgement handler.
 */

var ChallanService = (function () {
  var TYPE = {
    BATTERY_RETURN: 'BATTERY_RETURN',
    COMPANY_DISPATCH: 'COMPANY_DISPATCH'
  };

  var STATUS = {
    GENERATED: 'GENERATED',
    ACKNOWLEDGED: 'ACKNOWLEDGED'
  };

  /**
   * Create an official Battery Return Delivery Challan for a rejected ticket.
   * STRICT RULE: Contains NO price, NO rate, NO taxes, NO weight. Only physical goods details with Qty 1.
   */
  function createReturnChallan(ticketNo) {
    if (!ticketNo) throw new Error('Ticket number is required to create return challan');
    var ticket = Database.getRowById('Tickets', 'ticket_no', ticketNo);
    if (!ticket) throw new Error('Ticket ' + ticketNo + ' not found');

    if (ticket.status !== 'REJECTED_RETURN_PENDING' && ticket.status !== 'REJECTED_RETURNED') {
      throw new Error('Return challan can only be generated for rejected tickets (current status: ' + ticket.status + ')');
    }

    // Check if challan already exists for this ticket
    var existingChallan = getChallanForTicket(ticketNo);
    if (existingChallan) {
      return existingChallan;
    }

    var challanNo = Utils.getNextId('RETURN_CHALLAN_PREFIX', 'RETURN_CHALLAN_SEQ', 6);
    var todayIso = Utils.toIsoDate(new Date());
    var recipientName = (ticket.source_type === 'DEALER' && ticket.dealer_name) ? ticket.dealer_name : ticket.customer_name;

    var challanRecord = {
      challan_no: challanNo,
      challan_type: TYPE.BATTERY_RETURN,
      challan_date: todayIso,
      recipient_type: ticket.source_type,
      recipient_name: recipientName,
      mobile: ticket.mobile,
      address: ticket.address,
      ticket_no: ticket.ticket_no,
      battery_model: ticket.battery_model,
      battery_serial_no: ticket.original_serial_no,
      quantity: 1, // Strictly 1
      received_by_name: '',
      received_date: '',
      status: STATUS.GENERATED,
      remarks: 'Returned battery rejected upon testing. Non-commercial movement.'
    };

    Database.appendRow('Delivery_Challans', challanRecord);

    AuditService.log(
      'CHALLAN_GENERATE',
      AuditService.RECORD_TYPE.CHALLAN,
      challanNo,
      '',
      STATUS.GENERATED,
      'Generated Battery Return Challan ' + challanNo + ' for ticket ' + ticketNo
    );

    return challanRecord;
  }

  /**
   * Acknowledge physical handover of the rejected battery to customer or dealer.
   */
  function markChallanReturned(data) {
    if (!data.challan_no) throw new Error('Challan number is required');
    var challan = Database.getRowById('Delivery_Challans', 'challan_no', data.challan_no);
    if (!challan) throw new Error('Challan ' + data.challan_no + ' not found');

    var receiverName = String(data.received_by_name || data.receiver_name || '').trim();
    if (!receiverName) throw new Error('Receiver name is required for return acknowledgement');

    var returnDate = (data.received_date || data.return_date) ? Utils.toIsoDate(data.received_date || data.return_date) : Utils.toIsoDate(new Date());
    var userEmail = Utils.getCurrentUserEmail();

    Database.updateRow('Delivery_Challans', 'challan_no', challan.challan_no, {
      status: STATUS.ACKNOWLEDGED,
      received_by_name: receiverName,
      received_date: returnDate,
      remarks: String(data.remarks || challan.remarks)
    });

    // Update originating ticket to REJECTED_RETURNED
    if (challan.ticket_no) {
      Database.updateRow('Tickets', 'ticket_no', challan.ticket_no, {
        status: 'REJECTED_RETURNED',
        updated_at: new Date().toISOString()
      });

      AuditService.log(
        'REJECTED_RETURNED',
        AuditService.RECORD_TYPE.TICKET,
        challan.ticket_no,
        'REJECTED_RETURN_PENDING',
        'REJECTED_RETURNED',
        'Physical rejected battery handed over to ' + receiverName + ' under Challan ' + challan.challan_no,
        userEmail
      );
    }

    AuditService.log(
      'CHALLAN_ACK',
      AuditService.RECORD_TYPE.CHALLAN,
      challan.challan_no,
      STATUS.GENERATED,
      STATUS.ACKNOWLEDGED,
      'Return challan acknowledged by receiver: ' + receiverName,
      userEmail
    );

    return {
      challan_no: challan.challan_no,
      status: STATUS.ACKNOWLEDGED,
      received_by_name: receiverName,
      ticket_no: challan.ticket_no
    };
  }

  /**
   * Retrieve challan by number.
   */
  function getChallanByNo(challanNo) {
    var challan = Database.getRowById('Delivery_Challans', 'challan_no', challanNo);
    if (!challan) return null;
    challan.challan_date_formatted = Utils.formatDateIndian(challan.challan_date);
    challan.received_date_formatted = Utils.formatDateIndian(challan.received_date);
    return challan;
  }

  /**
   * Retrieve return challan for a ticket if already generated.
   */
  function getChallanForTicket(ticketNo) {
    var rows = Database.getRows('Delivery_Challans');
    var target = String(ticketNo).trim();
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].ticket_no).trim() === target && rows[i].challan_type === TYPE.BATTERY_RETURN) {
        var c = rows[i];
        c.challan_date_formatted = Utils.formatDateIndian(c.challan_date);
        c.received_date_formatted = Utils.formatDateIndian(c.received_date);
        return c;
      }
    }
    return null;
  }

  /**
   * Render A4 printable HTML data for return delivery challan.
   */
  function getPrintData(challanOrTicketId) {
    if (!challanOrTicketId) throw new Error('Challan number or ticket number is required');
    var rawId = String(challanOrTicketId).trim();
    var cleanId = rawId.replace(/^PENDING\s*\((.*?)\)$/i, '$1').trim();

    // 1. Try to find challan by challan_no
    var challan = getChallanByNo(rawId);
    if (!challan && cleanId !== rawId) {
      challan = getChallanByNo(cleanId);
    }
    if (challan && challan.challan_type === TYPE.COMPANY_DISPATCH) {
      // Avoid cross-matching company dispatch challan when return challan requested
      challan = null;
    }

    // 2. Try to find challan by ticket_no
    if (!challan) {
      challan = getChallanForTicket(cleanId) || getChallanForTicket(rawId);
    }

    // 3. Try to locate ticket directly
    var ticket = Database.getRowById('Tickets', 'ticket_no', cleanId) || Database.getRowById('Tickets', 'ticket_no', rawId);
    if (!ticket && challan && challan.ticket_no) {
      ticket = Database.getRowById('Tickets', 'ticket_no', challan.ticket_no);
    }
    // Also try finding ticket by serial number
    if (!ticket) {
      var allTickets = Database.getRows('Tickets');
      for (var tIdx = 0; tIdx < allTickets.length; tIdx++) {
        if (allTickets[tIdx].original_serial_no === rawId || allTickets[tIdx].original_serial_no === cleanId) {
          ticket = allTickets[tIdx];
          if (!challan) challan = getChallanForTicket(ticket.ticket_no);
          break;
        }
      }
    }

    // 4. If challan not yet created in DB but ticket exists, generate draft/preview challan data
    if (!challan && ticket) {
      var todayIso = Utils.toIsoDate(new Date());
      challan = {
        challan_no: 'DC-PREVIEW-' + ticket.ticket_no,
        challan_type: TYPE.BATTERY_RETURN,
        challan_date: todayIso,
        challan_date_formatted: Utils.formatDateIndian(todayIso),
        recipient_type: ticket.source_type || 'CUSTOMER',
        recipient_name: (ticket.source_type === 'DEALER' && ticket.dealer_name) ? ticket.dealer_name : ticket.customer_name,
        mobile: ticket.mobile || '',
        address: ticket.address || '',
        ticket_no: ticket.ticket_no,
        battery_model: ticket.battery_model || '',
        battery_serial_no: ticket.original_serial_no || '',
        quantity: 1,
        status: STATUS.GENERATED,
        remarks: 'Physical goods return delivery challan. Warranty claim rejected after electrical test.'
      };
    }

    if (!challan) throw new Error('Return challan not found for ID: ' + rawId);

    // Ensure formatted dates
    if (challan.challan_date && !challan.challan_date_formatted) {
      challan.challan_date_formatted = Utils.formatDateIndian(challan.challan_date);
    }
    if (challan.received_date && !challan.received_date_formatted) {
      challan.received_date_formatted = Utils.formatDateIndian(challan.received_date);
    }

    // Diagnostic test resolution (take latest test)
    var ticketNo = challan.ticket_no || (ticket ? ticket.ticket_no : '');
    var tests = ticketNo ? BatteryTestService.getTestsByTicket(ticketNo) : [];
    if (tests.length === 0 && ticket && ticket.original_serial_no) {
      var allTests = Database.getRows('Battery_Tests');
      for (var tstI = 0; tstI < allTests.length; tstI++) {
        if (allTests[tstI].original_serial_no === ticket.original_serial_no) {
          tests.push(allTests[tstI]);
        }
      }
    }
    var test = (tests && tests.length > 0) ? tests[tests.length - 1] : null;

    if (test && test.test_date) {
      test.test_date_formatted = Utils.formatDateIndian(test.test_date);
    }

    var config = Config.getAll();
    var gstVal = config.COMPANY_GST || '';

    return {
      company: {
        name: config.COMPANY_NAME || 'Amaron Battery Hub & Service Care',
        address: config.COMPANY_ADDRESS || 'Shop 14-16, Auto Hub Complex, Ring Road, Surat, Gujarat - 395002',
        phone: config.COMPANY_PHONE || '+91 98250 12345',
        email: config.COMPANY_EMAIL || 'service@batteryhub.in',
        gst: gstVal,
        gstin: gstVal,
        terms: config.COMPANY_TERMS || ''
      },
      challan: challan,
      ticket: ticket || {},
      test: test || {}
    };
  }

  return {
    TYPE: TYPE,
    STATUS: STATUS,
    createReturnChallan: createReturnChallan,
    markChallanReturned: markChallanReturned,
    getChallanByNo: getChallanByNo,
    getChallanForTicket: getChallanForTicket,
    getPrintData: getPrintData,
    getChallanPrintData: getPrintData
  };
})();
