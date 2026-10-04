/**
 * BatteryTestService.gs
 * Electrical, specific gravity, load test diagnostics, and PASS/REJECT workflow evaluation.
 */

var BatteryTestService = (function () {
  var RESULT = {
    PASS: 'PASS',
    REJECT: 'REJECT'
  };

  /**
   * Diagnostic assistant to analyze electrical readings.
   */
  function evaluateTestReadings(ocv, specificGravityStr, loadVoltage) {
    var vOcv = parseFloat(ocv);
    var vLoad = parseFloat(loadVoltage);
    var findings = [];
    var recommended = RESULT.PASS;

    if (!isNaN(vOcv)) {
      if (vOcv < 10.5) {
        findings.push('Open circuit voltage (' + vOcv + 'V) indicates deep discharge or shorted cell');
      } else if (vOcv >= 12.6) {
        findings.push('OCV (' + vOcv + 'V) is fully charged');
      }
    }

    if (specificGravityStr) {
      var cells = String(specificGravityStr)
        .split(',')
        .map(function (s) { return parseFloat(s.trim()); })
        .filter(function (n) { return !isNaN(n); });

      if (cells.length > 0) {
        var minGrav = Math.min.apply(null, cells);
        var maxGrav = Math.max.apply(null, cells);
        var diff = maxGrav - minGrav;

        if (diff >= 0.050) {
          findings.push('Cell specific gravity variation (' + diff.toFixed(3) + ') exceeds 0.050 limit (dead cell defect)');
        }
        if (minGrav < 1.150) {
          findings.push('Low specific gravity detected in one or more cells (<1.150)');
        }
      }
    }

    if (!isNaN(vLoad)) {
      if (vLoad < 9.6) {
        findings.push('Load test voltage collapsed to ' + vLoad + 'V under 15s load (capacity failure)');
      }
    }

    return {
      findings: findings,
      summary: findings.join('; ')
    };
  }

  /**
   * Record a comprehensive battery test and transition ticket status.
   *
   * @param {Object} data - Test submission parameters
   * @return {Object} Test record and updated ticket info
   */
  function recordTest(data) {
    if (!data.ticket_no) {
      throw new Error('Ticket number is required to record test');
    }
    var ticket = Database.getRowById('Tickets', 'ticket_no', data.ticket_no);
    if (!ticket) {
      throw new Error('Ticket ' + data.ticket_no + ' not found');
    }

    if (ticket.status === 'CLOSED' || ticket.status === 'REJECTED_RETURNED') {
      throw new Error('Cannot test ticket ' + data.ticket_no + ' because it is already ' + ticket.status);
    }

    var testResult = String(data.test_result || '').toUpperCase();
    if (testResult !== RESULT.PASS && testResult !== RESULT.REJECT) {
      throw new Error('Invalid test result: ' + testResult + '. Must be PASS or REJECT.');
    }

    var currentYear = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');
    var testId = 'TST-' + currentYear + '-' + Utilities.getUuid().substring(0, 6).toUpperCase();
    var testDate = data.test_date ? Utils.toIsoDate(data.test_date) : Utils.toIsoDate(new Date());
    var testerName = data.tested_by || Utils.getCurrentUserEmail();

    var testRecord = {
      test_id: testId,
      ticket_no: ticket.ticket_no,
      original_serial_no: ticket.original_serial_no,
      test_date: testDate,
      tested_by: testerName,
      open_circuit_voltage: data.open_circuit_voltage || '',
      specific_gravity: data.specific_gravity || '',
      load_test_voltage: data.load_test_voltage || '',
      physical_condition: data.physical_condition || '',
      test_result: testResult,
      test_remarks: data.test_remarks || '',
      report_file_id: data.report_file_id || ''
    };

    // Save test row
    Database.appendRow('Battery_Tests', testRecord);

    // Determine new ticket status
    var oldStatus = ticket.status;
    var newStatus = (testResult === RESULT.PASS) ? 'PASSED' : 'REJECTED_RETURN_PENDING';

    Database.updateRow('Tickets', 'ticket_no', ticket.ticket_no, {
      status: newStatus,
      updated_at: new Date().toISOString()
    });

    // Audit log
    AuditService.log(
      testResult === RESULT.PASS ? 'TEST_PASS' : 'TEST_REJECT',
      AuditService.RECORD_TYPE.TICKET,
      ticket.ticket_no,
      oldStatus,
      newStatus,
      'Battery testing completed with result: ' + testResult + '. Remarks: ' + (data.test_remarks || 'None'),
      testerName
    );

    return {
      test: testRecord,
      ticket_no: ticket.ticket_no,
      new_status: newStatus
    };
  }

  /**
   * Retrieve all tests conducted for a given ticket.
   */
  function getTestsByTicket(ticketNo) {
    var rows = Database.getRows('Battery_Tests');
    var target = String(ticketNo).trim();
    var results = [];

    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].ticket_no).trim() === target) {
        results.push(rows[i]);
      }
    }
    return results;
  }

  return {
    RESULT: RESULT,
    evaluateTestReadings: evaluateTestReadings,
    recordTest: recordTest,
    getTestsByTicket: getTestsByTicket
  };
})();
