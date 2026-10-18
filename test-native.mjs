import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const face=read('./ios/LinhCompanion/Sources/LinhApp.swift');
const session=read('./ios/LinhCompanion/Sources/LinhSession.swift');
const math=read('./ios/LinhCompanion/Sources/GameReasoner.swift');
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
assert.ok(!session.includes('URLSession')&&!session.includes('GEMINI_API_KEY'),
          'No network/AI service in local native prototype');
assert.ok(math.includes('lastDamage')&&math.includes('inspect('),
          'Missing numeric experiment observations');
console.log('PASS: iOS prototype static architecture and privacy assertions (NOT an Xcode build)');
