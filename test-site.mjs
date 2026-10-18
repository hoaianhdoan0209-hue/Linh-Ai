import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui = readFileSync(new URL('./index.html',import.meta.url),'utf8');
const legacy = readFileSync(new URL('./legacy-dashboard.html',import.meta.url),'utf8');

assert.ok(ui.includes('id="linh"'),'Missing the single visible Linh character');
assert.equal((ui.match(/<button\b/g)||[]).length,1,'Home must have one visible interaction');
assert.ok(!/<(?:input|select|textarea|nav|section|h1|h2|h3)\b/i.test(ui),
  'Home must not expose settings, explanations, forms or menus');
assert.ok(ui.includes('Safari PWA cannot stream the screen'),
  'Do not promise web screen capture');
assert.ok(!/getDisplayMedia\(/.test(ui),'Web must not pretend to capture other apps');
assert.ok(ui.includes('serviceWorker'),'PWA service worker must be registered');

for(const marker of [
'id="mascot"','id="gameList"','id="effectsList"','id="runOptimize"',
'id="saveObservation"','id="exportData"','id="importData"',
'id="photoInput"','id="scanPhoto"','id="applyVisionFacts"',
'id="visionQuestions"','id="askLinhBtn"','vision-engine.js','./ocr/tesseract.min.js',
'localStorage'])assert.ok(legacy.includes(marker),'Legacy analysis missing: '+marker);

for(const page of [ui,legacy]){
 const scripts=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.ok(scripts.length>=1,'Missing scripts');
 for(const s of scripts)if(s[1].trim())new Function(s[1]);
}
assert.ok(!legacy.includes('<script src="./cloud-ui.js">'),
  'Paid AI integration must remain disabled');
const manifest=JSON.parse(readFileSync(new URL('./manifest.webmanifest',import.meta.url),'utf8'));
assert.equal(manifest.start_url,'./');
assert.equal(manifest.display,'standalone');
console.log('PASS: Linh-only UI, preserved analysis engine, no fake screen capture, PWA');
