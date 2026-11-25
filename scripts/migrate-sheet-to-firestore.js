#!/usr/bin/env node

/**
 * scripts/migrate-sheet-to-firestore.js
 *
 * One-time data migration utility: fetches existing records from the legacy
 * Google Apps Script bulk endpoint and writes them cleanly into Cloud Firestore
 * for Firebase project `battery-warranty-hub-26` (Standard Edition `(default)` DB).
 *
 * Uses `gcloud auth print-access-token` and Firestore REST API (zero extra npm deps).
 * Usage:
 *   node scripts/migrate-sheet-to-firestore.js [--dry-run]
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'battery-warranty-hub-26';
const LEGACY_BULK_URL = 'https://script.google.com/macros/s/AKfycbxByzdkfuxAOIWnvi9MVNJ4o5gD21SGWVxvsR56PelHxC69vyGyVRnDbY5KvsFj-9jE/exec?api=bulk';
const BOOTSTRAP_ADMIN_EMAIL = 'ayushmestorage@gmail.com';
const DRY_RUN = process.argv.includes('--dry-run');

function httpRequest(url, options = {}, body = null, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        return resolve(httpRequest(res.headers.location, { method: 'GET', headers: options.headers }, null, maxRedirects - 1));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function toFirestoreValue(val) {
  if (val === null) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { integerValue: '0' };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function pick(obj, allowedKeys) {
  const out = {};
  for (const key of allowedKeys) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

function asStr(v, maxLen = 1000, fallback = '') {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function asBool(v, fallback = true) {
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toUpperCase();
  if (s === 'TRUE' || s === 'YES' || s === '1') return true;
  if (s === 'FALSE' || s === 'NO' || s === '0') return false;
  return fallback;
}

function asNum(v, fallback = 0, min = -Infinity, max = Infinity) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function safeDocId(raw) {
  return String(raw || '').trim().replace(/[\/]/g, '_');
}

function buildMigrationDocuments(bulkData) {
  const nowIso = new Date().toISOString();
  const tables = bulkData.tables || {};
  const rawConfig = bulkData.config || {};
  const docs = [];

  // 1. Bootstrap admin + existing Users -> authorized_staff
  docs.push({
    collection: 'authorized_staff',
    id: BOOTSTRAP_ADMIN_EMAIL,
    data: {
      email: BOOTSTRAP_ADMIN_EMAIL,
      name: 'Ayush Admin',
      role: 'ADMIN',
      active: true,
      created_at: nowIso,
      updated_at: nowIso
    }
  });

  (tables.Users || []).forEach((u) => {
    const email = asStr(u.email, 150).toLowerCase();
    if (!email || !email.includes('@') || email === BOOTSTRAP_ADMIN_EMAIL) return;
    const roleRaw = asStr(u.role, 20, 'OPERATOR').toUpperCase();
    const role = ['ADMIN', 'OPERATOR', 'TESTER'].includes(roleRaw) ? roleRaw : 'OPERATOR';
    docs.push({
      collection: 'authorized_staff',
      id: email,
      data: {
        email,
        name: asStr(u.name, 100, email.split('@')[0]) || email.split('@')[0],
        role,
        active: asStr(u.status, 20, 'ACTIVE').toUpperCase() !== 'DISABLED',
        created_at: asStr(u.created_at, 40, nowIso) || nowIso,
        updated_at: nowIso
      }
    });
  });

  // 2. config/app_settings
  const cfgAllowedStr = [
    'COMPANY_NAME', 'COMPANY_ADDRESS', 'COMPANY_PHONE', 'COMPANY_EMAIL',
    'COMPANY_GST', 'COMPANY_TERMS', 'TIMEZONE',
    'TICKET_PREFIX', 'CLAIM_PREFIX', 'RETURN_CHALLAN_PREFIX',
    'COMPANY_CHALLAN_PREFIX', 'DISPATCH_PREFIX'
  ];
  const cfgSeqKeys = [
    'TICKET_SEQ', 'CLAIM_SEQ', 'RETURN_CHALLAN_SEQ',
    'COMPANY_CHALLAN_SEQ', 'DISPATCH_SEQ'
  ];
  const configDoc = { updated_at: nowIso };
  cfgAllowedStr.forEach((k) => {
    if (rawConfig[k] !== undefined && rawConfig[k] !== null) {
      configDoc[k] = asStr(rawConfig[k], k === 'COMPANY_TERMS' ? 2000 : 400);
    }
  });
  cfgSeqKeys.forEach((k) => {
    configDoc[k] = Math.max(1, Math.round(asNum(rawConfig[k], 1001, 1, 1000000000)));
  });
  docs.push({ collection: 'config', id: 'app_settings', data: configDoc });

  // 3. battery_models
  (tables.Battery_Models || []).forEach((m, idx) => {
    const id = safeDocId(asStr(m.model_id, 60) || `MOD-${String(idx + 1).padStart(3, '0')}`);
    docs.push({
      collection: 'battery_models',
      id,
      data: {
        model_id: id,
        model_code: asStr(m.model_code, 60),
        brand: asStr(m.brand, 80, 'Amaron') || 'Amaron',
        model_name: asStr(m.model_name, 150, id) || id,
        capacity_ah: asNum(m.capacity_ah, 35, 0, 1000),
        warranty_months: asNum(m.warranty_months, 36, 0, 240),
        guarantee_months: asNum(m.guarantee_months, 18, 0, 240),
        pro_rata_months: asNum(m.pro_rata_months, 18, 0, 240),
        is_active: asBool(m.is_active, true),
        updated_at: nowIso
      }
    });
  });

  // 4. dealers
  (tables.Dealers || []).forEach((d, idx) => {
    const id = safeDocId(asStr(d.dealer_id, 60) || `DLR-${String(idx + 1).padStart(3, '0')}`);
    docs.push({
      collection: 'dealers',
      id,
      data: {
        dealer_id: id,
        dealer_name: asStr(d.dealer_name, 150, id) || id,
        contact_person: asStr(d.contact_person, 100),
        mobile: asStr(d.mobile, 30),
        address: asStr(d.address, 300),
        gstin: asStr(d.gstin, 30),
        city: asStr(d.city, 80),
        is_active: asBool(d.is_active, true),
        updated_at: nowIso
      }
    });
  });

  // 5. customers
  (tables.Customers || []).forEach((c, idx) => {
    const id = safeDocId(asStr(c.customer_id, 60) || `CUST-MIG-${String(idx + 1).padStart(4, '0')}`);
    docs.push({
      collection: 'customers',
      id,
      data: {
        customer_id: id,
        name: asStr(c.name, 150, 'Customer') || 'Customer',
        mobile: asStr(c.mobile, 30),
        address: asStr(c.address, 300),
        vehicle_number: asStr(c.vehicle_number, 40),
        created_at: asStr(c.created_at, 50, nowIso) || nowIso
      }
    });
  });

  // 6. tickets
  const VALID_TICKET_STATUSES = new Set([
    'RECEIVED', 'TESTING', 'PASSED', 'TEST_PASSED',
    'REJECTED_RETURN_PENDING', 'REJECTED_RETURNED',
    'CLAIM_CREATED', 'READY_FOR_COMPANY', 'SENT_TO_COMPANY',
    'REPLACEMENT_RECEIVED', 'STOCK_UPDATE_REQUIRED',
    'STOCK_UPDATED', 'CLOSED'
  ]);
  (tables.Tickets || []).forEach((t) => {
    const id = safeDocId(asStr(t.ticket_no, 60));
    if (!id) return;
    let st = asStr(t.status, 40, 'RECEIVED').toUpperCase().replace(/[\s\—\-]+/g, '_');
    if (st === 'CLAIM_CLOSED') st = 'CLOSED';
    if (st === 'REJECTED_—_RETURNED' || st === 'REJECTED_RETURN') st = 'REJECTED_RETURNED';
    if (!VALID_TICKET_STATUSES.has(st)) st = 'RECEIVED';

    const src = asStr(t.source_type, 20, 'CUSTOMER').toUpperCase() === 'DEALER' ? 'DEALER' : 'CUSTOMER';
    const custName = asStr(t.customer_name, 150) || asStr(t.dealer_name, 150) || 'Customer';

    docs.push({
      collection: 'tickets',
      id,
      data: {
        ticket_no: id,
        source_type: src,
        customer_id: asStr(t.customer_id, 60),
        customer_name: custName,
        dealer_id: asStr(t.dealer_id, 60),
        dealer_name: asStr(t.dealer_name, 150),
        mobile: asStr(t.mobile, 30),
        address: asStr(t.address, 300),
        vehicle_number: asStr(t.vehicle_number, 40),
        battery_model: asStr(t.battery_model, 150, 'Unknown Model') || 'Unknown Model',
        original_serial_no: asStr(t.original_serial_no, 80, 'UNKNOWN') || 'UNKNOWN',
        date_received: asStr(t.date_received, 30),
        date_of_sale: asStr(t.date_of_sale, 30),
        service_battery_issued: asBool(t.service_battery_issued, false),
        service_battery_model: asStr(t.service_battery_model, 150),
        service_battery_serial: asStr(t.service_battery_serial, 80),
        service_battery_date: asStr(t.service_battery_date, 30),
        status: st,
        remarks: asStr(t.remarks, 1000),
        created_at: asStr(t.created_at, 50, nowIso) || nowIso,
        updated_at: asStr(t.updated_at, 50, nowIso) || nowIso,
        created_by: asStr(t.created_by, 150, BOOTSTRAP_ADMIN_EMAIL)
      }
    });
  });

  // 7. battery_tests
  (tables.Battery_Tests || []).forEach((bt) => {
    const id = safeDocId(asStr(bt.test_id, 60));
    if (!id) return;
    const res = asStr(bt.test_result, 20, 'PASS').toUpperCase() === 'REJECT' ? 'REJECT' : 'PASS';
    docs.push({
      collection: 'battery_tests',
      id,
      data: {
        test_id: id,
        ticket_no: asStr(bt.ticket_no, 60, 'UNKNOWN') || 'UNKNOWN',
        original_serial_no: asStr(bt.original_serial_no, 80),
        test_date: asStr(bt.test_date, 30),
        tested_by: asStr(bt.tested_by, 100),
        open_circuit_voltage: asStr(bt.open_circuit_voltage, 30),
        specific_gravity: asStr(bt.specific_gravity, 200),
        load_test_voltage: asStr(bt.load_test_voltage, 30),
        physical_condition: asStr(bt.physical_condition, 200),
        test_result: res,
        test_remarks: asStr(bt.test_remarks, 1000),
        report_file_id: asStr(bt.report_file_id, 120)
      }
    });
  });

  // 8. claims
  const VALID_CLAIM_STATUSES = new Set([
    'CLAIM_CREATED', 'READY_FOR_COMPANY', 'SENT_TO_COMPANY',
    'REPLACEMENT_RECEIVED', 'STOCK_UPDATED', 'CLOSED'
  ]);
  (tables.Claims || []).forEach((c) => {
    const id = safeDocId(asStr(c.claim_no, 60));
    if (!id) return;
    let st = asStr(c.status, 40, 'CLAIM_CREATED').toUpperCase().replace(/[\s\-]+/g, '_');
    if (st === 'CLAIM_CLOSED') st = 'CLOSED';
    if (!VALID_CLAIM_STATUSES.has(st)) st = 'CLAIM_CREATED';
    let stockSt = asStr(c.stock_status, 40);
    if (st === 'CLOSED' && stockSt !== 'UPDATED') {
      stockSt = 'UPDATED';
    }
    const claimObj = {
      claim_no: id,
      ticket_no: asStr(c.ticket_no, 60, 'UNKNOWN') || 'UNKNOWN',
      source_type: asStr(c.source_type, 20),
      customer_name: asStr(c.customer_name, 150),
      mobile: asStr(c.mobile, 30),
      address: asStr(c.address, 300),
      dealer_name: asStr(c.dealer_name, 150),
      vehicle_number: asStr(c.vehicle_number, 40),
      battery_model: asStr(c.battery_model, 150, 'Unknown Model') || 'Unknown Model',
      original_serial_no: asStr(c.original_serial_no, 80, 'UNKNOWN') || 'UNKNOWN',
      date_of_sale: asStr(c.date_of_sale, 30),
      warranty_months: asNum(c.warranty_months, 36, 0, 240),
      warranty_expiry_date: asStr(c.warranty_expiry_date, 30),
      warranty_status: asStr(c.warranty_status, 40),
      claim_date: asStr(c.claim_date, 30),
      status: st,
      dispatch_batch_no: asStr(c.dispatch_batch_no, 60),
      company_challan_no: asStr(c.company_challan_no, 60),
      company_dispatch_date: asStr(c.company_dispatch_date, 30),
      replacement_model: asStr(c.replacement_model, 150),
      replacement_serial_no: asStr(c.replacement_serial_no, 80),
      replacement_received_date: asStr(c.replacement_received_date, 30),
      stock_status: stockSt,
      stock_ref_no: asStr(c.stock_ref_no, 100),
      stock_updated_date: asStr(c.stock_updated_date, 30),
      stock_updated_by: asStr(c.stock_updated_by, 150),
      closed_date: asStr(c.closed_date, 30),
      remarks: asStr(c.remarks, 1000),
      doc_count: asNum(c.doc_count, 0, 0, 1000),
      created_at: asStr(c.created_at, 50, nowIso) || nowIso,
      updated_at: asStr(c.updated_at, 50, nowIso) || nowIso
    };
    docs.push({ collection: 'claims', id, data: claimObj });
  });

  // 9. delivery_challans
  const VALID_CHALLAN_STATUSES = new Set(['GENERATED', 'ACKNOWLEDGED', 'DISPATCHED']);
  (tables.Delivery_Challans || []).forEach((ch) => {
    const id = safeDocId(asStr(ch.challan_no, 60));
    if (!id) return;
    const tp = asStr(ch.challan_type, 30, 'BATTERY_RETURN').toUpperCase() === 'COMPANY_DISPATCH'
      ? 'COMPANY_DISPATCH' : 'BATTERY_RETURN';
    let st = asStr(ch.status, 30, 'GENERATED').toUpperCase();
    if (!VALID_CHALLAN_STATUSES.has(st)) st = 'GENERATED';
    docs.push({
      collection: 'delivery_challans',
      id,
      data: {
        challan_no: id,
        challan_type: tp,
        challan_date: asStr(ch.challan_date, 30),
        recipient_type: asStr(ch.recipient_type, 30),
        recipient_name: asStr(ch.recipient_name, 150),
        mobile: asStr(ch.mobile, 30),
        address: asStr(ch.address, 300),
        ticket_no: asStr(ch.ticket_no, 60),
        battery_model: asStr(ch.battery_model, 150),
        battery_serial_no: asStr(ch.battery_serial_no, 80),
        quantity: Math.max(1, Math.round(asNum(ch.quantity, 1, 1, 10000))),
        received_by_name: asStr(ch.received_by_name, 150),
        received_date: asStr(ch.received_date, 30),
        status: st,
        remarks: asStr(ch.remarks, 1000)
      }
    });
  });

  // 10. company_dispatches
  (tables.Company_Dispatches || []).forEach((d) => {
    const id = safeDocId(asStr(d.dispatch_batch_no, 60));
    if (!id) return;
    docs.push({
      collection: 'company_dispatches',
      id,
      data: {
        dispatch_batch_no: id,
        company_name: asStr(d.company_name, 150, 'Amaron Batteries Ltd.') || 'Amaron Batteries Ltd.',
        destination: asStr(d.destination, 200),
        company_challan_no: asStr(d.company_challan_no, 60, id) || id,
        dispatch_date: asStr(d.dispatch_date, 30),
        carrier_transporter: asStr(d.carrier_transporter, 150),
        lr_docket_no: asStr(d.lr_docket_no, 80),
        claim_count: Math.max(1, Math.round(asNum(d.claim_count, 1, 1, 10000))),
        battery_count: Math.max(1, Math.round(asNum(d.battery_count, 1, 1, 10000))),
        created_by: asStr(d.created_by, 150),
        remarks: asStr(d.remarks, 1000)
      }
    });
  });

  // 11. company_dispatch_items
  (tables.Company_Dispatch_Items || []).forEach((di) => {
    const id = safeDocId(asStr(di.item_id, 60));
    if (!id) return;
    docs.push({
      collection: 'company_dispatch_items',
      id,
      data: {
        item_id: id,
        dispatch_batch_no: asStr(di.dispatch_batch_no, 60, 'UNKNOWN') || 'UNKNOWN',
        claim_no: asStr(di.claim_no, 60, 'UNKNOWN') || 'UNKNOWN',
        ticket_no: asStr(di.ticket_no, 60),
        customer_name: asStr(di.customer_name, 150),
        battery_model: asStr(di.battery_model, 150),
        original_serial_no: asStr(di.original_serial_no, 80),
        warranty_status: asStr(di.warranty_status, 40)
      }
    });
  });

  // 12. replacement_receipts
  (tables.Replacement_Receipts || []).forEach((rr) => {
    const id = safeDocId(asStr(rr.receipt_id, 60));
    if (!id) return;
    docs.push({
      collection: 'replacement_receipts',
      id,
      data: {
        receipt_id: id,
        claim_no: asStr(rr.claim_no, 60, 'UNKNOWN') || 'UNKNOWN',
        replacement_model: asStr(rr.replacement_model, 150),
        replacement_serial_no: asStr(rr.replacement_serial_no, 80, 'UNKNOWN') || 'UNKNOWN',
        received_date: asStr(rr.received_date, 30),
        received_by: asStr(rr.received_by, 150),
        remarks: asStr(rr.remarks, 1000)
      }
    });
  });

  // 13. stock_update_log
  (tables.Stock_Update_Log || []).forEach((st) => {
    const id = safeDocId(asStr(st.stock_task_id, 60));
    if (!id) return;
    const ss = asStr(st.stock_status, 30, 'UPDATE_REQUIRED').toUpperCase() === 'UPDATED' ? 'UPDATED' : 'UPDATE_REQUIRED';
    docs.push({
      collection: 'stock_update_log',
      id,
      data: {
        stock_task_id: id,
        claim_no: asStr(st.claim_no, 60, 'UNKNOWN') || 'UNKNOWN',
        replacement_model: asStr(st.replacement_model, 150),
        replacement_serial_no: asStr(st.replacement_serial_no, 80),
        received_date: asStr(st.received_date, 30),
        stock_status: ss,
        accounting_ref_no: asStr(st.accounting_ref_no, 100),
        updated_at: asStr(st.updated_at, 50),
        updated_by: asStr(st.updated_by, 150),
        remarks: asStr(st.remarks, 1000)
      }
    });
  });

  // 14. service_batteries
  const VALID_SB_STATUS = new Set(['AVAILABLE', 'ASSIGNED', 'BLOCKED']);
  (tables.Service_Batteries || []).forEach((sb) => {
    const id = safeDocId(asStr(sb.sb_id, 60));
    if (!id) return;
    const sRaw = asStr(sb.status, 20, 'AVAILABLE').toUpperCase();
    docs.push({
      collection: 'service_batteries',
      id,
      data: {
        sb_id: id,
        serial_no: asStr(sb.serial_no, 80, id) || id,
        brand: asStr(sb.brand, 80, 'Amaron') || 'Amaron',
        model_name: asStr(sb.model_name, 150, 'Standby Service Battery') || 'Standby Service Battery',
        capacity_ah: asNum(sb.capacity_ah, 35, 0, 1000),
        status: VALID_SB_STATUS.has(sRaw) ? sRaw : 'AVAILABLE',
        is_blocked: asBool(sb.is_blocked, false),
        block_reason: asStr(sb.block_reason, 300),
        current_ticket_no: asStr(sb.current_ticket_no, 60),
        current_customer_name: asStr(sb.current_customer_name, 150),
        current_mobile: asStr(sb.current_mobile, 30),
        assigned_date: asStr(sb.assigned_date, 30),
        rotation_count: Math.max(0, Math.round(asNum(sb.rotation_count, 0, 0, 100000))),
        last_rotated_date: asStr(sb.last_rotated_date, 30),
        condition_notes: asStr(sb.condition_notes, 500),
        created_at: asStr(sb.created_at, 50, nowIso) || nowIso,
        updated_at: asStr(sb.updated_at, 50, nowIso) || nowIso
      }
    });
  });

  // 15. service_battery_logs
  const VALID_SB_ACTIONS = new Set(['STOCK_ADDED', 'ASSIGNED', 'RETURNED', 'BLOCKED', 'UNBLOCKED', 'REMOVED']);
  (tables.Service_Battery_Logs || []).forEach((l) => {
    const id = safeDocId(asStr(l.log_id, 60));
    if (!id) return;
    const act = asStr(l.action_type, 20, 'STOCK_ADDED').toUpperCase();
    docs.push({
      collection: 'service_battery_logs',
      id,
      data: {
        log_id: id,
        sb_id: asStr(l.sb_id, 60, 'UNKNOWN') || 'UNKNOWN',
        serial_no: asStr(l.serial_no, 80, 'UNKNOWN') || 'UNKNOWN',
        model_name: asStr(l.model_name, 150),
        action_type: VALID_SB_ACTIONS.has(act) ? act : 'STOCK_ADDED',
        ticket_no: asStr(l.ticket_no, 60),
        customer_name: asStr(l.customer_name, 150),
        mobile: asStr(l.mobile, 30),
        assigned_date: asStr(l.assigned_date, 30),
        returned_date: asStr(l.returned_date, 30),
        days_rotated: Math.max(0, Math.round(asNum(l.days_rotated, 0, 0, 100000))),
        performed_by: asStr(l.performed_by, 150),
        remarks: asStr(l.remarks, 1000),
        created_at: asStr(l.created_at, 50, nowIso) || nowIso
      }
    });
  });

  // 16. audit_log
  (tables.Audit_Log || []).forEach((a, idx) => {
    const id = safeDocId(asStr(a.audit_id, 60) || `AUD-MIG-${String(idx + 1).padStart(5, '0')}`);
    docs.push({
      collection: 'audit_log',
      id,
      data: {
        audit_id: id,
        timestamp: asStr(a.timestamp, 50, nowIso),
        user_email: asStr(a.user_email, 150, BOOTSTRAP_ADMIN_EMAIL),
        action: asStr(a.action, 80, 'MIGRATED_EVENT') || 'MIGRATED_EVENT',
        record_type: asStr(a.record_type, 50),
        entity_type: asStr(a.entity_type || a.record_type, 50),
        record_id: asStr(a.record_id, 80),
        entity_id: asStr(a.entity_id || a.record_id, 80),
        old_status: asStr(a.old_status, 60),
        new_status: asStr(a.new_status, 60),
        details: asStr(a.details, 1000)
      }
    });
  });

  return docs;
}

async function main() {
  console.log(`\nFetching live bulk snapshot from legacy Apps Script endpoint...`);
  const bulkRes = await httpRequest(LEGACY_BULK_URL);
  if (bulkRes.statusCode !== 200) {
    throw new Error(`HTTP ${bulkRes.statusCode} fetching legacy bulk data`);
  }
  const parsed = JSON.parse(bulkRes.data);
  if (!parsed || !parsed.success || !parsed.data) {
    throw new Error('Invalid JSON response from legacy endpoint');
  }

  const docs = buildMigrationDocuments(parsed.data);
  const byCol = {};
  docs.forEach((d) => { byCol[d.collection] = (byCol[d.collection] || 0) + 1; });
  console.log(`Prepared ${docs.length} Firestore documents across ${Object.keys(byCol).length} collections:`);
  console.log(byCol);

  if (DRY_RUN) {
    console.log('\n[--dry-run] Skipping Firestore commit.');
    return;
  }

  const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const baseDocPath = `projects/${PROJECT_ID}/databases/(default)/documents`;
  const commitUrl = `https://firestore.googleapis.com/v1/${baseDocPath}:commit`;

  const CHUNK_SIZE = 200;
  for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
    const chunk = docs.slice(i, i + CHUNK_SIZE);
    const writes = chunk.map((d) => ({
      update: {
        name: `${baseDocPath}/${d.collection}/${d.id}`,
        fields: toFirestoreFields(d.data)
      }
    }));

    const payload = JSON.stringify({ writes });
    const res = await httpRequest(commitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`Firestore commit failed (${res.statusCode}): ${res.data}`);
    }
    const commitJson = JSON.parse(res.data);
    console.log(`Committed batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${(commitJson.writeResults || []).length} docs written.`);
  }

  // Verify counts via Firestore REST list endpoints
  console.log('\nVerifying migrated document counts in Firestore...');
  const verifiedCounts = {};
  for (const colName of Object.keys(byCol)) {
    const listUrl = `https://firestore.googleapis.com/v1/${baseDocPath}/${colName}?pageSize=500`;
    const listRes = await httpRequest(listUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (listRes.statusCode !== 200) {
      throw new Error(`Verification list failed for ${colName} (${listRes.statusCode}): ${listRes.data}`);
    }
    const listJson = JSON.parse(listRes.data);
    verifiedCounts[colName] = (listJson.documents || []).length;
  }
  console.log('Verified Firestore counts:', verifiedCounts);
  console.log('\nMigration complete!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nMigration ERROR:', err);
  process.exit(1);
});
