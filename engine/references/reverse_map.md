# Reverse Map

本文件记录 native 函数到 TypeScript 模块的复刻映射。未通过测试的条目不得标记为 implemented。

| Native / Java Evidence | Current Understanding | TypeScript Target | Status |
|---|---|---|---|
| APP mode-2 body + ARM64 golden invocation | 构造 `2|YYYY|M|D|hourCode|30|30|longitude|-8|gender|0|0|0` | `src/engine/normalize.ts` | implemented-parity |
| mode-2 native dispatch | native Gregorian chart branch requires 13 body fields and gender `1/2` | `src/engine/normalize.ts` | implemented-parity |
| mode-2 dispatch -> `0x124b80` | fields map into native calendar invocation with hourCode/30/30, not user clock minute/second | `src/engine/native-calendar.ts` | implemented-parity |
| `0x187270` | Gregorian date to JD-like floating day | `src/engine/calendar.ts` | implemented-static-port |
| `0x187090` | JD-like floating day to Gregorian date structure | `src/engine/calendar.ts` | implemented-static-port |
| `0x14e0a6..0x14e29c` | repeated signed mod10/mod12 residue primitive used by 0x14dbd0 cyclic fields | `src/engine/native-cyclic.ts` | implemented-static-port |
| `0x14bed0 -> 0x14dbd0` | caller-consumed lookup slice: cache refill, month boundary, outputs 0x74/0x68/0x1c/0x6a plus cyclic bytes 0x78..0x7b, then map into calendar core 0xa0..0xac and 0xc8..0xd4 | `src/engine/native-calendar-lookup.ts` | implemented-static-port |
| `0x14d2aa..0x14d69d` | builds the 25-entry double vector at output 0x38 and matching int vector at output 0x50 from context records, 0x185800 and 0x1861d0 | `src/engine/native-calendar-event-vectors.ts` | implemented-static-port |
| `0x14c02d..0x14c4a5` | 0x14bed0 context offsets 0x10/0x18/0x50/0x68/0x80/0x98 feed record/cache bounds and lookup output bytes 0x1c/0x68/0x69/0x6a/0x6b | `src/engine/native-calendar-context.ts` | implemented-argument-map |
| `0x1828c2..0x182ad0` | 0x182880 context cache refill entry aliases rdi to rbx, then resets/copied context table begin/end fields 0x10/0x18, 0x50/0x58, 0x68/0x70, 0x80/0x88 and marker 0x98 | `src/engine/native-calendar-context.ts` | implemented-argument-map |
| `0x182940..0x182b31` | 0x182880 early refill loops fill 25 records at ctx+0x10, 15 dword boundaries at ctx+0x50, then derive 14 paired ctx+0x80/0x68 entries from adjacent boundary differences | `src/engine/native-calendar-context.ts` | implemented-argument-map |
| `0x183000`, `0x14bcb0`, `0x183110` | C++ vector append helpers used by 0x182880; append one 16-byte record or dword and grow capacity to max(size + 1, oldCapacity * 2) when full | `src/engine/native-vector.ts` | implemented-static-port |
| `0x183230` | C++ vector range assignment helper used by 0x181490 mode 0; replaces the destination 16-byte record vector with a source range and grows capacity to max(sourceCount, oldCapacity * 2) when needed | `src/engine/native-vector.ts` | implemented-static-port |
| `0x182b33..0x182fd7` | 0x182880 tail index correction control flow: seed range guard, 3-slot candidate loop, normal ctx+0x68 rewrite, fallback ctx+0x98 marker and sentinel normalization | `src/engine/native-calendar-context.ts` | implemented-argument-map |
| `0x181490..0x1822c4` | context sample helper used by 0x182880; copies ctx+0x0 vector, mode 0 replaces the local copy with ctx+0x8 through 0x183230, mode 0/1 take separate numeric paths, cold paths consult ctx+0xa0..0xb8 packed/string buffers; dependency summary records numeric/libm/native helper call counts | `src/engine/native-calendar-context.ts` | implemented-argument-map |
| `0x181a8b..0x181bde` | neutral binary128 context-sample interpolation with validated alternating base/step records, half-open native range, 0x20 pair stride, preserved two-floor operation order, the 0x19b004 correction, and the shared final conversion reached through the 0x181bde jump to 0x181a0f; excludes mode 0/1, secondary cold path, calendar, and chart parity | `src/engine/native-context-sample.ts` | implemented-static-port |
| `0x181490` mode 0 hot path | raw-target `+0x256859`, record/fixed-upper dispatch, interpolation or prepared-input `0x1817db` numeric path, provisional/iterated correction branches, and shared int finalization; secondary cold path remains named but unported | `src/engine/native-context-sample.ts`, `src/engine/native-context-mode-zero.ts` | implemented-static-port |
| `0x181490` mode 1 hot path | raw-target `+0x256859`, mode offset `14`, shared interpolation dispatch, prepared-input `0x181614` numeric path, `[1800,84600]` provisional/iterated window, and shared int finalization | `src/engine/native-context-sample.ts`, `src/engine/native-context-mode-one.ts` | implemented-static-port |
| `0x195a00`, `0x196270`, `0x195b60`, `0x195be0`, `0x195c60`, `0x195130`, `0x1951f0`, `0x194c80`, `0x196240`, `0x195cd0`, `0x1952a0`, `0x19a380`, `0x19a410` | binary128 representation, double/int/uint64 conversions, compare/add/subtract/multiply/divide, plus exact binary128 `floorl` and `fmodl` used by 0x181490 numeric paths; this is numeric substrate, not full 0x181490 parity | `src/engine/native-numeric.ts` | implemented-static-port |
| `0x19a420`, `0x19a430` | `cosl` / `sinl` medium argument-reduction paths with Bionic ld128 operation order; signed-int32 quotient range only; 5205 mode-2 reaches the still-missing large `rem_pio2l` path | `src/engine/native-trig.ts` | implemented-static-port |
| `0x19a440`, `0x19a450` | finite `atan2l` plus the direct `abs(x)<pi/4` `tanl` kernel consumed by `0x184970`; unconsumed tan argument reduction remains rejected | `src/engine/native-inverse-trig.ts` | implemented-static-port |
| `0x183380 -> 0x183830` | finite binary128 piecewise transform plus wrapper used at four `0x181490` call sites; raw 21-row table at `0x84510` is bit-preserved and SHA-256 checked | `src/engine/native-transform.ts` | implemented-static-port |
| `0x183d40(x, 0, 0, precision)` | table 0 / variant 0 series transform for observed precision `8` (`0x186f9b`), `10` (`0x1863cc`), `50` (`0x184ca3`), and `-1` (`0x18671c`); six orders over bit-preserved APK table `0x84cd0` | `src/engine/native-series-transform.ts` | implemented-static-port |
| `0x1838a0` | ten-term ordered binary128 sine correction with 34 bit-preserved APK constants and final `/100/(648000/pi)` normalization | `src/engine/native-periodic-correction.ts` | implemented-static-port |
| `0x185800` | angle series used directly by `0x14dbd0`; precision `-1` table-0 series plus `0x1838a0`, eccentricity cosine correction, and final `+pi` | `src/engine/native-angle-series.ts` | implemented-static-port |
| `0x184970` | angle/time correction used by `0x14dbd0@0x14df07`; precision `50` table series, node/obliquity/eccentricity/nutation terms, `sinl/cosl/tanl/atan2l/fmodl`, native wrapping, and final division by `2*pi` | `src/engine/native-angle-transform.ts` | implemented-static-port |
| `0x1842b0(x, 0, precision)` | observed precision `3/20/-1` full-table mode-one series paths; three APK table segments contain `2652/894/12` binary128 values in six-value amplitude/phase records | `src/engine/native-mode-one-series.ts` | implemented-static-port |
| `0x185160` | twelve-term ordered sine denominator used only by `0x1859c0` | `src/engine/native-mode-one-denominator.ts` | implemented-static-port |
| `0x1859c0` | three-pass mode-one correction with mode-one precision `3/20/-1`, mode-zero precision `3/10/60`, and one corrected denominator reused by the final two passes | `src/engine/native-mode-one-correction.ts` | implemented-static-port |
| `0x1861d0` | two-pass binary128 correction used by `0x181490` mode 0 and four calendar-side callers; combines precision `10/-1` series, `0x1838a0`, periodic denominator and cosine residual terms | `src/engine/native-iterated-correction.ts` | implemented-static-port |
| `0x186e40` | straight-line mode 0 binary128 transform with 13 APK double constants, two `cosl`, one `sinl`, and fixed `0x183d40(x,0,0,8)` call | `src/engine/native-mode-transform.ts` | implemented-static-port |
| `0x1868e0` | mode 1 numeric transform with 31 APK double constants, `cosl` x6, `sinl` x3, fixed `0x1842b0(x,0,20)`, and residual update | `src/engine/native-mode-one-transform.ts` | implemented-static-port |
| `0x14dbd0` fixture-range path | mode adjustment, true-solar date, cyclic fields, lookup overwrite, 0xd8..0x183 event boundaries and conditional 0xa0/0xa4 decrement; cross-cache 0x14e7bf rollover remains rejected | `src/engine/native-calendar-core-prefix.ts` | implemented-static-port |
| `0x124b80` | two mode-0 calendar-core calls around reflected-date construction, then original input date overwrite into final 0x50..0x77 | `src/engine/native-calendar-wrapper.ts` | implemented-static-port |
| `0x182dc8` fallback marker read | reads `monthBoundaries[marker + 1]` through `0x4(base, marker, 4)` before comparing against record `marker * 2`; fixes the 1998 leap marker at index 7 | `src/engine/native-context-refill.ts` | implemented-static-port |
| `0x11b600..0x11ba2a` | maps calendar offsets 0xa0..0xd4 and boundary 0xd8/0x128 through APK stem, branch, lunar month/day tables into named strings and normalized month | `src/engine/native-calendar-named.ts` | implemented-static-port |
| `0x1553f2..0x1558d2` | chart orchestrator prefix: lunar-year polarity, gender label, and signed month/hour formulas for 命宫 at context 0x98 and 身宫 at context 0xb0 | `src/engine/native-palace-anchors.ts` | implemented-static-port |
| `0x156fb0` + `0x1753a0` | creates 12 palace nodes and assigns palace stems from the lunar-year stem, the 0x19f020 tiger-first branch index, five native year-stem groups, and mod10 | `src/engine/native-palace-stems.ts` | implemented-static-port |
| `0x157500..0x1583c9` | assigns the twelve palace names at signed offsets 0 through -11 from the 命宫 branch through helper 0x176260 | `src/engine/native-palace-names.ts` | implemented-static-port |
| `0x1586a0..0x159038` + `0x155a6e..0x155b99` | maps 命宫 stem/branch through native `甲乙/丙丁/戊己/庚辛/壬癸` groups, branch groups, wrap, and key reorder; x86_64 bytes plus the transcribed 乙巳 case lock 火六局 | `src/engine/native-five-elements-bureau.ts` | implemented-parity |
| `0x159170..0x1597c7` | assigns 顺/逆 and twelve `%d~%d` major-limit ranges from the bureau number and gender/polarity label | `src/engine/native-major-limits.ts` | implemented-static-port |
| `0x1597d0..0x159f27` | maps lunar-year branch to the age-one minor-limit anchor, then appends ages 1..72 forward for male or reverse for female | `src/engine/native-minor-limits.ts` | implemented-static-port |
| `0x15a100..0x15a63f`, `0x15a6b0..0x15abef` | maps 命宫支 to 命主 at context 0xe0 and lunar-year branch to 身主 at context 0xf8 through native branch groups | `src/engine/native-life-body-lords.ts` | implemented-static-port |
| `0x168a38..0x168c5f` | compares chart `+0x128`; `阳男` or `阴女` uses forward 长生/博士 shifts, while `阴男` or `阳女` takes the reverse path | `src/engine/native-remaining-stars.ts` | implemented-static-port |
| `0x155f35..0x155f7d`, `0x15ace0..0x15ae77` | computes the 紫微 anchor from lunar day and bureau, then mirrors its branch index into the 天府 anchor | `src/engine/native-major-star-anchors.ts` | implemented-static-port |
| `0x14bed0` remaining outputs | strings and day-selected side outputs not consumed by canonical APP JSON fields | future boundary fixtures | out-of-scope |
| `0x155370..0x16ccf2`, `0x16d020..0x172a0b` | chart orchestration and JSON serialization fields | `src/engine/chart-engine.ts` | implemented-parity |

Status vocabulary:
- `implemented-protocol`: protocol boundary is implemented, not full chart parity.
- `implemented-argument-map`: native call arguments are mapped and tested, but the callee algorithm is still missing.
- `implemented-static-port`: TypeScript mirrors static native disassembly and has unit tests, but has not been promoted to full chart parity.
- `missing`: no TypeScript implementation yet.
- `implemented-parity`: TypeScript output passed native/golden parity tests.
- `out-of-scope`: native side output exists but is not part of the canonical chart contract.
