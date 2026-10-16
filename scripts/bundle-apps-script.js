#!/usr/bin/env node

/**
 * scripts/bundle-apps-script.js
 * 
 * Bundles the modular Google Apps Script source files into:
 * 1. A standalone all-in-one Code_All_In_One.gs for quick copy-pasting
 * 2. A clean dist/apps-script-bundle/ folder ready for import or clasp
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'apps-script');
const distDir = path.join(__dirname, '..', 'dist', 'apps-script-bundle');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Order of execution in GAS
const gsOrder = [
  'Utils.gs',
  'AuthService.gs',
  'Config.gs',
  'Database.gs',
  'WarrantyService.gs',
  'BatteryTestService.gs',
  'TicketService.gs',
  'ClaimService.gs',
  'ChallanService.gs',
  'DispatchService.gs',
  'ReplacementService.gs',
  'DriveService.gs',
  'ReportService.gs',
  'AuditService.gs',
  'Setup.gs',
  'Code.gs'
];

console.log('📦 Bundling Google Apps Script production assets...');

let bundledGs = `/**\n * Battery Warranty & Claim Management System - Production Full Bundle\n * Generated on: ${new Date().toISOString()}\n * Master Spreadsheet ID: 1Vp8DLiLVwT6j_zyvKWHYKIpFrk-Je9Vfq2KtyUKXK08\n */\n\n`;

for (const file of gsOrder) {
  const filePath = path.join(srcDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    bundledGs += `// ═════════════════════════════════════════════════════════════════\n`;
    bundledGs += `// FILE: ${file}\n`;
    bundledGs += `// ═════════════════════════════════════════════════════════════════\n\n`;
    bundledGs += content + '\n\n';
    console.log(`  ✓ Added ${file}`);
  }
}

// Write the all-in-one file
const bundleFile = path.join(distDir, 'Code_All_In_One.gs');
fs.writeFileSync(bundleFile, bundledGs, 'utf8');
console.log(`\n✨ Unified Script created: dist/apps-script-bundle/Code_All_In_One.gs (${(bundledGs.length / 1024).toFixed(1)} KB)`);

// Copy all HTML files
const htmlFiles = ['Index.html', 'app.html', 'styles.html'];
for (const file of htmlFiles) {
  const src = path.join(srcDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
  }
}

// Copy templates
const templatesDir = path.join(distDir, 'templates');
if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

const tmplFiles = ['claim-form.html', 'company-challan.html', 'return-challan.html', 'intake-slip.html'];
for (const file of tmplFiles) {
  const src = path.join(srcDir, 'templates', file);
  const dest = path.join(templatesDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied templates/${file}`);
  }
}

console.log(`\n🎉 Distribution assets ready in: dist/apps-script-bundle/\n`);
