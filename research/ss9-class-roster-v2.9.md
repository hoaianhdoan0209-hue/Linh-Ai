# Socrates SS9 class roster 2.9.0 — 2026-10-19

## What was imported

The user supplied 10 base, 25 combined and 3 standalone class entries and asked Socrates to learn the latest roster. We **preserve the 38 supplied names**, add **Nyxen** from the SS8 update (July 2026), and now index **39 class candidates: 10 basic + 25 combined + 4 direct**. This is a searchable working index, **not** a claim that all 39 entries, formulas, or tier strengths have been individually certified in the in-game SS9 Codex.

Executable: [`ss9-class-roster.js`](../ss9-class-roster.js) (Web/PWA) and byte-identical [`gateway/ss9-class-roster.cjs`](../gateway/ss9-class-roster.cjs) (private optional AI backend). Both are integrated into name search, chat answers, OCR name labeling, and the provider evidence packet.

## Corrections and conflicts

| Class | Supplied pairing | Best available finding | Trust handling |
|---|---|---|---|
| Necromancer | Pyromancer + Voidfarer | **Animancer + Voidfarer** | [ChillyRoom class detail #5](https://prequel.chillyroom.com/et/class/5), developer-authored; fix pairing |
| Paragon | Warrior + Lightbringer | **Aegis + Lightbringer** | [Pocket Gamer current 2026 class table](https://www.pocketgamer.com/soul-knight-prequel/tier-list/), secondary not official |
| Wildwalker | Thief + Herbalist | **Warrior + Herbalist** | [Historical Japanese class-combination index](https://w.atwiki.jp/soulknightprequel_jp/pages/17.html), community/older source; verify SS9 Codex |
| Stormwarden | Warrior + Tempest Mage | [Wiki.gg specific Stormwarden article](https://soulknightprequel.wiki.gg/wiki/Stormwarden) and [old class list](https://soulknightprequel.wiki.gg/wiki/Classes) say Aegis + Tempest Mage; a [2026 Pocket Gamer table](https://www.pocketgamer.com/soul-knight-prequel/tier-list/) lists Herbalist + Tempest Mage | **Sources conflict**, so pairing is deliberately displayed as unresolved instead of showing a falsely definitive formula |
| Standalone count | Tempest Archer, Hellion, Astreon (3) | Add **Nyxen** introduced during SS8 | [SS8 announcement](https://prequel.chillyroom.com/et/article/base/313), public app-version history and [2026 class roundup](https://www.pocketgamer.com/soul-knight-prequel/tier-list/) corroborate |

Other notes: `Lightbinder` resolves as an alias of `Lightbringer`; `Pyroshot` as `Artillerist`; `Dread Knight` as `Dreadknight`. Alias does **not** create an extra class count. We do not carry forward exaggerated anecdotal damage such as “hàng ngàn tỷ” as a verified SS9 number. Historical wiki skill modifiers are not current SS9 DPS formulas.

## Evidence grades and limitations

- `developer-page`: class-combination official pages at [ChillyRoom /et/class/1..5](https://prequel.chillyroom.com/et/class).
- `developer-update`/`developer-hotfix`: explicit public season updates; this does **not** mean an in-game damage measurement.
- `secondary-current`: independent 2026 summary, potentially with errors.
- `legacy-correlated`/`community-historical`: older wiki references, enough for a search index but not seasonal rank/tier advice.
- `conflicting-sources`: do not guess.
- `user-provided`: class name or combination directly supplied by the user, not independently verified.
- Every roster record sets `verifiedEffect:false`, so tier-list ordering, rotation DPS, and damage multipliers are **not** inferred from category or class style.

## Acceptance

1. `test-ss9-class-roster.cjs` confirms 10/25/4, 39 unique names, aliases and corrected/missing cases.
2. `test-ai-grounding.mjs` confirms gateway and browser rosters are byte-identical and that the model receives source-scoped class candidates, not unconditional class truths.
3. `test-site.mjs` ensures roster is bundled and offline cached, and that chat and OCR refer to it.
4. CI success means functions pass mocks and deployment succeeds, **not** that the class database covers all current in-game SS9 skill trees.
5. Need actual SS9 class selection/Codex captures (with consent), plus primary developer sources for uncertain classes, before calling the roster fully verified.

The supplied URL [ChillyRoom /et/article/base/347](https://prequel.chillyroom.com/et/article/base/347) remains unextractable in this environment. Do not attribute any of these rows to that article.
