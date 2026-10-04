/**
 * ReportService.gs
 * Operational dashboard metrics, actionable attention cards, and analytical reports.
 */

var ReportService = (function () {
  function getDashboardSummary() {
    var tickets = Database.getRows('Tickets');
    var claims = Database.getRows('Claims');

    var summary = {
      totalBatteriesReceived: tickets.length,
      underTesting: 0,
      rejectedTotal: 0,
      rejectedReturnPending: 0,
      rejectedReturned: 0,
      passed: 0,
      warrantyClaimsTotal: claims.length,
      readyForCompany: 0,
      sentToCompany: 0,
      replacementPending: 0,
      replacementReceived: 0,
      stockUpdatePending: 0,
      closed: 0,
      // Ageing breakdown for replacement pending
      ageing: {
        d0_7: 0,
        d8_15: 0,
        d16_30: 0,
        d31_60: 0,
        d60_plus: 0
      },
      // Action required operational items
      actionRequired: []
    };

    // Calculate Ticket metrics
    for (var i = 0; i < tickets.length; i++) {
      var tStatus = String(tickets[i].status).toUpperCase();
      if (tStatus === 'RECEIVED' || tStatus === 'TESTING') {
        summary.underTesting++;
      } else if (tStatus === 'REJECTED_RETURN_PENDING') {
        summary.rejectedTotal++;
        summary.rejectedReturnPending++;
      } else if (tStatus === 'REJECTED_RETURNED') {
        summary.rejectedTotal++;
        summary.rejectedReturned++;
      } else if (tStatus === 'PASSED') {
        summary.passed++;
      }
    }

    // Calculate Claim metrics
    for (var c = 0; c < claims.length; c++) {
      var claim = claims[c];
      var cStatus = String(claim.status).toUpperCase();

      if (cStatus === 'CLAIM_CREATED' || cStatus === 'READY_FOR_COMPANY') {
        summary.readyForCompany++;
      } else if (cStatus === 'SENT_TO_COMPANY') {
        summary.sentToCompany++;
        summary.replacementPending++;

        // Calculate Ageing
        var days = Utils.diffDays(claim.company_dispatch_date, new Date());
        if (days <= 7) summary.ageing.d0_7++;
        else if (days <= 15) summary.ageing.d8_15++;
        else if (days <= 30) summary.ageing.d16_30++;
        else if (days <= 60) summary.ageing.d31_60++;
        else summary.ageing.d60_plus++;
      } else if (cStatus === 'REPLACEMENT_RECEIVED') {
        summary.replacementReceived++;
        if (claim.stock_status !== 'UPDATED') {
          summary.stockUpdatePending++;
        }
      } else if (cStatus === 'CLOSED') {
        summary.closed++;
      }
    }

    // Build "What Needs My Attention?" section
    if (summary.underTesting > 0) {
      summary.actionRequired.push({
        count: summary.underTesting,
        type: 'TESTING',
        badge: 'AMBER',
        title: summary.underTesting + ' Batteries awaiting testing',
        actionView: 'tickets',
        filter: 'RECEIVED'
      });
    }

    if (summary.rejectedReturnPending > 0) {
      summary.actionRequired.push({
        count: summary.rejectedReturnPending,
        type: 'RETURN',
        badge: 'RED',
        title: summary.rejectedReturnPending + ' Rejected batteries awaiting return acknowledgement',
        actionView: 'challans',
        filter: 'GENERATED'
      });
    }

    if (summary.readyForCompany > 0) {
      summary.actionRequired.push({
        count: summary.readyForCompany,
        type: 'DISPATCH',
        badge: 'AMBER',
        title: summary.readyForCompany + ' Claims ready to send to battery company',
        actionView: 'pendingCompany',
        filter: 'READY_FOR_COMPANY'
      });
    }

    if (summary.replacementPending > 0) {
      summary.actionRequired.push({
        count: summary.replacementPending,
        type: 'REPLACEMENT',
        badge: 'RED',
        title: summary.replacementPending + ' Company replacements pending' + (summary.ageing.d31_60 + summary.ageing.d60_plus > 0 ? ' (' + (summary.ageing.d31_60 + summary.ageing.d60_plus) + ' overdue 30+ days)' : ''),
        actionView: 'replacementPending',
        filter: 'SENT_TO_COMPANY'
      });
    }

    if (summary.stockUpdatePending > 0) {
      summary.actionRequired.push({
        count: summary.stockUpdatePending,
        type: 'STOCK',
        badge: 'AMBER',
        title: summary.stockUpdatePending + ' Replacement batteries received but stock not updated in store',
        actionView: 'stockTasks',
        filter: 'PENDING'
      });
    }

    return summary;
  }

  function getDetailedReports() {
    var claims = Database.getRows('Claims');
    var tickets = Database.getRows('Tickets');

    // Model breakdown
    var modelMap = {};
    for (var i = 0; i < claims.length; i++) {
      var m = claims[i].battery_model || 'Unknown';
      if (!modelMap[m]) modelMap[m] = { total: 0, inWarranty: 0, outWarranty: 0, replacementReceived: 0 };
      modelMap[m].total++;
      if (claims[i].warranty_status === 'IN_WARRANTY') modelMap[m].inWarranty++;
      if (claims[i].warranty_status === 'OUT_OF_WARRANTY') modelMap[m].outWarranty++;
      if (claims[i].status === 'REPLACEMENT_RECEIVED' || claims[i].status === 'CLOSED') modelMap[m].replacementReceived++;
    }

    // Dealer breakdown
    var dealerMap = {};
    for (var d = 0; d < claims.length; d++) {
      if (claims[d].dealer_name) {
        var dName = claims[d].dealer_name;
        if (!dealerMap[dName]) dealerMap[dName] = { claims: 0, pending: 0, closed: 0 };
        dealerMap[dName].claims++;
        if (claims[d].status === 'SENT_TO_COMPANY') dealerMap[dName].pending++;
        if (claims[d].status === 'CLOSED') dealerMap[dName].closed++;
      }
    }

    return {
      modelBreakdown: modelMap,
      dealerBreakdown: dealerMap,
      totalTicketsCount: tickets.length,
      totalClaimsCount: claims.length
    };
  }

  return {
    getDashboardSummary: getDashboardSummary,
    getDetailedReports: getDetailedReports
  };
})();
