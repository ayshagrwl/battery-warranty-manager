/**
 * Battery Warranty & Claim Management System — Standalone Client-Side Application
 * 100% Free-First Simulation for GitHub Pages & Local Preview
 * ZERO Backend Secrets • ZERO Private URLs • Complete State Machine & Print Engine
 */

(function () {
  'use strict';

  // Storage key
  const STORAGE_KEY = 'BWMS_DEMO_STATE_V1';

  // Initial Mock Dataset (Indian Battery Distributor)
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
        ticket_no: 'TKT-2026-000001',
        source_type: 'CUSTOMER',
        customer_name: 'Rahul S. Verma',
        mobile: '9876543210',
        vehicle_number: 'GJ-05-CD-1234',
        address: 'Flat 402, Sai Residency, Adajan, Surat',
        battery_model: 'Amaron Pro 42B20R',
        original_serial_no: '0094829103',
        date_received: '2026-09-12',
        service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R',
        service_battery_serial: 'SB-00349',
        status: 'CLAIM_CREATED',
        claim_no: 'CLM-2026-000001',
        remarks: 'Morning starting issue, deep voltage dip on cranking.',
        created_at: '2026-09-12T09:35:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000002',
        source_type: 'CUSTOMER',
        customer_name: 'Sunil Dave',
        mobile: '9898012345',
        vehicle_number: 'GJ-05-AB-7744',
        address: 'Shop 4, Ring Road, Surat',
        battery_model: 'Amaron Fresh 35R',
        original_serial_no: '0081273941',
        date_received: '2026-09-14',
        service_battery_issued: false,
        service_battery_model: '',
        service_battery_serial: '',
        status: 'TEST_REJECTED',
        claim_no: null,
        challan_no: 'DC-RET-2026-000001',
        remarks: 'Physical case swollen; deep discharge sulphation from alternator overcharge.',
        created_at: '2026-09-14T11:20:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000003',
        source_type: 'CUSTOMER',
        customer_name: 'Priya Patel',
        mobile: '9824156789',
        vehicle_number: 'GJ-05-ER-5512',
        address: '12 Green Park Society, Vesu, Surat',
        battery_model: 'Exide Mileage 45D26L',
        original_serial_no: '0038192847',
        date_received: '2026-09-18',
        service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R',
        service_battery_serial: 'SB-00412',
        status: 'CLAIM_CREATED',
        claim_no: 'CLM-2026-000002',
        remarks: 'Battery dead within 14 months of purchase.',
        created_at: '2026-09-18T14:15:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000004',
        source_type: 'DEALER',
        dealer_name: 'Shree Ganesh Auto Electricals (Surat)',
        customer_name: 'Vikram Desai',
        mobile: '9712398765',
        vehicle_number: 'GJ-01-AX-9901',
        address: 'Bhestan, Surat',
        battery_model: 'Tata Green Velocity 38B20R',
        original_serial_no: '0055192830',
        date_received: '2026-09-20',
        service_battery_issued: false,
        service_battery_model: '',
        service_battery_serial: '',
        status: 'CLAIM_CREATED',
        claim_no: 'CLM-2026-000003',
        remarks: 'Dealer surrendered on customer behalf. Internal cell short.',
        created_at: '2026-09-20T10:00:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000005',
        source_type: 'CUSTOMER',
        customer_name: 'Hardik Mehta',
        mobile: '9909044556',
        vehicle_number: 'GJ-06-KK-2234',
        address: 'Nanpura, Surat',
        battery_model: 'Amaron Flo 55B24L',
        original_serial_no: '0019284715',
        date_received: '2026-09-22',
        service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R',
        service_battery_serial: 'SB-00551',
        status: 'CLAIM_CREATED',
        claim_no: 'CLM-2026-000004',
        remarks: 'Frequent charging loss, cell 2 specific gravity low.',
        created_at: '2026-09-22T16:40:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000006',
        source_type: 'CUSTOMER',
        customer_name: 'Amit Trivedi',
        mobile: '9898123456',
        vehicle_number: 'GJ-05-MM-3399',
        address: 'Varachha, Surat',
        battery_model: 'Exide Ride 35R',
        original_serial_no: '0072819401',
        date_received: '2026-09-26',
        service_battery_issued: false,
        service_battery_model: '',
        service_battery_serial: '',
        status: 'TESTING',
        claim_no: null,
        remarks: 'Customer reports battery draining in 2 days.',
        created_at: '2026-09-26T09:10:00.000Z'
      },
      {
        ticket_no: 'TKT-2026-000007',
        source_type: 'CUSTOMER',
        customer_name: 'Deepak Shah',
        mobile: '9727099881',
        vehicle_number: 'GJ-05-PQ-8811',
        address: 'Katargam, Surat',
        battery_model: 'Amaron Pro 42B20R',
        original_serial_no: '0044928172',
        date_received: '2026-09-28',
        service_battery_issued: true,
        service_battery_model: 'Exide Service Pool 35R',
        service_battery_serial: 'SB-00620',
        status: 'RECEIVED',
        claim_no: null,
        remarks: 'New intake today. Awaiting test bench.',
        created_at: '2026-09-28T08:30:00.000Z'
      }
    ],
    tests: [
      {
        test_id: 'TST-2026-000001',
        ticket_no: 'TKT-2026-000001',
        original_serial_no: '0094829103',
        test_date: '2026-09-13',
        tested_by: 'Sanjay Mistri',
        open_circuit_voltage: 10.4,
        load_test_voltage: 8.2,
        specific_gravity: '1.18, 1.18, 1.12, 1.18, 1.18, 1.18',
        physical_condition: 'CLEAN_OK',
        test_result: 'PASS',
        test_remarks: 'Cell #3 dead. Internal plate break. Eligible for warranty replacement.'
      },
      {
        test_id: 'TST-2026-000002',
        ticket_no: 'TKT-2026-000002',
        original_serial_no: '0081273941',
        test_date: '2026-09-14',
        tested_by: 'Sanjay Mistri',
        open_circuit_voltage: 11.2,
        load_test_voltage: 6.8,
        specific_gravity: '1.10, 1.10, 1.11, 1.10, 1.10, 1.10',
        physical_condition: 'BULGED',
        test_result: 'REJECT',
        test_remarks: 'Severe container bulging caused by alternator overcharge. Rejected under manufacturer warranty policy.'
      },
      {
        test_id: 'TST-2026-000003',
        ticket_no: 'TKT-2026-000003',
        original_serial_no: '0038192847',
        test_date: '2026-09-19',
        tested_by: 'Sanjay Mistri',
        open_circuit_voltage: 10.5,
        load_test_voltage: 8.1,
        specific_gravity: '1.17, 1.12, 1.18, 1.18, 1.18, 1.18',
        physical_condition: 'CLEAN_OK',
        test_result: 'PASS',
        test_remarks: 'Cell #2 dead. Passes warranty qualification.'
      },
      {
        test_id: 'TST-2026-000004',
        ticket_no: 'TKT-2026-000004',
        original_serial_no: '0055192830',
        test_date: '2026-09-20',
        tested_by: 'Sanjay Mistri',
        open_circuit_voltage: 10.2,
        load_test_voltage: 7.9,
        specific_gravity: '1.12, 1.18, 1.18, 1.18, 1.18, 1.18',
        physical_condition: 'CLEAN_OK',
        test_result: 'PASS',
        test_remarks: 'Manufacturing defect confirmed.'
      },
      {
        test_id: 'TST-2026-000005',
        ticket_no: 'TKT-2026-000005',
        original_serial_no: '0019284715',
        test_date: '2026-09-23',
        tested_by: 'Sanjay Mistri',
        open_circuit_voltage: 10.6,
        load_test_voltage: 8.3,
        specific_gravity: '1.18, 1.11, 1.18, 1.18, 1.18, 1.18',
        physical_condition: 'CLEAN_OK',
        test_result: 'PASS',
        test_remarks: 'Cell 2 short confirmed.'
      }
    ],
    claims: [
      {
        claim_no: 'CLM-2026-000001',
        ticket_no: 'TKT-2026-000001',
        customer_name: 'Rahul S. Verma',
        mobile: '9876543210',
        vehicle_number: 'GJ-05-CD-1234',
        battery_model: 'Amaron Pro 42B20R',
        original_serial_no: '0094829103',
        warranty_status: 'IN_WARRANTY',
        claim_date: '2026-09-13',
        status: 'CLOSED',
        dispatch_batch_no: 'DSP-2026-000001',
        company_challan_no: 'DC-COM-2026-000001',
        replacement_model: 'Amaron Pro 42B20R',
        replacement_serial_no: 'REP-9847120',
        replacement_received_date: '2026-09-25',
        stock_status: 'UPDATED',
        stock_ref_no: 'VR-2026-0928',
        closed_date: '2026-09-26'
      },
      {
        claim_no: 'CLM-2026-000002',
        ticket_no: 'TKT-2026-000003',
        customer_name: 'Priya Patel',
        mobile: '9824156789',
        vehicle_number: 'GJ-05-ER-5512',
        battery_model: 'Exide Mileage 45D26L',
        original_serial_no: '0038192847',
        warranty_status: 'IN_WARRANTY',
        claim_date: '2026-09-19',
        status: 'REPLACEMENT_RECEIVED',
        dispatch_batch_no: 'DSP-2026-000001',
        company_challan_no: 'DC-COM-2026-000001',
        replacement_model: 'Exide Mileage 45D26L',
        replacement_serial_no: 'REP-4491028',
        replacement_received_date: '2026-09-27',
        stock_status: 'UPDATE_REQUIRED',
        stock_ref_no: null,
        closed_date: null
      },
      {
        claim_no: 'CLM-2026-000003',
        ticket_no: 'TKT-2026-000004',
        customer_name: 'Vikram Desai',
        mobile: '9712398765',
        vehicle_number: 'GJ-01-AX-9901',
        battery_model: 'Tata Green Velocity 38B20R',
        original_serial_no: '0055192830',
        warranty_status: 'IN_WARRANTY',
        claim_date: '2026-09-20',
        status: 'SENT_TO_COMPANY',
        dispatch_batch_no: 'DSP-2026-000001',
        company_challan_no: 'DC-COM-2026-000001',
        replacement_model: null,
        replacement_serial_no: null,
        replacement_received_date: null,
        stock_status: 'NOT_APPLICABLE',
        stock_ref_no: null,
        closed_date: null
      },
      {
        claim_no: 'CLM-2026-000004',
        ticket_no: 'TKT-2026-000005',
        customer_name: 'Hardik Mehta',
        mobile: '9909044556',
        vehicle_number: 'GJ-06-KK-2234',
        battery_model: 'Amaron Flo 55B24L',
        original_serial_no: '0019284715',
        warranty_status: 'IN_WARRANTY',
        claim_date: '2026-09-23',
        status: 'READY_FOR_COMPANY',
        dispatch_batch_no: null,
        company_challan_no: null,
        replacement_model: null,
        replacement_serial_no: null,
        replacement_received_date: null,
        stock_status: 'NOT_APPLICABLE',
        stock_ref_no: null,
        closed_date: null
      }
    ],
    dispatches: [
      {
        dispatch_batch_no: 'DSP-2026-000001',
        company_name: 'Amaron Batteries Ltd.',
        destination: 'Baroda Central Regional Depot',
        company_challan_no: 'DC-COM-2026-000001',
        dispatch_date: '2026-09-21',
        carrier_transporter: 'Shree Tirupati Logistics',
        lr_docket_no: 'LR-994812',
        claim_count: 3,
        battery_count: 3,
        created_by: 'ramesh@batteryhub.in',
        remarks: 'Packed in 1 wooden crate with individual inspection reports.'
      }
    ],
    challans: [
      {
        challan_no: 'DC-RET-2026-000001',
        challan_type: 'BATTERY_RETURN',
        challan_date: '2026-09-14',
        recipient_name: 'Sunil Dave',
        mobile: '9898012345',
        address: 'Shop 4, Ring Road, Surat',
        ticket_no: 'TKT-2026-000002',
        battery_model: 'Amaron Fresh 35R',
        battery_serial_no: '0081273941',
        quantity: 1,
        status: 'ACKNOWLEDGED',
        remarks: 'Warranty rejected due to container bulging and extreme alternator overcharging.'
      },
      {
        challan_no: 'DC-COM-2026-000001',
        challan_type: 'COMPANY_DISPATCH',
        challan_date: '2026-09-21',
        recipient_name: 'Amaron Batteries Ltd. (Depot)',
        mobile: '+91 265 2840192',
        address: 'Plot 44, GIDC Industrial Estate, Baroda',
        ticket_no: 'CONSOLIDATED-BATCH',
        battery_model: 'Multiple Models (3 Batteries)',
        battery_serial_no: '0094829103, 0038192847, 0055192830',
        quantity: 3,
        status: 'DISPATCHED',
        remarks: 'Consignment booked under LR-994812 via Shree Tirupati Logistics.'
      }
    ],
    stockTasks: [
      {
        stock_task_id: 'STK-2026-000001',
        claim_no: 'CLM-2026-000001',
        replacement_model: 'Amaron Pro 42B20R',
        replacement_serial_no: 'REP-9847120',
        received_date: '2026-09-25',
        stock_status: 'UPDATED',
        accounting_ref_no: 'VR-2026-0928',
        updated_at: '2026-09-26T14:20:00.000Z',
        updated_by: 'Ramesh Sharma'
      },
      {
        stock_task_id: 'STK-2026-000002',
        claim_no: 'CLM-2026-000002',
        replacement_model: 'Exide Mileage 45D26L',
        replacement_serial_no: 'REP-4491028',
        received_date: '2026-09-27',
        stock_status: 'UPDATE_REQUIRED',
        accounting_ref_no: null,
        updated_at: null,
        updated_by: null
      }
    ],
    audits: [
      {
        audit_id: 'AUD-2026-000001',
        timestamp: '2026-09-26T14:22:00.000Z',
        user_email: 'ramesh@batteryhub.in',
        action: 'STOCK_UPDATE',
        record_type: 'CLAIM',
        record_id: 'CLM-2026-000001',
        old_status: 'REPLACEMENT_RECEIVED',
        new_status: 'STOCK_UPDATED',
        details: 'Logged Busy ERP voucher VR-2026-0928 for REP-9847120.'
      },
      {
        audit_id: 'AUD-2026-000002',
        timestamp: '2026-09-27T10:15:00.000Z',
        user_email: 'sanjay@batteryhub.in',
        action: 'REPLACEMENT_RECEIVE',
        record_type: 'CLAIM',
        record_id: 'CLM-2026-000002',
        old_status: 'SENT_TO_COMPANY',
        new_status: 'REPLACEMENT_RECEIVED',
        details: 'Received replacement battery REP-4491028. Created task STK-2026-000002.'
      },
      {
        audit_id: 'AUD-2026-000003',
        timestamp: '2026-09-28T08:32:00.000Z',
        user_email: 'ayush@batteryhub.in',
        action: 'INTAKE',
        record_type: 'TICKET',
        record_id: 'TKT-2026-000007',
        old_status: 'NONE',
        new_status: 'RECEIVED',
        details: 'Intake ticket created for Deepak Shah. Issued loaner SB-00620.'
      }
    ]
  };

  // State holder
  let state = loadState();

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial mock dataset', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist to localStorage', e);
    }
  }

  function resetState() {
    state = JSON.parse(JSON.stringify(INITIAL_STATE));
    saveState();
    renderAll();
    showToast('Demo data reset to initial benchmark state.', 'success');
  }

  // ==========================================
  // Toast notifications
  // ==========================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================
  // Modal Helpers
  // ==========================================
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  };

  // ==========================================
  // Tab Switching
  // ==========================================
  window.switchTab = function (tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    if (tabId === 'tab-print') {
      renderPrintTemplate();
    }
  };

  // ==========================================
  // Formatters
  // ==========================================
  function formatDate(d) {
    if (!d) return '-';
    try {
      const parts = d.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) {}
    return d;
  }

  function renderStatusPill(status) {
    const clean = (status || '').replace(/_/g, ' ');
    return `<span class="status-pill status-${status}">${clean}</span>`;
  }

  // ==========================================
  // KPI Calculations
  // ==========================================
  function updateKPIs() {
    const totalTickets = state.tickets.length;
    const testingCount = state.tickets.filter(t => t.status === 'TESTING').length;
    const loanersOut = state.tickets.filter(t => t.service_battery_issued && t.status !== 'CLOSED').length;
    const dispatchedCount = state.claims.filter(c => c.status === 'SENT_TO_COMPANY').length;
    const pendingStock = state.stockTasks.filter(s => s.stock_status === 'UPDATE_REQUIRED').length;

    document.getElementById('kpi-total-tickets').textContent = totalTickets;
    document.getElementById('kpi-testing').textContent = testingCount;
    document.getElementById('kpi-loaners').textContent = loanersOut;
    document.getElementById('kpi-dispatched').textContent = dispatchedCount;
    document.getElementById('kpi-stock-tasks').textContent = pendingStock;

    document.getElementById('count-tickets').textContent = totalTickets;
    document.getElementById('count-testing').textContent = testingCount;
    document.getElementById('count-claims').textContent = state.claims.length;
    document.getElementById('count-stock').textContent = pendingStock;
  }

  // ==========================================
  // Urgent Actions on Dashboard
  // ==========================================
  function renderUrgentActions() {
    const container = document.getElementById('urgent-actions-container');
    if (!container) return;

    const urgentItems = [];

    // Pending stock tasks
    const pendingStocks = state.stockTasks.filter(s => s.stock_status === 'UPDATE_REQUIRED');
    pendingStocks.forEach(s => {
      urgentItems.push({
        title: `Pending Physical Stock Entry: ${s.claim_no}`,
        desc: `Replacement ${s.replacement_model} (${s.replacement_serial_no}) arrived on ${formatDate(s.received_date)}. Enter Busy/Tally voucher to permit customer handover.`,
        actionText: 'Reconcile Stock',
        badge: 'Stock Blocker',
        color: 'rose',
        onClick: `openReconcileModal('${s.stock_task_id}')`
      });
    });

    // Batteries awaiting test
    const unTested = state.tickets.filter(t => t.status === 'RECEIVED' || t.status === 'TESTING');
    unTested.forEach(t => {
      urgentItems.push({
        title: `Testing Due: ${t.ticket_no} (${t.customer_name})`,
        desc: `${t.battery_model} (Serial: ${t.original_serial_no}). Received ${formatDate(t.date_received)}.`,
        actionText: 'Start Test',
        badge: 'Bench Lab',
        color: 'amber',
        onClick: `openTestModal('${t.ticket_no}')`
      });
    });

    if (urgentItems.length === 0) {
      container.innerHTML = `<div class="p-3 text-center text-muted">🎉 All pending tasks are up to date. No immediate bottlenecks!</div>`;
      return;
    }

    container.innerHTML = urgentItems.map(item => `
      <div class="urgent-item ${item.color}">
        <div class="urgent-meta">
          <h5>${item.title} <span class="badge badge-${item.color === 'rose' ? 'danger' : 'warning'}">${item.badge}</span></h5>
          <p>${item.desc}</p>
        </div>
        <button class="btn btn-sm btn-outline" onclick="${item.onClick}">${item.actionText}</button>
      </div>
    `).join('');
  }

  // ==========================================
  // Recent Activities Table (Dashboard)
  // ==========================================
  function renderDashboardRecentTable() {
    const tbody = document.getElementById('dashboard-recent-tbody');
    if (!tbody) return;

    const recent = [...state.tickets].reverse().slice(0, 5);
    tbody.innerHTML = recent.map(t => `
      <tr>
        <td>
          <strong>${t.ticket_no}</strong>
          ${t.claim_no ? `<br><small class="text-muted">${t.claim_no}</small>` : ''}
        </td>
        <td>
          <strong>${t.customer_name}</strong>
          ${t.dealer_name ? `<br><small class="text-muted">${t.dealer_name}</small>` : ''}
          <br><small class="text-muted">${t.mobile}</small>
        </td>
        <td>
          <strong>${t.battery_model}</strong>
          <br><code class="text-blue font-mono">'${t.original_serial_no}</code>
          ${t.service_battery_issued ? `<br><span class="badge badge-purple">Loaner: ${t.service_battery_serial}</span>` : ''}
        </td>
        <td>${renderStatusPill(t.status)}</td>
        <td>${formatDate(t.date_received)}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="openInspector('${t.ticket_no}')">Inspect</button>
        </td>
      </tr>
    `).join('');
  }

  // ==========================================
  // Tickets Table View
  // ==========================================
  function renderTicketsTable(filteredTickets = null) {
    const tbody = document.getElementById('intake-tbody');
    if (!tbody) return;

    const list = filteredTickets || state.tickets;
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center p-4 text-muted">No tickets found matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr>
        <td><strong>${t.ticket_no}</strong></td>
        <td>
          <strong>${t.customer_name}</strong>
          ${t.dealer_name ? `<br><small class="text-muted">${t.dealer_name}</small>` : ''}
          <br><small class="text-muted">${t.mobile}</small>
        </td>
        <td><code>${t.vehicle_number || '-'}</code></td>
        <td>${t.battery_model}</td>
        <td><code class="font-mono text-blue">'${t.original_serial_no}</code></td>
        <td>
          ${t.service_battery_issued 
            ? `<span class="badge badge-purple" title="Issued ${t.service_battery_model}">${t.service_battery_serial}</span>` 
            : `<span class="text-muted">None</span>`}
        </td>
        <td>${renderStatusPill(t.status)}</td>
        <td>${formatDate(t.date_received)}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openInspector('${t.ticket_no}')">View</button>
            ${t.status === 'RECEIVED' || t.status === 'TESTING' 
              ? `<button class="btn btn-sm btn-primary" onclick="openTestModal('${t.ticket_no}')">Test</button>` 
              : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ==========================================
  // Testing Lab View
  // ==========================================
  function renderTestingLab() {
    const container = document.getElementById('lab-items-container');
    if (!container) return;

    const items = state.tickets.filter(t => t.status === 'RECEIVED' || t.status === 'TESTING' || t.status === 'TEST_PASSED' || t.status === 'TEST_REJECTED');
    if (items.length === 0) {
      container.innerHTML = `<div class="p-4 text-muted text-center full-width">No batteries currently in the diagnostic queue.</div>`;
      return;
    }

    container.innerHTML = items.map(t => {
      const test = state.tests.find(x => x.ticket_no === t.ticket_no);
      const isTested = !!test;

      return `
        <div class="lab-card">
          <div class="lab-card-header">
            <div>
              <span class="lab-card-title">${t.ticket_no}</span>
              <div style="font-size:12px; color:var(--slate-500);">${t.customer_name} • ${t.mobile}</div>
            </div>
            ${renderStatusPill(t.status)}
          </div>

          <div class="lab-battery-info">
            <div class="lab-meta-row">
              <strong>Model:</strong>
              <span>${t.battery_model}</span>
            </div>
            <div class="lab-meta-row">
              <strong>Original Serial:</strong>
              <code class="font-mono text-blue">'${t.original_serial_no}</code>
            </div>
            <div class="lab-meta-row">
              <strong>Received:</strong>
              <span>${formatDate(t.date_received)}</span>
            </div>
            ${t.service_battery_issued ? `
              <div class="lab-meta-row mt-1" style="color:var(--purple); font-weight:600;">
                <span>Loaner Issued:</span>
                <code>${t.service_battery_serial}</code>
              </div>
            ` : ''}
          </div>

          ${isTested ? `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; margin-bottom:12px; font-size:12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>OC Voltage: <strong>${test.open_circuit_voltage} V</strong></span>
                <span>Load Test (15s): <strong>${test.load_test_voltage} V</strong></span>
              </div>
              <div style="margin-bottom:4px;">
                <span>Gravity: <code>${test.specific_gravity}</code></span>
              </div>
              <div>
                <strong>Conclusion:</strong>
                <span class="badge badge-${test.test_result === 'PASS' ? 'success' : 'danger'}">${test.test_result}</span>
                <span style="color:#64748b; font-size:11px;">(${test.test_remarks})</span>
              </div>
            </div>
          ` : `
            <div style="background:#fffbeb; border:1px dashed #fcd34d; border-radius:6px; padding:10px; margin-bottom:12px; font-size:12px; color:#92400e;">
              ⚡ Awaiting electrical diagnostics and physical casing check.
            </div>
          `}

          <div class="lab-card-actions">
            ${!isTested || t.status === 'TESTING' || t.status === 'RECEIVED' ? `
              <button class="btn btn-sm btn-primary" onclick="openTestModal('${t.ticket_no}')">
                <svg class="icon" viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
                Record Test
              </button>
            ` : ''}
            ${t.status === 'TEST_PASSED' && !t.claim_no ? `
              <button class="btn btn-sm btn-emerald" onclick="createClaimFromTicket('${t.ticket_no}')">
                Convert to Claim
              </button>
            ` : ''}
            ${t.status === 'TEST_REJECTED' ? `
              <button class="btn btn-sm btn-rose" onclick="preparePrintChallan('${t.challan_no || 'DC-RET-2026-000001'}')">
                View Return Challan
              </button>
            ` : ''}
            <button class="btn btn-sm btn-outline" onclick="openInspector('${t.ticket_no}')">Inspect</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // Claims & Dispatches View
  // ==========================================
  function renderClaimsView() {
    // 1. Dispatches List
    const dispatchContainer = document.getElementById('dispatches-list');
    const badgeDispatch = document.getElementById('badge-dispatch-count');
    if (dispatchContainer) {
      badgeDispatch.textContent = `${state.dispatches.length} Batches`;
      dispatchContainer.innerHTML = state.dispatches.map(d => `
        <div class="dispatch-box">
          <div class="dispatch-box-header">
            <h4>${d.dispatch_batch_no}</h4>
            <span class="badge badge-teal">${d.claim_count} Batteries</span>
          </div>
          <p class="dispatch-meta-line"><strong>Company:</strong> ${d.company_name}</p>
          <p class="dispatch-meta-line"><strong>Depot:</strong> ${d.destination}</p>
          <p class="dispatch-meta-line"><strong>Carrier:</strong> ${d.carrier_transporter} (<code>${d.lr_docket_no}</code>)</p>
          <p class="dispatch-meta-line"><strong>Challan No:</strong> <code>${d.company_challan_no}</code></p>
          <div style="margin-top:10px;">
            <button class="btn btn-sm btn-outline" onclick="preparePrintChallan('${d.company_challan_no}')">Print DC-COM Manifest</button>
          </div>
        </div>
      `).join('');
    }

    // 2. Claims Table
    const tbody = document.getElementById('claims-tbody');
    if (tbody) {
      tbody.innerHTML = state.claims.map(c => `
        <tr>
          <td><strong>${c.claim_no}</strong></td>
          <td><small>${c.ticket_no}</small></td>
          <td><strong>${c.customer_name}</strong><br><small class="text-muted">${c.mobile}</small></td>
          <td>
            <strong>${c.battery_model}</strong>
            <br><code class="font-mono text-blue">'${c.original_serial_no}</code>
          </td>
          <td><span class="badge badge-info">${c.warranty_status}</span></td>
          <td>${renderStatusPill(c.status)}</td>
          <td>
            ${c.replacement_serial_no 
              ? `<code class="font-mono text-emerald" style="font-weight:700;">'${c.replacement_serial_no}</code>` 
              : `<span class="text-muted">Awaiting Factory</span>`}
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-outline" onclick="openInspector('${c.ticket_no}')">Inspect</button>
              ${c.status === 'SENT_TO_COMPANY' ? `
                <button class="btn btn-sm btn-primary" onclick="openReceiveReplacementModal('${c.claim_no}')">Receive Replacement</button>
              ` : ''}
              ${c.status === 'REPLACEMENT_RECEIVED' ? `
                <button class="btn btn-sm btn-rose" onclick="openReconcileModalForClaim('${c.claim_no}')">Reconcile Stock</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  // ==========================================
  // Stock Reconciliation View
  // ==========================================
  function renderStockView() {
    const tbody = document.getElementById('stock-tbody');
    if (!tbody) return;

    if (state.stockTasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-muted">No stock tasks recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.stockTasks.map(s => `
      <tr>
        <td><strong>${s.stock_task_id}</strong></td>
        <td><strong>${s.claim_no}</strong></td>
        <td>${s.replacement_model}</td>
        <td><code class="font-mono text-emerald" style="font-weight:700;">'${s.replacement_serial_no}</code></td>
        <td>${formatDate(s.received_date)}</td>
        <td>
          ${s.stock_status === 'UPDATED' 
            ? `<span class="badge badge-success">UPDATED IN ERP</span>` 
            : `<span class="badge badge-danger">UPDATE REQUIRED</span>`}
        </td>
        <td>
          ${s.accounting_ref_no 
            ? `<code class="font-mono" style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${s.accounting_ref_no}</code>` 
            : `<span class="text-muted">Pending Inward Voucher</span>`}
        </td>
        <td>
          ${s.stock_status === 'UPDATE_REQUIRED' ? `
            <button class="btn btn-sm btn-rose" onclick="openReconcileModal('${s.stock_task_id}')">
              Mark Reconciled
            </button>
          ` : `
            <span class="text-muted" style="font-size:12px;">✅ Reconciled</span>
          `}
        </td>
      </tr>
    `).join('');
  }

  // ==========================================
  // Audit Trail View
  // ==========================================
  function renderAuditView() {
    const tbody = document.getElementById('audit-tbody');
    if (!tbody) return;

    tbody.innerHTML = [...state.audits].reverse().map(a => `
      <tr>
        <td><code class="font-mono">${a.audit_id}</code></td>
        <td><small>${new Date(a.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small></td>
        <td><strong>${a.user_email}</strong></td>
        <td><span class="badge badge-gray">${a.action}</span></td>
        <td><strong>${a.record_id}</strong> (${a.record_type})</td>
        <td>
          ${a.old_status !== 'NONE' ? `<span class="text-muted">${a.old_status}</span> &rarr; ` : ''}
          <strong>${a.new_status}</strong>
        </td>
        <td><small>${a.details}</small></td>
      </tr>
    `).join('');
  }

  // ==========================================
  // Print Center Template Renderer
  // ==========================================
  function renderPrintTemplate(templateType = null, recordId = null) {
    const selector = document.getElementById('print-template-selector');
    const paper = document.getElementById('print-paper');
    if (!paper) return;

    const chosen = templateType || (selector ? selector.value : 'DC-RET');
    if (selector && templateType) selector.value = templateType;

    const cfg = state.config;

    if (chosen === 'DC-RET') {
      // Battery Return Challan (Rejected Batteries)
      const challan = (recordId ? state.challans.find(c => c.challan_no === recordId) : state.challans.find(c => c.challan_type === 'BATTERY_RETURN')) || state.challans[0];
      paper.innerHTML = `
        <div class="challan-header">
          <div class="company-branding">
            <h2>${cfg.companyName}</h2>
            <p>${cfg.companyAddress}</p>
            <p><strong>Phone:</strong> ${cfg.companyPhone} | <strong>GSTIN:</strong> ${cfg.companyGst}</p>
          </div>
          <div class="doc-badge-block">
            <div class="doc-type-title">DELIVERY CHALLAN</div>
            <p><strong>Challan No:</strong> <code class="font-mono">${challan ? challan.challan_no : 'DC-RET-2026-000001'}</code></p>
            <p><strong>Date:</strong> ${challan ? formatDate(challan.challan_date) : '14/09/2026'}</p>
            <p><strong>Type:</strong> Battery Return (Warranty Rejected)</p>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="label">Delivered To:</td>
            <td><strong>${challan ? challan.recipient_name : 'Sunil Dave'}</strong></td>
            <td class="label">Contact Mobile:</td>
            <td>${challan ? challan.mobile : '9898012345'}</td>
          </tr>
          <tr>
            <td class="label">Destination Address:</td>
            <td>${challan ? challan.address : 'Shop 4, Ring Road, Surat'}</td>
            <td class="label">Originating Ticket:</td>
            <td><code>${challan ? challan.ticket_no : 'TKT-2026-000002'}</code></td>
          </tr>
        </table>

        <table class="item-table">
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>Description / Battery Model</th>
              <th>Original Serial Number</th>
              <th style="width:70px;">Qty</th>
              <th>Technical Diagnostic Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>${challan ? challan.battery_model : 'Amaron Fresh 35R'}</strong></td>
              <td><code class="font-mono">'${challan ? challan.battery_serial_no : '0081273941'}</code></td>
              <td>1 Nos</td>
              <td>${challan ? challan.remarks : 'Bulged casing caused by alternator overcharge. Void under manufacturer terms.'}</td>
            </tr>
          </tbody>
        </table>

        <div class="terms-box">
          <strong>Undertaking & Terms:</strong>
          <p>1. The above referenced battery was physically inspected and tested at our authorized facility. The defect identified is outside standard manufacturer warranty guidelines.</p>
          <p>2. The customer/dealer acknowledges receipt of the surrendered battery in as-is condition along with this official test conclusion.</p>
          <p>3. If any service/loaner battery was temporarily issued during testing, it has been returned to the distributor in clean condition prior to this release.</p>
        </div>

        <div class="signoff-section">
          <div class="sign-box">
            Customer / Receiver Signature<br>
            <span style="font-size:10px; color:#94a3b8;">(I have received my original battery back)</span>
          </div>
          <div class="sign-box">
            For ${cfg.companyName}<br>
            <span style="font-size:10px; color:#94a3b8;">Authorized Signatory / Store Keeper</span>
          </div>
        </div>
      `;
    } else if (chosen === 'DC-COM') {
      // Consolidated Company Dispatch Challan
      const dispatch = state.dispatches[0];
      const claimsInBatch = state.claims.filter(c => c.dispatch_batch_no === (dispatch ? dispatch.dispatch_batch_no : null));

      paper.innerHTML = `
        <div class="challan-header">
          <div class="company-branding">
            <h2>${cfg.companyName}</h2>
            <p>${cfg.companyAddress}</p>
            <p><strong>Phone:</strong> ${cfg.companyPhone} | <strong>GSTIN:</strong> ${cfg.companyGst}</p>
          </div>
          <div class="doc-badge-block">
            <div class="doc-type-title">COMPANY DISPATCH MANIFEST</div>
            <p><strong>Challan No:</strong> <code class="font-mono">${dispatch ? dispatch.company_challan_no : 'DC-COM-2026-000001'}</code></p>
            <p><strong>Batch ID:</strong> <code>${dispatch ? dispatch.dispatch_batch_no : 'DSP-2026-000001'}</code></p>
            <p><strong>Date:</strong> ${dispatch ? formatDate(dispatch.dispatch_date) : '21/09/2026'}</p>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="label">Consignee (Factory):</td>
            <td><strong>${dispatch ? dispatch.company_name : 'Amaron Batteries Ltd.'}</strong></td>
            <td class="label">Destination Depot:</td>
            <td>${dispatch ? dispatch.destination : 'Baroda Central Regional Depot'}</td>
          </tr>
          <tr>
            <td class="label">Carrier / Transporter:</td>
            <td><strong>${dispatch ? dispatch.carrier_transporter : 'Shree Tirupati Logistics'}</strong></td>
            <td class="label">LR / Docket Number:</td>
            <td><code class="font-mono" style="font-weight:700;">${dispatch ? dispatch.lr_docket_no : 'LR-994812'}</code></td>
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
            Transporter / Driver Signature & Vehicle Stamp<br>
            <span style="font-size:10px; color:#94a3b8;">(Received goods in sealed condition)</span>
          </div>
          <div class="sign-box">
            For ${cfg.companyName}<br>
            <span style="font-size:10px; color:#94a3b8;">Despatch Officer / Authorized Signatory</span>
          </div>
        </div>
      `;
    } else {
      // Official Warranty Claim & Inspection Slip
      const claim = state.claims[0];
      const ticket = state.tickets.find(t => t.ticket_no === claim.ticket_no);
      const test = state.tests.find(x => x.ticket_no === claim.ticket_no);

      paper.innerHTML = `
        <div class="challan-header">
          <div class="company-branding">
            <h2>${cfg.companyName}</h2>
            <p>${cfg.companyAddress}</p>
            <p><strong>Phone:</strong> ${cfg.companyPhone} | <strong>GSTIN:</strong> ${cfg.companyGst}</p>
          </div>
          <div class="doc-badge-block">
            <div class="doc-type-title">WARRANTY CLAIM DOCKET</div>
            <p><strong>Claim No:</strong> <code class="font-mono">${claim ? claim.claim_no : 'CLM-2026-000001'}</code></p>
            <p><strong>Ticket No:</strong> <code>${ticket ? ticket.ticket_no : 'TKT-2026-000001'}</code></p>
            <p><strong>Claim Date:</strong> ${claim ? formatDate(claim.claim_date) : '13/09/2026'}</p>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="label">Customer Name:</td>
            <td><strong>${claim ? claim.customer_name : 'Rahul S. Verma'}</strong></td>
            <td class="label">Mobile Number:</td>
            <td>${claim ? claim.mobile : '9876543210'}</td>
          </tr>
          <tr>
            <td class="label">Vehicle Registration:</td>
            <td><code>${claim ? claim.vehicle_number : 'GJ-05-CD-1234'}</code></td>
            <td class="label">Warranty Eligibility:</td>
            <td><strong style="color:#15803d;">IN-WARRANTY (36 Months)</strong></td>
          </tr>
          <tr>
            <td class="label">Original Serial No:</td>
            <td><code class="font-mono text-blue">'${claim ? claim.original_serial_no : '0094829103'}</code></td>
            <td class="label">Service Loaner Issued:</td>
            <td>${ticket && ticket.service_battery_issued ? `<code class="font-mono">${ticket.service_battery_serial}</code>` : 'None'}</td>
          </tr>
        </table>

        <div style="margin:16px 0 8px; font-weight:700; text-transform:uppercase; font-size:11px; color:#475569;">
          Bench Electrical Test Summary
        </div>
        <table class="item-table">
          <thead>
            <tr>
              <th>Open Circuit Voltage (OCV)</th>
              <th>15s High Load Voltage</th>
              <th>Specific Gravity (6 Cells)</th>
              <th>Lab Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${test ? test.open_circuit_voltage : 10.4} Volts</strong></td>
              <td><strong>${test ? test.load_test_voltage : 8.2} Volts</strong></td>
              <td><code>${test ? test.specific_gravity : '1.18, 1.18, 1.12, 1.18, 1.18, 1.18'}</code></td>
              <td><span class="badge badge-success">PASS</span> (Cell #3 Dead)</td>
            </tr>
          </tbody>
        </table>

        <div class="terms-box">
          <strong>Customer Acknowledgement & Undertaking:</strong>
          <p>I hereby confirm that I have surrendered my battery for official manufacturer warranty processing. I understand that replacement approval is subject to final physical inspection by the factory service engineer.</p>
        </div>

        <div class="signoff-section">
          <div class="sign-box">
            Customer Signature
          </div>
          <div class="sign-box">
            Testing Engineer Signature
          </div>
        </div>
      `;
    }
  }

  window.preparePrintChallan = function (challanNo) {
    switchTab('tab-print');
    if (challanNo.startsWith('DC-RET')) {
      renderPrintTemplate('DC-RET', challanNo);
    } else if (challanNo.startsWith('DC-COM')) {
      renderPrintTemplate('DC-COM', challanNo);
    }
  };

  // ==========================================
  // Modals & Interactive Actions
  // ==========================================

  // 1. New Intake
  document.getElementById('form-new-intake').addEventListener('submit', function (e) {
    e.preventDefault();

    const sourceType = document.getElementById('intake-source-type').value;
    const dealerSelect = document.getElementById('intake-dealer-id');
    const dealerName = sourceType === 'DEALER' ? dealerSelect.options[dealerSelect.selectedIndex].text : '';

    const customerName = document.getElementById('intake-customer-name').value.trim();
    const mobile = document.getElementById('intake-mobile').value.trim();
    const vehicle = document.getElementById('intake-vehicle').value.trim();
    const address = document.getElementById('intake-address').value.trim();
    const model = document.getElementById('intake-battery-model').value;
    const origSerial = document.getElementById('intake-original-serial').value.trim();
    const remarks = document.getElementById('intake-remarks').value.trim();

    const issueLoaner = document.getElementById('intake-issue-loaner').checked;
    const loanerModel = document.getElementById('intake-loaner-model').value.trim();
    const loanerSerial = document.getElementById('intake-loaner-serial').value.trim();

    const nextSeq = String(state.tickets.length + 1).padStart(6, '0');
    const ticketNo = `TKT-2026-${nextSeq}`;
    const today = new Date().toISOString().split('T')[0];

    const newTicket = {
      ticket_no: ticketNo,
      source_type: sourceType,
      dealer_name: dealerName,
      customer_name: customerName,
      mobile: mobile,
      vehicle_number: vehicle,
      address: address,
      battery_model: model,
      original_serial_no: origSerial,
      date_received: today,
      service_battery_issued: issueLoaner,
      service_battery_model: issueLoaner ? loanerModel : '',
      service_battery_serial: issueLoaner ? loanerSerial : '',
      status: 'RECEIVED',
      claim_no: null,
      remarks: remarks,
      created_at: new Date().toISOString()
    };

    state.tickets.push(newTicket);

    // Audit log
    state.audits.push({
      audit_id: `AUD-2026-${String(state.audits.length + 1).padStart(6, '0')}`,
      timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in',
      action: 'INTAKE',
      record_type: 'TICKET',
      record_id: ticketNo,
      old_status: 'NONE',
      new_status: 'RECEIVED',
      details: `Intake registered for ${customerName} (${model}, Serial '${origSerial}'). ${issueLoaner ? `Loaner ${loanerSerial} issued.` : ''}`
    });

    saveState();
    closeModal('modal-intake');
    this.reset();
    document.getElementById('loaner-fields').style.display = 'none';
    renderAll();
    showToast(`Intake ticket ${ticketNo} generated successfully!`, 'success');
  });

  // Source Type toggles Dealer select
  document.getElementById('intake-source-type').addEventListener('change', function () {
    const isDealer = this.value === 'DEALER';
    document.getElementById('group-dealer-select').style.display = isDealer ? 'block' : 'none';
  });

  // Loaner checkbox toggles loaner inputs
  document.getElementById('intake-issue-loaner').addEventListener('change', function () {
    document.getElementById('loaner-fields').style.display = this.checked ? 'flex' : 'none';
    if (this.checked && !document.getElementById('intake-loaner-serial').value) {
      document.getElementById('intake-loaner-serial').value = `SB-${String(Math.floor(Math.random() * 800) + 100)}`;
    }
  });

  // 2. Open Test Modal
  window.openTestModal = function (ticketNo) {
    const t = state.tickets.find(x => x.ticket_no === ticketNo);
    if (!t) return;

    document.getElementById('test-ticket-no').value = t.ticket_no;
    document.getElementById('test-meta-ticket').textContent = t.ticket_no;
    document.getElementById('test-meta-customer').textContent = t.customer_name;
    document.getElementById('test-meta-model').textContent = t.battery_model;
    document.getElementById('test-meta-serial').textContent = `'${t.original_serial_no}`;

    // Defaults
    document.getElementById('test-ocv').value = '10.5';
    document.getElementById('test-load-v').value = '8.2';
    document.getElementById('test-gravity').value = '1.18, 1.18, 1.11, 1.18, 1.18, 1.18';
    document.getElementById('test-remarks').value = 'Cell 3 weak gravity and sudden drop under load.';

    openModal('modal-test');
  };

  // Submit Test Modal
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

    const testId = `TST-2026-${String(state.tests.length + 1).padStart(6, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // Remove existing test if re-testing
    state.tests = state.tests.filter(x => x.ticket_no !== ticketNo);

    state.tests.push({
      test_id: testId,
      ticket_no: ticketNo,
      original_serial_no: t.original_serial_no,
      test_date: today,
      tested_by: tester,
      open_circuit_voltage: ocv,
      load_test_voltage: loadV,
      specific_gravity: gravity,
      physical_condition: casing,
      test_result: result,
      test_remarks: remarks
    });

    if (result === 'PASS') {
      t.status = 'TEST_PASSED';
      // Automatically generate claim
      const claimSeq = String(state.claims.length + 1).padStart(6, '0');
      const claimNo = `CLM-2026-${claimSeq}`;
      t.claim_no = claimNo;
      t.status = 'CLAIM_CREATED';

      state.claims.push({
        claim_no: claimNo,
        ticket_no: t.ticket_no,
        customer_name: t.customer_name,
        mobile: t.mobile,
        vehicle_number: t.vehicle_number,
        battery_model: t.battery_model,
        original_serial_no: t.original_serial_no,
        warranty_status: 'IN_WARRANTY',
        claim_date: today,
        status: 'READY_FOR_COMPANY',
        dispatch_batch_no: null,
        company_challan_no: null,
        replacement_model: null,
        replacement_serial_no: null,
        replacement_received_date: null,
        stock_status: 'NOT_APPLICABLE',
        stock_ref_no: null,
        closed_date: null
      });

      state.audits.push({
        audit_id: `AUD-2026-${String(state.audits.length + 1).padStart(6, '0')}`,
        timestamp: new Date().toISOString(),
        user_email: 'sanjay@batteryhub.in',
        action: 'TEST',
        record_type: 'TICKET',
        record_id: ticketNo,
        old_status: 'TESTING',
        new_status: 'CLAIM_CREATED',
        details: `Battery passed test (${ocv}V, Load: ${loadV}V). Converted to Claim ${claimNo}.`
      });

      showToast(`Test PASSED! Created Claim ${claimNo} (Ready for Company dispatch).`, 'success');
    } else {
      t.status = 'TEST_REJECTED';
      const challanSeq = String(state.challans.length + 1).padStart(6, '0');
      const challanNo = `DC-RET-2026-${challanSeq}`;
      t.challan_no = challanNo;

      state.challans.push({
        challan_no: challanNo,
        challan_type: 'BATTERY_RETURN',
        challan_date: today,
        recipient_name: t.customer_name,
        mobile: t.mobile,
        address: t.address || 'Surat',
        ticket_no: t.ticket_no,
        battery_model: t.battery_model,
        battery_serial_no: t.original_serial_no,
        quantity: 1,
        status: 'GENERATED',
        remarks: remarks
      });

      state.audits.push({
        audit_id: `AUD-2026-${String(state.audits.length + 1).padStart(6, '0')}`,
        timestamp: new Date().toISOString(),
        user_email: 'sanjay@batteryhub.in',
        action: 'TEST',
        record_type: 'TICKET',
        record_id: ticketNo,
        old_status: 'TESTING',
        new_status: 'TEST_REJECTED',
        details: `Battery rejected (${casing}). Generated return delivery challan ${challanNo}.`
      });

      showToast(`Test REJECTED. Return delivery challan ${challanNo} issued.`, 'info');
    }

    saveState();
    closeModal('modal-test');
    renderAll();
  });

  // 3. Create Dispatch Batch
  document.getElementById('btn-create-dispatch').addEventListener('click', function () {
    const readyClaims = state.claims.filter(c => c.status === 'READY_FOR_COMPANY');
    const container = document.getElementById('dispatch-claims-selector');

    if (readyClaims.length === 0) {
      showToast('No approved claims currently in "READY_FOR_COMPANY" state.', 'info');
      return;
    }

    container.innerHTML = readyClaims.map(c => `
      <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #f1f5f9;">
        <input type="checkbox" id="chk-claim-${c.claim_no}" value="${c.claim_no}" checked>
        <label for="chk-claim-${c.claim_no}" style="font-size:12px; cursor:pointer;">
          <strong>${c.claim_no}</strong>: ${c.customer_name} — ${c.battery_model} (Serial: <code>'${c.original_serial_no}</code>)
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

    const batchSeq = String(state.dispatches.length + 1).padStart(6, '0');
    const batchId = `DSP-2026-${batchSeq}`;
    const challanSeq = String(state.challans.length + 1).padStart(6, '0');
    const challanNo = `DC-COM-2026-${challanSeq}`;
    const today = new Date().toISOString().split('T')[0];

    const claimIds = checkedBoxes.map(b => b.value);

    // Update selected claims
    claimIds.forEach(id => {
      const claim = state.claims.find(c => c.claim_no === id);
      if (claim) {
        claim.status = 'SENT_TO_COMPANY';
        claim.dispatch_batch_no = batchId;
        claim.company_challan_no = challanNo;
      }
    });

    state.dispatches.push({
      dispatch_batch_no: batchId,
      company_name: company,
      destination: dest,
      company_challan_no: challanNo,
      dispatch_date: today,
      carrier_transporter: carrier,
      lr_docket_no: lr,
      claim_count: claimIds.length,
      battery_count: claimIds.length,
      created_by: 'ramesh@batteryhub.in',
      remarks: `Consolidated dispatch of ${claimIds.length} batteries booked via ${carrier}.`
    });

    state.challans.push({
      challan_no: challanNo,
      challan_type: 'COMPANY_DISPATCH',
      challan_date: today,
      recipient_name: company,
      mobile: '+91 265 2840192',
      address: dest,
      ticket_no: 'CONSOLIDATED-BATCH',
      battery_model: 'Consolidated Consignment',
      battery_serial_no: claimIds.join(', '),
      quantity: claimIds.length,
      status: 'DISPATCHED',
      remarks: `Booked under LR ${lr}`
    });

    state.audits.push({
      audit_id: `AUD-2026-${String(state.audits.length + 1).padStart(6, '0')}`,
      timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in',
      action: 'DISPATCH',
      record_type: 'DISPATCH',
      record_id: batchId,
      old_status: 'READY_FOR_COMPANY',
      new_status: 'SENT_TO_COMPANY',
      details: `Created batch ${batchId} containing ${claimIds.length} claims. Challan ${challanNo} generated.`
    });

    saveState();
    closeModal('modal-dispatch');
    renderAll();
    showToast(`Batch ${batchId} created and dispatched!`, 'success');
  });

  // 4. Receive Replacement Modal
  window.openReceiveReplacementModal = function (claimNo) {
    const claim = state.claims.find(c => c.claim_no === claimNo);
    if (!claim) return;

    document.getElementById('repl-claim-no').value = claim.claim_no;
    document.getElementById('repl-meta-claim').textContent = claim.claim_no;
    document.getElementById('repl-meta-customer').textContent = claim.customer_name;
    document.getElementById('repl-meta-orig-serial').textContent = `'${claim.original_serial_no}`;
    document.getElementById('repl-model').value = claim.battery_model;
    document.getElementById('repl-serial').value = `REP-${Math.floor(1000000 + Math.random() * 9000000)}`;

    openModal('modal-replacement');
  };

  document.getElementById('form-receive-replacement').addEventListener('submit', function (e) {
    e.preventDefault();

    const claimNo = document.getElementById('repl-claim-no').value;
    const claim = state.claims.find(c => c.claim_no === claimNo);
    if (!claim) return;

    const replModel = document.getElementById('repl-model').value.trim();
    const replSerial = document.getElementById('repl-serial').value.trim();
    const today = new Date().toISOString().split('T')[0];

    claim.status = 'REPLACEMENT_RECEIVED';
    claim.replacement_model = replModel;
    claim.replacement_serial_no = replSerial;
    claim.replacement_received_date = today;
    claim.stock_status = 'UPDATE_REQUIRED';

    // Generate Stock Update Task
    const taskId = `STK-2026-${String(state.stockTasks.length + 1).padStart(6, '0')}`;
    state.stockTasks.push({
      stock_task_id: taskId,
      claim_no: claimNo,
      replacement_model: replModel,
      replacement_serial_no: replSerial,
      received_date: today,
      stock_status: 'UPDATE_REQUIRED',
      accounting_ref_no: null,
      updated_at: null,
      updated_by: null
    });

    state.audits.push({
      audit_id: `AUD-2026-${String(state.audits.length + 1).padStart(6, '0')}`,
      timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in',
      action: 'REPLACEMENT_RECEIVE',
      record_type: 'CLAIM',
      record_id: claimNo,
      old_status: 'SENT_TO_COMPANY',
      new_status: 'REPLACEMENT_RECEIVED',
      details: `Received factory replacement '${replSerial}'. Created mandatory stock task ${taskId}.`
    });

    saveState();
    closeModal('modal-replacement');
    renderAll();
    showToast(`Replacement received! Task ${taskId} created for Busy/Tally reconciliation.`, 'success');
  });

  // 5. Reconcile Stock Modal
  window.openReconcileModal = function (taskId) {
    const task = state.stockTasks.find(s => s.stock_task_id === taskId);
    if (!task) return;

    document.getElementById('recon-task-id').value = task.stock_task_id;
    document.getElementById('recon-meta-task').textContent = task.stock_task_id;
    document.getElementById('recon-meta-claim').textContent = task.claim_no;
    document.getElementById('recon-meta-battery').textContent = task.replacement_model;
    document.getElementById('recon-meta-serial').textContent = `'${task.replacement_serial_no}`;
    document.getElementById('recon-ref-no').value = `VR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    openModal('modal-reconcile');
  };

  window.openReconcileModalForClaim = function (claimNo) {
    const task = state.stockTasks.find(s => s.claim_no === claimNo && s.stock_status === 'UPDATE_REQUIRED');
    if (task) {
      openReconcileModal(task.stock_task_id);
    } else {
      showToast('No pending stock task found for this claim.', 'info');
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

    task.stock_status = 'UPDATED';
    task.accounting_ref_no = `${erp}:${refNo}`;
    task.updated_at = new Date().toISOString();
    task.updated_by = operator;

    // Update parent claim
    const claim = state.claims.find(c => c.claim_no === task.claim_no);
    if (claim) {
      claim.stock_status = 'UPDATED';
      claim.stock_ref_no = `${erp}:${refNo}`;
      claim.status = 'CLOSED';
      claim.closed_date = new Date().toISOString().split('T')[0];

      // Also update linked ticket
      const ticket = state.tickets.find(t => t.ticket_no === claim.ticket_no);
      if (ticket) {
        ticket.status = 'CLOSED';
      }
    }

    state.audits.push({
      audit_id: `AUD-2026-${String(state.audits.length + 1).padStart(6, '0')}`,
      timestamp: new Date().toISOString(),
      user_email: 'ramesh@batteryhub.in',
      action: 'STOCK_UPDATE',
      record_type: 'STOCK_TASK',
      record_id: taskId,
      old_status: 'UPDATE_REQUIRED',
      new_status: 'UPDATED',
      details: `Reconciled physical stock in ${erp} with reference ${refNo}. Handover authorized and claim closed.`
    });

    saveState();
    closeModal('modal-reconcile');
    renderAll();
    showToast(`Stock reconciled (${refNo})! Claim and ticket successfully marked CLOSED.`, 'success');
  });

  // 6. Detailed Inspector Modal
  window.openInspector = function (ticketNo) {
    const t = state.tickets.find(x => x.ticket_no === ticketNo);
    if (!t) return;

    const claim = t.claim_no ? state.claims.find(c => c.claim_no === t.claim_no) : null;
    const test = state.tests.find(x => x.ticket_no === t.ticket_no);

    document.getElementById('inspect-title').textContent = `${t.ticket_no} Details`;
    const badge = document.getElementById('inspect-badge');
    badge.className = `badge status-${t.status}`;
    badge.textContent = t.status.replace(/_/g, ' ');

    // 3 Serials
    document.getElementById('inspect-orig-serial').textContent = `'${t.original_serial_no}`;
    document.getElementById('inspect-loaner-serial').textContent = t.service_battery_issued ? `'${t.service_battery_serial}' (${t.service_battery_model})` : 'None Issued';
    document.getElementById('inspect-repl-serial').textContent = claim && claim.replacement_serial_no ? `'${claim.replacement_serial_no}' (${claim.replacement_model})` : 'Awaiting Factory';

    // Details Grid
    document.getElementById('inspect-cust-name').textContent = t.customer_name;
    document.getElementById('inspect-cust-phone').textContent = `Mobile: ${t.mobile}`;
    document.getElementById('inspect-cust-vehicle').textContent = `Vehicle: ${t.vehicle_number || 'N/A'}`;

    document.getElementById('inspect-battery-model').textContent = t.battery_model;
    document.getElementById('inspect-warranty-terms').textContent = test ? `Test: ${test.test_result} (OCV: ${test.open_circuit_voltage}V, Load: ${test.load_test_voltage}V)` : 'Pending Test Bench';

    document.getElementById('inspect-dispatch-batch').textContent = claim && claim.dispatch_batch_no ? `Batch: ${claim.dispatch_batch_no}` : 'Not Batched';
    document.getElementById('inspect-lr-docket').textContent = claim && claim.company_challan_no ? `Challan: ${claim.company_challan_no}` : '-';

    document.getElementById('inspect-stock-status').textContent = claim ? `Stock: ${claim.stock_status}` : 'N/A';
    document.getElementById('inspect-stock-ref').textContent = claim && claim.stock_ref_no ? `ERP Ref: ${claim.stock_ref_no}` : '-';

    // Progression Steps
    const stepsContainer = document.getElementById('inspect-timeline-steps');
    const stages = [
      { id: 'INTAKE', label: '1. Intake' },
      { id: 'TEST', label: '2. Testing Lab' },
      { id: 'CLAIM', label: '3. Claim Created' },
      { id: 'DISPATCH', label: '4. Dispatched' },
      { id: 'REPLACE', label: '5. Replacement' },
      { id: 'CLOSED', label: '6. Closed' }
    ];

    let currentStageIndex = 0;
    if (t.status === 'RECEIVED') currentStageIndex = 0;
    else if (t.status === 'TESTING' || t.status === 'TEST_PASSED' || t.status === 'TEST_REJECTED') currentStageIndex = 1;
    else if (t.status === 'CLAIM_CREATED' || (claim && claim.status === 'READY_FOR_COMPANY')) currentStageIndex = 2;
    else if (claim && claim.status === 'SENT_TO_COMPANY') currentStageIndex = 3;
    else if (claim && claim.status === 'REPLACEMENT_RECEIVED') currentStageIndex = 4;
    else if (t.status === 'CLOSED' || (claim && claim.status === 'CLOSED')) currentStageIndex = 5;

    stepsContainer.innerHTML = stages.map((s, idx) => {
      let cls = '';
      if (idx < currentStageIndex) cls = 'completed';
      else if (idx === currentStageIndex) cls = 'active';

      return `
        <div class="step-node ${cls}">
          <div class="step-circle">${idx < currentStageIndex ? '✓' : idx + 1}</div>
          <span class="step-text">${s.label}</span>
        </div>
      `;
    }).join('');

    // Print button handler inside inspector
    document.getElementById('inspect-btn-print').onclick = function () {
      closeModal('modal-inspector');
      if (t.challan_no) {
        preparePrintChallan(t.challan_no);
      } else if (claim && claim.company_challan_no) {
        preparePrintChallan(claim.company_challan_no);
      } else {
        switchTab('tab-print');
        renderPrintTemplate('CLAIM-FORM');
      }
    };

    openModal('modal-inspector');
  };

  // ==========================================
  // Omnibox Live Search Filter
  // ==========================================
  const searchInput = document.getElementById('omnibox-search');
  const clearSearchBtn = document.getElementById('clear-search');

  function handleSearch() {
    const q = searchInput.value.trim().toLowerCase();
    clearSearchBtn.style.display = q ? 'block' : 'none';

    if (!q) {
      renderTicketsTable();
      return;
    }

    const filtered = state.tickets.filter(t => {
      return (
        t.ticket_no.toLowerCase().includes(q) ||
        (t.claim_no && t.claim_no.toLowerCase().includes(q)) ||
        t.original_serial_no.toLowerCase().includes(q) ||
        (t.service_battery_serial && t.service_battery_serial.toLowerCase().includes(q)) ||
        t.customer_name.toLowerCase().includes(q) ||
        (t.dealer_name && t.dealer_name.toLowerCase().includes(q)) ||
        t.mobile.toLowerCase().includes(q) ||
        (t.vehicle_number && t.vehicle_number.toLowerCase().includes(q))
      );
    });

    renderTicketsTable(filtered);
    switchTab('tab-intake');
  }

  searchInput.addEventListener('input', handleSearch);
  clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    handleSearch();
  });

  // Ticket Status Filter Dropdown
  document.getElementById('filter-ticket-status').addEventListener('change', function () {
    const val = this.value;
    if (val === 'ALL') {
      renderTicketsTable();
    } else {
      const filtered = state.tickets.filter(t => t.status === val);
      renderTicketsTable(filtered);
    }
  });

  // Navigation Click Handlers
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // KPI Card clicks filter tickets
  document.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const f = card.dataset.filter;
      if (f === 'TESTING') {
        switchTab('tab-lab');
      } else if (f === 'DISPATCHED') {
        switchTab('tab-claims');
      } else if (f === 'STOCK_PENDING') {
        switchTab('tab-stock');
      } else {
        switchTab('tab-intake');
      }
    });
  });

  // Quick Action Buttons
  document.getElementById('btn-quick-intake').addEventListener('click', () => openModal('modal-intake'));
  document.getElementById('btn-intake-modal-open').addEventListener('click', () => openModal('modal-intake'));
  document.getElementById('btn-reset-demo').addEventListener('click', resetState);

  // Print controls
  document.getElementById('print-template-selector').addEventListener('change', function () {
    renderPrintTemplate(this.value);
  });
  document.getElementById('btn-trigger-print').addEventListener('click', () => window.print());

  // Master Render
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

  // Initial Boot
  renderAll();
})();
