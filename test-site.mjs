import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("./index.html",import.meta.url),"utf8");
for(const marker of ['id="mascot"','id="gameList"','id="effectsList"','id="runOptimize"','id="saveObservation"','id="exportData"','id="importData"','id="photoInput"','localStorage','serviceWorker']) {
  assert.ok(html.includes(marker),"Thiếu thành phần: "+marker);
}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length>=1,"Không tìm thấy JavaScript ứng dụng");
for(const match of scripts) new Function(match[1]);
const manifest=JSON.parse(readFileSync(new URL("./manifest.webmanifest",import.meta.url),"utf8"));
assert.equal(manifest.start_url,"./");
assert.equal(manifest.display,"standalone");
console.log("Linh Web: valid HTML scripts, required offline/analysis controls, PWA manifest.");
