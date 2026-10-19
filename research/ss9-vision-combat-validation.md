# SS9 evidence research and real-screenshot benchmark protocol

Research date: **2026-10-19**. This is an intake/validation plan, **not a completed computer-vision benchmark or game-certified DPS formula**.

## Source precedence
1. Live **SS9 Codex of Equipment, skills and Fatestones**, read from player screenshots with player confirmation; equipment tier and currently equipped state still require separate confirmation.
2. [ChillyRoom SS8→SS9 transition notice (2026-09-15)](https://prequel.chillyroom.com/et/article/base/344): specific class/skill/Legendary/Fatebound adjustments. It says that most gear values changed with five Legendary tiers and refers players to the *in-game* Codex. Patch figures are dated and rank-specific, not current-game DPS.
3. [ChillyRoom SS9 hotfix chronology](https://prequel.chillyroom.com/et/article/base/358): trigger/cooldown/Smartcast fixes, some reports specific to 9.18–9.24; corrections must be reconciled by date.
4. [ChillyRoom SS5 Artillerist/Wildwalker](https://prequel.chillyroom.com/et/article/base/239) and [Skill Specializations](https://prequel.chillyroom.com/et/article/base/133): official *conceptual* build graph, not validated SS9 balance values.
5. [Wiki.gg Fatebound Nodes](https://soulknightprequel.wiki.gg/wiki/Fatebound_Nodes): rich historical names / old 2–3-piece effects. Many numbers predate the SS9 equipment overhaul and **must not become live SS9 defaults**.
6. [Community SS9 Celesturgic examples from 2026-10-02](https://www.reddit.com/r/SoulKnightPrequel/comments/1ww0her/extra_skill_points_quick_tutorial_101_ss9/): current screenshots and claim mapping skill types to equipment slots, **unverified community observations**.

The exact user-supplied [October 16 patch URL](https://prequel.chillyroom.com/et/article/base/369) could not be retrieved directly on 2026-10-19. Do not invent newer figures or claim the 2026-09-15 Karmic 360% snapshot overrides later 2026 changes. The existing older assistant knowledge may mention 480%; until the later article/live Codex is independently verified, mark this conflict as **unresolved**, not as a global multiplier.

The executable graph `ss9-evidence-graph.js` has **25 bounded source-linked interactions**, with scope, source date, event trigger and developer-described vs empirically validated status. No item record is a measured damage formula.

## Real screenshot benchmark: acquire only from authorized images

Do **not** copy third-party screenshots into our repository without rights or consent. Official and community links are references, not training permission. The user can explicitly contribute their own gameplay captures; strip player ID and account/private content before any shared benchmark upload. The main PWA must keep screenshot processing in-browser and never upload or persist original photos without explicit opt-in.

| Required screenshot from **current SS9** | Human annotation | Failure to catch |
| --- | --- | --- |
| Equipped character + class panel | class, specialization, level, season, timestamp | Treating a Codex preview as equipped |
| Skill screen + chosen Specializations | skill ID, rank, specialization list/levels, active/passive/support | Mistaking skill icon for activated skill |
| Codex Legendary details at each relevant tier | canonical item name, slot, tier 1–5, text, source | Extrapolating max-tier bonus to tier 1 |
| Fatestone/Fatebound presets | actual slot, linked node, count, Calamitous status | Applying old 2/3-piece wiki values as current |
| Forged and Celesturgic item details | affix name, roll, slot, quality, equip state | Combining two alternative items |
| Sacred Soul/Eidolon active build | ID, level, activation, effects | Calling unequipped spirits equipped |
| Two alternatives A/B (same item slot) | distinct build IDs, what changed, set counts | Merging A+B into one build |
| Combat video or before/after screenshots | target, enemy level, defense, duration, skill, tick timing, hit count, active buffs | Inferring actual DPS from a single floating number |

**Minimum acceptance for recognition:** 30 consented current-season images from at least three layout types and two language settings; train/dev/test split by capture session; separately score exact item names, correct UI panel, mechanic tier, equip state, set count and unknown/reject rate. Until this exists, **no accuracy claim**. Historic images from [ChillyRoom skill-specialization demo](https://prequel.chillyroom.com/et/article/base/133) or [old equipment Codex](https://prequel.chillyroom.com/et/article/base/135) can help plan regions of interest, but **cannot certify SS9 recognition**.

## Combat verification protocol

For each claimed relation record:
1. Select one skill, one specific target and difficulty, one build ID, one patch version and one skill rank. Note damage mitigation and resistances if available.
2. Record two conditions (A: prereq absent; B: present). Keep every other variable and the exact 20-second interval constant.
3. Repeat each condition at least three times, capturing full screen video or timestamps, actual hits, buff duration, crit status, projectiles, misses and target status.
4. Compute damage/s over the window and difference **only for these observations**, with ranges across replicates. Reject runs where target, skill rank, buff uptime or build changed outside the intended variable.
5. Distinguish a developer-described transition/fix from replicated telemetry. Do not automatically generalize to multi-target fights, different bosses or all skills. Do not claim causal effect if multiple variables differ.
6. For DoT compare discrete ticks and duration (for Nyax’s Embrace, transition describes 0.5s ticks over 4s); for Deadly Tempo record actual crit-to-Rage event intervals and skill consumption; for Bombadier count Ember consumption and 10s stack expiry.
7. If a developer patch number conflicts with in-game measurements, keep both with source/date and mark unresolved until repeated controlled testing.

## Immediate acceptance gates
- No old Fatebound/Legendary wiki number becomes an SS9 formula without current-season confirmation.
- No stacking addition/multiplication absent a confirmed combination rule.
- No image/OCR indication proves which of two builds is worn.
- No simulation automatically imports an official patch **percentage** as an observed hit-damage multiplier.
- User can ask for trigger, affected skill, rank, source date and next controlled test for any of the 25 graph edges.
- A full empirical damage model is **blocked** until real measured combat traces exist.

See `test-ss9-evidence-graph.cjs` for graph scope regressions. CI verifies behavior against fixed examples, not real-world image/telemetry fidelity.
