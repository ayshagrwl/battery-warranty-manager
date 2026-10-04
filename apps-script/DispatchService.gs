/**
 * DispatchService.gs
 * Consolidated company dispatch batch generation, company delivery challans, and SENT_TO_COMPANY transitions.
 */

var DispatchService = (function () {
  /**
   * Retrieve all claims waiting to be dispatched to the battery manufacturer.
   */
  function getPendingClaims() {
    var claims = Database.getRows('Claims');
    var pending = [];

    for (var i = 0; i < claims.length; i++) {
      var c = claims[i];
      if (c.status === 'READY_FOR_COMPANY' || c.status === 'CLAIM_CREATED') {
        c.claim_date_formatted = Utils.formatDateIndian(c.claim_date);
        c.warranty_expiry_formatted = Utils.formatDateIndian(c.warranty_expiry_date);
        c.days_pending_dispatch = Utils.diffDays(c.claim_date);
        pending.push(c);
      }
    }

    pending.sort(function (a, b) {
      return new Date(a.claim_date).getTime() - new Date(b.claim_date).getTime();
    });

    return pending;
  }

  /**
   * Consolidate selected claims into a company dispatch batch and generate delivery challan.
   */
  function createCompanyDispatch(data) {
    var claimNos = data.claim_nos;
    if (!claimNos || !Array.isArray(claimNos) || claimNos.length === 0) {
      throw new Error('At least one claim must be selected for company dispatch');
    }

    var companyName = String(data.company_name || '').trim();
    if (!companyName) throw new Error('Battery company / manufacturer name is required');

    var destination = String(data.destination || '').trim();
    var transporter = String(data.transporter || '').trim();
    var lrDocket = String(data.lr_docket_no || '').trim();
    var remarks = String(data.remarks || '').trim();

    var batchNo = Utils.getNextId('DISPATCH_PREFIX', 'DISPATCH_SEQ', 6);
    var challanNo = Utils.getNextId('COMPANY_CHALLAN_PREFIX', 'COMPANY_CHALLAN_SEQ', 6);
    var todayIso = Utils.toIsoDate(new Date());
    var nowIso = new Date().toISOString();
    var userEmail = Utils.getCurrentUserEmail();

    var batchRecord = {
      dispatch_batch_no: batchNo,
      company_name: companyName,
      destination: destination,
      company_challan_no: challanNo,
      dispatch_date: todayIso,
      carrier_transporter: transporter,
      lr_docket_no: lrDocket,
      claim_count: claimNos.length,
      battery_count: claimNos.length,
      created_by: userEmail,
      remarks: remarks
    };

    Database.appendRow('Company_Dispatches', batchRecord);

    // Also record consolidated company delivery challan
    var config = Config.getAll();
    var challanRecord = {
      challan_no: challanNo,
      challan_type: ChallanService.TYPE.COMPANY_DISPATCH,
      challan_date: todayIso,
      recipient_type: 'COMPANY',
      recipient_name: companyName,
      mobile: '',
      address: destination,
      ticket_no: '',
      battery_model: 'Consolidated Batch (' + claimNos.length + ' Batteries)',
      battery_serial_no: 'BATCH-' + batchNo,
      quantity: claimNos.length,
      received_by_name: '',
      received_date: '',
      status: ChallanService.STATUS.GENERATED,
      remarks: 'Consolidated company dispatch. Transporter: ' + transporter + ', LR/Docket: ' + lrDocket
    };
    Database.appendRow('Delivery_Challans', challanRecord);

    // Link each individual claim
    var processedClaims = [];
    for (var i = 0; i < claimNos.length; i++) {
      var cNo = claimNos[i];
      var claim = Database.getRowById('Claims', 'claim_no', cNo);
      if (!claim) continue;

      var currentYear = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');
      var itemId = 'DPI-' + currentYear + '-' + Utilities.getUuid().substring(0, 6).toUpperCase();

      Database.appendRow('Company_Dispatch_Items', {
        item_id: itemId,
        dispatch_batch_no: batchNo,
        claim_no: claim.claim_no,
        customer_name: claim.customer_name,
        battery_model: claim.battery_model,
        original_serial_no: claim.original_serial_no,
        warranty_status: claim.warranty_status
      });

      var oldStatus = claim.status;
      Database.updateRow('Claims', 'claim_no', claim.claim_no, {
        status: 'SENT_TO_COMPANY',
        dispatch_batch_no: batchNo,
        company_challan_no: challanNo,
        company_dispatch_date: todayIso,
        updated_at: nowIso
      });

      if (claim.ticket_no) {
        Database.updateRow('Tickets', 'ticket_no', claim.ticket_no, {
          status: 'SENT_TO_COMPANY',
          updated_at: nowIso
        });
      }

      AuditService.log(
        'SENT_TO_COMPANY',
        AuditService.RECORD_TYPE.CLAIM,
        claim.claim_no,
        oldStatus,
        'SENT_TO_COMPANY',
        'Dispatched to ' + companyName + ' under Batch ' + batchNo + ' / Challan ' + challanNo + ' (LR: ' + lrDocket + ')',
        userEmail
      );

      processedClaims.push(claim.claim_no);
    }

    AuditService.log(
      'DISPATCH_BATCH',
      AuditService.RECORD_TYPE.DISPATCH,
      batchNo,
      '',
      'SENT_TO_COMPANY',
      'Consolidated batch created for ' + processedClaims.length + ' claims to ' + companyName + ' (' + destination + ')',
      userEmail
    );

    return {
      dispatch_batch_no: batchNo,
      company_challan_no: challanNo,
      claims_count: processedClaims.length,
      claims: processedClaims
    };
  }

  /**
   * Retrieve full details of a dispatch batch including itemized claims.
   */
  function getDispatchByBatchNo(batchNo) {
    var batch = Database.getRowById('Company_Dispatches', 'dispatch_batch_no', batchNo);
    if (!batch) return null;

    batch.dispatch_date_formatted = Utils.formatDateIndian(batch.dispatch_date);

    var items = Database.getRows('Company_Dispatch_Items');
    var batchItems = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].dispatch_batch_no === batchNo) {
        batchItems.push(items[i]);
      }
    }
    batch.items = batchItems;
    return batch;
  }

  /**
   * Get print data for company consolidated delivery challan.
   */
  function getPrintData(companyChallanNo) {
    var challans = Database.getRows('Delivery_Challans');
    var challan = null;
    for (var i = 0; i < challans.length; i++) {
      if (challans[i].challan_no === companyChallanNo) {
        challan = challans[i];
        break;
      }
    }
    if (!challan) throw new Error('Company challan ' + companyChallanNo + ' not found');

    var dispatches = Database.getRows('Company_Dispatches');
    var dispatch = null;
    for (var d = 0; d < dispatches.length; d++) {
      if (dispatches[d].company_challan_no === companyChallanNo) {
        dispatch = dispatches[d];
        break;
      }
    }

    var items = [];
    if (dispatch) {
      var allItems = Database.getRows('Company_Dispatch_Items');
      for (var k = 0; k < allItems.length; k++) {
        if (allItems[k].dispatch_batch_no === dispatch.dispatch_batch_no) {
          items.push(allItems[k]);
        }
      }
    }

    var config = Config.getAll();
    return {
      company: {
        name: config.COMPANY_NAME || 'Battery Hub & Service Center',
        address: config.COMPANY_ADDRESS || '',
        phone: config.COMPANY_PHONE || '',
        email: config.COMPANY_EMAIL || '',
        gst: config.COMPANY_GST || ''
      },
      challan: challan,
      dispatch: dispatch,
      items: items
    };
  }

  return {
    getPendingClaims: getPendingClaims,
    createCompanyDispatch: createCompanyDispatch,
    getDispatchByBatchNo: getDispatchByBatchNo,
    getPrintData: getPrintData
  };
})();
