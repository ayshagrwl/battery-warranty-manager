/**
 * ClaimService.gs
 * Warranty claim creation from passed tickets, universal multi-attribute search, and lifecycle timeline reconstruction.
 */

var ClaimService = (function () {
  var STATUS = {
    CLAIM_CREATED: 'CLAIM_CREATED',
    READY_FOR_COMPANY: 'READY_FOR_COMPANY',
    SENT_TO_COMPANY: 'SENT_TO_COMPANY',
    REPLACEMENT_RECEIVED: 'REPLACEMENT_RECEIVED',
    STOCK_UPDATED: 'STOCK_UPDATED',
    CLOSED: 'CLOSED'
  };

  /**
   * Create an official manufacturer warranty claim from a passed ticket.
   */
  function createClaim(data) {
    if (!data.ticket_no) throw new Error('Ticket number is required');
    var ticket = Database.getRowById('Tickets', 'ticket_no', data.ticket_no);
    if (!ticket) throw new Error('Ticket ' + data.ticket_no + ' not found');

    if (ticket.status !== 'PASSED' && ticket.status !== STATUS.CLAIM_CREATED && ticket.status !== STATUS.READY_FOR_COMPANY) {
      throw new Error('Claim can only be generated for tickets that have PASSED testing (current status: ' + ticket.status + ')');
    }

    // Check for existing claim
    var existingClaim = getClaimByTicket(data.ticket_no);
    if (existingClaim) {
      return existingClaim;
    }

    var dateOfSale = data.date_of_sale ? Utils.toIsoDate(data.date_of_sale) : '';
    var warrantyCalc = WarrantyService.calculateWarranty(ticket.battery_model, dateOfSale);

    var claimNo = Utils.getNextId('CLAIM_PREFIX', 'CLAIM_SEQ', 6);
    var todayIso = Utils.toIsoDate(new Date());
    var nowIso = new Date().toISOString();
    var userEmail = Utils.getCurrentUserEmail();

    var claimRecord = {
      claim_no: claimNo,
      ticket_no: ticket.ticket_no,
      source_type: ticket.source_type,
      customer_name: ticket.customer_name,
      mobile: ticket.mobile,
      address: ticket.address,
      dealer_name: ticket.dealer_name || '',
      vehicle_number: ticket.vehicle_number || '',
      battery_model: ticket.battery_model,
      original_serial_no: ticket.original_serial_no,
      date_of_sale: dateOfSale,
      warranty_months: warrantyCalc.warranty_months,
      warranty_expiry_date: warrantyCalc.warranty_expiry_date,
      warranty_status: warrantyCalc.warranty_status,
      claim_date: todayIso,
      status: STATUS.CLAIM_CREATED,
      dispatch_batch_no: '',
      company_challan_no: '',
      company_dispatch_date: '',
      replacement_model: '',
      replacement_serial_no: '',
      replacement_received_date: '',
      stock_status: 'NOT_APPLICABLE',
      stock_ref_no: '',
      stock_updated_date: '',
      stock_updated_by: '',
      closed_date: '',
      remarks: String(data.remarks || ticket.remarks || '').trim(),
      created_at: nowIso,
      updated_at: nowIso
    };

    Database.appendRow('Claims', claimRecord);

    // Update originating ticket
    Database.updateRow('Tickets', 'ticket_no', ticket.ticket_no, {
      status: STATUS.CLAIM_CREATED,
      updated_at: nowIso
    });

    AuditService.log(
      'CLAIM_CREATE',
      AuditService.RECORD_TYPE.CLAIM,
      claimNo,
      'PASSED',
      STATUS.CLAIM_CREATED,
      'Warranty claim created from ' + ticket.ticket_no + ' for ' + ticket.battery_model +
      ' (Serial: ' + ticket.original_serial_no + ', Warranty: ' + warrantyCalc.warranty_status + ')',
      userEmail
    );

    return claimRecord;
  }

  /**
   * Get claim linked to a ticket.
   */
  function getClaimByTicket(ticketNo) {
    var claims = Database.getRows('Claims');
    var target = String(ticketNo).trim();
    for (var i = 0; i < claims.length; i++) {
      if (String(claims[i].ticket_no).trim() === target) {
        return claims[i];
      }
    }
    return null;
  }

  /**
   * Retrieve full claim details by claim number.
   */
  function getClaimByNo(claimNo) {
    var claim = Database.getRowById('Claims', 'claim_no', claimNo);
    if (!claim) return null;

    claim.claim_date_formatted = Utils.formatDateIndian(claim.claim_date);
    claim.date_of_sale_formatted = Utils.formatDateIndian(claim.date_of_sale);
    claim.warranty_expiry_formatted = Utils.formatDateIndian(claim.warranty_expiry_date);
    claim.company_dispatch_formatted = Utils.formatDateIndian(claim.company_dispatch_date);
    claim.replacement_received_formatted = Utils.formatDateIndian(claim.replacement_received_date);
    claim.closed_date_formatted = Utils.formatDateIndian(claim.closed_date);

    claim.ticket = Database.getRowById('Tickets', 'ticket_no', claim.ticket_no);
    claim.documents = DriveService.getClaimDocuments(claimNo);
    claim.tests = claim.ticket_no ? BatteryTestService.getTestsByTicket(claim.ticket_no) : [];

    return claim;
  }

  /**
   * List claims with filter support.
   */
  function getClaims(filter) {
    var rows = Database.getRows('Claims');
    var filterObj = filter || {};
    var results = [];

    for (var i = rows.length - 1; i >= 0; i--) {
      var c = rows[i];

      if (filterObj.status && c.status !== filterObj.status) continue;
      if (filterObj.warranty_status && c.warranty_status !== filterObj.warranty_status) continue;

      if (filterObj.search) {
        var q = String(filterObj.search).trim().toLowerCase();
        var match = (
          (c.claim_no && c.claim_no.toLowerCase().indexOf(q) !== -1) ||
          (c.ticket_no && c.ticket_no.toLowerCase().indexOf(q) !== -1) ||
          (c.customer_name && c.customer_name.toLowerCase().indexOf(q) !== -1) ||
          (c.mobile && c.mobile.indexOf(q) !== -1) ||
          (c.original_serial_no && c.original_serial_no.toLowerCase().indexOf(q) !== -1) ||
          (c.replacement_serial_no && c.replacement_serial_no.toLowerCase().indexOf(q) !== -1) ||
          (c.battery_model && c.battery_model.toLowerCase().indexOf(q) !== -1) ||
          (c.dispatch_batch_no && c.dispatch_batch_no.toLowerCase().indexOf(q) !== -1) ||
          (c.company_challan_no && c.company_challan_no.toLowerCase().indexOf(q) !== -1)
        );
        if (!match) continue;
      }

      c.claim_date_formatted = Utils.formatDateIndian(c.claim_date);
      c.warranty_expiry_formatted = Utils.formatDateIndian(c.warranty_expiry_date);
      c.company_dispatch_formatted = Utils.formatDateIndian(c.company_dispatch_date);
      c.replacement_received_formatted = Utils.formatDateIndian(c.replacement_received_date);

      results.push(c);
    }
    return results;
  }

  /**
   * Universal Multi-Attribute Search across all entities.
   * Matches Ticket No, Claim No, Original Serial, Replacement Serial, Mobile, Customer, Dealer, Vehicle, Challan, Dispatch.
   */
  function universalSearch(searchQuery) {
    var raw = String(searchQuery || '').trim();
    if (!raw) return { tickets: [], claims: [], challans: [], count: 0 };

    var q = raw.toLowerCase();
    var cleanSerial = Utils.sanitizeSerial(raw).toLowerCase();

    var tickets = Database.getRows('Tickets');
    var claims = Database.getRows('Claims');
    var challans = Database.getRows('Delivery_Challans');

    var matchedTickets = [];
    var matchedClaims = [];
    var matchedChallans = [];

    // Search Tickets
    for (var i = 0; i < tickets.length; i++) {
      var t = tickets[i];
      var tSerial = Utils.sanitizeSerial(t.original_serial_no).toLowerCase();
      var sSerial = Utils.sanitizeSerial(t.service_battery_serial).toLowerCase();

      if (
        (t.ticket_no && t.ticket_no.toLowerCase().indexOf(q) !== -1) ||
        (t.customer_name && t.customer_name.toLowerCase().indexOf(q) !== -1) ||
        (t.dealer_name && t.dealer_name.toLowerCase().indexOf(q) !== -1) ||
        (t.mobile && t.mobile.indexOf(q) !== -1) ||
        (t.vehicle_number && t.vehicle_number.toLowerCase().indexOf(q) !== -1) ||
        (t.battery_model && t.battery_model.toLowerCase().indexOf(q) !== -1) ||
        (tSerial && tSerial.indexOf(cleanSerial) !== -1) ||
        (sSerial && sSerial.indexOf(cleanSerial) !== -1)
      ) {
        t.date_received_formatted = Utils.formatDateIndian(t.date_received);
        matchedTickets.push(t);
      }
    }

    // Search Claims
    for (var j = 0; j < claims.length; j++) {
      var c = claims[j];
      var cOrigSerial = Utils.sanitizeSerial(c.original_serial_no).toLowerCase();
      var cReplSerial = Utils.sanitizeSerial(c.replacement_serial_no).toLowerCase();

      if (
        (c.claim_no && c.claim_no.toLowerCase().indexOf(q) !== -1) ||
        (c.ticket_no && c.ticket_no.toLowerCase().indexOf(q) !== -1) ||
        (c.customer_name && c.customer_name.toLowerCase().indexOf(q) !== -1) ||
        (c.dealer_name && c.dealer_name.toLowerCase().indexOf(q) !== -1) ||
        (c.mobile && c.mobile.indexOf(q) !== -1) ||
        (c.battery_model && c.battery_model.toLowerCase().indexOf(q) !== -1) ||
        (c.dispatch_batch_no && c.dispatch_batch_no.toLowerCase().indexOf(q) !== -1) ||
        (c.company_challan_no && c.company_challan_no.toLowerCase().indexOf(q) !== -1) ||
        (c.stock_ref_no && c.stock_ref_no.toLowerCase().indexOf(q) !== -1) ||
        (cOrigSerial && cOrigSerial.indexOf(cleanSerial) !== -1) ||
        (cReplSerial && cReplSerial.indexOf(cleanSerial) !== -1)
      ) {
        c.claim_date_formatted = Utils.formatDateIndian(c.claim_date);
        c.company_dispatch_formatted = Utils.formatDateIndian(c.company_dispatch_date);
        c.replacement_received_formatted = Utils.formatDateIndian(c.replacement_received_date);
        matchedClaims.push(c);
      }
    }

    // Search Challans
    for (var k = 0; k < challans.length; k++) {
      var ch = challans[k];
      var chSerial = Utils.sanitizeSerial(ch.battery_serial_no).toLowerCase();

      if (
        (ch.challan_no && ch.challan_no.toLowerCase().indexOf(q) !== -1) ||
        (ch.recipient_name && ch.recipient_name.toLowerCase().indexOf(q) !== -1) ||
        (ch.mobile && ch.mobile.indexOf(q) !== -1) ||
        (ch.ticket_no && ch.ticket_no.toLowerCase().indexOf(q) !== -1) ||
        (chSerial && chSerial.indexOf(cleanSerial) !== -1)
      ) {
        ch.challan_date_formatted = Utils.formatDateIndian(ch.challan_date);
        matchedChallans.push(ch);
      }
    }

    return {
      query: raw,
      tickets: matchedTickets,
      claims: matchedClaims,
      challans: matchedChallans,
      count: matchedTickets.length + matchedClaims.length + matchedChallans.length
    };
  }

  /**
   * Reconstruct the complete end-to-end lifecycle timeline for a claim or ticket.
   */
  function getClaimTimeline(claimOrTicketNo) {
    var target = String(claimOrTicketNo).trim();
    var claim = null;
    var ticket = null;

    if (target.indexOf('CLM') === 0) {
      claim = Database.getRowById('Claims', 'claim_no', target);
      if (claim && claim.ticket_no) {
        ticket = Database.getRowById('Tickets', 'ticket_no', claim.ticket_no);
      }
    } else if (target.indexOf('TKT') === 0) {
      ticket = Database.getRowById('Tickets', 'ticket_no', target);
      claim = getClaimByTicket(target);
    } else {
      // Try finding by serial number
      var searchRes = universalSearch(target);
      if (searchRes.claims.length > 0) claim = searchRes.claims[0];
      if (searchRes.tickets.length > 0) ticket = searchRes.tickets[0];
    }

    if (!ticket && !claim) {
      throw new Error('No claim or ticket found matching: ' + target);
    }

    var events = [];

    // Milestone 1: Intake
    if (ticket) {
      events.push({
        milestone: 'INTAKE',
        title: 'Battery Intake',
        timestamp: ticket.created_at,
        date_formatted: Utils.formatDateIndian(ticket.date_received),
        actor: ticket.created_by || 'Front Desk',
        icon: 'inbox',
        badge: 'RECEIVED',
        badgeColor: 'blue',
        details: 'Received ' + ticket.battery_model + ' (Serial: ' + ticket.original_serial_no + ') from ' +
          ticket.customer_name + (ticket.service_battery_issued ? ' with loaner service battery ' + ticket.service_battery_serial : '')
      });
    }

    // Milestone 2: Testing
    var tests = ticket ? BatteryTestService.getTestsByTicket(ticket.ticket_no) : [];
    for (var t = 0; t < tests.length; t++) {
      var tst = tests[t];
      events.push({
        milestone: 'TESTING',
        title: 'Battery Testing: ' + tst.test_result,
        timestamp: tst.test_date,
        date_formatted: Utils.formatDateIndian(tst.test_date),
        actor: tst.tested_by,
        icon: tst.test_result === 'PASS' ? 'check-circle' : 'x-circle',
        badge: tst.test_result,
        badgeColor: tst.test_result === 'PASS' ? 'green' : 'rose',
        details: 'OCV: ' + (tst.open_circuit_voltage || '-') + 'V | Load: ' + (tst.load_test_voltage || '-') +
          'V | Remarks: ' + (tst.test_remarks || 'None')
      });
    }

    // Milestone 3: Return Challan (if rejected)
    if (ticket && (ticket.status === 'REJECTED_RETURN_PENDING' || ticket.status === 'REJECTED_RETURNED')) {
      var retChallan = ChallanService.getChallanForTicket(ticket.ticket_no);
      if (retChallan) {
        events.push({
          milestone: 'RETURN_CHALLAN',
          title: 'Return Challan ' + retChallan.challan_no,
          timestamp: retChallan.challan_date,
          date_formatted: Utils.formatDateIndian(retChallan.challan_date),
          actor: 'Store Keeper',
          icon: 'file-text',
          badge: retChallan.status,
          badgeColor: retChallan.status === 'ACKNOWLEDGED' ? 'green' : 'amber',
          details: 'Physical return challan for rejected battery (Qty 1)' +
            (retChallan.received_by_name ? '. Collected by: ' + retChallan.received_by_name : ' (Pending Handover)')
        });
      }
    }

    // Milestone 4: Claim Creation
    if (claim) {
      events.push({
        milestone: 'CLAIM_CREATED',
        title: 'Warranty Claim Registered: ' + claim.claim_no,
        timestamp: claim.created_at,
        date_formatted: Utils.formatDateIndian(claim.claim_date),
        actor: 'Warranty Officer',
        icon: 'shield',
        badge: claim.warranty_status,
        badgeColor: claim.warranty_status === 'IN_WARRANTY' ? 'purple' : 'amber',
        details: 'Warranty status calculated: ' + claim.warranty_status +
          ' (Expiry: ' + Utils.formatDateIndian(claim.warranty_expiry_date) + ')'
      });

      // Milestone 5: Documents
      var docs = DriveService.getClaimDocuments(claim.claim_no);
      for (var d = 0; d < docs.length; d++) {
        var doc = docs[d];
        events.push({
          milestone: 'DOCUMENT',
          title: 'Document Uploaded: ' + doc.doc_type,
          timestamp: doc.uploaded_at,
          date_formatted: Utils.formatDateTimeIndian(doc.uploaded_at),
          actor: doc.uploaded_by,
          icon: 'paperclip',
          badge: doc.doc_type,
          badgeColor: 'cyan',
          details: doc.file_name + ' (' + doc.file_size_kb + ' KB)'
        });
      }

      // Milestone 6: Company Dispatch
      if (claim.dispatch_batch_no) {
        events.push({
          milestone: 'DISPATCH',
          title: 'Dispatched to Manufacturer (' + claim.dispatch_batch_no + ')',
          timestamp: claim.company_dispatch_date,
          date_formatted: Utils.formatDateIndian(claim.company_dispatch_date),
          actor: 'Dispatch Manager',
          icon: 'truck',
          badge: 'SENT_TO_COMPANY',
          badgeColor: 'rose',
          details: 'Sent under Company Challan ' + claim.company_challan_no + ' to manufacturer'
        });
      }

      // Milestone 7: Replacement Received
      if (claim.replacement_serial_no) {
        events.push({
          milestone: 'REPLACEMENT',
          title: 'Replacement Battery Received',
          timestamp: claim.replacement_received_date,
          date_formatted: Utils.formatDateIndian(claim.replacement_received_date),
          actor: 'Inventory Inward',
          icon: 'package',
          badge: 'REPLACEMENT_RECEIVED',
          badgeColor: 'emerald',
          details: 'Model: ' + claim.replacement_model + ' | Replacement Serial: ' + claim.replacement_serial_no +
            ' (Original Serial ' + claim.original_serial_no + ' preserved)'
        });
      }

      // Milestone 8: Stock Update
      if (claim.stock_status === 'UPDATED') {
        events.push({
          milestone: 'STOCK_UPDATE',
          title: 'Physical Stock Reconciled',
          timestamp: claim.stock_updated_date,
          date_formatted: Utils.formatDateIndian(claim.stock_updated_date),
          actor: claim.stock_updated_by || 'Accountant',
          icon: 'database',
          badge: 'STOCK_UPDATED',
          badgeColor: 'teal',
          details: 'Entered into inventory system under voucher reference: ' + (claim.stock_ref_no || '-')
        });
      }

      // Milestone 9: Closure
      if (claim.status === 'CLOSED') {
        events.push({
          milestone: 'CLOSED',
          title: 'Claim Finalized & Closed',
          timestamp: claim.closed_date,
          date_formatted: Utils.formatDateIndian(claim.closed_date),
          actor: 'Service Advisor',
          icon: 'check-circle-2',
          badge: 'CLOSED',
          badgeColor: 'slate',
          details: 'New replacement battery handed over to customer/dealer. Case complete.'
        });
      }
    }

    // Sort chronologically
    events.sort(function (a, b) {
      var timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      var timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

    return {
      target: target,
      ticket: ticket,
      claim: claim,
      events: events
    };
  }

  return {
    STATUS: STATUS,
    createClaim: createClaim,
    getClaimByTicket: getClaimByTicket,
    getClaimByNo: getClaimByNo,
    getClaims: getClaims,
    universalSearch: universalSearch,
    getClaimTimeline: getClaimTimeline
  };
})();
