/**
 * Code.gs
 * Web App entry point (doGet), HTML templating, and secure RPC API dispatcher.
 */

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var page = params.page || 'app';

  // Handle direct print views
  if (page === 'print-return-challan' && params.id) {
    return renderPrintTemplate('templates/return-challan', ChallanService.getChallanPrintData(params.id));
  }
  if (page === 'print-company-challan' && params.id) {
    return renderPrintTemplate('templates/company-challan', DispatchService.getCompanyChallanPrintData(params.id));
  }
  if (page === 'print-claim-form' && params.id) {
    return renderPrintTemplate('templates/claim-form', DispatchService.getClaimFormPrintData(params.id));
  }

  // Render primary single page app
  var template = HtmlService.createTemplateFromFile('Index');
  template.companyName = Config.get('COMPANY_NAME', 'Battery Warranty Manager');
  template.subtitle = 'Warranty Claims & Battery Service Management';

  return template.evaluate()
    .setTitle(template.companyName)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function renderPrintTemplate(filename, printData) {
  var template = HtmlService.createTemplateFromFile(filename);
  template.data = printData;
  return template.evaluate()
    .setTitle(printData.company.name + ' - Document')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── CLIENT RPC APIS ──────────────────────────────────────────────────────────

function apiGetInitialData() {
  try {
    return Utils.success({
      config: Config.getAll(),
      models: WarrantyService.getActiveModels(),
      dealers: Database.getRows('Dealers'),
      currentUser: AuthService.getCurrentUser()
    });
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiGetDashboard() {
  try {
    return Utils.success(ReportService.getDashboardSummary());
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiCreateTicket(ticketData) {
  try {
    var ticket = TicketService.createTicket(ticketData);
    return Utils.success(ticket, 'Ticket ' + ticket.ticket_no + ' created successfully.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiRecordBatteryTest(testData) {
  try {
    var res = TicketService.recordBatteryTest(testData);
    return Utils.success(res, 'Test recorded successfully. Battery marked ' + testData.test_result + '.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiGetTicket(ticketNo) {
  try {
    var ticket = TicketService.getTicketDetails(ticketNo);
    if (!ticket) return Utils.error('Ticket not found: ' + ticketNo);
    return Utils.success(ticket);
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiListTickets(filter) {
  try {
    return Utils.success(TicketService.listTickets(filter));
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiCreateClaim(claimData) {
  try {
    var claim = ClaimService.createClaim(claimData);
    return Utils.success(claim, 'Warranty Claim ' + claim.claim_no + ' created successfully.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiGetClaim(claimNo) {
  try {
    var claim = ClaimService.getClaimDetails(claimNo);
    if (!claim) return Utils.error('Claim not found: ' + claimNo);
    return Utils.success(claim);
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiListClaims(filter) {
  try {
    return Utils.success(ClaimService.listClaims(filter));
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiGetPendingForCompany() {
  try {
    return Utils.success(ClaimService.getPendingForCompany());
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiGetReplacementPending() {
  try {
    return Utils.success(ClaimService.getReplacementPending());
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiCreateReturnChallan(ticketNo) {
  try {
    var challan = ChallanService.createReturnChallan(ticketNo);
    return Utils.success(challan, 'Return Delivery Challan ' + challan.challan_no + ' created.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiMarkChallanReturned(data) {
  try {
    var challan = ChallanService.markChallanReturned(data);
    return Utils.success(challan, 'Battery marked returned. Acknowledgement recorded.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiCreateCompanyDispatch(data) {
  try {
    var dispatch = DispatchService.createCompanyDispatch(data);
    return Utils.success(dispatch, 'Dispatched ' + dispatch.claim_count + ' batteries. Challan: ' + dispatch.company_challan_no);
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiRecordReplacementReceived(data) {
  try {
    var res = ReplacementService.recordReplacementReceived(data);
    return Utils.success(res, 'Replacement serial ' + res.replacement_serial_no + ' received. Stock update required.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiRecordStockUpdated(data) {
  try {
    var res = ReplacementService.recordStockUpdated(data);
    return Utils.success(res, 'Physical inventory stock update confirmed.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiCloseClaim(data) {
  try {
    var res = ReplacementService.closeClaim(data);
    return Utils.success(res, 'Claim ' + res.claim_no + ' marked closed.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiUploadDocument(data) {
  try {
    var doc = DriveService.uploadDocument(data);
    return Utils.success(doc, 'Document ' + doc.file_name + ' uploaded to Drive.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiDownloadClaimZip(claimNo) {
  try {
    var res = DriveService.createClaimDocumentZip(claimNo);
    return Utils.success(res, 'Claim document zip archive created.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiSearchUniversal(query) {
  try {
    return Utils.success(ClaimService.searchUniversal(query));
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiGetReports() {
  try {
    return Utils.success(ReportService.getDetailedReports());
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiCalculateWarranty(modelName, dateOfSale) {
  try {
    return Utils.success(WarrantyService.calculateWarranty(modelName, dateOfSale));
  } catch (err) {
    return Utils.error(err.message);
  }
}

function apiSaveConfig(configData) {
  try {
    if (!AuthService.isAdmin()) {
      return Utils.error('Only administrators can update settings.');
    }
    for (var k in configData) {
      if (configData.hasOwnProperty(k)) {
        Config.set(k, configData[k]);
      }
    }
    return Utils.success(Config.getAll(), 'Settings updated successfully.');
  } catch (err) {
    return Utils.error(err.message);
  }
}
