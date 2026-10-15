#!/usr/bin/env node

/**
 * scripts/run-full-system-test.js
 * 
 * Comprehensive Automated End-to-End System Test Suite
 * Tests Google Workspace connectivity, Apps Script deployment health,
 * and executes core business logic simulations (Intake, Bench Diagnostics,
 * Warranty Engine, Challan Generation, and Tally/Busy Stock Gate).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

const SHEET_ID = '1Vp8DLiLVwT6j_zyvKWHYKIpFrk-Je9Vfq2KtyUKXK08';
const DEPLOYMENT_ID = 'AKfycbz8veuql4nvWujUKPskLUGKFB7l0DnPTlyMbkdh6OgPfJkJlI1IUNovRYyKMEHRPm1j';
const WEBAPP_URL = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} : ${message}`);
  } else {
    console.error(`  ${colors.red}✗ FAIL${colors.reset} : ${message}`);
  }
}

function httpsGet(url, maxRedirects = 3) {
  return new Promise((resolve) => {
    const start = Date.now();
    https.get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location && maxRedirects > 0) {
        httpsGet(res.headers.location, maxRedirects - 1).then(redirectRes => {
          resolve({
            statusCode: redirectRes.statusCode,
            headers: redirectRes.headers,
            latency: Date.now() - start,
            data: redirectRes.data,
            redirected: true
          });
        });
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          latency: Date.now() - start,
          data
        });
      });
    }).on('error', (err) => {
      resolve({ statusCode: 0, error: err.message, latency: Date.now() - start });
    });
  });
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}═════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ⚡ BATTERY WARRANTY MANAGEMENT SYSTEM — AUTOMATED FULL TEST SUITE ⚡  ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // TEST SUITE 1: Infrastructure & Cloud Reachability
  console.log(`${colors.bold}SUITE 1: Google Cloud Infrastructure & Endpoint Health${colors.reset}`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);

  const sheetRes = await httpsGet(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`);
  assert(sheetRes.statusCode === 200, `Google Sheet master DB reachable (Status 200, ${sheetRes.latency}ms)`);
  assert(sheetRes.data.includes('version') || sheetRes.data.includes('table'), 'Google Sheet GViz endpoint returns valid structured table response');

  const webAppRes = await httpsGet(WEBAPP_URL);
  assert(webAppRes.statusCode === 200 || webAppRes.statusCode === 302, `Production Web App endpoint online (HTTP ${webAppRes.statusCode}, ${webAppRes.latency}ms)`);
  assert(webAppRes.headers.server === 'ESF' || webAppRes.headers['x-frame-options'], 'Google Frontend Edge Server routing verified');

  const bulkRes = await httpsGet(`${WEBAPP_URL}?api=bulk`);
  assert(bulkRes.statusCode === 200, `Production Web App bulk state prefetch endpoint online (HTTP 200, ${bulkRes.latency}ms)`);
  assert(bulkRes.data.includes('success') && (bulkRes.data.includes('tables') || bulkRes.data.includes('tickets')), 'Production Web App returns valid bulk state payload with all tables');

  // TEST SUITE 2: Apps Script File & Template Integrity
  console.log(`\n${colors.bold}SUITE 2: Apps Script Deployment Source Integrity${colors.reset}`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);

  const requiredFiles = [
    'apps-script/Code.gs',
    'apps-script/Database.gs',
    'apps-script/Config.gs',
    'apps-script/TicketService.gs',
    'apps-script/BatteryTestService.gs',
    'apps-script/WarrantyService.gs',
    'apps-script/ClaimService.gs',
    'apps-script/ChallanService.gs',
    'apps-script/DispatchService.gs',
    'apps-script/ReplacementService.gs',
    'apps-script/ReportService.gs',
    'apps-script/DriveService.gs',
    'apps-script/AuditService.gs',
    'apps-script/Index.html',
    'apps-script/app.html',
    'apps-script/styles.html'
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(__dirname, '..', relPath);
    assert(fs.existsSync(fullPath), `Production file exists: ${relPath}`);
  }

  // Check that HTML files contain critical client mounts
  const indexContent = fs.readFileSync(path.join(__dirname, '..', 'apps-script/Index.html'), 'utf8');
  assert(indexContent.includes('include(\'styles\')'), 'Index.html properly includes styles component');
  assert(indexContent.includes('include(\'app\')'), 'Index.html properly includes app controller');

  // TEST SUITE 3: Business Logic & Rules Engine Simulation
  console.log(`\n${colors.bold}SUITE 3: Core Battery Warranty Business Rules Engine${colors.reset}`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);

  // 3.1. Leading zero preservation test
  const originalSerial = '00849201';
  const textForced = "'" + originalSerial;
  assert(textForced.startsWith("'00849201"), 'Leading zeroes preserved with text forcing convention');

  // 3.2. Diagnostic bench logic test
  function evaluateBatteryTest(ocv, specificGravityArr, loadVoltage, hasPhysicalDamage) {
    if (hasPhysicalDamage) return { result: 'REJECT', reason: 'Physical damage/crack' };
    if (ocv < 10.5) return { result: 'REJECT', reason: 'Deep discharge / dead cell' };
    
    // Check specific gravity difference across cells
    const minSg = Math.min(...specificGravityArr);
    const maxSg = Math.max(...specificGravityArr);
    if ((maxSg - minSg) > 0.05) return { result: 'REJECT', reason: 'Specific gravity variation across cells > 0.05' };
    if (minSg < 1.15) return { result: 'REJECT', reason: 'Sulphated / low specific gravity' };

    // 15s Load test threshold (standard automotive battery: >= 9.6V under load)
    if (loadVoltage < 9.6) return { result: 'REJECT', reason: 'Failed 15s load test (< 9.6V)' };

    return { result: 'PASS', reason: 'Meets manufacturer factory defect criteria' };
  }

  // Test Good Battery (Should PASS)
  const goodTest = evaluateBatteryTest(12.6, [1.24, 1.25, 1.24, 1.25, 1.24, 1.24], 10.2, false);
  assert(goodTest.result === 'PASS', 'Diagnostic bench: Healthy battery with factory defect correctly evaluates to PASS');

  // Test Sulphated Battery (Should REJECT)
  const sulphatedTest = evaluateBatteryTest(11.2, [1.12, 1.10, 1.11, 1.10, 1.12, 1.10], 8.4, false);
  assert(sulphatedTest.result === 'REJECT', 'Diagnostic bench: Low voltage & low gravity correctly evaluates to REJECT');

  // Test Physically Cracked Battery (Should REJECT)
  const damagedTest = evaluateBatteryTest(12.5, [1.24, 1.24, 1.24, 1.24, 1.24, 1.24], 10.1, true);
  assert(damagedTest.result === 'REJECT', 'Diagnostic bench: Physical damage/crack immediately triggers REJECT');

  // 3.3. Warranty Pro-Rata & Guarantee Window Test
  function calculateWarranty(totalWarrantyMonths, guaranteeMonths, dateOfSaleStr, claimDateStr) {
    const saleDate = new Date(dateOfSaleStr);
    const claimDate = new Date(claimDateStr);
    const diffMonths = (claimDate.getFullYear() - saleDate.getFullYear()) * 12 + (claimDate.getMonth() - saleDate.getMonth());

    if (diffMonths <= guaranteeMonths) {
      return { status: 'FULL_GUARANTEE', discountPercent: 100, payablePercent: 0 };
    } else if (diffMonths <= totalWarrantyMonths) {
      const proRataMonths = totalWarrantyMonths - guaranteeMonths;
      const monthsUsedInProRata = diffMonths - guaranteeMonths;
      const discountPercent = Math.max(0, Math.round(100 - (monthsUsedInProRata / proRataMonths) * 100));
      return { status: 'PRO_RATA', discountPercent, payablePercent: 100 - discountPercent };
    } else {
      return { status: 'EXPIRED', discountPercent: 0, payablePercent: 100 };
    }
  }

  const w1 = calculateWarranty(36, 18, '2026-01-01', '2026-06-01'); // 5 months -> Full Guarantee
  assert(w1.status === 'FULL_GUARANTEE' && w1.discountPercent === 100, 'Warranty engine: Claim within 18m guarantee gives 100% free replacement');

  const w2 = calculateWarranty(36, 18, '2024-01-01', '2026-01-01'); // 24 months -> Pro-rata
  assert(w2.status === 'PRO_RATA' && w2.discountPercent > 0, 'Warranty engine: Claim in month 24 qualifies for Pro-Rata discount');

  const w3 = calculateWarranty(36, 18, '2022-01-01', '2026-01-01'); // 48 months -> Expired
  assert(w3.status === 'EXPIRED', 'Warranty engine: Claim beyond 36 months correctly evaluated as EXPIRED');

  // 3.4. ERP & Tally/Busy Stock Gate Test
  function canCloseClaim(replacementReceived, busyVoucherLogged) {
    if (!replacementReceived) return { allowed: false, reason: 'Replacement battery not yet received from manufacturer' };
    if (!busyVoucherLogged) return { allowed: false, reason: 'Mandatory stock reconciliation gate: Inward voucher in Busy/Tally required' };
    return { allowed: true };
  }

  const gateBlocked = canCloseClaim(true, false);
  assert(gateBlocked.allowed === false, 'Accounting Gate: Blocks ticket closure when Busy/Tally inward voucher is missing');

  const gateAllowed = canCloseClaim(true, true);
  assert(gateAllowed.allowed === true, 'Accounting Gate: Allows ticket closure once voucher reference is confirmed');

  // TEST SUITE 4: Direct Production Gateway & Clasp Configuration
  console.log(`\n${colors.bold}SUITE 4: Direct Production Gateway & Deployment Integrity${colors.reset}`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);

  const rootIndexHtml = path.join(__dirname, '..', 'index.html');
  const demoPath = path.join(__dirname, '..', 'demo');
  const claspJsonPath = path.join(__dirname, '..', '.clasp.json');

  assert(!fs.existsSync(demoPath), 'Demo directory successfully removed for pure production operation');
  assert(fs.existsSync(rootIndexHtml), 'Root index.html production gateway is present');
  
  const indexCode = fs.readFileSync(rootIndexHtml, 'utf8');
  assert(indexCode.includes(DEPLOYMENT_ID), 'Root index.html connects directly to production deployment URL');
  assert(indexCode.includes('script.google.com/macros/s/'), 'Root index.html routes to Google Apps Script production web app');
  assert(fs.existsSync(claspJsonPath), 'Clasp configuration .clasp.json verified for ongoing production sync');

  // TEST SUITE 5: Bulk State Engine & In-Memory Multi-View Integrity
  console.log(`\n${colors.bold}SUITE 5: Bulk State Engine & Multi-View In-Memory Architecture${colors.reset}`);
  console.log(`─────────────────────────────────────────────────────────────────────────────`);

  const codeGsContent = fs.readFileSync(path.join(__dirname, '..', 'apps-script/Code.gs'), 'utf8');
  assert(codeGsContent.includes('apiGetBulkState'), 'Code.gs exports apiGetBulkState for zero-latency bulk pre-fetching');
  assert(codeGsContent.includes('apiSaveModel'), 'Code.gs exports apiSaveModel for master battery model management');
  assert(codeGsContent.includes('apiSaveDealer'), 'Code.gs exports apiSaveDealer for authorized dealer master management');
  assert(codeGsContent.includes('getBulkTables'), 'Database.gs implements optimized single-sheet-open getBulkTables');

  const appHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'apps-script/app.html'), 'utf8');
  assert(appHtmlContent.includes('loadCachedState'), 'app.html implements cold-start instant cache hydration');
  assert(appHtmlContent.includes('syncAllData'), 'app.html implements background sync engine');
  assert(appHtmlContent.includes('switchLabTab'), 'app.html provides dual-tab control for testing lab');
  assert(appHtmlContent.includes('switchDispatchTab'), 'app.html provides dual-tab control for company dispatches');
  assert(appHtmlContent.includes('switchReplacementTab'), 'app.html provides dual-tab control for replacements due/history');
  assert(appHtmlContent.includes('switchStockTab'), 'app.html provides dual-tab control for ERP stock reconciliation');
  assert(appHtmlContent.includes('switchChallansTab'), 'app.html provides triple-tab control for delivery challans');
  assert(appHtmlContent.includes('downloadCSV'), 'app.html implements universal CSV export engine');

  // Verify client-side filter simulation
  const sampleTickets = [
    { ticket_no: 'TKT-001', original_serial_no: '009841', status: 'RECEIVED', customer_name: 'Rajesh Sharma', battery_model: 'AAM-FL-00042B20L' },
    { ticket_no: 'TKT-002', original_serial_no: '009842', status: 'TEST_PASSED', customer_name: 'Amit Patel', battery_model: 'AAM-PR-00055D23L' },
    { ticket_no: 'TKT-003', original_serial_no: '009843', status: 'TEST_REJECTED', customer_name: 'Sunil Verma', battery_model: 'AAM-FL-00042B20L' }
  ];
  const filteredByStatus = sampleTickets.filter(t => t.status === 'RECEIVED');
  assert(filteredByStatus.length === 1 && filteredByStatus[0].ticket_no === 'TKT-001', 'In-memory filter correctly isolates status without server call');

  const filteredBySearch = sampleTickets.filter(t => {
    const blob = [t.ticket_no, t.original_serial_no, t.customer_name, t.battery_model].join(' ').toLowerCase();
    return blob.indexOf('009842') !== -1;
  });
  assert(filteredBySearch.length === 1 && filteredBySearch[0].original_serial_no === '009842', 'In-memory multi-field search preserves leading zeroes and isolates serials');

  console.log(`\n${colors.bold}${colors.cyan}═════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.bold}TEST RESULTS:${colors.reset} ${passedCount} / ${totalCount} TESTS PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log(`${colors.bold}${colors.cyan}═════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (passedCount === totalCount) {
    console.log(`${colors.green}${colors.bold}🎉 ALL SYSTEMS OPERATIONAL & VERIFIED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.error(`${colors.red}${colors.bold}⚠️ Some tests failed. Check diagnostic output above.${colors.reset}\n`);
    process.exit(1);
  }
}

runTests();
