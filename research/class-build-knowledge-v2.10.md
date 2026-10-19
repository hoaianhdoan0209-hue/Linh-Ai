# Socrates 2.10 — class → skill → specialization → equipment relationship graph

Research and build: **2026-10-19**. This is a source-scoped knowledge index, **not 39 complete class trees and not measured DPS**.

## Coverage

- **39 class candidate names** inherited from the roster (10 basic, 25 combined, 4 standalone) with original provenance/conflict grades; class counts are not certification that every class remains playable in each region.
- **5 ChillyRoom class detail profiles** (Voidfarer, DreadKnight, Dark Ranger, Astral Mage, Necromancer), containing **34 named active/passive skills**. All other class trees remain incomplete.
- **15 named Specialization and patch-fix relationships**, including **8 detailed Shield Blitz/Aegis options**, Ranger's Scattershot–Exacting, three Astreon Smartcast specs, two Nyxen Yellow Crucible specs and one Pyroknight hotfix.
- **2 developer-described specialization combinations** (Concuss + Skyfall; Proficiency + Blinkstrike) for Shield Blitz as documented in Nov 2024. These **may require rechecking in current SS9 Codex**.
- **8 max Awakening-tier Class Concordance references** published at SS9 transition, kept separate from equip rank and total DPS.
- **25 source-labelled item/skill/Fatebound interactions** remain maintained by `ss9-evidence-graph.js`; the linked class graph retrieves the SS9/hotfix subset and excludes community and pre-SS9 background by default.

## User-facing usage

| User question | Expected Socrates behavior |
| --- | --- |
| `Build Artillerist dùng kỹ năng và trang bị nào?` | Lists three SS9 developer-described Artillerist links: Bomb Voyage!/Bombadier stack timing, Cloudburst DoT and Karmic cokerize prerequisite for Adhesive Gunpowder; **no invented DPS** |
| `Các specialization Shield Blitz của Aegis?` | Lists eight names, their dated effects and the Nov 2024 reference; does not claim current SS9 ranks |
| `Shield Blitz + Skyfall + Concuss?` | Describes the developer demonstration: leap and chance to stun; cannot deduce a global multiplier |
| `Build Necromancer có active/passive nào?` | Displays four active, three passive, official class page and asks for equipped skills |
| `Amaranthine Starsigil Momentum qua Smartcast?` | Reports that the specific Astreon specialization was fixed in the SS9 9.21 hotfix, without inventing the modifier |
| `Artillerist dùng Excantation: Iridescence?` | Blocks cross-class extrapolation; the cited Iridescence relationship belongs to Astral Mage |
| `Build Druid mạnh nhất?` | States this project lacks Druid's verified full skill tree and asks for skill screen/equipment rather than hallucinating |
| `Cây kỹ năng 39 class đã đầy đủ?` | Reports explicit coverage counts and that *zero* class trees have been fully validated for SS9 |

## Sources

1. [ChillyRoom official class directory](https://prequel.chillyroom.com/et/class), and [class/1](https://prequel.chillyroom.com/et/class/1) to [class/5](https://prequel.chillyroom.com/et/class/5): partial profiles, active/passive names and limited mechanic explanations.
2. [Skill Specializations developer preview, 2024-11-07](https://prequel.chillyroom.com/et/article/base/133): eight Shield Blitz choices (Proficiency, Concuss, Warleader, Redoubt, Battlemaster, Blinkstrike, Skyfall, Temerity), combined options and their effects. **Historical examples**: not proof of current SS9 rank values.
3. [Nyxen + Ranger specialization SS8, 2026-06-28](https://prequel.chillyroom.com/et/article/base/304): Scattershot–Exacting adjusts projectile type and fragment probability. SS8 source, **verify SS9**.
4. [SS9 Season Transition, 2026-09-15](https://prequel.chillyroom.com/et/article/base/344): named class concordances, set/item/skill changes, 5 Legendary tiers. Values are dated **max tiers only** when indicated.
5. [SS9 Three Kingdoms hotfix, through 2026-09-24](https://prequel.chillyroom.com/et/article/base/358): Smartcast Astreon Effulgence/Momentum/Noesis, Nyxen Ardor/Undulation, Pyroknight Ferrokinesis. Fix notes **do not supply** full specialization effect multipliers.
6. [ChillyRoom Artillerist/Wildwalker SS5](https://prequel.chillyroom.com/et/article/base/239): build concept only, deliberately not imported as SS9 DPS.

The user's earlier [article /base/347](https://prequel.chillyroom.com/et/article/base/347) still could not be extracted reliably; **no record is silently attributed to it**.

## Engineering

`class-build-knowledge.js` ships as small same-origin offline JS. Its source is byte-identically copied to `gateway/class-build-knowledge.cjs` and both use UMD dependency resolution so the same file runs in Node and the PWA. `gateway/game-context.mjs` retrieves only the matched class profile, related specialization rows, named gear effects, source dates and restrictive caveats; no extra personal gameplay data is gathered. `test-class-build-knowledge.cjs` and `test-ai-grounding.mjs` assert the exact scope, cross-class rejection, source link and no-DPS status. CI bundles the source in GitHub Pages offline cache.

**Known gaps:** no complete SS9 active/passive trees for all 39 names; no full specialization levels, Legendary 1–5 roll charts, Sacred Soul/Eidolon complete effects, screenshots benchmark, or controlled battle logs. CI verifies deterministic logic only. Private Render gateway does not auto-deploy: manually update it after Web release.

## Real-game validation gate

Obtain player-approved screenshots of skill panels with all active/passive icons, chosen specs (names, rank), equipped gear details (including Legendary tier), Fatestones/Fatebounds and Sacred Soul/Eidolon for **one selected class at a time**; compare with actual in-game Codex. Confirm every graph edge before recommending a build and do not extrapolate boss DPS from patch notes.
