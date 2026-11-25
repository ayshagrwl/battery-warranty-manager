/**
 * build-github-pages.js
 * Compiles the single-page application into root index.html for direct GitHub Pages hosting.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appsScriptDir = path.join(rootDir, 'apps-script');

console.log('Building standalone GitHub Pages application...');

const indexTemplate = fs.readFileSync(path.join(appsScriptDir, 'Index.html'), 'utf8');
const styles = fs.readFileSync(path.join(appsScriptDir, 'styles.html'), 'utf8');
const app = fs.readFileSync(path.join(appsScriptDir, 'app.html'), 'utf8');

let html = indexTemplate;
html = html.replace(/<\?=\s*companyName\s*\?>/g, 'Amaron Battery Hub & Service Care');
html = html.replace(/<\?!=\s*include\('styles'\);\s*\?>/g, styles);
html = html.replace(/<\?!=\s*include\('app'\);\s*\?>/g, app);

const targetFile = path.join(rootDir, 'index.html');
fs.writeFileSync(targetFile, html, 'utf8');

const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const firebaseTargetFile = path.join(publicDir, 'index.html');
fs.writeFileSync(firebaseTargetFile, html, 'utf8');

console.log(`✓ Generated: ${targetFile} (${Math.round(html.length / 1024)} KB)`);
console.log(`✓ Generated: ${firebaseTargetFile} (Firebase Hosting ready)`);
console.log('✓ Pure GitHub Pages & Firebase Hosting standalone application ready.');
