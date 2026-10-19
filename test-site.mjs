import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui = readFileSync(new URL('./index.html',import.meta.url),'utf8');
const legacy = readFileSync(new URL('./legacy-dashboard.html',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('./manifest.webmanifest',import.meta.url),'utf8'));
assert.equal(manifest.name,'Socrates','PWA installed title must use the renamed sage');
assert.equal(manifest.short_name,'Socrates');
assert.ok(ui.includes('<title>Socrates'), 'Web browser title must use the renamed sage');
assert.ok(ui.includes('SOCRATES'),'Sage name must be shown next to the character');
assert.ok(ui.includes('aria-label="Nhắn cho Socrates"'),
 'Web chat must show the renamed sage');
assert.ok(!ui.includes('Nói với Linh'),'Outdated public assistant name must not appear');


assert.ok(ui.includes('id="linh"'),'Missing the single visible Linh character');
assert.equal((ui.match(/id="linh"/g)||[]).length,1,'Home must have one Linh character');
assert.ok(ui.includes('id="chatDock" class="chat-dock" autocomplete="off"'),
  'Conversation composer must always be visible without tapping Linh');
assert.ok(ui.includes('id="chatMessage"'),'Typing to Linh must be possible on all browsers');
assert.ok(ui.includes('id="mic" type="button" hidden'),'Optional mic requires explicit consent');
assert.ok(ui.includes('id="imageInput" type="file"'),
  'User must be able to choose an image directly from the main Linh UI');
assert.ok(ui.includes('id="approveImage"') && ui.includes('id="dismissImage"'),
  'OCR memory must require explicit user approval and support skipping');
assert.ok(ui.includes('id="eraseImages"'),
  'User must be able to delete confirmed photo memory');
assert.ok(ui.includes('autonomousThought()') && ui.includes('document.hidden||scanning'),
  'Proactive speech must be limited to visible pages and stop during OCR');
assert.ok(ui.includes('web-image-memory.js') && ui.includes('vision-engine.js') &&
          ui.includes('web-game-brain.js') && ui.includes('web-game-experiments.js'),
  'Image memory and OCR interpretation modules are required');
assert.ok(ui.includes("const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition"),
 'Voice input must be feature detected, not promised');
assert.ok(ui.includes('chat.respond(message,dialogue,legacy)'),'Home must answer user questions, not only rotate canned quotes');
assert.ok(ui.includes('experiments.record(measurements,message)'),
 'The main chat must accept explicit game measurements');
assert.ok(ui.includes('gameBrain.answer(message,savedImages,gameNotes,legacy,measurements)'),
 'Game arithmetic and confirmed OCR memory must be available from the same chat');
assert.ok(ui.includes('id="learnStatus"'),'Home must show learned-data summary');
assert.ok(ui.includes("gameBrain.nextStudyPrompt(savedImages,gameNotes)"),
 'Learning must affect grounded proactive questions');
assert.ok(ui.includes("if(set(gameBrain.KEY,{version:1,items:studied.notes}))"),
 'Explicit saved game notes must only be considered learned after local storage succeeds');
assert.ok(!/<(?:select|textarea|nav|section|h1|h2|h3)\b/i.test(ui),
  'Home must not expose settings, explanations, forms or menus');
assert.ok(ui.includes('Safari PWA cannot stream the screen'),
  'Do not promise web screen capture');
assert.ok(!/getDisplayMedia\(/.test(ui),'Web must not pretend to capture other apps');
assert.ok(ui.includes('enhancedOCRCanvas(file)'), 'Low-evidence image needs optional in-memory OCR retry');
assert.ok(ui.includes('secondCanvas.width=0;secondCanvas.height=0;'),
 'Temporary enhanced screenshots must be discarded');
assert.ok(ui.includes('const contextual=photoRequest?null:coach.reply(message,lastPatch?[]:savedImages);'),
 'Upload instructions must not be overridden by a stale build');
assert.ok(ui.includes('build-systems.js?v=2.1.0'), 'Load SS9 prerequisite engine');
assert.ok(ui.includes('rotation-lab.js?v=2.1.0') && ui.includes('rotation-commands.js?v=2.1.0'),
 'Ship discrete event rotation modules in the page');
assert.ok(ui.includes('const rotationReply=rotations.answer(message);'),
 'Main chat must pass explicit player experiment text to the simulator');
assert.ok(ui.includes('buildSystems.assess(message,{context:buildContext})'), 'Game chat uses SS9 dependency reasoning');
assert.ok(ui.includes('buildContext=buildSystems.merge(buildContext,nextBuild)'),
 'Explicit build clues should accumulate in conversation only');
assert.ok(ui.includes("buildContext=buildSystems.inspect(raw,{source:'image'});"), 'OCR extracts dependency context');
assert.ok(ui.includes('thinking-guard.js?v=2.1.0'), 'Thinking guard loaded before prompt strategy');
assert.ok(ui.includes('thinkingGuard.observe(thinkingState,message,{source:'), 'Thinking guard observes only relevant messages');
assert.ok(ui.includes("thinkingState=thinkingGuard.observePhoto(thinkingState,raw);"),
 'Two recent screenshots must be tracked as separate hypotheses');
assert.ok(ui.includes('if(nextBuild&&!alternativeTurn)buildContext=buildSystems.merge(buildContext,nextBuild);'),
 'An A/B hypothetical comparison must not become the active equipment');
assert.ok(ui.includes("if(clear){lastPatch=null;buildContext=null;thinkingState=thinkingGuard.empty();}"),
 'Clear dialogue must remove session-only hypotheses');
assert.ok(ui.includes('prompt-strategy.js?v=2.1.0'),
 'Prompt planning must be loaded from same-origin JavaScript');
assert.ok(ui.includes('promptStrategy.answer(message,{context:buildContext})'),
 'Game chat must use context-aware prompt planning before generic fallback');
assert.ok(ui.includes('serviceWorker'),'PWA service worker must be registered');
assert.ok(ui.includes('web-companion.js'),'Local Web assistant engine must load');
assert.ok(ui.includes('web-dialogue.js'),'Local two-way dialogue engine must load');
assert.ok(ui.includes('aria-live="polite"'),'Linh hints must be screen-reader accessible');
assert.ok(ui.includes('thought.textContent=text'),'Never use untrusted local game data as HTML');
assert.ok(ui.includes('said.textContent='),'User text must never be injected as HTML');
assert.ok(ui.includes('brain.LEGACY_KEY'),'Home must read legacy memory read-only');
assert.ok(!ui.includes('localStorage.setItem(brain.LEGACY_KEY'),
 'Web home must not overwrite existing game profiles');
const offlineRaw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
const offline=offlineRaw.replace(/\?v=[0-9.]+/g,'');
const assetsVersion=ui.match(/game-coach\.js\?v=([0-9.]+)/)?.[1];
assert.ok(assetsVersion,'Game coach must have a deployed asset version');
assert.ok(offlineRaw.includes("'./game-coach.js?v="+assetsVersion+"'"),
 'PWA must precache the same coach version as the page');
assert.ok(offlineRaw.includes("const CACHE='linh-site-"+assetsVersion+"'"),
 'Updating the assistant must rotate PWA cache version');
assert.ok(offlineRaw.includes("'./rotation-lab.js?v="+assetsVersion+"'") &&
 offlineRaw.includes("'./rotation-commands.js?v="+assetsVersion+"'"),
 'PWA must cache the event-driven rotation tools');
assert.ok(offlineRaw.includes("'./thinking-guard.js?v="+assetsVersion+"'"),
 'Thinking guard must be bundled for offline PWA');
assert.ok(offlineRaw.includes("'./prompt-strategy.js?v="+assetsVersion+"'"),
 'Offline planner version must match the active game assistant');
assert.ok(offlineRaw.includes("'./build-systems.js?v="+assetsVersion+"'"),
 'PWA cache must include SS9 engine at the same version');
assert.ok(offline.includes("'./web-game-experiments.js'"),
 'Service worker must cache the offline measurement ledger');
assert.ok(offline.includes("'./web-game-brain.js'"),
 'Service worker must cache the offline calculator');
assert.ok(offline.includes("'./web-image-memory.js'") &&
          offline.includes("'./vision-engine.js'"),
 'Offline service worker must cache the image learning modules');
assert.ok(offline.includes("'./web-dialogue.js'"),
 'Service worker must cache the new offline thought engine');

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
assert.equal(manifest.start_url,'./');
assert.equal(manifest.display,'standalone');
console.log('PASS: Linh-only UI, preserved analysis engine, no fake screen capture, PWA');
