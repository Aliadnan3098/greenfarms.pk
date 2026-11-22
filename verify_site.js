const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname);
const htmlFiles = [
  'index.html',
  'butter-vs-cream.html',
  'heritage.html',
  'shop.html',
  'contact.html'
];

// Regex for emoji detection
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

let allPassed = true;

console.log('--- STARTING GREENFARMS SITE AUDIT ---');

htmlFiles.forEach(file => {
  const filePath = path.join(siteDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: ${file} does not exist!`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Check 1: Viewport meta tag
  const hasViewport = /<meta\s+name=["']viewport["']\s+content=["']width=device-width,\s*initial-scale=1\.0,\s*maximum-scale=1\.0["']/.test(content);
  if (!hasViewport) {
    console.warn(`WARN: ${file} does not have exact width=device-width, initial-scale=1.0, maximum-scale=1.0 viewport tag`);
  } else {
    console.log(`PASS: ${file} has correct viewport meta tag`);
  }

  // Check 2: Abril Fatface font
  const hasAbril = /Abril\+Fatface/.test(content);
  if (!hasAbril) {
    console.error(`FAIL: ${file} missing Abril Fatface Google Font link`);
    allPassed = false;
  } else {
    console.log(`PASS: ${file} includes Abril Fatface`);
  }

  // Check 3: Mobile drawer present
  const hasDrawer = /id=["']mobile-nav-drawer["']/.test(content);
  if (!hasDrawer) {
    console.error(`FAIL: ${file} missing #mobile-nav-drawer`);
    allPassed = false;
  } else {
    console.log(`PASS: ${file} has #mobile-nav-drawer`);
  }

  // Check 4: Mobile menu button present
  const hasMenuBtn = /class=["'][^"']*mobile-menu-btn[^"']*["']/.test(content);
  if (!hasMenuBtn) {
    console.error(`FAIL: ${file} missing .mobile-menu-btn`);
    allPassed = false;
  } else {
    console.log(`PASS: ${file} has .mobile-menu-btn`);
  }

  // Check 5: Emojis check
  const emojiMatch = content.match(emojiRegex);
  if (emojiMatch) {
    console.error(`FAIL: ${file} contains emoji: ${emojiMatch[0]}`);
    allPassed = false;
  } else {
    console.log(`PASS: ${file} contains 0 emojis`);
  }

  // Check 6: Check for 500g plastic jar references and PKR 1,500
  const mentions500g = /500g/i.test(content);
  const mentions1500 = /1,?500/.test(content);
  if (!mentions500g || !mentions1500) {
    console.warn(`WARN: ${file} might be missing 500g (found: ${mentions500g}) or PKR 1,500 (found: ${mentions1500})`);
  } else {
    console.log(`PASS: ${file} correctly references 500g jars and PKR 1,500`);
  }

  // Check 7: Image references exist on disk
  const imgRegex = /src=["']([^"']+\.(?:png|jpe?g|svg|ico))["']/gi;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const srcPath = match[1];
    if (srcPath.startsWith('http')) continue;
    const resolvedPath = path.join(siteDir, srcPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`FAIL: ${file} references missing asset: ${srcPath}`);
      allPassed = false;
    }
  }
});

// Check CSS
const cssPath = path.join(siteDir, 'css', 'main.css');
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, 'utf8');
  if (emojiRegex.test(css)) {
    console.error('FAIL: main.css contains emoji!');
    allPassed = false;
  } else {
    console.log('PASS: main.css contains 0 emojis');
  }

  const hasOverflowProtection = /overflow-x:\s*hidden/.test(css);
  if (hasOverflowProtection) {
    console.log('PASS: main.css contains overflow-x: hidden on html/body');
  } else {
    console.error('FAIL: main.css missing overflow-x: hidden');
    allPassed = false;
  }

  const hasMobileBreakpoint = /@media\s*\(max-width:\s*768px\)/.test(css);
  if (hasMobileBreakpoint) {
    console.log('PASS: main.css has @media (max-width: 768px) mobile rules');
  } else {
    console.error('FAIL: main.css missing mobile breakpoint');
    allPassed = false;
  }
}

// Check JS
const jsPath = path.join(siteDir, 'js', 'app.js');
if (fs.existsSync(jsPath)) {
  const js = fs.readFileSync(jsPath, 'utf8');
  if (emojiRegex.test(js)) {
    console.error('FAIL: app.js contains emoji!');
    allPassed = false;
  } else {
    console.log('PASS: app.js contains 0 emojis');
  }
  if (/initMobileMenu/.test(js)) {
    console.log('PASS: app.js contains initMobileMenu');
  } else {
    console.error('FAIL: app.js missing initMobileMenu');
    allPassed = false;
  }
}

console.log('--- AUDIT COMPLETE: ' + (allPassed ? 'ALL CHECKS PASSED SUCCESSFULLY' : 'SOME CHECKS FAILED') + ' ---');
process.exit(allPassed ? 0 : 1);
