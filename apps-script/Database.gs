/**
 * Database.gs
 * Google Sheets Data Access Layer, Database Setup, and Demo Seeder.
 */

var Database = (function () {
  var SCHEMA_DEF = {
    'Config': ['key', 'value', 'description'],
    'Users': ['user_id', 'email', 'name', 'role', 'status', 'created_at'],
    'Battery_Models': ['model_id', 'brand', 'model_name', 'capacity_ah', 'warranty_months', 'guarantee_months', 'pro_rata_months', 'is_active'],
    'Dealers': ['dealer_id', 'dealer_name', 'contact_person', 'mobile', 'address', 'gstin', 'is_active'],
    'Customers': ['customer_id', 'name', 'mobile', 'address', 'vehicle_number', 'created_at'],
    'Tickets': [
      'ticket_no', 'source_type', 'customer_id', 'customer_name', 'dealer_id', 'dealer_name',
      'mobile', 'address', 'vehicle_number', 'battery_model', 'original_serial_no', 'date_received',
      'service_battery_issued', 'service_battery_model', 'service_battery_serial', 'service_battery_date',
      'status', 'remarks', 'created_at', 'updated_at', 'created_by'
    ],
    'Battery_Tests': [
      'test_id', 'ticket_no', 'original_serial_no', 'test_date', 'tested_by',
      'open_circuit_voltage', 'specific_gravity', 'load_test_voltage', 'physical_condition',
      'test_result', 'test_remarks', 'report_file_id'
    ],
    'Claims': [
      'claim_no', 'ticket_no', 'source_type', 'customer_name', 'mobile', 'address', 'dealer_name',
      'vehicle_number', 'battery_model', 'original_serial_no', 'date_of_sale', 'warranty_months',
      'warranty_expiry_date', 'warranty_status', 'claim_date', 'status', 'dispatch_batch_no',
      'company_challan_no', 'company_dispatch_date', 'replacement_model', 'replacement_serial_no',
      'replacement_received_date', 'stock_status', 'stock_ref_no', 'stock_updated_date',
      'stock_updated_by', 'closed_date', 'remarks', 'created_at', 'updated_at'
    ],
    'Claim_Documents': [
      'doc_id', 'claim_no', 'doc_type', 'file_name', 'drive_file_id', 'mime_type',
      'file_size_kb', 'uploaded_at', 'uploaded_by'
    ],
    'Delivery_Challans': [
      'challan_no', 'challan_type', 'challan_date', 'recipient_type', 'recipient_name',
      'mobile', 'address', 'ticket_no', 'battery_model', 'battery_serial_no', 'quantity',
      'received_by_name', 'received_date', 'status', 'remarks'
    ],
    'Company_Dispatches': [
      'dispatch_batch_no', 'company_name', 'destination', 'company_challan_no', 'dispatch_date',
      'carrier_transporter', 'lr_docket_no', 'claim_count', 'battery_count', 'created_by', 'remarks'
    ],
    'Company_Dispatch_Items': [
      'item_id', 'dispatch_batch_no', 'claim_no', 'customer_name', 'battery_model',
      'original_serial_no', 'warranty_status'
    ],
    'Replacement_Receipts': [
      'receipt_id', 'claim_no', 'replacement_model', 'replacement_serial_no',
      'received_date', 'received_by', 'remarks'
    ],
    'Stock_Update_Log': [
      'stock_task_id', 'claim_no', 'replacement_model', 'replacement_serial_no',
      'received_date', 'stock_status', 'accounting_ref_no', 'updated_at', 'updated_by', 'remarks'
    ],
    'Audit_Log': [
      'audit_id', 'timestamp', 'user_email', 'action', 'record_type', 'record_id',
      'old_status', 'new_status', 'details'
    ]
  };

  function getSpreadsheet() {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('SPREADSHEET_ID');
    if (sheetId) {
      try {
        return SpreadsheetApp.openById(sheetId);
      } catch (e) {
        // Fallback to active spreadsheet
      }
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  function getSheet(name) {
    var ss = getSpreadsheet();
    if (!ss) {
      throw new Error('Spreadsheet not accessible. Set SPREADSHEET_ID in Script Properties.');
    }
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      throw new Error('Sheet "' + name + '" does not exist. Run setupDatabase() first.');
    }
    return sheet;
  }

  function getRows(sheetName) {
    var sheet = getSheet(sheetName);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var headers = data[0];
    var rows = [];

    for (var r = 1; r < data.length; r++) {
      var row = {};
      var hasData = false;
      for (var c = 0; c < headers.length; c++) {
        var key = headers[c];
        var val = data[r][c];
        if (val !== '' && val !== null && val !== undefined) {
          hasData = true;
        }
        row[key] = val;
      }
      if (hasData) {
        rows.push(row);
      }
    }
    return rows;
  }

  function appendRow(sheetName, rowObj) {
    return Utils.withLock(function () {
      var sheet = getSheet(sheetName);
      var headers = SCHEMA_DEF[sheetName] || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var newRow = [];

      for (var i = 0; i < headers.length; i++) {
        var key = headers[i];
        var val = rowObj.hasOwnProperty(key) ? rowObj[key] : '';

        // Preserve leading zeros for serials and mobile numbers
        if (key.indexOf('serial') !== -1 || key === 'mobile') {
          val = String(val);
        }
        newRow.push(val);
      }

      sheet.appendRow(newRow);
      var lastRow = sheet.getLastRow();

      // Format text columns as Plain Text (@) to ensure no leading-zero stripping
      for (var colIdx = 0; colIdx < headers.length; colIdx++) {
        var colKey = headers[colIdx];
        if (colKey.indexOf('serial') !== -1 || colKey === 'mobile' || colKey.indexOf('_no') !== -1) {
          sheet.getRange(lastRow, colIdx + 1).setNumberFormat('@');
        }
      }

      return rowObj;
    });
  }

  function updateRow(sheetName, idColumn, idValue, updateObj) {
    return Utils.withLock(function () {
      var sheet = getSheet(sheetName);
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return false;

      var headers = data[0];
      var idColIdx = headers.indexOf(idColumn);
      if (idColIdx === -1) {
        throw new Error('ID column "' + idColumn + '" not found in sheet ' + sheetName);
      }

      for (var r = 1; r < data.length; r++) {
        if (String(data[r][idColIdx]).trim() === String(idValue).trim()) {
          for (var key in updateObj) {
            if (updateObj.hasOwnProperty(key)) {
              var colIdx = headers.indexOf(key);
              if (colIdx !== -1) {
                var cellVal = updateObj[key];
                if (key.indexOf('serial') !== -1 || key === 'mobile') {
                  cellVal = String(cellVal);
                  sheet.getRange(r + 1, colIdx + 1).setNumberFormat('@');
                }
                sheet.getRange(r + 1, colIdx + 1).setValue(cellVal);
              }
            }
          }
          // Update updated_at if present in schema
          var updatedIdx = headers.indexOf('updated_at');
          if (updatedIdx !== -1 && !updateObj.hasOwnProperty('updated_at')) {
            sheet.getRange(r + 1, updatedIdx + 1).setValue(new Date().toISOString());
          }
          return true;
        }
      }
      return false;
    });
  }

  function getRowById(sheetName, idColumn, idValue) {
    var rows = getRows(sheetName);
    var target = String(idValue).trim();
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][idColumn]).trim() === target) {
        return rows[i];
      }
    }
    return null;
  }

  function setupDatabase() {
    return Utils.withLock(function () {
      var ss = getSpreadsheet();
      if (!ss) {
        throw new Error('Spreadsheet could not be opened. Check permissions or ID.');
      }

      for (var sheetName in SCHEMA_DEF) {
        if (SCHEMA_DEF.hasOwnProperty(sheetName)) {
          var headers = SCHEMA_DEF[sheetName];
          var sheet = ss.getSheetByName(sheetName);

          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
          }

          // Check if headers already exist
          if (sheet.getLastRow() === 0) {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            // Format Header
            var headerRange = sheet.getRange(1, 1, 1, headers.length);
            headerRange.setBackground('#1e293b')
              .setFontColor('#ffffff')
              .setFontWeight('bold')
              .setFontFamily('Arial');
            sheet.setFrozenRows(1);
          }
        }
      }

      // Remove default empty Sheet1 if other tabs exist
      var defaultSheet = ss.getSheetByName('Sheet1');
      if (defaultSheet && ss.getSheets().length > 1) {
        try { ss.deleteSheet(defaultSheet); } catch (e) { }
      }

      // Seed Initial Config
      var configSheet = ss.getSheetByName('Config');
      if (configSheet.getLastRow() <= 1) {
        var defaultConfigs = [
          ['COMPANY_NAME', 'Amaron Battery Hub & Service Care', 'Business name'],
          ['COMPANY_ADDRESS', 'Shop 14-16, Auto Hub Complex, Ring Road, Surat, Gujarat - 395002', 'Full physical address'],
          ['COMPANY_PHONE', '+91 98250 12345', 'Contact phone number'],
          ['COMPANY_EMAIL', 'service@batteryhub.in', 'Customer service email'],
          ['COMPANY_GST', '24AAACG1234A1Z5', 'GSTIN identification number'],
          ['TIMEZONE', 'Asia/Kolkata', 'System operating timezone'],
          ['TICKET_PREFIX', 'TKT', 'Complaint / ticket prefix'],
          ['CLAIM_PREFIX', 'CLM', 'Warranty claim prefix'],
          ['RETURN_CHALLAN_PREFIX', 'DC-RET', 'Customer/dealer return delivery challan prefix'],
          ['COMPANY_CHALLAN_PREFIX', 'DC-COM', 'Consolidated company delivery challan prefix'],
          ['DISPATCH_PREFIX', 'DSP', 'Company dispatch batch prefix'],
          ['TICKET_SEQ', '1001', 'Next ticket sequence number'],
          ['CLAIM_SEQ', '1001', 'Next claim sequence number'],
          ['RETURN_CHALLAN_SEQ', '1001', 'Next return challan sequence number'],
          ['COMPANY_CHALLAN_SEQ', '1001', 'Next company challan sequence number'],
          ['DISPATCH_SEQ', '1001', 'Next dispatch batch sequence number']
        ];
        configSheet.getRange(2, 1, defaultConfigs.length, 3).setValues(defaultConfigs);
      }

      // Seed Default Battery Models
      var modelSheet = ss.getSheetByName('Battery_Models');
      if (modelSheet.getLastRow() <= 1) {
        var defaultModels = [
          ['MOD-001', 'Amaron', 'AAM-PR-00042B20R (Pro 35Ah)', 35, 36, 18, 18, true],
          ['MOD-002', 'Amaron', 'AAM-FL-0BH40B20R (Flo 35Ah)', 35, 48, 24, 24, true],
          ['MOD-003', 'Amaron', 'AAM-GO-00038B20R (Go 35Ah)', 35, 24, 12, 12, true],
          ['MOD-004', 'Amaron', 'AAM-PR-565106590 (Pro 65Ah)', 65, 36, 18, 18, true],
          ['MOD-005', 'Exide', 'FML0-ML35R (Mileage 35Ah)', 35, 36, 18, 18, true],
          ['MOD-006', 'Exide', 'FEP0-EPIQ35R (Epiq 35Ah)', 35, 72, 36, 36, true],
          ['MOD-007', 'Exide', 'FML0-ML45D21L (Mileage 45Ah)', 45, 36, 18, 18, true],
          ['MOD-008', 'Luminous', 'ILTT18048 (Inverter 150Ah)', 150, 48, 24, 24, true]
        ];
        modelSheet.getRange(2, 1, defaultModels.length, 8).setValues(defaultModels);
      }

      // Seed Default Dealers
      var dealerSheet = ss.getSheetByName('Dealers');
      if (dealerSheet.getLastRow() <= 1) {
        var defaultDealers = [
          ['DLR-001', 'Shree Ganesh Auto Electricals', 'Mahesh Patel', '9825012345', 'Transport Nagar, Surat', '24AAACG1234A1Z5', true],
          ['DLR-002', 'Krishna Battery & Spare Parts', 'Kiran Shah', '9898054321', 'Station Road, Navsari', '24BBBCG9876B1Z2', true],
          ['DLR-003', 'National Motors & Battery Care', 'Praveen Sharma', '9426033445', 'GIDC Phase 2, Vapi', '24CCCCG5432C1Z9', true]
        ];
        dealerSheet.getRange(2, 1, defaultDealers.length, 7).setValues(defaultDealers);
      }

      // Seed Admin User
      var userSheet = ss.getSheetByName('Users');
      if (userSheet.getLastRow() <= 1) {
        var adminEmail = Utils.getCurrentUserEmail();
        var defaultUsers = [
          ['USR-001', adminEmail, 'Administrator', 'ADMIN', 'ACTIVE', new Date().toISOString()]
        ];
        userSheet.getRange(2, 1, defaultUsers.length, 6).setValues(defaultUsers);
      }

      Config.invalidateCache();
      return true;
    });
  }

  function seedDemoData() {
    return Utils.withLock(function () {
      setupDatabase();

      // Sample Ticket 1: Just Received
      TicketService.createTicket({
        source_type: 'CUSTOMER',
        customer_name: 'Vikas Sharma',
        mobile: '9825123456',
        address: 'B-201, Green City, Adajan, Surat',
        vehicle_number: 'GJ-05-AB-4021',
        battery_model: 'AAM-PR-00042B20R (Pro 35Ah)',
        original_serial_no: '0091823741',
        date_received: '2026-10-02',
        service_battery_issued: true,
        service_battery_model: 'AAM-GO-00038B20R (Go 35Ah)',
        service_battery_serial: 'SB-8041',
        service_battery_date: '2026-10-02',
        remarks: 'Customer complains car does not crank after parking overnight'
      });

      // Sample Ticket 2: Under Testing
      var tkt2 = TicketService.createTicket({
        source_type: 'CUSTOMER',
        customer_name: 'Mehul Trivedi',
        mobile: '9879055443',
        address: '14, Shanti Niketan Society, Vesu',
        vehicle_number: 'GJ-05-CD-9102',
        battery_model: 'FML0-ML35R (Mileage 35Ah)',
        original_serial_no: '0082910482',
        date_received: '2026-10-01',
        service_battery_issued: false,
        remarks: 'Self starting sluggish'
      });

      // Sample Ticket 3 & Rejection with Return Challan
      var tkt3 = TicketService.createTicket({
        source_type: 'DEALER',
        dealer_name: 'Shree Ganesh Auto Electricals',
        customer_name: 'Pooja Auto Garage',
        mobile: '9825012345',
        address: 'Transport Nagar, Surat',
        battery_model: 'AAM-GO-00038B20R (Go 35Ah)',
        original_serial_no: '0073918240',
        date_received: '2026-09-28',
        remarks: 'Sent by dealer for warranty replacement'
      });
      TicketService.recordBatteryTest({
        ticket_no: tkt3.ticket_no,
        test_result: 'REJECT',
        tested_by: 'Sanjay Mistri',
        open_circuit_voltage: '9.2',
        specific_gravity: '1.10, 1.10, 1.11, 1.10, 1.10, 1.09',
        load_test_voltage: '4.8',
        physical_condition: 'Terminal post melted and deep sulphation due to overcharging',
        test_remarks: 'Physical abuse and deep sulphation. Not eligible under warranty.'
      });
      var challan = ChallanService.createReturnChallan(tkt3.ticket_no);
      ChallanService.markChallanReturned({
        challan_no: challan.challan_no,
        received_by_name: 'Mahesh Patel (Dealer Rep)',
        remarks: 'Rejected battery collected with delivery challan'
      });

      // Sample Ticket 4 & Passed Claim Sent to Company
      var tkt4 = TicketService.createTicket({
        source_type: 'CUSTOMER',
        customer_name: 'Deepak Patel',
        mobile: '9909012345',
        address: '402, Royal Palace, Piplod',
        vehicle_number: 'GJ-05-EE-8899',
        battery_model: 'AAM-PR-00042B20R (Pro 35Ah)',
        original_serial_no: '0098471923',
        date_received: '2026-09-10',
        service_battery_issued: true,
        service_battery_model: 'AAM-GO-00038B20R (Go 35Ah)',
        service_battery_serial: 'SB-8042',
        service_battery_date: '2026-09-10',
        remarks: 'Completely dead cell'
      });
      TicketService.recordBatteryTest({
        ticket_no: tkt4.ticket_no,
        test_result: 'PASS',
        tested_by: 'Sanjay Mistri',
        open_circuit_voltage: '10.5',
        specific_gravity: '1.24, 1.24, 1.12, 1.24, 1.24, 1.23',
        load_test_voltage: '7.8',
        physical_condition: 'Clean, no damage',
        test_remarks: 'Internal cell #3 open-circuit failure. Eligible for full replacement.'
      });
      var claim4 = ClaimService.createClaim({
        ticket_no: tkt4.ticket_no,
        date_of_sale: '2025-04-15'
      });

      // Sample Ticket 5 & Claim with Replacement Received Pending Stock Update
      var tkt5 = TicketService.createTicket({
        source_type: 'CUSTOMER',
        customer_name: 'Amitabh Sen',
        mobile: '9824098765',
        address: 'A-12, Alkapuri, Baroda',
        vehicle_number: 'GJ-06-KK-3344',
        battery_model: 'FML0-ML35R (Mileage 35Ah)',
        original_serial_no: '0065412987',
        date_received: '2026-08-20',
        service_battery_issued: false,
        remarks: 'Warranty claim replacement test'
      });
      TicketService.recordBatteryTest({
        ticket_no: tkt5.ticket_no,
        test_result: 'PASS',
        tested_by: 'Sanjay Mistri',
        test_remarks: 'Internal short circuit.'
      });
      var claim5 = ClaimService.createClaim({
        ticket_no: tkt5.ticket_no,
        date_of_sale: '2025-01-10'
      });
      // Simulate Dispatch
      DispatchService.createCompanyDispatch({
        company_name: 'Exide Industries Ltd.',
        destination: 'Baroda Regional Depot',
        transporter: 'Tirupati Courier',
        lr_docket_no: 'LR-88912',
        claim_nos: [claim5.claim_no],
        remarks: 'Warranty batch'
      });
      // Mark Replacement Received
      ReplacementService.recordReplacementReceived({
        claim_no: claim5.claim_no,
        replacement_model: 'FML0-ML35R (Mileage 35Ah)',
        replacement_serial_no: 'REP-EXI-998811',
        received_date: '2026-09-25',
        remarks: 'New replacement battery received from company depot'
      });

      AuditService.log('SYSTEM', 'SEED_DEMO', 'SYSTEM', 'SYSTEM', '', '', 'Demo database seeded successfully');
      return true;
    });
  }

  return {
    getSpreadsheet: getSpreadsheet,
    getSheet: getSheet,
    getRows: getRows,
    appendRow: appendRow,
    updateRow: updateRow,
    getRowById: getRowById,
    setupDatabase: setupDatabase,
    seedDemoData: seedDemoData
  };
})();

/** Global setup trigger callable directly from Apps Script Editor */
function setupApplication() {
  var ok = Database.setupDatabase();
  Logger.log('setupApplication result: ' + ok);
  return ok;
}

/** Global demo data seeder */
function seedDemoData() {
  var ok = Database.seedDemoData();
  Logger.log('seedDemoData result: ' + ok);
  return ok;
}
