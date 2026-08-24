# External Reference Audit: Renhuai123/ziwei-doushu

## Snapshot

- Repository: `https://github.com/Renhuai123/ziwei-doushu`
- Inspected commit: `88194a404242bfe5c6d5cc512e4117e3e245cdd5`
- License: MIT for repository code; no source file from the repository is bundled in this skill at this snapshot.
- Evidence role: named external implementation source. It may become a production calculation profile after adapter tests; it does not need APK-native approval, but must retain its own provenance and validation boundary.

## What The Repository Actually Implements

The public `lib/ziwei/algorithm.ts` integrates `iztro` for chart generation and `lunar-javascript` for Gregorian/lunar conversion. It is not a Ziwei Xingyu compatibility implementation, but it is a materially more complete product baseline: standard chart generation, structured palace data, city input, UI, classics/knowledge content and a large published sample corpus.

At the inspected commit, the checkout contains no unit-test or integration-test files. The published 518,400-sample dataset is still valuable as a community-profile corpus and coverage source. It should be validated against the upstream profile's own input semantics, not forced to match Ziwei Xingyu.

## Adopted Ideas

1. **Explicit random-event default**: its share-form code treats longitude 120 as a product default. This skill adopts the useful input-design idea but isolates it behind `profile=random-event`; natal charts continue to require an explicit or verified longitude.
2. **Structured palace relationships**: its palace model stores opposite-palace and empty-palace data so later text logic does not reverse-parse prose. This skill adopts the architectural idea as a stricter `relations` block derived from APK-native palace nodes, without importing its school-specific borrowing interpretation.
3. **Reference-corpus mindset**: large external samples can become a differential corpus tagged `external-reference`. Differences are investigation leads, never automatic patches.

## Not Yet Integrated

- `iztro` and `lunar-javascript` calls: now allowed under an explicit `ziwei-doushu-community` adapter, but not yet wired into the current CLI.
- Four-transform, brightness, palace, and star tables: they should enter through the community adapter rather than overwrite the native-profile tables in place.
- `patterns.ts`, classics, compatibility, and interpretation prose: these belong to `ziwei-natal` or a separate knowledge layer, not the chart engine.
- The approximate city-longitude table: useful for UI suggestions, but its one-decimal city centroids are not precise birth coordinates and are not inserted into the verified place table.
- Late-zi date rollover and simplified true-solar branch logic: these are school/product assumptions and conflict with the requirement to reproduce the APP mode-2 calendar chain.

## Safe Reuse Rule

Future reuse from this repository requires all four conditions:

1. Preserve the upstream MIT notice for copied code.
2. Record the exact commit and source file.
3. Mark fields with the community calculation profile and validate them against that profile's own tests/corpus; APK confirmation is optional comparison evidence, not a promotion gate.
4. Keep interpretation knowledge outside `ziwei-chart` unless it is purely structural; using the project as a calculation source does not import its Ni Haixia interpretation defaults.
