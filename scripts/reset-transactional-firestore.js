#!/usr/bin/env node

/**
 * scripts/reset-transactional-firestore.js
 *
 * Cleans all transactional warranty records (tickets, tests, claims, challans,
 * company dispatches, replacement receipts, stock logs, customers, audit logs)
 * in Firestore project `battery-warranty-hub-26` so the portal starts 100% fresh,
 * while preserving master setup (authorized_staff, battery_models, dealers,
 * company branding config, and service_batteries pool with assignments cleared).
 *
 * Sequence counters in config/app_settings are reset back to 1001.
 *
 * Usage:
 *   node scripts/reset-transactional-firestore.js [--dry-run]
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'battery-warranty-hub-26';
const DRY_RUN = process.argv.includes('--dry-run');

const TRANSACTIONAL_COLLECTIONS = [
  'tickets',
  'battery_tests',
  'claims',
  'claim_documents',
  'delivery_challans',
  'company_dispatches',
  'company_dispatch_items',
  'replacement_receipts',
  'stock_update_log',
  'customers',
  'service_battery_logs',
  'audit_log'
];

function httpRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function listAllDocNames(collectionName, token) {
  const names = [];
  let pageToken = '';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=300`;
  do {
    const url = pageToken ? `${baseUrl}&pageToken=${encodeURIComponent(pageToken)}` : baseUrl;
    const res = await httpRequest(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.statusCode !== 200) {
      throw new Error(`Failed listing ${collectionName} (${res.statusCode}): ${res.data}`);
    }
    const json = JSON.parse(res.data);
    (json.documents || []).forEach((doc) => names.push(doc.name));
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return names;
}

async function commitWrites(writes, token) {
  if (!writes.length) return;
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;
  const CHUNK = 200;
  for (let i = 0; i < writes.length; i += CHUNK) {
    const payload = JSON.stringify({ writes: writes.slice(i, i + CHUNK) });
    const res = await httpRequest(commitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`Commit failed (${res.statusCode}): ${res.data}`);
    }
  }
}

async function main() {
  const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const basePath = `projects/${PROJECT_ID}/databases/(default)/documents`;
  const deleteWrites = [];
  const counts = {};

  console.log(`\nScanning Firestore transactional collections in '${PROJECT_ID}'...`);
  for (const col of TRANSACTIONAL_COLLECTIONS) {
    const names = await listAllDocNames(col, token);
    counts[col] = names.length;
    names.forEach((name) => deleteWrites.push({ delete: name }));
  }

  // Also release any assigned service batteries without removing the stock pool
  const sbUrl = `https://firestore.googleapis.com/v1/${basePath}/service_batteries?pageSize=300`;
  const sbRes = await httpRequest(sbUrl, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sbUpdates = [];
  if (sbRes.statusCode === 200) {
    const sbJson = JSON.parse(sbRes.data);
    const nowIso = new Date().toISOString();
    (sbJson.documents || []).forEach((doc) => {
      const f = doc.fields || {};
      const st = f.status && f.status.stringValue ? f.status.stringValue : 'AVAILABLE';
      if (st === 'ASSIGNED' || (f.current_ticket_no && f.current_ticket_no.stringValue)) {
        const isBlk = !!(f.is_blocked && f.is_blocked.booleanValue);
        sbUpdates.push({
          update: {
            name: doc.name,
            fields: Object.assign({}, f, {
              status: { stringValue: isBlk ? 'BLOCKED' : 'AVAILABLE' },
              current_ticket_no: { stringValue: '' },
              current_customer_name: { stringValue: '' },
              current_mobile: { stringValue: '' },
              assigned_date: { stringValue: '' },
              updated_at: { stringValue: nowIso }
            })
          }
        });
      }
    });
  }

  console.log('Documents scheduled for cleanup:', counts);
  console.log('Total documents to delete:', deleteWrites.length);
  if (sbUpdates.length > 0) {
    console.log('Service batteries to unassign back to pool:', sbUpdates.length);
  }

  if (DRY_RUN) {
    console.log('\n[--dry-run] Skipping Firestore mutations.');
    process.exit(0);
  }

  // Execute deletions and service battery resets
  await commitWrites(deleteWrites.concat(sbUpdates), token);

  // Reset config sequence counters to 1001 while preserving company info & prefixes
  const cfgUrl = `https://firestore.googleapis.com/v1/${basePath}/config/app_settings`;
  const cfgRes = await httpRequest(cfgUrl, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (cfgRes.statusCode === 200) {
    const cfgDoc = JSON.parse(cfgRes.data);
    const nextFields = Object.assign({}, cfgDoc.fields || {}, {
      TICKET_SEQ: { integerValue: '1001' },
      CLAIM_SEQ: { integerValue: '1001' },
      RETURN_CHALLAN_SEQ: { integerValue: '1001' },
      COMPANY_CHALLAN_SEQ: { integerValue: '1001' },
      DISPATCH_SEQ: { integerValue: '1001' },
      updated_at: { stringValue: new Date().toISOString() }
    });
    await commitWrites([{
      update: {
        name: `${basePath}/config/app_settings`,
        fields: nextFields
      }
    }], token);
    console.log('Reset sequence counters in config/app_settings to 1001.');
  }

  // Verify zero remaining transactional documents
  const afterCounts = {};
  for (const col of TRANSACTIONAL_COLLECTIONS) {
    const names = await listAllDocNames(col, token);
    afterCounts[col] = names.length;
  }
  console.log('Post-cleanup verified counts:', afterCounts);
  console.log('\nFirestore clean reset complete!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nReset ERROR:', err);
  process.exit(1);
});
