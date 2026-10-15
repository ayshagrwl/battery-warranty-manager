/**
 * Code.gs
 * Web App entry point (doGet), HTML templating, and secure RPC API dispatcher.
 */

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};

  // 1. Instant Health Check & Diagnostic endpoint
  if (params.test === 'true' || params.check === 'true') {
    var checkResult = Database.checkDatabaseConnection();
    return ContentService.createTextOutput(JSON.stringify(checkResult, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Diagnostic API endpoints for verification
  if (params.api === 'dashboard' || params.dashboard === 'true') {
    return ContentService.createTextOutput(JSON.stringify(apiGetDashboard(), null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (params.api === 'tickets' || params.tickets === 'true') {
    return ContentService.createTextOutput(JSON.stringify(apiListTickets({}), null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (params.api === 'initial') {
    return ContentService.createTextOutput(JSON.stringify(apiGetInitialData(), null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Cross-Domain REST API dispatcher for GitHub Pages (GET)
  if (params.action) {
    var getArgs = [];
    if (params.args) {
      try { getArgs = JSON.parse(params.args); } catch (e) { getArgs = [params.args]; }
    } else if (params.data) {
      try { getArgs = [JSON.parse(params.data)]; } catch (e) { getArgs = [params.data]; }
    }
    if (!Array.isArray(getArgs)) getArgs = [getArgs];

    var getResult = executeApiAction(params.action, getArgs);
    return ContentService.createTextOutput(JSON.stringify(getResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Self-service initialization and seeding via URL
  if (params.init === 'true' || params.seed === 'true') {
    Database.setupDatabase();
    if (params.seed === 'true') {
      Database.seedDemoData();
    }
    var initStatus = Database.checkDatabaseConnection();
    return ContentService.createTextOutput(JSON.stringify({
      status: 'SUCCESS',
      message: params.seed === 'true' ? 'Database initialized and demo data seeded!' : 'Database initialized with 14 schema tabs!',
      report: initStatus
    }, null, 2)).setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Auto-initialize database on first web visit if Config tab missing
  try {
    var ss = Database.getSpreadsheet();
    if (ss && !ss.getSheetByName('Config')) {
      Database.setupDatabase();
    }
  } catch (initErr) {
    Logger.log('Auto-setup error: ' + initErr.message);
  }

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
  var compName = 'Battery Warranty Manager';
  try {
    compName = Config.get('COMPANY_NAME', compName);
  } catch (e) { }

  template.companyName = compName;
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
  var template;
  try {
    template = HtmlService.createTemplateFromFile(filename);
  } catch (e) {
    var baseName = filename.indexOf('/') !== -1 ? filename.split('/').pop() : filename;
    template = HtmlService.createTemplateFromFile(baseName);
  }
  template.data = printData;
  return template.evaluate()
    .setTitle((printData && printData.company ? printData.company.name : 'Battery Hub') + ' - Document')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function apiGetAuditLog() {
  try {
    return Utils.success(Database.getRows('Audit_Log'));
  } catch (err) {
    return Utils.error(err.message);
  }
}

// ─── CLIENT RPC APIS ──────────────────────────────────────────────────────────

function apiGetInitialData() {
  try {
    var ss = Database.getSpreadsheet();
    if (ss && !ss.getSheetByName('Config')) {
      Database.setupDatabase();
    }
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

function apiCheckConnection() {
  try {
    return Utils.success(Database.checkDatabaseConnection(), 'Connection verified successfully.');
  } catch (err) {
    return Utils.error(err.message);
  }
}

// ─── CROSS-ORIGIN REST DISPATCHER & DOPOST (FOR GITHUB PAGES) ─────────────────

function executeApiAction(action, args) {
  if (!args) args = [];
  if (!Array.isArray(args)) args = [args];

  var apiMap = {
    'apiGetInitialData': function() { return apiGetInitialData(); },
    'apiGetDashboard': function() { return apiGetDashboard(); },
    'apiCreateTicket': function(a) { return apiCreateTicket(a[0]); },
    'apiRecordBatteryTest': function(a) { return apiRecordBatteryTest(a[0]); },
    'apiGetTicket': function(a) { return apiGetTicket(a[0]); },
    'apiListTickets': function(a) { return apiListTickets(a[0]); },
    'apiCreateClaim': function(a) { return apiCreateClaim(a[0]); },
    'apiGetClaim': function(a) { return apiGetClaim(a[0]); },
    'apiListClaims': function(a) { return apiListClaims(a[0]); },
    'apiGetPendingForCompany': function() { return apiGetPendingForCompany(); },
    'apiGetReplacementPending': function() { return apiGetReplacementPending(); },
    'apiCreateReturnChallan': function(a) { return apiCreateReturnChallan(a[0]); },
    'apiMarkChallanReturned': function(a) { return apiMarkChallanReturned(a[0]); },
    'apiCreateCompanyDispatch': function(a) { return apiCreateCompanyDispatch(a[0]); },
    'apiRecordReplacementReceived': function(a) { return apiRecordReplacementReceived(a[0]); },
    'apiRecordStockUpdated': function(a) { return apiRecordStockUpdated(a[0]); },
    'apiCloseClaim': function(a) { return apiCloseClaim(a[0]); },
    'apiUploadDocument': function(a) { return apiUploadDocument(a[0]); },
    'apiDownloadClaimZip': function(a) { return apiDownloadClaimZip(a[0]); },
    'apiSearchUniversal': function(a) { return apiSearchUniversal(a[0]); },
    'apiGetReports': function() { return apiGetReports(); },
    'apiCalculateWarranty': function(a) { return apiCalculateWarranty(a[0], a[1], a[2]); },
    'apiSaveConfig': function(a) { return apiSaveConfig(a[0]); },
    'apiCheckConnection': function() { return apiCheckConnection(); },
    'apiGetAuditLog': function() { return apiGetAuditLog(); }
  };

  if (apiMap.hasOwnProperty(action)) {
    return apiMap[action](args);
  }
  return Utils.error('Action [' + action + '] not recognized by backend.');
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload;
    try {
      payload = JSON.parse(raw);
    } catch (parseErr) {
      payload = (e && e.parameter) ? e.parameter : {};
    }
    var action = payload.action || (e && e.parameter ? e.parameter.action : '');
    var args = payload.args || (payload.data !== undefined ? [payload.data] : []);
    if (!Array.isArray(args)) args = [args];

    var result = executeApiAction(action, args);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message,
      data: null
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

