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
    var claimNos = data ? data.claim_nos : null;
    if (!claimNos || !Array.isArray(claimNos) || claimNos.length === 0) {
      throw new Error('At least one claim must be selected for company dispatch');
    }

    var companyName = String(data.company_name || '').trim();
    if (!companyName) throw new Error('Battery company / manufacturer name is required');

    var destination = String(data.destination || data.company_name || '').trim();
    var transporter = String(data.transporter || data.transport_name || data.carrier || '').trim();
    var lrDocket = String(data.lr_docket_no || data.docket_number || data.docket_no || '').trim();
    var remarks = String(data.remarks || '').trim();

    var batchNo = Utils.getNextId('DISPATCH_PREFIX', 'DISPATCH_SEQ', 6);
    var challanNo = Utils.getNextId('COMPANY_CHALLAN_PREFIX', 'COMPANY_CHALLAN_SEQ', 6);
    var dispatchDateIso = data.dispatch_date ? Utils.toIsoDate(data.dispatch_date) : Utils.toIsoDate(new Date());
    if (!dispatchDateIso) dispatchDateIso = Utils.toIsoDate(new Date());
    var nowIso = new Date().toISOString();
    var userEmail = Utils.getCurrentUserEmail();

    var batchRecord = {
      dispatch_batch_no: batchNo,
      company_name: companyName,
      destination: destination,
      company_challan_no: challanNo,
      dispatch_date: dispatchDateIso,
      carrier_transporter: transporter,
      lr_docket_no: lrDocket,
      claim_count: claimNos.length,
      battery_count: claimNos.length,
      created_by: userEmail,
      remarks: remarks
    };

    Database.appendRow('Company_Dispatches', batchRecord);

    // Also record consolidated company delivery challan
    var challanRecord = {
      challan_no: challanNo,
      challan_type: ChallanService.TYPE.COMPANY_DISPATCH,
      challan_date: dispatchDateIso,
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
        customer_name: claim.customer_name || claim.dealer_name || '',
        battery_model: claim.battery_model,
        original_serial_no: claim.original_serial_no,
        warranty_status: claim.warranty_status
      });

      var oldStatus = claim.status;
      Database.updateRow('Claims', 'claim_no', claim.claim_no, {
        status: 'SENT_TO_COMPANY',
        dispatch_batch_no: batchNo,
        company_challan_no: challanNo,
        company_dispatch_date: dispatchDateIso,
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
      claim_count: processedClaims.length,
      claims_count: processedClaims.length,
      battery_count: processedClaims.length,
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
  function getPrintData(companyChallanOrBatchId) {
    if (!companyChallanOrBatchId) throw new Error('Company challan number or batch number is required');
    var rawId = String(companyChallanOrBatchId).trim();
    var cleanId = rawId.replace(/^PENDING\s*\((.*?)\)$/i, '$1').trim();

    // 1. Check Delivery_Challans for company challan
    var challans = Database.getRows('Delivery_Challans');
    var challan = null;
    for (var i = 0; i < challans.length; i++) {
      if ((challans[i].challan_no === rawId || challans[i].challan_no === cleanId) &&
          (challans[i].challan_type === ChallanService.TYPE.COMPANY_DISPATCH || challans[i].recipient_type === 'COMPANY' || String(challans[i].challan_no).indexOf('COM') !== -1)) {
        challan = challans[i];
        break;
      }
    }

    // 2. Check Company_Dispatches for batch or challan
    var dispatches = Database.getRows('Company_Dispatches');
    var dispatch = null;
    for (var d = 0; d < dispatches.length; d++) {
      if (dispatches[d].company_challan_no === rawId || dispatches[d].company_challan_no === cleanId ||
          dispatches[d].dispatch_batch_no === rawId || dispatches[d].dispatch_batch_no === cleanId) {
        dispatch = dispatches[d];
        break;
      }
    }

    // 2b. If not matched, check if passed rawId is a Claim or Ticket ID
    if (!dispatch && !challan) {
      var allClaims = Database.getRows('Claims');
      for (var clIdx = 0; clIdx < allClaims.length; clIdx++) {
        var clmRecord = allClaims[clIdx];
        if (clmRecord.claim_no === rawId || clmRecord.claim_no === cleanId ||
            clmRecord.ticket_no === rawId || clmRecord.ticket_no === cleanId ||
            clmRecord.original_serial_no === rawId || clmRecord.original_serial_no === cleanId) {
          var targetBatch = clmRecord.dispatch_batch_no;
          var targetChallan = clmRecord.company_challan_no;
          if (targetBatch || targetChallan) {
            for (var d2 = 0; d2 < dispatches.length; d2++) {
              if ((targetBatch && dispatches[d2].dispatch_batch_no === targetBatch) ||
                  (targetChallan && dispatches[d2].company_challan_no === targetChallan)) {
                dispatch = dispatches[d2];
                break;
              }
            }
            if (!dispatch && targetChallan) {
              for (var ch2 = 0; ch2 < challans.length; ch2++) {
                if (challans[ch2].challan_no === targetChallan) {
                  challan = challans[ch2];
                  break;
                }
              }
            }
          }
          break;
        }
      }
    }

    // If dispatch found and challan wasn't matched directly, find challan from dispatch
    if (dispatch && !challan) {
      for (var j = 0; j < challans.length; j++) {
        if (challans[j].challan_no === dispatch.company_challan_no) {
          challan = challans[j];
          break;
        }
      }
    }

    // If challan exists but dispatch wasn't matched directly, find dispatch from challan
    if (challan && !dispatch) {
      for (var k = 0; k < dispatches.length; k++) {
        if (dispatches[k].company_challan_no === challan.challan_no) {
          dispatch = dispatches[k];
          break;
        }
      }
    }

    // 3. Resolve items from Company_Dispatch_Items
    var items = [];
    var allItems = Database.getRows('Company_Dispatch_Items');
    var batchNo = dispatch ? dispatch.dispatch_batch_no : (challan ? challan.challan_no : rawId);

    var claimsCache = null;
    for (var m = 0; m < allItems.length; m++) {
      if (allItems[m].dispatch_batch_no === batchNo || (dispatch && allItems[m].dispatch_batch_no === dispatch.dispatch_batch_no)) {
        var itm = allItems[m];
        if (!itm.ticket_no || !itm.customer_name) {
          if (!claimsCache) claimsCache = Database.getRows('Claims');
          for (var clIdx2 = 0; clIdx2 < claimsCache.length; clIdx2++) {
            if (claimsCache[clIdx2].claim_no === itm.claim_no) {
              if (!itm.ticket_no) itm.ticket_no = claimsCache[clIdx2].ticket_no;
              if (!itm.customer_name) itm.customer_name = claimsCache[clIdx2].customer_name || claimsCache[clIdx2].dealer_name || 'Customer';
              break;
            }
          }
        }
        items.push(itm);
      }
    }

    // 4. Fallback: if items array empty, resolve from Claims table
    if (items.length === 0) {
      var allClaimsFallback = Database.getRows('Claims');
      for (var c = 0; c < allClaimsFallback.length; c++) {
        var clm = allClaimsFallback[c];
        if ((dispatch && dispatch.dispatch_batch_no && clm.dispatch_batch_no === dispatch.dispatch_batch_no) ||
            (challan && challan.challan_no && clm.company_challan_no === challan.challan_no) ||
            (dispatch && dispatch.company_challan_no && clm.company_challan_no === dispatch.company_challan_no) ||
            clm.company_challan_no === rawId || clm.company_challan_no === cleanId ||
            clm.dispatch_batch_no === rawId || clm.dispatch_batch_no === cleanId) {
          items.push({
            item_id: 'DPI-SYNTH-' + (items.length + 1),
            dispatch_batch_no: clm.dispatch_batch_no || batchNo,
            claim_no: clm.claim_no,
            ticket_no: clm.ticket_no,
            customer_name: clm.customer_name || clm.dealer_name || 'Customer',
            battery_model: clm.battery_model,
            original_serial_no: clm.original_serial_no,
            warranty_status: clm.warranty_status || 'IN_WARRANTY'
          });
        }
      }
    }

    // 5. If still no items, generate fallback item
    if (items.length === 0 && (dispatch || challan)) {
      items.push({
        item_id: 'DPI-SYNTH-1',
        dispatch_batch_no: batchNo,
        claim_no: (dispatch ? dispatch.company_challan_no : (challan ? challan.challan_no : 'BATCH-1')),
        ticket_no: (challan ? challan.ticket_no : '-'),
        customer_name: (challan ? challan.recipient_name : (dispatch ? dispatch.company_name : 'Customer')),
        battery_model: (challan ? challan.battery_model : 'Consolidated Battery Batch'),
        original_serial_no: (challan ? challan.battery_serial_no : 'BATCH-' + batchNo),
        warranty_status: 'IN_WARRANTY'
      });
    }

    var todayIso = Utils.toIsoDate(new Date());
    if (!dispatch && challan) {
      dispatch = {
        dispatch_batch_no: 'DSP-' + challan.challan_no,
        company_name: challan.recipient_name || 'Battery Manufacturer Depot',
        destination: challan.address || 'Regional Service Depot',
        company_challan_no: challan.challan_no,
        dispatch_date: challan.challan_date || todayIso,
        carrier_transporter: 'Direct Transport',
        lr_docket_no: '-',
        claim_count: items.length || 1,
        battery_count: items.length || 1,
        created_by: 'Store Manager',
        remarks: challan.remarks || ''
      };
    }

    if (!challan && dispatch) {
      challan = {
        challan_no: dispatch.company_challan_no || ('DC-COM-' + dispatch.dispatch_batch_no),
        challan_type: ChallanService.TYPE.COMPANY_DISPATCH,
        challan_date: dispatch.dispatch_date || todayIso,
        recipient_type: 'COMPANY',
        recipient_name: dispatch.company_name || 'Battery Manufacturer Depot',
        address: dispatch.destination || 'Regional Service Depot',
        battery_model: 'Consolidated Batch (' + items.length + ' Batteries)',
        battery_serial_no: 'BATCH-' + dispatch.dispatch_batch_no,
        quantity: items.length || 1,
        status: 'DISPATCHED',
        remarks: 'Transporter: ' + (dispatch.carrier_transporter || '-') + ', LR/Docket: ' + (dispatch.lr_docket_no || '-')
      };
    }

    if (!challan && !dispatch) {
      throw new Error('Company dispatch or challan record not found for: ' + rawId);
    }

    if (challan && challan.challan_date && !challan.challan_date_formatted) {
      challan.challan_date_formatted = Utils.formatDateIndian(challan.challan_date);
    }
    if (dispatch && dispatch.dispatch_date && !dispatch.dispatch_date_formatted) {
      dispatch.dispatch_date_formatted = Utils.formatDateIndian(dispatch.dispatch_date);
    }

    var config = Config.getAll();
    var gstVal = config.COMPANY_GST || config.COMPANY_GSTIN || '24AAACG1234A1Z5';

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
      dispatch: dispatch,
      items: items
    };
  }

  return {
    getPendingClaims: getPendingClaims,
    createCompanyDispatch: createCompanyDispatch,
    getDispatchByBatchNo: getDispatchByBatchNo,
    getPrintData: getPrintData,
    getCompanyChallanPrintData: getPrintData,
    getClaimFormPrintData: function (id) { return ClaimService.getClaimFormPrintData(id); }
  };
})();
