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
for(const key of ['struct LinhFace','LinhCoordinator','LongPressGesture','TapGesture'])
 assert.ok(face.includes(key),'Missing native Linh-only UI marker: '+key);
for(const bad of ['TextField(', 'Form {', 'TabView {', 'List {', 'NavigationStack'])
 assert.ok(!face.includes(bad),'Native UI must not contain '+bad);
for(const key of ['SCContentSharingPicker.shared','picker.present()','SCStream(','addStreamOutput',
                     'VNRecognizeTextRequest','VNImageRequestHandler','CMSampleBufferGetImageBuffer',
                     'stopCapture()','capturesAudio = false'])
 assert.ok(session.includes(key),'Missing safe native observation code: '+key);
assert.ok(plist.includes('<string>screen-capture</string>'));
assert.ok(project.includes('18.0'),'Single app must install on iOS 18');
assert.ok(session.includes('@available(iOS 27.0, *)'),'Modern backend only on iOS 27');
const coordinator=read('./ios/LinhCompanion/Sources/LinhCoordinator.swift');
const replayPicker=read('./ios/LinhCompanion/Sources/ReplayKitPicker.swift');
const broadcast=read('./ios/LinhCompanion/BroadcastExtension/SampleHandler.swift');
const extInfo=read('./ios/LinhCompanion/BroadcastExtension/Info.plist');
const shared=read('./ios/LinhCompanion/Sources/LinhSharedStore.swift');
for(const marker of ['#available(iOS 27.0, *)','modernSession().handleTap()','usesReplayKit'])
 assert.ok(coordinator.includes(marker),'Auto-select runtime backend missing: '+marker);
assert.ok(face.includes('ReplayKitPicker()'),'iOS 18 must expose official broadcast control');
for(const marker of ['RPSystemBroadcastPickerView','preferredExtension','showsMicrophoneButton = false'])
 assert.ok(replayPicker.includes(marker),'Official ReplayKit picker missing: '+marker);
for(const marker of ['RPBroadcastSampleHandler','processSampleBuffer(','CMSampleBufferGetImageBuffer',
                      'VNRecognizeTextRequest','GameReasoner','LinhSharedStore.publish'])
 assert.ok(broadcast.includes(marker),'Extension must locally analyze authorized frames: '+marker);
assert.ok(extInfo.includes('com.apple.broadcast-services-upload'));
assert.ok(project.includes('LinhBroadcast')&&project.includes('embed: true'),
          'Broadcast extension must ship with host app');
assert.ok(project.includes('NSExtensionPointIdentifier: com.apple.broadcast-services-upload'),
          'XcodeGen generates Info.plist: extension point must be in project.yml');
assert.ok(project.includes('UIBackgroundModes: [screen-capture]'),
          'XcodeGen must preserve system capture background mode');
assert.ok((project.match(/com\\.apple\\.security\\.application-groups:/g)||[]).length === 2,
          'App Group must be declared for BOTH signed targets in XcodeGen');
assert.ok(broadcast.includes('guard LinhSharedStore.hasSharedContainer') &&
          shared.includes('containerURL('),
          'ReplayKit must stop if host/extension cannot share an App Group');
assert.ok(shared.includes('group.ai.linh.companion'),'Both iOS paths must share bounded evidence');
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
