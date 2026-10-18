import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const face=read('./ios/LinhCompanion/Sources/LinhApp.swift');
const session=read('./ios/LinhCompanion/Sources/LinhSession.swift');
const math=read('./ios/LinhCompanion/Sources/GameReasoner.swift');
const insight=read('./ios/LinhCompanion/Sources/GameInsight.swift');
const evidence=read('./ios/LinhCompanion/Sources/GameEvidenceLedger.swift');
const tests=read('./ios/LinhCompanion/Tests/InsightTests.swift');
const plist=read('./ios/LinhCompanion/Sources/Info.plist');
const project=read('./ios/LinhCompanion/project.yml');
for(const key of ['struct LinhFace','LinhSession','LongPressGesture','TapGesture'])
 assert.ok(face.includes(key),'Missing native Linh-only UI marker: '+key);
for(const bad of ['TextField(', 'Form {', 'TabView {', 'List {', 'NavigationStack'])
 assert.ok(!face.includes(bad),'Native UI must not contain '+bad);
for(const key of ['SCContentSharingPicker.shared','picker.present()','SCStream(','addStreamOutput',
                     'VNRecognizeTextRequest','VNImageRequestHandler','CMSampleBufferGetImageBuffer',
                     'stopCapture()','capturesAudio = false'])
 assert.ok(session.includes(key),'Missing safe native observation code: '+key);
assert.ok(plist.includes('<string>screen-capture</string>'));
assert.ok(project.includes('27.0'));
for(const key of ['currentStream === stream','currentGeneration','generation incoming: Int',
                   'CMSampleBufferIsValid','CMSampleBufferGetSampleAttachmentsArray',
                   'SCFrameStatus(rawValue: rawStatus) == .complete','endSession()']) {
 assert.ok(session.includes(key),'Screen sharing safety gate missing: '+key);
}
assert.ok(!session.includes('URLSession')&&!session.includes('GEMINI_API_KEY'),
          'No network/AI service in local native prototype');
assert.ok(evidence.includes('GameEvidenceSnapshot') && evidence.includes('UserDefaults'),
          'Must persist minimal evidence on device');
assert.ok(!evidence.includes('screenshotData')&&!evidence.includes('rawOCR'),
          'Never archive screenshot or OCR text');
assert.ok(math.includes('candidateDamage') && math.includes('damageHits >= 2'),
          'Require stable damage across frames');
assert.ok(math.includes('topicHits >= 2'),
          'Require stable mechanic signals across frames');
assert.ok(math.includes('lastDamage')&&math.includes('inspect('),
          'Missing numeric experiment observations');
for(const token of ['case suggestion','case calculation','case question',
                   'minGap: TimeInterval = 75','repeatGap: TimeInterval = 300'])
 assert.ok(insight.includes(token),'Missing concise insight restriction: '+token);
assert.ok(session.includes('message.sound = nil')&&session.includes('policy.shouldPresent('),
          'Alerts must be quiet and frequency limited');
assert.ok(!session.includes('AVSpeechSynthesizer')&&!session.includes('voice.speak('),
          'Do not speak long explanations while playing');
assert.ok(face.includes('session.latestInsight')&&face.includes('lineLimit(3)'),
          'Only one brief insight near Linh instead of live subtitle');
assert.ok(tests.includes('CheckLinhInsights'),'Missing executable Swift tests');
console.log('PASS: iOS prototype static architecture and privacy assertions (NOT an Xcode build)');
