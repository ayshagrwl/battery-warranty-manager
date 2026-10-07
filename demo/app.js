/**
 * Battery Warranty & Claim Management System — Standalone Client-Side Application
 * v2.0 — Improved Admin UX, Bug Fixes, Full Workflow Coverage
 * 100% Free-First Simulation for GitHub Pages & Local Preview
 * ZERO Backend Secrets • ZERO Private URLs • Complete State Machine & Print Engine
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'BWMS_DEMO_STATE_V2';
  const CURRENT_YEAR = new Date().getFullYear();

  // ─── INITIAL MOCK DATASET ────────────────────────────────────────────────────
  const INITIAL_STATE = {
    config: {
      companyName: 'Amaron Battery Hub & Service Care',
      companyAddress: 'Plot 14-16, Transport Nagar, Ring Road, Surat, Gujarat - 395002',
      companyPhone: '+91 98250 12345 / +91 261 2490123',
      companyGst: '24AAACG1234A1Z5',
      timezone: 'Asia/Kolkata'
    },
    tickets: [
      {
        ticket_no: 'TKT-2026-000001', source_type: 'CUSTOMER',
        customer_name: 'Rahul S. Verma', mobile: '9876543210',
        vehicle_number: 'GJ-05-CD-1234', address: 'Flat 402, Sai Residency, Adajan, Surat',
        battery_model: 'Amaron Pro 42B20R', original_serial_no: '0094829103',
        date_received: '2026-09-12', service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R', service_battery_serial: 'SB-00349',
        status: 'CLOSED', claim_no: 'CLM-2026-000001', challan_no: null, service_battery_returned: true,
        remarks: 'Morning starting issue, deep voltage dip on cranking.', created_at: '2026-09-12T09:35:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000002', source_type: 'CUSTOMER',
        customer_name: 'Sunil Dave', mobile: '9898012345',
        vehicle_number: 'GJ-05-AB-7744', address: 'Shop 4, Ring Road, Surat',
        battery_model: 'Amaron Fresh 35R', original_serial_no: '0081273941',
        date_received: '2026-09-14', service_battery_issued: false,
        service_battery_model: '', service_battery_serial: '',
        status: 'TEST_REJECTED', claim_no: null, challan_no: 'DC-RET-2026-000001', service_battery_returned: true,
        remarks: 'Physical case swollen; deep discharge sulphation from alternator overcharge.', created_at: '2026-09-14T11:20:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000003', source_type: 'CUSTOMER',
        customer_name: 'Priya Patel', mobile: '9824156789',
        vehicle_number: 'GJ-05-ER-5512', address: '12 Green Park Society, Vesu, Surat',
        battery_model: 'Exide Mileage 45D26L', original_serial_no: '0038192847',
        date_received: '2026-09-18', service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R', service_battery_serial: 'SB-00412',
        status: 'CLAIM_CREATED', claim_no: 'CLM-2026-000002', challan_no: null, service_battery_returned: false,
        remarks: 'Battery dead within 14 months of purchase.', created_at: '2026-09-18T14:15:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000004', source_type: 'DEALER',
        dealer_name: 'Shree Ganesh Auto Electricals (Surat)', customer_name: 'Vikram Desai',
        mobile: '9712398765', vehicle_number: 'GJ-01-AX-9901', address: 'Bhestan, Surat',
        battery_model: 'Tata Green Velocity 38B20R', original_serial_no: '0055192830',
        date_received: '2026-09-20', service_battery_issued: false,
        service_battery_model: '', service_battery_serial: '',
        status: 'CLAIM_CREATED', claim_no: 'CLM-2026-000003', challan_no: null, service_battery_returned: true,
        remarks: 'Dealer surrendered on customer behalf. Internal cell short.', created_at: '2026-09-20T10:00:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000005', source_type: 'CUSTOMER',
        customer_name: 'Hardik Mehta', mobile: '9909044556',
        vehicle_number: 'GJ-06-KK-2234', address: 'Nanpura, Surat',
        battery_model: 'Amaron Flo 55B24L', original_serial_no: '0019284715',
        date_received: '2026-09-22', service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R', service_battery_serial: 'SB-00551',
        status: 'CLAIM_CREATED', claim_no: 'CLM-2026-000004', challan_no: null, service_battery_returned: false,
        remarks: 'Frequent charging loss, cell 2 specific gravity low.', created_at: '2026-09-22T16:40:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000006', source_type: 'CUSTOMER',
        customer_name: 'Amit Trivedi', mobile: '9898123456',
        vehicle_number: 'GJ-05-MM-3399', address: 'Varachha, Surat',
        battery_model: 'Exide Ride 35R', original_serial_no: '0072819401',
        date_received: '2026-09-26', service_battery_issued: false,
        service_battery_model: '', service_battery_serial: '',
        status: 'RECEIVED', claim_no: null, challan_no: null, service_battery_returned: true,
        remarks: 'Customer reports battery draining in 2 days.', created_at: '2026-09-26T09:10:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000007', source_type: 'CUSTOMER',
        customer_name: 'Deepak Shah', mobile: '9727099881',
        vehicle_number: 'GJ-05-PQ-8811', address: 'Katargam, Surat',
        battery_model: 'Amaron Pro 42B20R', original_serial_no: '0044928172',
        date_received: '2026-09-28', service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R', service_battery_serial: 'SB-00620',
        status: 'RECEIVED', claim_no: null, challan_no: null, service_battery_returned: false,
        remarks: 'New intake today. Awaiting test bench.', created_at: '2026-09-28T08:30:00.000Z'
      }
    ],
    tests: [
      { test_id: 'TST-2026-000001', ticket_no: 'TKT-2026-000001', original_serial_no: '0094829103', test_date: '2026-09-13', tested_by: 'Sanjay Mistri', open_circuit_voltage: 10.4, load_test_voltage: 8.2, specific_gravity: '1.18, 1.18, 1.12, 1.18, 1.18, 1.18', physical_condition: 'CLEAN_OK', test_result: 'PASS', test_remarks: 'Cell #3 dead. Internal plate break. Eligible for warranty replacement.' },
      { test_id: 'TST-2026-000002', ticket_no: 'TKT-2026-000002', original_serial_no: '0081273941', test_date: '2026-09-14', tested_by: 'Sanjay Mistri', open_circuit_voltage: 11.2, load_test_voltage: 6.8, specific_gravity: '1.10, 1.10, 1.11, 1.10, 1.10, 1.10', physical_condition: 'BULGED', test_result: 'REJECT', test_remarks: 'Severe container bulging caused by alternator overcharge. Rejected under manufacturer warranty policy.' },
      { test_id: 'TST-2026-000003', ticket_no: 'TKT-2026-000003', original_serial_no: '0038192847', test_date: '2026-09-19', tested_by: 'Sanjay Mistri', open_circuit_voltage: 10.5, load_test_voltage: 8.1, specific_gravity: '1.17, 1.12, 1.18, 1.18, 1.18, 1.18', physical_condition: 'CLEAN_OK', test_result: 'PASS', test_remarks: 'Cell #2 dead. Passes warranty qualification.' },
      { test_id: 'TST-2026-000004', ticket_no: 'TKT-2026-000004', original_serial_no: '0055192830', test_date: '2026-09-20', tested_by: 'Sanjay Mistri', open_circuit_voltage: 10.2, load_test_voltage: 7.9, specific_gravity: '1.12, 1.18, 1.18, 1.18, 1.18, 1.18', physical_condition: 'CLEAN_OK', test_result: 'PASS', test_remarks: 'Manufacturing defect confirmed.' },
      { test_id: 'TST-2026-000005', ticket_no: 'TKT-2026-000005', original_serial_no: '0019284715', test_date: '2026-09-23', tested_by: 'Sanjay Mistri', open_circuit_voltage: 10.6, load_test_voltage: 8.3, specific_gravity: '1.18, 1.11, 1.18, 1.18, 1.18, 1.18', physical_condition: 'CLEAN_OK', test_result: 'PASS', test_remarks: 'Cell 2 short confirmed.' }
    ],
    claims: [
      { claim_no: 'CLM-2026-000001', ticket_no: 'TKT-2026-000001', customer_name: 'Rahul S. Verma', mobile: '9876543210', vehicle_number: 'GJ-05-CD-1234', battery_model: 'Amaron Pro 42B20R', original_serial_no: '0094829103', warranty_status: 'IN_WARRANTY', claim_date: '2026-09-13', status: 'CLOSED', dispatch_batch_no: 'DSP-2026-000001', company_challan_no: 'DC-COM-2026-000001', replacement_model: 'Amaron Pro 42B20R', replacement_serial_no: 'REP-9847120', replacement_received_date: '2026-09-25', stock_status: 'UPDATED', stock_ref_no: 'BUSY:VR-2026-0928', closed_date: '2026-09-26' },
      { claim_no: 'CLM-2026-000002', ticket_no: 'TKT-2026-000003', customer_name: 'Priya Patel', mobile: '9824156789', vehicle_number: 'GJ-05-ER-5512', battery_model: 'Exide Mileage 45D26L', original_serial_no: '0038192847', warranty_status: 'IN_WARRANTY', claim_date: '2026-09-19', status: 'REPLACEMENT_RECEIVED', dispatch_batch_no: 'DSP-2026-000001', company_challan_no: 'DC-COM-2026-000001', replacement_model: 'Exide Mileage 45D26L', replacement_serial_no: 'REP-4491028', replacement_received_date: '2026-09-27', stock_status: 'UPDATE_REQUIRED', stock_ref_no: null, closed_date: null },
      { claim_no: 'CLM-2026-000003', ticket_no: 'TKT-2026-000004', customer_name: 'Vikram Desai', mobile: '9712398765', vehicle_number: 'GJ-01-AX-9901', battery_model: 'Tata Green Velocity 38B20R', original_serial_no: '0055192830', warranty_status: 'IN_WARRANTY', claim_date: '2026-09-20', status: 'SENT_TO_COMPANY', dispatch_batch_no: 'DSP-2026-000001', company_challan_no: 'DC-COM-2026-000001', replacement_model: null, replacement_serial_no: null, replacement_received_date: null, stock_status: 'NOT_APPLICABLE', stock_ref_no: null, closed_date: null },
      { claim_no: 'CLM-2026-000004', ticket_no: 'TKT-2026-000005', customer_name: 'Hardik Mehta', mobile: '9909044556', vehicle_number: 'GJ-06-KK-2234', battery_model: 'Amaron Flo 55B24L', original_serial_no: '0019284715', warranty_status: 'IN_WARRANTY', claim_date: '2026-09-23', status: 'READY_FOR_COMPANY', dispatch_batch_no: null, company_challan_no: null, replacement_model: null, replacement_serial_no: null, replacement_received_date: null, stock_status: 'NOT_APPLICABLE', stock_ref_no: null, closed_date: null }
    ],
    dispatches: [
      { dispatch_batch_no: 'DSP-2026-000001', company_name: 'Amaron Batteries Ltd.', destination: 'Baroda Central Regional Depot', company_challan_no: 'DC-COM-2026-000001', dispatch_date: '2026-09-21', carrier_transporter: 'Shree Tirupati Logistics', lr_docket_no: 'LR-994812', claim_count: 3, battery_count: 3, created_by: 'ramesh@batteryhub.in', remarks: 'Packed in 1 wooden crate with individual inspection reports.' }
    ],
    challans: [
      { challan_no: 'DC-RET-2026-000001', challan_type: 'BATTERY_RETURN', challan_date: '2026-09-14', recipient_name: 'Sunil Dave', mobile: '9898012345', address: 'Shop 4, Ring Road, Surat', ticket_no: 'TKT-2026-000002', battery_model: 'Amaron Fresh 35R', battery_serial_no: '0081273941', quantity: 1, status: 'GENERATED', remarks: 'Warranty rejected due to container bulging and extreme alternator overcharging.' },
      { challan_no: 'DC-COM-2026-000001', challan_type: 'COMPANY_DISPATCH', challan_date: '2026-09-21', recipient_name: 'Amaron Batteries Ltd. (Depot)', mobile: '+91 265 2840192', address: 'Plot 44, GIDC Industrial Estate, Baroda', ticket_no: 'CONSOLIDATED-BATCH', battery_model: 'Multiple Models (3 Batteries)', battery_serial_no: '0094829103, 0038192847, 0055192830', quantity: 3, status: 'DISPATCHED', remarks: 'Consignment booked under LR-994812 via Shree Tirupati Logistics.' }
    ],
    stockTasks: [
      { stock_task_id: 'STK-2026-000001', claim_no: 'CLM-2026-000001', replacement_model: 'Amaron Pro 42B20R', replacement_serial_no: 'REP-9847120', received_date: '2026-09-25', stock_status: 'UPDATED', accounting_ref_no: 'BUSY:VR-2026-0928', updated_at: '2026-09-26T14:20:00.000Z', updated_by: 'Ramesh Sharma' },
      { stock_task_id: 'STK-2026-000002', claim_no: 'CLM-2026-000002', replacement_model: 'Exide Mileage 45D26L', replacement_serial_no: 'REP-4491028', received_date: '2026-09-27', stock_status: 'UPDATE_REQUIRED', accounting_ref_no: null, updated_at: null, updated_by: null }
    ],
    audits: [
      { audit_id: 'AUD-2026-000001', timestamp: '2026-09-26T14:22:00.000Z', user_email: 'ramesh@batteryhub.in', action: 'STOCK_UPDATE', record_type: 'CLAIM', record_id: 'CLM-2026-000001', old_status: 'REPLACEMENT_RECEIVED', new_status: 'CLOSED', details: "Logged Busy ERP voucher VR-2026-0928 for REP-9847120. Claim closed." },
      { audit_id: 'AUD-2026-000002', timestamp: '2026-09-27T10:15:00.000Z', user_email: 'sanjay@batteryhub.in', action: 'REPLACEMENT_RECEIVE', record_type: 'CLAIM', record_id: 'CLM-2026-000002', old_status: 'SENT_TO_COMPANY', new_status: 'REPLACEMENT_RECEIVED', details: "Received replacement battery REP-4491028. Created task STK-2026-000002." },
      { audit_id: 'AUD-2026-000003', timestamp: '2026-09-28T08:32:00.000Z', user_email: 'ayush@batteryhub.in', action: 'INTAKE', record_type: 'TICKET', record_id: 'TKT-2026-000007', old_status: 'NONE', new_status: 'RECEIVED', details: "Intake ticket created for Deepak Shah. Issued loaner SB-00620." }
    ]
  };

  // ─── STATE MANAGEMENT ─────────────────────────────────────────────────────────
  let state = loadState();

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { console.warn('Could not read localStorage', e); }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('Could not persist to localStorage', e); }
  }

  function resetState() {
    state = JSON.parse(JSON.stringify(INITIAL_STATE));
    saveState();
    renderAll();
    showToast('Demo data reset to initial benchmark state.', 'success');
  }

  // ─── ID GENERATORS ────────────────────────────────────────────────────────────
  function nextSeq(prefix, collection) {
    let max = 0;
    collection.forEach(item => {
      const id = typeof item === 'string'
        ? item
        : (item.ticket_no || item.claim_no || item.challan_no || item.audit_id ||
           item.test_id || item.dispatch_batch_no || item.stock_task_id || '');
      if (!id.startsWith(prefix + '-')) return;
      const n = parseInt(String(id).split('-').pop(), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return `${prefix}-${CURRENT_YEAR}-${String(max + 1).padStart(6, '0')}`;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isTerminalTicket(t) {
    return t.status === 'CLOSED' || t.status === 'CLOSED_REJECTED';
  }

  function isLoanerOutstanding(t) {
    return !!(t.service_battery_issued && !t.service_battery_returned && !isTerminalTicket(t));
  }

  function brandOfModel(model) {
    const m = (model || '').toLowerCase();
    if (m.includes('amaron')) return 'Amaron';
    if (m.includes('exide')) return 'Exide';
    if (m.includes('tata')) return 'Tata Green';
    return 'Other';
  }

  function companyMatchesClaim(company, claim) {
    const brand = brandOfModel(claim.battery_model);
    if (company.includes('Amaron')) return brand === 'Amaron';
    if (company.includes('Exide')) return brand === 'Exide';
    if (company.includes('Tata')) return brand === 'Tata Green';
    return true;
  }

  function parseGravityCells(raw) {
    return (raw || '').split(/[,\s]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
  }

  function evaluateDiagnostics(ocv, loadV, gravityRaw, casing) {
    const reasons = [];
    if (casing && casing !== 'CLEAN_OK') reasons.push('Physical casing is not intact (' + casing.replace(/_/g, ' ') + ')');
    if (!isNaN(ocv) && ocv < 10.5) reasons.push('OCV below 10.5V (deep discharge / shorted cell)');
    if (!isNaN(loadV) && loadV < 9.6) reasons.push('Load test collapsed below 9.6V');
    const cells = parseGravityCells(gravityRaw);
    if (gravityRaw && cells.length !== 6) reasons.push('Enter all 6 hydrometer readings');
    if (cells.length === 6) {
      const min = Math.min.apply(null, cells);
      const max = Math.max.apply(null, cells);
      if (max - min > 0.05) reasons.push('Cell gravity spread > 0.050 (dead cell)');
      if (min < 1.15) reasons.push('One or more cells below 1.150 SG');
    }
    const physicalReject = casing && casing !== 'CLEAN_OK';
    return {
      recommendReject: physicalReject,
      recommendPass: !physicalReject && cells.length === 6,
      reasons
    };
  }

  // ─── TOAST NOTIFICATIONS ─────────────────────────────────────────────────────
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const icons = { success: '✅', danger: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // ─── MODAL HELPERS ────────────────────────────────────────────────────────────
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  };
  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
    // Only restore if no other modals are open
    if (!document.querySelector('.modal-overlay.open')) document.body.style.overflow = '';
  };

  // Close modal on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal(this.id);
    });
  });

  // ─── TAB SWITCHING ────────────────────────────────────────────────────────────
  window.switchTab = function (tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.toggle('active', pane.id === tabId));
    if (tabId === 'tab-print') renderPrintTemplate();
  };

  // ─── FORMATTERS ──────────────────────────────────────────────────────────────
  function formatDate(d) {
    if (!d) return '—';
    try {
      const parts = d.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) {}
    return d;
  }

  function daysSince(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr.split('T')[0]);
    const now = new Date();
    return Math.floor((now - d) / (1000 * 60 * 60 * 24));
  }

  const STATUS_CONFIG = {
    'RECEIVED':            { label: 'RECEIVED',            cls: 'status-received' },
    'TESTING':             { label: 'TESTING',             cls: 'status-testing' },
    'TEST_PASSED':         { label: 'TEST PASSED',         cls: 'status-passed' },
    'TEST_REJECTED':       { label: 'TEST REJECTED',       cls: 'status-rejected' },
    'CLAIM_CREATED':       { label: 'CLAIM CREATED',       cls: 'status-claim' },
    'READY_FOR_COMPANY':   { label: 'READY FOR COMPANY',   cls: 'status-ready' },
    'SENT_TO_COMPANY':     { label: 'SENT TO COMPANY',     cls: 'status-sent' },
    'REPLACEMENT_RECEIVED':{ label: 'REPLACEMENT RECEIVED',cls: 'status-replacement' },
    'CLOSED':              { label: 'CLOSED',              cls: 'status-closed' },
    'CLOSED_REJECTED':     { label: 'CLOSED REJECTED',     cls: 'status-rejected' },
    'REJECTED_BY_COMPANY': { label: 'REJECTED BY COMPANY', cls: 'status-rejected' },
    'STOCK_UPDATED':       { label: 'STOCK UPDATED',       cls: 'status-STOCK_UPDATED' },
    'IN_WARRANTY':         { label: 'IN WARRANTY',         cls: 'status-passed' },
    'OUT_OF_WARRANTY':     { label: 'OUT OF WARRANTY',     cls: 'status-rejected' },
    'UPDATE_REQUIRED':     { label: 'UPDATE REQUIRED',     cls: 'status-rejected' },
    'UPDATED':             { label: 'UPDATED ✓',           cls: 'status-closed' },
  };

  function renderStatusPill(status) {
    const cfg = STATUS_CONFIG[status] || { label: (status || '').replace(/_/g, ' '), cls: 'status-default' };
    return `<span class="status-pill ${cfg.cls}">${cfg.label}</span>`;
  }

  function renderSourceBadge(sourceType, dealerName) {
    if (sourceType === 'DEALER') {
      return `<span class="badge badge-purple" title="${dealerName || ''}">DEALER</span>`;
    }
    return `<span class="badge badge-primary">CUSTOMER</span>`;
  }

  function renderAgeingBadge(days) {
    if (days === null || days === undefined) return '—';
    if (days <= 7)  return `<span class="badge badge-success">${days}d</span>`;
    if (days <= 15) return `<span class="badge badge-info">${days}d</span>`;
    if (days <= 30) return `<span class="badge badge-warning">${days}d</span>`;
    if (days <= 60) return `<span class="badge badge-danger">${days}d ⚠️</span>`;
    return `<span class="badge badge-danger" style="animation:pulse-red 1.5s infinite;">${days}d 🔥</span>`;
  }

  // ─── VALIDATION HELPERS ───────────────────────────────────────────────────────
  function isDuplicateSerial(serial, excludeTicketNo) {
    const norm = (serial || '').trim();
    if (!norm) return false;
    return state.tickets.some(t =>
      t.original_serial_no === norm &&
      t.ticket_no !== excludeTicketNo &&
      !isTerminalTicket(t)
    );
  }

  function isDuplicateLoanerSerial(serial, excludeTicketNo) {
    const norm = (serial || '').trim();
    if (!norm) return false;
    return state.tickets.some(t =>
      t.service_battery_issued &&
      t.service_battery_serial === norm &&
      t.ticket_no !== excludeTicketNo &&
      isLoanerOutstanding(t)
    );
  }

  // ─── KPI CALCULATIONS ─────────────────────────────────────────────────────────
  function updateKPIs() {
    const totalTickets = state.tickets.length;
    const testingCount = state.tickets.filter(t => t.status === 'RECEIVED' || t.status === 'TESTING').length;
    // Only count loaners on active (non-closed, non-rejected) tickets
    const loanersOut = state.tickets.filter(isLoanerOutstanding).length;
    const dispatchedCount = state.claims.filter(c => c.status === 'SENT_TO_COMPANY').length;
    const pendingStock = state.stockTasks.filter(s => s.stock_status === 'UPDATE_REQUIRED').length;
    const readyForDispatch = state.claims.filter(c => c.status === 'READY_FOR_COMPANY').length;

    setEl('kpi-total-tickets', totalTickets);
    setEl('kpi-testing', testingCount);
    setEl('kpi-loaners', loanersOut);
    setEl('kpi-dispatched', dispatchedCount);
    setEl('kpi-stock-tasks', pendingStock);
    setEl('count-tickets', totalTickets);
    setEl('count-testing', testingCount);
    setEl('count-claims', state.claims.length);
    setEl('count-stock', pendingStock);

    // Sidebar attention badges
    const urgentBadge = document.getElementById('sidebar-urgent-badge');
    const urgentTotal = testingCount + pendingStock + readyForDispatch;
    if (urgentBadge) {
      urgentBadge.textContent = urgentTotal || '';
      urgentBadge.style.display = urgentTotal ? 'inline-flex' : 'none';
    }
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ─── URGENT ACTIONS (DASHBOARD) ───────────────────────────────────────────────
  function renderUrgentActions() {
    const container = document.getElementById('urgent-actions-container');
    if (!container) return;
    const items = [];

    // 1. Pending stock tasks (highest priority — blocks customer handover)
    state.stockTasks.filter(s => s.stock_status === 'UPDATE_REQUIRED').forEach(s => {
      const d = daysSince(s.received_date);
      items.push({
        priority: 1,
        title: `🔴 ERP Stock Entry Blocking Claim ${s.claim_no}`,
        desc: `Replacement <strong>${s.replacement_model}</strong> (<code>'${s.replacement_serial_no}</code>) received on ${formatDate(s.received_date)} (${d} days ago). Enter Busy/Tally voucher to authorize customer handover.`,
        btn: 'Mark Reconciled',
        color: 'rose',
        onClick: `openReconcileModal('${s.stock_task_id}')`
      });
    });

    // 2. Batteries received but not tested
    state.tickets.filter(t => t.status === 'RECEIVED' || t.status === 'TESTING').forEach(t => {
      const d = daysSince(t.date_received);
      items.push({
        priority: 2,
        title: `⚡ Testing Due: ${t.ticket_no} — ${t.customer_name}`,
        desc: `<strong>${t.battery_model}</strong> • Serial <code>'${t.original_serial_no}</code> • Received ${formatDate(t.date_received)} (${d} days in holding)`,
        btn: 'Start Lab Test',
        color: 'amber',
        onClick: `openTestModal('${t.ticket_no}')`
      });
    });

    // 3. Claims ready to dispatch
    const readyClaims = state.claims.filter(c => c.status === 'READY_FOR_COMPANY');
    if (readyClaims.length > 0) {
      items.push({
        priority: 3,
        title: `🚚 ${readyClaims.length} Claims Ready to Dispatch to Company`,
        desc: `${readyClaims.map(c => `<code>${c.claim_no}</code>`).join(', ')} — awaiting consolidation into dispatch batch for manufacturer.`,
        btn: 'Create Dispatch Batch',
        color: 'teal',
        onClick: `switchTab('tab-claims'); openDispatchModal();`
      });
    }

    // 4. Ageing dispatched claims (>15 days)
    const ageing = state.claims.filter(c => {
      if (c.status !== 'SENT_TO_COMPANY') return false;
      const dispatch = state.dispatches.find(d => d.dispatch_batch_no === c.dispatch_batch_no);
      const d = dispatch ? daysSince(dispatch.dispatch_date) : 0;
      return d > 15;
    });
    if (ageing.length > 0) {
      items.push({
        priority: 4,
        title: `⏳ ${ageing.length} Claims Ageing at Company (>15 Days)`,
        desc: `${ageing.map(c => `<code>${c.claim_no}</code>`).join(', ')} — follow up with manufacturer for replacement status.`,
        btn: 'View Claims',
        color: 'amber',
        onClick: `switchTab('tab-claims')`
      });
    }

    const overdueLoaners = state.tickets.filter(t => {
      if (!isLoanerOutstanding(t)) return false;
      return (daysSince(t.date_received) || 0) > 14;
    });
    if (overdueLoaners.length > 0) {
      items.push({
        priority: 5,
        title: `🔋 ${overdueLoaners.length} Service Loaner${overdueLoaners.length > 1 ? 's' : ''} Out >14 Days`,
        desc: overdueLoaners.map(t => `<code>${escapeHtml(t.service_battery_serial)}</code> with ${escapeHtml(t.customer_name)}`).join(', ') + ' — collect before closing.',
        btn: 'View Loaners',
        color: 'amber',
        onClick: `filterTickets('LOANER_OUT')`
      });
    }

    if (items.length === 0) {
      container.innerHTML = `<div class="p-3 text-center" style="color:var(--emerald); font-weight:600;">🎉 All operations are clear. No pending bottlenecks!</div>`;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="urgent-item ${item.color}">
        <div class="urgent-meta">
          <h5>${item.title}</h5>
          <p>${item.desc}</p>
        </div>
        <button class="btn btn-sm btn-outline" onclick="${item.onClick}">${item.btn}</button>
      </div>
    `).join('');
  }

  // ─── DASHBOARD RECENT TABLE ───────────────────────────────────────────────────
  function renderDashboardRecentTable() {
    const tbody = document.getElementById('dashboard-recent-tbody');
    if (!tbody) return;

    // Show ALL tickets, latest first, up to 10
    const recent = [...state.tickets].reverse().slice(0, 10);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">No intake tickets yet. Create your first one!</td></tr>`;
      return;
    }
    tbody.innerHTML = recent.map(t => {
      const claim = t.claim_no ? state.claims.find(c => c.claim_no === t.claim_no) : null;
      return `
        <tr>
          <td>
            <strong style="cursor:pointer; color:var(--primary);" onclick="openInspector('${t.ticket_no}')">${t.ticket_no}</strong>
            ${t.claim_no ? `<br><small class="text-muted" style="cursor:pointer;" onclick="openInspector('${t.ticket_no}')">${t.claim_no}</small>` : ''}
          </td>
          <td>
            ${renderSourceBadge(t.source_type, t.dealer_name)}
            <strong> ${t.customer_name}</strong>
            ${t.dealer_name ? `<br><small class="text-muted">${t.dealer_name}</small>` : ''}
            <br><small class="text-muted">${t.mobile}</small>
          </td>
          <td>
            <strong>${t.battery_model}</strong>
            <br><code class="font-mono text-blue">'${t.original_serial_no}</code>
            ${t.service_battery_issued ? `<br><span class="badge badge-purple" style="font-size:10px;">Loaner: ${t.service_battery_serial}</span>` : ''}
          </td>
          <td>${renderStatusPill(t.status)}</td>
          <td>${formatDate(t.date_received)}</td>
          <td>${renderContextualAction(t, claim)}</td>
        </tr>
      `;
    }).join('');
  }

  // ─── CONTEXTUAL NEXT-ACTION BUTTON ────────────────────────────────────────────
  // This is the CORE UX fix — every row always shows the correct NEXT action
  function renderContextualAction(ticket, claim) {
    const t = ticket;
    const c = claim || (t.claim_no ? state.claims.find(x => x.claim_no === t.claim_no) : null);
    const s = t.status;

    if (s === 'RECEIVED' || s === 'TESTING') {
      return `<button class="btn btn-sm btn-primary" onclick="openTestModal('${t.ticket_no}')">Record Test</button>`;
    }
    if (s === 'TEST_PASSED') {
      return `<button class="btn btn-sm btn-emerald" onclick="createClaimFromTicket('${t.ticket_no}')">Create Claim</button>`;
    }
    if (s === 'TEST_REJECTED' || (c && c.status === 'REJECTED_BY_COMPANY')) {
      const parts = [];
      if (t.challan_no) parts.push(`<button class="btn btn-sm btn-outline" onclick="preparePrintChallan('${t.challan_no}')">Print Return</button>`);
      else parts.push(`<button class="btn btn-sm btn-rose" onclick="generateReturnChallan('${t.ticket_no}')">Gen Challan</button>`);
      parts.push(`<button class="btn btn-sm btn-rose" onclick="openCloseoutModal('${t.ticket_no}','REJECT_RETURN')">Collect & Close</button>`);
      return `<div style="display:flex;gap:4px;flex-wrap:wrap;">${parts.join('')}</div>`;
    }
    if (c && c.status === 'READY_FOR_COMPANY') {
      return `<button class="btn btn-sm btn-teal" onclick="switchTab('tab-claims'); openDispatchModal();">Dispatch</button>`;
    }
    if (c && c.status === 'SENT_TO_COMPANY') {
      return `<button class="btn btn-sm btn-primary" onclick="openReceiveReplacementModal('${c.claim_no}')">Receive Replacement</button>`;
    }
    if (c && c.status === 'REPLACEMENT_RECEIVED') {
      return `<button class="btn btn-sm btn-rose" onclick="openReconcileModalForClaim('${c.claim_no}')">Log ERP Voucher</button>`;
    }
    if (c && c.status === 'STOCK_UPDATED') {
      return `<button class="btn btn-sm btn-emerald" onclick="openCloseoutModal('${t.ticket_no}','HANDOVER')">Handover to Customer</button>`;
    }
    if (s === 'CLOSED' || s === 'CLOSED_REJECTED' || (c && c.status === 'CLOSED')) {
      return `<span class="badge badge-success">Done</span>`;
    }
    return `<button class="btn btn-sm btn-outline" onclick="openInspector('${t.ticket_no}')">Inspect</button>`;
  }

  // ─── TICKETS TABLE VIEW ───────────────────────────────────────────────────────
  function renderTicketsTable(filteredTickets) {
    const tbody = document.getElementById('intake-tbody');
    if (!tbody) return;
    const list = filteredTickets !== undefined ? filteredTickets : state.tickets;
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center p-4 text-muted">No tickets found matching criteria.</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(t => {
      const claim = t.claim_no ? state.claims.find(c => c.claim_no === t.claim_no) : null;
      return `
        <tr>
          <td>
            <strong style="cursor:pointer; color:var(--primary);" onclick="openInspector('${t.ticket_no}')">${t.ticket_no}</strong>
            <br><small class="text-muted">${formatDate(t.date_received)}</small>
          </td>
          <td>
            ${renderSourceBadge(t.source_type, t.dealer_name)}
            <br><strong>${t.customer_name}</strong>
            ${t.dealer_name ? `<br><small class="text-muted">${t.dealer_name}</small>` : ''}
            <br><small class="text-muted">📱 ${t.mobile}</small>
          </td>
          <td><code style="font-size:11px;">${t.vehicle_number || '—'}</code></td>
          <td style="max-width:140px;">${t.battery_model}</td>
          <td><code class="font-mono text-blue">'${t.original_serial_no}</code></td>
          <td>
            ${t.service_battery_issued
              ? `<span class="badge badge-purple" title="${t.service_battery_model}">${t.service_battery_serial}</span>`
              : `<span class="text-muted" style="font-size:11px;">None</span>`}
          </td>
          <td>${renderStatusPill(t.status)}</td>
          <td>${formatDate(t.date_received)}</td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-outline" onclick="openInspector('${t.ticket_no}')">Timeline</button>
              ${renderContextualAction(t, claim)}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── TESTING LAB VIEW ────────────────────────────────────────────────────────
  function renderTestingLab() {
    const container = document.getElementById('lab-items-container');
    if (!container) return;

    // Fix: Show RECEIVED and TESTING in lab queue; TEST_PASSED and TEST_REJECTED as history
    const queueItems = state.tickets.filter(t => t.status === 'RECEIVED' || t.status === 'TESTING');
    const testedItems = state.tickets.filter(t => t.status === 'TEST_PASSED' || t.status === 'TEST_REJECTED');

    let html = '';

    if (queueItems.length === 0 && testedItems.length === 0) {
      container.innerHTML = `<div class="p-4 text-muted text-center full-width">No batteries currently in the diagnostic queue.</div>`;
      return;
    }

    if (queueItems.length > 0) {
      html += `<div class="lab-section-header full-width">⚡ Awaiting Diagnostic Test (${queueItems.length})</div>`;
      html += queueItems.map(t => renderLabCard(t, false)).join('');
    }

    if (testedItems.length > 0) {
      html += `<div class="lab-section-header full-width" style="margin-top:24px;">📋 Recently Tested (${testedItems.length})</div>`;
      html += testedItems.map(t => renderLabCard(t, true)).join('');
    }

    container.innerHTML = html;
  }

  function renderLabCard(t, isTested) {
    const test = state.tests.find(x => x.ticket_no === t.ticket_no);
    const isPassed = t.status === 'TEST_PASSED' || (test && test.test_result === 'PASS');
    const isRejected = t.status === 'TEST_REJECTED' || (test && test.test_result === 'REJECT');
    const days = daysSince(t.date_received);
    const urgencyColor = days > 3 ? '#dc2626' : days > 1 ? '#d97706' : '#059669';

    return `
      <div class="lab-card ${isRejected ? 'lab-card-rejected' : isPassed ? 'lab-card-passed' : ''}">
        <div class="lab-card-header">
          <div>
            <span class="lab-card-title">${t.ticket_no}</span>
            <div style="font-size:11px; color:var(--slate-500); margin-top:2px;">
              ${t.source_type === 'DEALER' ? `🏢 ${t.dealer_name || 'Dealer'} →` : '👤'} ${t.customer_name} • 📱 ${t.mobile}
            </div>
          </div>
          ${renderStatusPill(t.status)}
        </div>

        <div class="lab-battery-info">
          <div class="lab-meta-row"><strong>Battery Model:</strong><span>${t.battery_model}</span></div>
          <div class="lab-meta-row"><strong>Original Serial:</strong><code class="font-mono text-blue">'${t.original_serial_no}</code></div>
          <div class="lab-meta-row">
            <strong>Received:</strong>
            <span>${formatDate(t.date_received)} <span style="color:${urgencyColor}; font-weight:600;">(${days}d ago)</span></span>
          </div>
          ${t.service_battery_issued ? `
            <div class="lab-meta-row" style="color:var(--purple); font-weight:600; background:var(--purple-light); padding:4px 8px; border-radius:4px; margin-top:4px;">
              🔋 Loaner Issued: <code>${t.service_battery_serial}</code> (${t.service_battery_model})
            </div>` : ''}
          ${t.remarks ? `<div class="lab-meta-row" style="color:var(--slate-600); font-style:italic; font-size:12px;">"${t.remarks}"</div>` : ''}
        </div>

        ${test ? `
          <div class="test-results-box ${test.test_result === 'PASS' ? 'test-pass' : 'test-reject'}">
            <div class="test-verdict">
              ${test.test_result === 'PASS'
                ? `<span class="badge badge-success" style="font-size:13px; padding:4px 12px;">✅ PASS</span>`
                : `<span class="badge badge-danger" style="font-size:13px; padding:4px 12px;">❌ REJECT</span>`}
              <span style="font-size:11px; color:var(--slate-500); margin-left:8px;">by ${test.tested_by} on ${formatDate(test.test_date)}</span>
            </div>
            <div class="test-metrics">
              <span>OCV: <strong>${test.open_circuit_voltage}V</strong></span>
              <span>Load: <strong>${test.load_test_voltage}V</strong></span>
              <span>Casing: <strong>${test.physical_condition.replace('_', ' ')}</strong></span>
            </div>
            <div style="font-size:11px; color:var(--slate-600); margin-top:4px;">Gravity: <code>${test.specific_gravity}</code></div>
            ${test.test_remarks ? `<div style="font-size:12px; color:var(--slate-700); margin-top:4px; font-style:italic;">"${test.test_remarks}"</div>` : ''}
          </div>
        ` : `
          <div style="background:#fffbeb; border:1px dashed #fcd34d; border-radius:6px; padding:10px; margin-bottom:12px; font-size:12px; color:#92400e;">
            ⚡ Awaiting electrical diagnostics and physical casing check.
          </div>
        `}

        <div class="lab-card-actions">
          ${!isTested ? `
            <button class="btn btn-sm btn-primary" onclick="openTestModal('${t.ticket_no}')">
              🔬 Record Diagnostic Test
            </button>
          ` : ''}
          ${t.status === 'TEST_PASSED' ? `
            <button class="btn btn-sm btn-emerald" onclick="createClaimFromTicket('${t.ticket_no}')">
              📋 Convert to Warranty Claim
            </button>
          ` : ''}
          ${t.status === 'TEST_REJECTED' ? `
            ${!t.challan_no
              ? `<button class="btn btn-sm btn-rose" onclick="generateReturnChallan('${t.ticket_no}')">Generate Return Challan</button>`
              : `<button class="btn btn-sm btn-outline" onclick="preparePrintChallan('${t.challan_no}')">Print Return Challan</button>`
            }
            <button class="btn btn-sm btn-rose" onclick="openCloseoutModal('${t.ticket_no}','REJECT_RETURN')">Collect & Close</button>
          ` : ''}
          <button class="btn btn-sm btn-outline" onclick="openInspector('${t.ticket_no}')">📊 Full Timeline</button>
        </div>
      </div>
    `;
  }

  // ─── CLAIMS & DISPATCHES VIEW ────────────────────────────────────────────────
  function renderClaimsView() {
    // Dispatches Section
    const dispatchContainer = document.getElementById('dispatches-list');
    const badgeDispatch = document.getElementById('badge-dispatch-count');
    if (dispatchContainer) {
      if (badgeDispatch) badgeDispatch.textContent = `${state.dispatches.length} Batch${state.dispatches.length !== 1 ? 'es' : ''}`;
      dispatchContainer.innerHTML = state.dispatches.length === 0
        ? `<div class="p-3 text-muted text-center">No dispatch batches created yet.</div>`
        : state.dispatches.map(d => {
            const claimsInBatch = state.claims.filter(c => c.dispatch_batch_no === d.dispatch_batch_no);
            const allReplaced = claimsInBatch.every(c => c.status !== 'SENT_TO_COMPANY');
            return `
              <div class="dispatch-box">
                <div class="dispatch-box-header">
                  <h4>${d.dispatch_batch_no}</h4>
                  <div style="display:flex;gap:6px;align-items:center;">
                    <span class="badge badge-teal">${d.claim_count} Batteries</span>
                    ${allReplaced ? `<span class="badge badge-success">All Replaced</span>` : `<span class="badge badge-warning">Pending</span>`}
                  </div>
                </div>
                <p class="dispatch-meta-line"><strong>Company:</strong> ${d.company_name}</p>
                <p class="dispatch-meta-line"><strong>Depot:</strong> ${d.destination}</p>
                <p class="dispatch-meta-line"><strong>Carrier:</strong> ${d.carrier_transporter} (<code>${d.lr_docket_no}</code>)</p>
                <p class="dispatch-meta-line"><strong>Challan:</strong> <code>${d.company_challan_no}</code> • ${formatDate(d.dispatch_date)}</p>
                <div style="margin-top:10px; display:flex; gap:6px;">
                  <button class="btn btn-sm btn-outline" onclick="preparePrintChallan('${d.company_challan_no}')">🖨️ Print DC-COM</button>
                </div>
              </div>
            `;
          }).join('');
    }

    // Claims Table
    const tbody = document.getElementById('claims-tbody');
    if (!tbody) return;

    const filterEl = document.getElementById('filter-claim-status');
    const filterVal = filterEl ? filterEl.value : 'ALL';
    const list = filterVal === 'ALL' ? state.claims : state.claims.filter(c => c.status === filterVal);

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center p-4 text-muted">No warranty claims match this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(c => {
      const dispatch = c.dispatch_batch_no ? state.dispatches.find(d => d.dispatch_batch_no === c.dispatch_batch_no) : null;
      const ageingDays = dispatch ? daysSince(dispatch.dispatch_date) : null;

      return `
        <tr>
          <td><strong style="cursor:pointer; color:var(--primary);" onclick="openInspector('${c.ticket_no}')">${c.claim_no}</strong></td>
          <td><small class="text-muted">${c.ticket_no}</small></td>
          <td>
            <strong>${escapeHtml(c.customer_name)}</strong>
            <br><small class="text-muted">📱 ${escapeHtml(c.mobile)}</small>
          </td>
          <td>
            <div>${escapeHtml(c.battery_model)}</div>
            <code class="font-mono text-blue" style="font-size:11px;">'${escapeHtml(c.original_serial_no)}</code>
          </td>
          <td>${renderStatusPill(c.warranty_status)}</td>
          <td>${renderStatusPill(c.status)}</td>
          <td>
            ${c.replacement_serial_no
              ? `<code class="font-mono text-emerald" style="font-weight:700;">'${escapeHtml(c.replacement_serial_no)}</code>`
              : (c.status === 'SENT_TO_COMPANY'
                  ? `${renderAgeingBadge(ageingDays)} <span style="font-size:11px; color:#94a3b8;">at factory</span>`
                  : `<span class="text-muted" style="font-size:11px;">—</span>`)}
          </td>
          <td>${c.stock_status ? renderStatusPill(c.stock_status) : '—'}</td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              ${c.status === 'READY_FOR_COMPANY' ? `<button class="btn btn-sm btn-teal" onclick="openDispatchModal()">Dispatch</button>` : ''}
              ${c.status === 'SENT_TO_COMPANY' ? `<button class="btn btn-sm btn-primary" onclick="openReceiveReplacementModal('${c.claim_no}')">Receive</button>
                <button class="btn btn-sm btn-outline" onclick="rejectByCompany('${c.claim_no}')">Company Reject</button>` : ''}
              ${c.status === 'REPLACEMENT_RECEIVED' ? `<button class="btn btn-sm btn-rose" onclick="openReconcileModalForClaim('${c.claim_no}')">Log ERP</button>` : ''}
              ${c.status === 'STOCK_UPDATED' ? `<button class="btn btn-sm btn-emerald" onclick="openCloseoutModal('${c.ticket_no}','HANDOVER')">Handover</button>` : ''}
              ${c.status === 'REJECTED_BY_COMPANY' ? `<button class="btn btn-sm btn-rose" onclick="openCloseoutModal('${c.ticket_no}','REJECT_RETURN')">Return to Customer</button>` : ''}
              ${c.status === 'CLOSED' ? `<span class="badge badge-success">Done</span>` : ''}
              <button class="btn btn-sm btn-outline" onclick="openInspector('${c.ticket_no}')">Timeline</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── STOCK VIEW ───────────────────────────────────────────────────────────────
  function renderStockView() {
    const tbody = document.getElementById('stock-tbody');
    if (!tbody) return;

    if (state.stockTasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-muted">No stock tasks recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.stockTasks.map(s => {
      const days = daysSince(s.received_date);
      const claim = state.claims.find(c => c.claim_no === s.claim_no);
      return `
        <tr>
          <td><strong>${s.stock_task_id}</strong></td>
          <td>
            <strong style="cursor:pointer; color:var(--primary);" onclick="openInspector('${claim ? claim.ticket_no : ''}')">
              ${s.claim_no}
            </strong>
          </td>
          <td>${s.replacement_model}</td>
          <td><code class="font-mono text-emerald" style="font-weight:700;">'${s.replacement_serial_no}</code></td>
          <td>${formatDate(s.received_date)}</td>
          <td>${s.stock_status === 'UPDATED' ? `${renderStatusPill('UPDATED')}` : `${renderStatusPill('UPDATE_REQUIRED')} <small style="color:#94a3b8;">(${days} days)</small>`}</td>
          <td>
            ${s.accounting_ref_no
              ? `<code class="font-mono" style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${s.accounting_ref_no}</code>`
              : `<span class="text-muted">Pending Inward Voucher</span>`}
          </td>
          <td>
            ${s.stock_status === 'UPDATE_REQUIRED'
              ? `<button class="btn btn-sm btn-rose" onclick="openReconcileModal('${s.stock_task_id}')">Log ERP Voucher</button>`
              : (claim && claim.status === 'STOCK_UPDATED'
                  ? `<button class="btn btn-sm btn-emerald" onclick="openCloseoutModal('${claim.ticket_no}','HANDOVER')">Handover</button>`
                  : `<span class="text-muted" style="font-size:12px;">Done by ${escapeHtml(s.updated_by || '—')}</span>`)}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── AUDIT TRAIL VIEW ─────────────────────────────────────────────────────────
  function renderAuditView() {
    const tbody = document.getElementById('audit-tbody');
    if (!tbody) return;

    if (state.audits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No audit records yet.</td></tr>`;
      return;
    }

    const ACTION_ICONS = { INTAKE: '📥', TEST: '🔬', DISPATCH: '🚚', REPLACEMENT_RECEIVE: '📦', STOCK_UPDATE: '⚖️', CHALLAN: '📄', CLAIM: '📋' };

    tbody.innerHTML = [...state.audits].reverse().map(a => `
      <tr>
        <td><code class="font-mono" style="font-size:11px;">${a.audit_id}</code></td>
        <td><small>${new Date(a.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}</small></td>
        <td><strong>${a.user_email}</strong></td>
        <td><span class="badge badge-gray">${ACTION_ICONS[a.action] || '•'} ${a.action}</span></td>
        <td><strong>${a.record_id}</strong> <small class="text-muted">(${a.record_type})</small></td>
        <td>
          ${a.old_status !== 'NONE' ? `<span class="text-muted" style="font-size:11px;">${a.old_status}</span> → ` : ''}
          <strong>${a.new_status}</strong>
        </td>
        <td><small>${a.details}</small></td>
      </tr>
    `).join('');
  }

  // ─── PRINT CENTER ─────────────────────────────────────────────────────────────
  function renderPrintTemplate(templateType, recordId) {
    const selector = document.getElementById('print-template-selector');
    const paper = document.getElementById('print-paper');
    if (!paper) return;

    const chosen = templateType || (selector ? selector.value : 'DC-RET');
    if (selector && templateType) selector.value = templateType;

    const cfg = state.config;

    if (chosen === 'DC-RET') {
      // Bug Fix: Find the specific challan by recordId, not just any return challan
      const challan = recordId
        ? state.challans.find(c => c.challan_no === recordId)
        : state.challans.find(c => c.challan_type === 'BATTERY_RETURN');

      if (!challan) {
        paper.innerHTML = `<div class="p-4 text-center text-muted">No return challan found.</div>`;
        return;
      }

      paper.innerHTML = buildReturnChallanHTML(challan, cfg);
    } else if (chosen === 'DC-COM') {
      const dispatch = recordId
        ? state.dispatches.find(d => d.company_challan_no === recordId)
        : state.dispatches[0];
      const challan = dispatch ? state.challans.find(c => c.challan_no === dispatch.company_challan_no) : null;
      const claimsInBatch = dispatch ? state.claims.filter(c => c.dispatch_batch_no === dispatch.dispatch_batch_no) : [];

      if (!dispatch) {
        paper.innerHTML = `<div class="p-4 text-center text-muted">No company dispatch batch found.</div>`;
        return;
      }

      paper.innerHTML = buildCompanyChallanHTML(dispatch, challan, claimsInBatch, cfg);
    } else {
      const claim = recordId
        ? state.claims.find(c => c.claim_no === recordId)
        : state.claims.find(c => c.status !== 'CLOSED') || state.claims[0];
      const ticket = claim ? state.tickets.find(t => t.ticket_no === claim.ticket_no) : null;
      const test = ticket ? state.tests.find(x => x.ticket_no === ticket.ticket_no) : null;
      paper.innerHTML = buildClaimFormHTML(claim, ticket, test, cfg);
    }
  }

  function buildReturnChallanHTML(c, cfg) {
    return `
      <div class="challan-header">
        <div class="company-branding">
          <h2>${cfg.companyName}</h2>
          <p>${cfg.companyAddress}</p>
          <p><strong>Phone:</strong> ${cfg.companyPhone} | <strong>GSTIN:</strong> ${cfg.companyGst}</p>
        </div>
        <div class="doc-badge-block">
          <div class="doc-type-title">BATTERY RETURN DELIVERY CHALLAN</div>
          <p><strong>Challan No:</strong> <code class="font-mono">${c.challan_no}</code></p>
          <p><strong>Date:</strong> ${formatDate(c.challan_date)}</p>
          <p><strong>Type:</strong> Warranty Rejected Battery Return</p>
        </div>
      </div>
      <table class="meta-table">
        <tr>
          <td class="label">Returned To:</td>
          <td><strong>${c.recipient_name}</strong></td>
          <td class="label">Mobile:</td>
          <td>${c.mobile}</td>
        </tr>
        <tr>
          <td class="label">Address:</td>
          <td>${c.address}</td>
          <td class="label">Originating Ticket:</td>
          <td><code>${c.ticket_no}</code></td>
        </tr>
      </table>
      <table class="item-table">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>Description / Battery Model</th>
            <th>Original Serial Number</th>
            <th style="width:70px;">Qty</th>
            <th>Rejection Reason</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td><strong>${c.battery_model}</strong></td>
            <td><code class="font-mono">'${c.battery_serial_no}</code></td>
            <td>1 Nos</td>
            <td>${c.remarks}</td>
          </tr>
        </tbody>
      </table>
      <div class="terms-box">
        <strong>Undertaking & Terms:</strong>
        <p>1. The above battery was physically inspected and tested at our authorized facility. The defect identified is outside standard manufacturer warranty guidelines.</p>
        <p>2. This challan does NOT carry any commercial value, rate, or GST implication. It is solely a custody transfer acknowledgement.</p>
        <p>3. The receiver acknowledges physical receipt of the surrendered battery in as-is, tested condition.</p>
        <p>4. If any service/loaner battery was issued, it must be returned before the original battery is released.</p>
      </div>
      <div class="signoff-section">
        <div class="sign-box">
          <div style="height:60px;"></div>
          Customer / Receiver Signature<br>
          <span style="font-size:10px; color:#94a3b8;">Name: _____________ Date: _____________</span>
        </div>
        <div class="sign-box">
          <div style="height:60px;"></div>
          For ${cfg.companyName}<br>
          <span style="font-size:10px; color:#94a3b8;">Authorized Signatory / Store Keeper</span>
        </div>
      </div>
    `;
  }

  function buildCompanyChallanHTML(dispatch, challan, claimsInBatch, cfg) {
    return `
      <div class="challan-header">
        <div class="company-branding">
          <h2>${cfg.companyName}</h2>
          <p>${cfg.companyAddress}</p>
          <p><strong>Phone:</strong> ${cfg.companyPhone} | <strong>GSTIN:</strong> ${cfg.companyGst}</p>
        </div>
        <div class="doc-badge-block">
          <div class="doc-type-title">COMPANY DISPATCH MANIFEST</div>
          <p><strong>Challan No:</strong> <code class="font-mono">${dispatch.company_challan_no}</code></p>
          <p><strong>Batch ID:</strong> <code>${dispatch.dispatch_batch_no}</code></p>
          <p><strong>Date:</strong> ${formatDate(dispatch.dispatch_date)}</p>
        </div>
      </div>
      <table class="meta-table">
        <tr>
          <td class="label">Consignee (Factory):</td>
          <td><strong>${dispatch.company_name}</strong></td>
          <td class="label">Destination Depot:</td>
          <td>${dispatch.destination}</td>
        </tr>
        <tr>
          <td class="label">Carrier / Transporter:</td>
          <td><strong>${dispatch.carrier_transporter}</strong></td>
          <td class="label">LR / Docket Number:</td>
          <td><code class="font-mono" style="font-weight:700;">${dispatch.lr_docket_no}</code></td>
        </tr>
      </table>
      <table class="item-table">
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th>Claim No.</th>
            <th>Customer Name</th>
            <th>Battery Model</th>
            <th>Original Serial Number</th>
            <th>Defect Diagnostic</th>
          </tr>
        </thead>
        <tbody>
          ${claimsInBatch.map((c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${c.claim_no}</strong></td>
              <td>${c.customer_name}</td>
              <td>${c.battery_model}</td>
              <td><code class="font-mono">'${c.original_serial_no}</code></td>
              <td>Internal dead cell / voltage collapse under load</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="terms-box">
        <strong>Consignment Declaration:</strong>
        <p>These batteries are sent exclusively for technical warranty evaluation and replacement as per manufacturer distributor agreement. Not for commercial resale. Goods value for insurance purpose only.</p>
      </div>
      <div class="signoff-section">
        <div class="sign-box">
          <div style="height:60px;"></div>
          Transporter / Driver Signature & Vehicle Stamp<br>
          <span style="font-size:10px; color:#94a3b8;">(Received goods in sealed condition)</span>
        </div>
        <div class="sign-box">
          <div style="height:60px;"></div>
          For ${cfg.companyName}<br>
          <span style="font-size:10px; color:#94a3b8;">Despatch Officer / Authorized Signatory</span>
        </div>
      </div>
    `;
  }

  function buildClaimFormHTML(claim, ticket, test, cfg) {
    if (!claim) return `<div class="p-4 text-center text-muted">No warranty claims found.</div>`;
    return `
      <div class="challan-header">
        <div class="company-branding">
          <h2>${cfg.companyName}</h2>
          <p>${cfg.companyAddress}</p>
          <p><strong>Phone:</strong> ${cfg.companyPhone} | <strong>GSTIN:</strong> ${cfg.companyGst}</p>
        </div>
        <div class="doc-badge-block">
          <div class="doc-type-title">WARRANTY CLAIM DOCKET</div>
          <p><strong>Claim No:</strong> <code class="font-mono">${claim.claim_no}</code></p>
          <p><strong>Ticket No:</strong> <code>${ticket ? ticket.ticket_no : '—'}</code></p>
          <p><strong>Claim Date:</strong> ${formatDate(claim.claim_date)}</p>
        </div>
      </div>
      <table class="meta-table">
        <tr>
          <td class="label">Customer Name:</td>
          <td><strong>${claim.customer_name}</strong></td>
          <td class="label">Mobile Number:</td>
          <td>${claim.mobile}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Registration:</td>
          <td><code>${claim.vehicle_number || '—'}</code></td>
          <td class="label">Warranty Eligibility:</td>
          <td><strong style="color:#15803d;">IN-WARRANTY</strong></td>
        </tr>
        <tr>
          <td class="label">Battery Model:</td>
          <td><strong>${claim.battery_model}</strong></td>
          <td class="label">Original Serial No:</td>
          <td><code class="font-mono text-blue">'${claim.original_serial_no}</code></td>
        </tr>
        <tr>
          <td class="label">Service Loaner Issued:</td>
          <td>${ticket && ticket.service_battery_issued ? `<code>${ticket.service_battery_serial}</code>` : 'None'}</td>
          <td class="label">Warranty Status:</td>
          <td><strong style="color:#059669;">${claim.warranty_status.replace(/_/g, ' ')}</strong></td>
        </tr>
      </table>
      <div style="margin:16px 0 8px; font-weight:700; text-transform:uppercase; font-size:11px; color:#475569;">Bench Electrical Test Summary</div>
      <table class="item-table">
        <thead>
          <tr>
            <th>Open Circuit Voltage (OCV)</th>
            <th>15s High Load Voltage</th>
            <th>Specific Gravity (6 Cells)</th>
            <th>Physical Condition</th>
            <th>Lab Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${test ? test.open_circuit_voltage : '—'} Volts</strong></td>
            <td><strong>${test ? test.load_test_voltage : '—'} Volts</strong></td>
            <td><code>${test ? test.specific_gravity : '—'}</code></td>
            <td>${test ? test.physical_condition.replace('_', ' ') : '—'}</td>
            <td><span class="badge badge-success">PASS</span></td>
          </tr>
        </tbody>
      </table>
      <div class="terms-box">
        <strong>Customer Acknowledgement & Undertaking:</strong>
        <p>I hereby confirm that I have surrendered my battery for official manufacturer warranty processing. I understand that replacement approval is subject to final physical inspection by the factory service engineer. The service/loaner battery (if issued) will be returned upon delivery of the replacement battery.</p>
      </div>
      <div class="signoff-section">
        <div class="sign-box">
          <div style="height:60px;"></div>
          Customer Signature
        </div>
        <div class="sign-box">
          <div style="height:60px;"></div>
          Testing Engineer / Authorized Staff Signature
        </div>
      </div>
    `;
  }

  window.preparePrintChallan = function (challanNo) {
    if (!challanNo) { showToast('No challan number associated with this record yet.', 'warning'); return; }
    switchTab('tab-print');
    if (challanNo.startsWith('DC-RET')) {
      renderPrintTemplate('DC-RET', challanNo);
    } else if (challanNo.startsWith('DC-COM')) {
      renderPrintTemplate('DC-COM', challanNo);
    }
  };

  // ─── MODAL: NEW INTAKE ────────────────────────────────────────────────────────
  document.getElementById('form-new-intake').addEventListener('submit', function (e) {
    e.preventDefault();

    const sourceType = document.getElementById('intake-source-type').value;
    const dealerSelect = document.getElementById('intake-dealer-id');
    const dealerName = sourceType === 'DEALER' ? dealerSelect.options[dealerSelect.selectedIndex].text : '';
    const customerName = document.getElementById('intake-customer-name').value.trim();
    const mobile = document.getElementById('intake-mobile').value.trim();
    const vehicle = document.getElementById('intake-vehicle').value.trim().toUpperCase();
    const address = document.getElementById('intake-address').value.trim();
    const model = document.getElementById('intake-battery-model').value;
    const origSerial = document.getElementById('intake-original-serial').value.trim();
    const remarks = document.getElementById('intake-remarks').value.trim();
    const issueLoaner = document.getElementById('intake-issue-loaner').checked;
    const loanerModel = document.getElementById('intake-loaner-model').value.trim();
    const loanerSerial = document.getElementById('intake-loaner-serial').value.trim();

    if (!/^[0-9]{10}$/.test(mobile)) {
      showToast('Enter a 10-digit mobile number.', 'danger');
      return;
    }
    if (!origSerial) { showToast('Battery serial number is required.', 'danger'); return; }
    if (isDuplicateSerial(origSerial, null)) {
      showToast(`Serial '${origSerial}' is already on an open ticket. Close or return that ticket first.`, 'danger', 6000);
      return;
    }

    if (issueLoaner && !loanerSerial.trim()) {
      showToast('Please enter the loaner battery serial number.', 'danger');
      return;
    }
    if (issueLoaner && loanerSerial === origSerial) {
      showToast('Loaner serial cannot be the same as the surrendered battery serial.', 'danger', 6000);
      return;
    }
    if (issueLoaner && isDuplicateLoanerSerial(loanerSerial, null)) {
      showToast(`Loaner '${loanerSerial}' is already issued on another open ticket.`, 'danger', 6000);
      return;
    }

    const ticketNo = nextSeq('TKT', state.tickets);
    const today = new Date().toISOString().split('T')[0];

    const newTicket = {
      ticket_no: ticketNo, source_type: sourceType, dealer_name: dealerName,
      customer_name: customerName, mobile: mobile, vehicle_number: vehicle,
      address: address, battery_model: model, original_serial_no: origSerial,
      date_received: today, service_battery_issued: issueLoaner,
      service_battery_model: issueLoaner ? loanerModel : '',
      service_battery_serial: issueLoaner ? loanerSerial : '',
      status: 'RECEIVED', claim_no: null, challan_no: null, remarks: remarks,
      service_battery_returned: !issueLoaner,
      created_at: new Date().toISOString()
    };

    state.tickets.push(newTicket);
    state.audits.push({
      audit_id: nextSeq('AUD', state.audits), timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in', action: 'INTAKE', record_type: 'TICKET',
      record_id: ticketNo, old_status: 'NONE', new_status: 'RECEIVED',
      details: `Intake registered for ${customerName} (${model}, Serial '${origSerial}'). ${issueLoaner ? `Loaner ${loanerSerial} issued.` : ''}`
    });

    saveState();
    closeModal('modal-intake');
    this.reset();
    document.getElementById('loaner-fields').style.display = 'none';
    document.getElementById('group-dealer-select').style.display = 'none';
    renderAll();
    showToast(`✅ Intake ticket ${ticketNo} generated! Battery is now in RECEIVED queue.`, 'success');
    // Auto-navigate to lab with the new ticket highlighted
    setTimeout(() => switchTab('tab-lab'), 500);
  });

  document.getElementById('intake-source-type').addEventListener('change', function () {
    document.getElementById('group-dealer-select').style.display = this.value === 'DEALER' ? 'block' : 'none';
  });

  document.getElementById('intake-issue-loaner').addEventListener('change', function () {
    document.getElementById('loaner-fields').style.display = this.checked ? 'flex' : 'none';
    // ✅ Bug Fix: Generate proper loaner serial format SB-00XXX
    if (this.checked && !document.getElementById('intake-loaner-serial').value) {
      let max = 0;
      state.tickets.forEach(t => {
        const m = /SB-(\d+)/.exec(t.service_battery_serial || '');
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      document.getElementById('intake-loaner-serial').value = `SB-${String(max + 1).padStart(5, '0')}`;
    }
  });

  // ─── OPEN TEST MODAL ─────────────────────────────────────────────────────────
  window.openTestModal = function (ticketNo) {
    const t = state.tickets.find(x => x.ticket_no === ticketNo);
    if (!t) return;
    const existingTest = state.tests.find(x => x.ticket_no === ticketNo);

    if (t.status === 'RECEIVED') {
      t.status = 'TESTING';
      saveState();
    }

    document.getElementById('test-ticket-no').value = t.ticket_no;
    document.getElementById('test-meta-ticket').textContent = t.ticket_no;
    document.getElementById('test-meta-customer').textContent = t.customer_name;
    document.getElementById('test-meta-model').textContent = t.battery_model;
    document.getElementById('test-meta-serial').textContent = `'${t.original_serial_no}`;

    // Pre-fill from existing test or defaults
    document.getElementById('test-ocv').value = existingTest ? existingTest.open_circuit_voltage : '10.5';
    document.getElementById('test-load-v').value = existingTest ? existingTest.load_test_voltage : '8.2';
    document.getElementById('test-gravity').value = existingTest ? existingTest.specific_gravity : '1.18, 1.18, 1.11, 1.18, 1.18, 1.18';
    document.getElementById('test-casing').value = existingTest ? existingTest.physical_condition : 'CLEAN_OK';
    document.getElementById('test-result').value = existingTest ? existingTest.test_result : 'PASS';
    document.getElementById('test-technician').value = existingTest ? existingTest.tested_by : 'Sanjay Mistri';
    document.getElementById('test-remarks').value = existingTest ? existingTest.test_remarks : '';
    updateTestRecommendation();

    openModal('modal-test');
  };

  function updateTestRecommendation() {
    const box = document.getElementById('test-recommendation');
    if (!box) return;
    const ocv = parseFloat(document.getElementById('test-ocv').value);
    const loadV = parseFloat(document.getElementById('test-load-v').value);
    const gravity = document.getElementById('test-gravity').value.trim();
    const casing = document.getElementById('test-casing').value;
    const rec = evaluateDiagnostics(ocv, loadV, gravity, casing);
    const resultEl = document.getElementById('test-result');
    box.hidden = false;
    if (rec.recommendReject) {
      box.className = 'test-recommendation rec-reject';
      box.textContent = 'Recommendation: REJECT — physical damage / abuse is outside warranty. ' + rec.reasons.join('. ') + '.';
      if (resultEl && !resultEl.dataset.manual) resultEl.value = 'REJECT';
    } else {
      box.className = 'test-recommendation rec-pass';
      const extra = rec.reasons.length ? ' Notes: ' + rec.reasons.join('. ') + '.' : ' Clean casing with electrical failure is typically a manufacturing claim (PASS).';
      box.textContent = 'Recommendation: PASS — eligible to convert to a company claim.' + extra;
      if (resultEl && !resultEl.dataset.manual) resultEl.value = 'PASS';
    }
  }

  // ─── SUBMIT TEST ─────────────────────────────────────────────────────────────
  document.getElementById('form-record-test').addEventListener('submit', function (e) {
    e.preventDefault();

    const ticketNo = document.getElementById('test-ticket-no').value;
    const t = state.tickets.find(x => x.ticket_no === ticketNo);
    if (!t) return;

    const ocv = parseFloat(document.getElementById('test-ocv').value);
    const loadV = parseFloat(document.getElementById('test-load-v').value);
    const gravity = document.getElementById('test-gravity').value.trim();
    const casing = document.getElementById('test-casing').value;
    const result = document.getElementById('test-result').value;
    const tester = document.getElementById('test-technician').value.trim();
    const remarks = document.getElementById('test-remarks').value.trim();

    // ✅ Auto-suggest result based on voltage if user hasn't manually changed
    if (ocv < 10.8 || loadV < 9.6 || casing !== 'CLEAN_OK') {
      if (result === 'PASS' && casing !== 'CLEAN_OK') {
        if (!confirm(`Physical casing condition is "${casing.replace('_', ' ')}" which typically indicates REJECT. Confirm PASS verdict anyway?`)) return;
      }
    }

    // Remove existing test (re-testing allowed)
    state.tests = state.tests.filter(x => x.ticket_no !== ticketNo);
    const testId = nextSeq('TST', state.tests);
    const today = new Date().toISOString().split('T')[0];

    state.tests.push({
      test_id: testId, ticket_no: ticketNo, original_serial_no: t.original_serial_no,
      test_date: today, tested_by: tester, open_circuit_voltage: ocv,
      load_test_voltage: loadV, specific_gravity: gravity,
      physical_condition: casing, test_result: result, test_remarks: remarks
    });

    if (result === 'PASS') {
      t.status = 'TEST_PASSED';
      state.audits.push({
        audit_id: nextSeq('AUD', state.audits), timestamp: new Date().toISOString(),
        user_email: 'sanjay@batteryhub.in', action: 'TEST', record_type: 'TICKET',
        record_id: ticketNo, old_status: 'TESTING', new_status: 'TEST_PASSED',
        details: `Battery passed test (OCV: ${ocv}V, Load: ${loadV}V). Ready for claim creation.`
      });
      saveState(); closeModal('modal-test'); renderAll();
      showToast(`✅ Test PASSED! Click "Convert to Warranty Claim" on the lab card for ${ticketNo}.`, 'success', 6000);
    } else {
      t.status = 'TEST_REJECTED';
      // ✅ Bug Fix: Only generate challan if one doesn't exist yet
      if (!t.challan_no) {
        const challanNo = nextSeq('DC-RET', state.challans);
        t.challan_no = challanNo;
        state.challans.push({
          challan_no: challanNo, challan_type: 'BATTERY_RETURN',
          challan_date: today, recipient_name: t.customer_name,
          mobile: t.mobile, address: t.address || 'Surat',
          ticket_no: t.ticket_no, battery_model: t.battery_model,
          battery_serial_no: t.original_serial_no, quantity: 1,
          status: 'GENERATED', remarks: remarks || `Rejected — ${casing.replace('_', ' ')}`
        });
      }
      state.audits.push({
        audit_id: nextSeq('AUD', state.audits), timestamp: new Date().toISOString(),
        user_email: 'sanjay@batteryhub.in', action: 'TEST', record_type: 'TICKET',
        record_id: ticketNo, old_status: 'TESTING', new_status: 'TEST_REJECTED',
        details: `Battery rejected (${casing}). Return delivery challan ${t.challan_no} generated.`
      });
      saveState(); closeModal('modal-test'); renderAll();
      showToast(`Battery REJECTED. Return challan ${t.challan_no} issued. Print it and hand battery back to customer.`, 'info', 6000);
    }
  });

  // ─── CREATE CLAIM FROM TICKET (Bug Fix: was undefined) ────────────────────────
  window.createClaimFromTicket = function (ticketNo) {
    const t = state.tickets.find(x => x.ticket_no === ticketNo);
    if (!t) return;
    if (t.claim_no) {
      showToast(`Claim ${t.claim_no} already exists for this ticket.`, 'info');
      return;
    }
    if (t.status !== 'TEST_PASSED') {
      showToast('Only TEST_PASSED batteries can be converted to a claim.', 'warning');
      return;
    }

    const claimNo = nextSeq('CLM', state.claims);
    const today = new Date().toISOString().split('T')[0];

    t.claim_no = claimNo;
    t.status = 'CLAIM_CREATED';

    state.claims.push({
      claim_no: claimNo, ticket_no: t.ticket_no, customer_name: t.customer_name,
      mobile: t.mobile, vehicle_number: t.vehicle_number, battery_model: t.battery_model,
      original_serial_no: t.original_serial_no, warranty_status: 'IN_WARRANTY',
      claim_date: today, status: 'READY_FOR_COMPANY',
      dispatch_batch_no: null, company_challan_no: null,
      replacement_model: null, replacement_serial_no: null,
      replacement_received_date: null, stock_status: 'NOT_APPLICABLE',
      stock_ref_no: null, closed_date: null
    });

    state.audits.push({
      audit_id: nextSeq('AUD', state.audits), timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in', action: 'CLAIM', record_type: 'CLAIM',
      record_id: claimNo, old_status: 'TEST_PASSED', new_status: 'READY_FOR_COMPANY',
      details: `Warranty claim ${claimNo} created for ${t.battery_model} (Serial '${t.original_serial_no}').`
    });

    saveState(); renderAll();
    showToast(`📋 Claim ${claimNo} created and marked READY FOR COMPANY. Go to Claims tab to dispatch.`, 'success', 6000);
    setTimeout(() => switchTab('tab-claims'), 800);
  };

  // ─── GENERATE RETURN CHALLAN (separate from test) ────────────────────────────
  window.generateReturnChallan = function (ticketNo) {
    const t = state.tickets.find(x => x.ticket_no === ticketNo);
    if (!t || t.challan_no) return;

    const challanNo = nextSeq('DC-RET', state.challans);
    const today = new Date().toISOString().split('T')[0];
    t.challan_no = challanNo;

    state.challans.push({
      challan_no: challanNo, challan_type: 'BATTERY_RETURN', challan_date: today,
      recipient_name: t.customer_name, mobile: t.mobile, address: t.address || 'Surat',
      ticket_no: t.ticket_no, battery_model: t.battery_model,
      battery_serial_no: t.original_serial_no, quantity: 1,
      status: 'GENERATED', remarks: 'Warranty rejected during electrical diagnostic.'
    });

    saveState(); renderAll();
    showToast(`📄 Return Challan ${challanNo} generated! Navigating to print...`, 'success');
    setTimeout(() => preparePrintChallan(challanNo), 600);
  };

  // ─── DISPATCH BATCH ───────────────────────────────────────────────────────────
  document.getElementById('btn-create-dispatch').addEventListener('click', function () {
    // ✅ Bug Fix: Only show READY_FOR_COMPANY claims (not already dispatched)
    const readyClaims = state.claims.filter(c => c.status === 'READY_FOR_COMPANY');
    const container = document.getElementById('dispatch-claims-selector');

    if (readyClaims.length === 0) {
      showToast('No approved claims in "READY FOR COMPANY" state. Test batteries and create claims first.', 'warning', 5000);
      return;
    }

    container.innerHTML = readyClaims.map(c => `
      <div style="display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #f1f5f9;">
        <input type="checkbox" id="chk-claim-${c.claim_no}" value="${c.claim_no}" checked>
        <label for="chk-claim-${c.claim_no}" style="font-size:12px; cursor:pointer;">
          <strong>${c.claim_no}</strong>: ${c.customer_name}
          — ${c.battery_model} (<code class="font-mono">'${c.original_serial_no}</code>)
        </label>
      </div>
    `).join('');

    openModal('modal-dispatch');
  });

  document.getElementById('form-create-dispatch').addEventListener('submit', function (e) {
    e.preventDefault();

    const checkedBoxes = Array.from(document.querySelectorAll('#dispatch-claims-selector input:checked'));
    if (checkedBoxes.length === 0) {
      showToast('Please select at least 1 claim to dispatch.', 'danger');
      return;
    }

    const company = document.getElementById('dispatch-company').value;
    const dest = document.getElementById('dispatch-destination').value.trim();
    const carrier = document.getElementById('dispatch-carrier').value.trim();
    const lr = document.getElementById('dispatch-lr').value.trim();

    if (!lr) { showToast('LR / Docket number is mandatory for dispatch.', 'danger'); return; }

    const batchId = nextSeq('DSP', state.dispatches);
    const challanNo = nextSeq('DC-COM', state.challans.filter(c => c.challan_type === 'COMPANY_DISPATCH'));
    const today = new Date().toISOString().split('T')[0];
    const claimIds = checkedBoxes.map(b => b.value);

    claimIds.forEach(id => {
      const claim = state.claims.find(c => c.claim_no === id);
      if (claim) {
        claim.status = 'SENT_TO_COMPANY';
        claim.dispatch_batch_no = batchId;
        claim.company_challan_no = challanNo;
      }
    });

    // ✅ Bug Fix: Link tickets too
    claimIds.forEach(id => {
      const claim = state.claims.find(c => c.claim_no === id);
      if (claim) {
        const ticket = state.tickets.find(t => t.ticket_no === claim.ticket_no);
        if (ticket) ticket.status = 'CLAIM_CREATED'; // Keep ticket status visible
      }
    });

    state.dispatches.push({
      dispatch_batch_no: batchId, company_name: company, destination: dest,
      company_challan_no: challanNo, dispatch_date: today,
      carrier_transporter: carrier, lr_docket_no: lr,
      claim_count: claimIds.length, battery_count: claimIds.length,
      created_by: 'ramesh@batteryhub.in',
      remarks: `Consolidated dispatch of ${claimIds.length} batteries via ${carrier}.`
    });

    state.challans.push({
      challan_no: challanNo, challan_type: 'COMPANY_DISPATCH', challan_date: today,
      recipient_name: company, mobile: '+91 265 2840192', address: dest,
      ticket_no: 'CONSOLIDATED-BATCH', battery_model: 'Consolidated Consignment',
      battery_serial_no: claimIds.join(', '), quantity: claimIds.length,
      status: 'DISPATCHED', remarks: `Booked under LR ${lr}`
    });

    state.audits.push({
      audit_id: nextSeq('AUD', state.audits), timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in', action: 'DISPATCH', record_type: 'DISPATCH',
      record_id: batchId, old_status: 'READY_FOR_COMPANY', new_status: 'SENT_TO_COMPANY',
      details: `Batch ${batchId} (${claimIds.length} claims) dispatched via ${carrier}, LR: ${lr}. Challan ${challanNo}.`
    });

    saveState(); closeModal('modal-dispatch'); renderAll();
    showToast(`🚚 Batch ${batchId} dispatched! Printing DC-COM challan...`, 'success');
    setTimeout(() => preparePrintChallan(challanNo), 800);
  });

  // ─── RECEIVE REPLACEMENT ──────────────────────────────────────────────────────
  window.openReceiveReplacementModal = function (claimNo) {
    const claim = state.claims.find(c => c.claim_no === claimNo);
    if (!claim) return;

    document.getElementById('repl-claim-no').value = claim.claim_no;
    document.getElementById('repl-meta-claim').textContent = claim.claim_no;
    document.getElementById('repl-meta-customer').textContent = claim.customer_name;
    document.getElementById('repl-meta-orig-serial').textContent = `'${claim.original_serial_no}`;
    document.getElementById('repl-model').value = claim.battery_model;
    document.getElementById('repl-serial').value = '';  // ✅ Bug Fix: Don't pre-fill — admin must scan actual barcode

    openModal('modal-replacement');
  };

  document.getElementById('form-receive-replacement').addEventListener('submit', function (e) {
    e.preventDefault();

    const claimNo = document.getElementById('repl-claim-no').value;
    const claim = state.claims.find(c => c.claim_no === claimNo);
    if (!claim) return;

    const replModel = document.getElementById('repl-model').value.trim();
    const replSerial = document.getElementById('repl-serial').value.trim();

    if (!replSerial) { showToast('Replacement battery serial number is required.', 'danger'); return; }

    // ✅ Bug Fix: Validate replacement serial ≠ original serial
    if (replSerial === claim.original_serial_no) {
      showToast(`CRITICAL: Replacement serial '${replSerial}' MATCHES the original battery serial. This is a data entry error. Please verify the physical barcode.`, 'danger', 8000);
      return;
    }

    // ✅ Bug Fix: Check if replacement serial already exists in system
    const allSerials = [
      ...state.claims.filter(c => c.replacement_serial_no).map(c => c.replacement_serial_no),
      ...state.tickets.map(t => t.original_serial_no)
    ];
    if (allSerials.includes(replSerial)) {
      if (!confirm(`Serial '${replSerial}' is already recorded in the system. Could be a duplicate scan. Proceed anyway?`)) return;
    }

    const today = new Date().toISOString().split('T')[0];
    claim.status = 'REPLACEMENT_RECEIVED';
    claim.replacement_model = replModel;
    claim.replacement_serial_no = replSerial;
    claim.replacement_received_date = today;
    claim.stock_status = 'UPDATE_REQUIRED';

    const taskId = nextSeq('STK', state.stockTasks);
    state.stockTasks.push({
      stock_task_id: taskId, claim_no: claimNo, replacement_model: replModel,
      replacement_serial_no: replSerial, received_date: today,
      stock_status: 'UPDATE_REQUIRED', accounting_ref_no: null,
      updated_at: null, updated_by: null
    });

    state.audits.push({
      audit_id: nextSeq('AUD', state.audits), timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in', action: 'REPLACEMENT_RECEIVE', record_type: 'CLAIM',
      record_id: claimNo, old_status: 'SENT_TO_COMPANY', new_status: 'REPLACEMENT_RECEIVED',
      details: `Received factory replacement serial '${replSerial}' (${replModel}). Created mandatory stock task ${taskId}.`
    });

    saveState(); closeModal('modal-replacement'); renderAll();
    showToast(`📦 Replacement '${replSerial}' received! Stock task ${taskId} created — update Busy/Tally before closing claim.`, 'success', 6000);
    setTimeout(() => switchTab('tab-stock'), 800);
  });

  // ─── RECONCILE STOCK ──────────────────────────────────────────────────────────
  window.openReconcileModal = function (taskId) {
    const task = state.stockTasks.find(s => s.stock_task_id === taskId);
    if (!task) return;

    document.getElementById('recon-task-id').value = task.stock_task_id;
    document.getElementById('recon-meta-task').textContent = task.stock_task_id;
    document.getElementById('recon-meta-claim').textContent = task.claim_no;
    document.getElementById('recon-meta-battery').textContent = task.replacement_model;
    document.getElementById('recon-meta-serial').textContent = `'${task.replacement_serial_no}`;
    document.getElementById('recon-ref-no').value = '';  // ✅ Bug Fix: Don't pre-fill reference number
    document.getElementById('recon-operator').value = 'Ramesh Sharma';

    openModal('modal-reconcile');
  };

  window.openReconcileModalForClaim = function (claimNo) {
    // ✅ Bug Fix: Handle case where no task found gracefully
    const task = state.stockTasks.find(s => s.claim_no === claimNo && s.stock_status === 'UPDATE_REQUIRED');
    if (task) {
      openReconcileModal(task.stock_task_id);
    } else {
      showToast('Stock task already completed for this claim.', 'info');
    }
  };

  document.getElementById('form-reconcile-stock').addEventListener('submit', function (e) {
    e.preventDefault();

    const taskId = document.getElementById('recon-task-id').value;
    const task = state.stockTasks.find(s => s.stock_task_id === taskId);
    if (!task) return;

    const erp = document.getElementById('recon-erp-type').value;
    const refNo = document.getElementById('recon-ref-no').value.trim();
    const operator = document.getElementById('recon-operator').value.trim();

    if (!refNo) { showToast('ERP Voucher Reference Number is mandatory.', 'danger'); return; }

    task.stock_status = 'UPDATED';
    task.accounting_ref_no = `${erp}:${refNo}`;
    task.updated_at = new Date().toISOString();
    task.updated_by = operator;

    const claim = state.claims.find(c => c.claim_no === task.claim_no);
    if (claim) {
      claim.stock_status = 'UPDATED';
      claim.stock_ref_no = `${erp}:${refNo}`;
      claim.status = 'CLOSED';
      claim.closed_date = new Date().toISOString().split('T')[0];
      const ticket = state.tickets.find(t => t.ticket_no === claim.ticket_no);
      if (ticket) ticket.status = 'CLOSED';
    }

    state.audits.push({
      audit_id: nextSeq('AUD', state.audits), timestamp: new Date().toISOString(),
      user_email: operator + '@batteryhub.in', action: 'STOCK_UPDATE', record_type: 'STOCK_TASK',
      record_id: taskId, old_status: 'UPDATE_REQUIRED', new_status: 'CLOSED',
      details: `Reconciled in ${erp} with voucher ref ${refNo}. Claim ${task.claim_no} fully closed.`
    });

    saveState(); closeModal('modal-reconcile'); renderAll();
    showToast(`⚖️ Stock reconciled (${refNo})! Claim ${task.claim_no} marked CLOSED. Full cycle complete.`, 'success', 6000);
  });

  // ─── INSPECTOR MODAL ─────────────────────────────────────────────────────────
  window.openInspector = function (ticketNo) {
    const t = state.tickets.find(x => x.ticket_no === ticketNo);
    if (!t) { showToast('Ticket not found: ' + ticketNo, 'warning'); return; }

    const claim = t.claim_no ? state.claims.find(c => c.claim_no === t.claim_no) : null;
    const test = state.tests.find(x => x.ticket_no === t.ticket_no);
    const dispatch = claim && claim.dispatch_batch_no ? state.dispatches.find(d => d.dispatch_batch_no === claim.dispatch_batch_no) : null;
    const stockTask = claim ? state.stockTasks.find(s => s.claim_no === claim.claim_no) : null;

    document.getElementById('inspect-title').textContent = `${t.ticket_no} — Lifecycle Inspector`;
    const badge = document.getElementById('inspect-badge');
    const currentStatus = claim ? claim.status : t.status;
    badge.className = `badge`;
    badge.textContent = (STATUS_CONFIG[currentStatus] || { label: currentStatus }).label;
    badge.style.background = getStatusColor(currentStatus);
    badge.style.color = '#fff';

    // 3 Serials
    document.getElementById('inspect-orig-serial').textContent = `'${t.original_serial_no}`;
    document.getElementById('inspect-loaner-serial').textContent = t.service_battery_issued
      ? `'${t.service_battery_serial}' — ${t.service_battery_model}` : 'None Issued';
    document.getElementById('inspect-repl-serial').textContent = claim && claim.replacement_serial_no
      ? `'${claim.replacement_serial_no}' — ${claim.replacement_model}` : 'Awaiting Factory Dispatch';

    // Details
    document.getElementById('inspect-cust-name').textContent = t.source_type === 'DEALER'
      ? `${t.customer_name} (via ${t.dealer_name})` : t.customer_name;
    document.getElementById('inspect-cust-phone').textContent = `📱 ${t.mobile}`;
    document.getElementById('inspect-cust-vehicle').textContent = `🚗 ${t.vehicle_number || 'N/A'} • ${t.address || ''}`;
    document.getElementById('inspect-battery-model').textContent = t.battery_model;
    document.getElementById('inspect-warranty-terms').textContent = test
      ? `Lab: ${test.test_result} (OCV: ${test.open_circuit_voltage}V | Load: ${test.load_test_voltage}V | ${test.physical_condition})` : 'Pending Lab Test';
    document.getElementById('inspect-dispatch-batch').textContent = dispatch
      ? `${dispatch.dispatch_batch_no} → ${dispatch.company_name}` : 'Not Dispatched';
    document.getElementById('inspect-lr-docket').textContent = dispatch
      ? `Carrier: ${dispatch.carrier_transporter} | LR: ${dispatch.lr_docket_no}` : '—';
    document.getElementById('inspect-stock-status').textContent = stockTask
      ? `${stockTask.stock_status}` : (claim ? 'Pending replacement' : 'Not applicable');
    document.getElementById('inspect-stock-ref').textContent = stockTask && stockTask.accounting_ref_no
      ? `ERP Ref: ${stockTask.accounting_ref_no}` : '—';

    // Timeline stages
    const stepsContainer = document.getElementById('inspect-timeline-steps');
    const finalStatus = claim ? claim.status : t.status;
    const stages = [
      { id: 'RECEIVED', label: '1. Battery Intake', done: true, info: `Received: ${formatDate(t.date_received)}` },
      { id: 'TESTING', label: '2. Lab Diagnostic', done: !!test, info: test ? `${test.test_result} by ${test.tested_by} on ${formatDate(test.test_date)}` : 'Awaiting test' },
      { id: 'CLAIM', label: '3. Warranty Claim', done: !!claim, info: claim ? `${claim.claim_no} • ${formatDate(claim.claim_date)}` : (t.status === 'TEST_REJECTED' ? '❌ Rejected — Not Eligible' : 'Pending test') },
      { id: 'DISPATCH', label: '4. Dispatched to Company', done: !!(claim && claim.dispatch_batch_no), info: dispatch ? `${dispatch.dispatch_batch_no} on ${formatDate(dispatch.dispatch_date)}` : 'Pending dispatch' },
      { id: 'REPLACE', label: '5. Replacement Received', done: !!(claim && claim.replacement_serial_no), info: claim && claim.replacement_serial_no ? `'${claim.replacement_serial_no} on ${formatDate(claim.replacement_received_date)}` : 'Awaiting factory' },
      { id: 'CLOSED', label: '6. Claim Closed', done: finalStatus === 'CLOSED', info: claim && claim.closed_date ? `Closed ${formatDate(claim.closed_date)}` : 'Pending ERP reconciliation' }
    ];

    const activeIdx = stages.findLastIndex(s => s.done);

    stepsContainer.innerHTML = stages.map((s, idx) => {
      const isActive = idx === activeIdx + 1 && !stages[idx].done;
      return `
        <div class="step-node ${s.done ? 'completed' : isActive ? 'active' : ''}">
          <div class="step-circle">${s.done ? '✓' : idx + 1}</div>
          <div>
            <span class="step-text">${s.label}</span>
            <div style="font-size:10px; color:var(--slate-400); margin-top:2px;">${s.info}</div>
          </div>
        </div>
      `;
    }).join('');

    // Print button inside inspector
    document.getElementById('inspect-btn-print').onclick = function () {
      closeModal('modal-inspector');
      if (t.challan_no) preparePrintChallan(t.challan_no);
      else if (claim && claim.company_challan_no) preparePrintChallan(claim.company_challan_no);
      else { switchTab('tab-print'); renderPrintTemplate('CLAIM-FORM'); }
    };

    openModal('modal-inspector');
  };

  function getStatusColor(status) {
    const colors = {
      'RECEIVED': '#0284c7', 'TESTING': '#d97706', 'TEST_PASSED': '#059669',
      'TEST_REJECTED': '#e11d48', 'CLAIM_CREATED': '#7c3aed', 'READY_FOR_COMPANY': '#0d9488',
      'SENT_TO_COMPANY': '#0369a1', 'REPLACEMENT_RECEIVED': '#059669',
      'CLOSED': '#374151', 'UPDATED': '#059669', 'UPDATE_REQUIRED': '#dc2626'
    };
    return colors[status] || '#6b7280';
  }

  // ─── SEARCH ──────────────────────────────────────────────────────────────────
  const searchInput = document.getElementById('omnibox-search');
  const clearSearchBtn = document.getElementById('clear-search');

  function handleSearch() {
    const q = (searchInput.value || '').trim().toLowerCase();
    clearSearchBtn.style.display = q ? 'block' : 'none';

    if (!q) { renderTicketsTable(); return; }

    // ✅ UX Fix: Search across tickets AND claims for comprehensive results
    const filteredTickets = state.tickets.filter(t => {
      const claim = t.claim_no ? state.claims.find(c => c.claim_no === t.claim_no) : null;
      const replSerial = claim ? (claim.replacement_serial_no || '') : '';
      return (
        t.ticket_no.toLowerCase().includes(q) ||
        (t.claim_no && t.claim_no.toLowerCase().includes(q)) ||
        t.original_serial_no.toLowerCase().includes(q) ||
        (t.service_battery_serial && t.service_battery_serial.toLowerCase().includes(q)) ||
        t.customer_name.toLowerCase().includes(q) ||
        (t.dealer_name && t.dealer_name.toLowerCase().includes(q)) ||
        t.mobile.toLowerCase().includes(q) ||
        (t.vehicle_number && t.vehicle_number.toLowerCase().includes(q)) ||
        t.battery_model.toLowerCase().includes(q) ||
        replSerial.toLowerCase().includes(q)
      );
    });

    renderTicketsTable(filteredTickets);
    switchTab('tab-intake');

    if (filteredTickets.length === 0) {
      showToast(`No results for "${q}". Try ticket #, serial, customer name, mobile, or vehicle.`, 'info');
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') { searchInput.value = ''; handleSearch(); } });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => { searchInput.value = ''; handleSearch(); });
  }

  document.getElementById('filter-ticket-status').addEventListener('change', function () {
    const val = this.value;
    renderTicketsTable(val === 'ALL' ? undefined : state.tickets.filter(t => t.status === val));
  });

  // ─── NAVIGATION ──────────────────────────────────────────────────────────────
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const f = card.dataset.filter;
      if (f === 'TESTING') switchTab('tab-lab');
      else if (f === 'DISPATCHED') switchTab('tab-claims');
      else if (f === 'STOCK_PENDING') switchTab('tab-stock');
      else switchTab('tab-intake');
    });
  });

  document.getElementById('btn-quick-intake').addEventListener('click', () => openModal('modal-intake'));
  document.getElementById('btn-intake-modal-open').addEventListener('click', () => openModal('modal-intake'));
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (confirm('Reset all demo data to the initial benchmark state? All your changes will be lost.')) resetState();
  });
  document.getElementById('print-template-selector').addEventListener('change', function () { renderPrintTemplate(this.value); });
  document.getElementById('btn-trigger-print').addEventListener('click', () => window.print());

  // ─── MASTER RENDER ────────────────────────────────────────────────────────────
  function renderAll() {
    updateKPIs();
    renderUrgentActions();
    renderDashboardRecentTable();
    renderTicketsTable();
    renderTestingLab();
    renderClaimsView();
    renderStockView();
    renderAuditView();
    renderPrintTemplate();
  }

  // ─── BOOT ─────────────────────────────────────────────────────────────────────
  renderAll();
})();
