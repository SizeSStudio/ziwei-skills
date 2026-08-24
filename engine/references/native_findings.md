# Native Findings

本文件只记录 APK/native 证据，不记录网上排盘规则。地址基于 x86_64 `libziweixingyu.so`，除非另有说明。

> 2026-07-19 校正：ARM64 动态黄金运行确认公历出生盘使用 13 字段 mode 2，而不是下文早期静态调查的 12 字段 mode 3。正式实现与结论以 `app_reverse_contract.md`、`reverse_map.md` 和本文后部黄金校正为准；mode-3 段只保留为调查历史。

## Entry Chain

- JNI: `Java_com_ziweixingyu_ziweixingyu_tools_getzwp`
- C++ wrapper: `zwds::get2(std::string)` at `0x105980`
- `get2` 是薄包装：初始化大结构后调用 `0x11c460`。
- `0x11c460` 是输入分派：处理 `$$`、按 `#` 分两段、校验 `checks`、再按 `|` 拆分 body。
- `0x11dc4f` 附近存在 mode-3 分支，需要 body 拆分结果为 12 个字段；它不是已验证的公历出生盘入口。

## Historical Mode 3 Field Evidence (Superseded For Gregorian Natal)

字段顺序来自 Java `x1/V0.java` 与 native `0x11dc4f` 附近：

```text
3|YYYY|M|D|hourCode|30|30|longitude|-8|sexFlag|0|0
```

Java 层构造：

```text
S0.g.B("checks", "") + "#3|" + x1 + "|" + (y1 + 1) + "|" + (z1 + 1) + "|" + hourCode + "|30|30|120.000|-8|sexFlag|0|0"
```

`hourCode` 由 `A1` 映射：

| A1 | hourCode |
|---:|---:|
| 1 | 2 |
| 2 | 4 |
| 3 | 6 |
| 4 | 8 |
| 5 | 10 |
| 6 | 12 |
| 7 | 14 |
| 8 | 16 |
| 9 | 18 |
| 10 | 20 |
| 11 | 22 |
| default | 0 |

Java mode 3 的 sexFlag:

| Java condition | sexFlag |
|---|---:|
| default / `I1 != 2` | 1 |
| `I1 == 2` | 0 |

native 中另一路标签分支比较字段 `"1"` 与 `"2"`，分别写入 `"男"` 与 `"女"`。这与 Java mode 3 的 `1/0` 不能直接合并，需样本验证。

## Core Date/Calendar Chain

- `0x124b80` 是 mode 3 调用的日期结构包装器。
- `0x124b80` 先调用 `0x14dbd0`，再经 `0x187270` / `0x187090` 调整日期结构，再次调用 `0x14dbd0`。
- `0x187270` 是 Gregorian 日期到浮点日数/JD-like 值的转换。
- `0x187090` 是浮点日数/JD-like 值到日期结构的逆转换。
- `0x14dbd0` 填充 0x184 字节日期/干支/月令结构，是出生盘复刻的核心之一。
- `0x14bed0` 负责 lunar/calendar 查表和缓存范围补齐，依赖 `0x105b10` 初始化的大结构。

## Historical Mode 3 Native Calendar Invocation

2026-07-09 已将 `0x11dc4f -> 0x124b80 -> 0x14dbd0` 的 mode 3 参数边界固化为 `src/engine/native-calendar.ts`。这是 native calendar invocation map，不是 `0x14dbd0` 的完整历法 port。

已确认字段流：

| APP mode 3 field | Native parse evidence | `0x124b80` / `0x14dbd0` role |
|---|---|---|
| `YYYY` | `0x11dc67..0x11dc7e` | `edx` year |
| `M` | `0x11dc81..0x11dc98` | `ecx` month |
| `D` | `0x11dc9b..0x11dcb2` | `r8d` day |
| `hourCode` | `0x11dcb5..0x11dcc7` | `xmm0` hour. For `1998-02-20 09:40` this is `10`, not the user clock hour `9`. |
| fixed field `30` | `0x11dccf..0x11dce1` | `xmm1` minute. Mode 3 sends fixed `30`, not user clock minute `40`. |
| fixed field `30` | `0x11dce9..0x11dcfc` | `xmm2` second. |
| longitude | `0x11dd04..0x11dd17` | `xmm3` longitude. |
| timezone field `-8` | `0x11dd26..0x11dd39` | Parsed before wrapper call; exact downstream register/field role still unresolved. |

Wrapper evidence:

- `0x11ddc0..0x11ddee` calls `0x124b80` for mode 3 chart construction.
- `0x124c18..0x124c58` calls `0x14dbd0` first with `r9d = 0`.
- `0x124c74..0x124cc7` compares date structures through `0x187270` / `0x187090`.
- `0x124d20..0x124d52` calls `0x14dbd0` again after date adjustment.
- `0x124d57..0x124d62` copies the second `0x14dbd0` result to the caller output.
- `0x124d67..0x124da4` then overwrites output offsets `0x50`, `0x54`, `0x58`, `0x60`, `0x68`, `0x70` with the original APP core input year/month/day/hourCode/minuteField/secondField. Therefore the final mode 3 output `0x50` date group is wrapper-adjusted, not simply the raw `0x14dbd0` internal working date.

## Date Conversion Static Port

2026-07-09 已静态移植 `0x187270` 与 `0x187090` 到 `src/engine/calendar.ts`。这是 pure date conversion，不代表 `0x14dbd0` 的历法、真太阳时、农历或四柱结构已完成。

`0x187270` 输入结构偏移：

| Offset | Type | Meaning |
|---:|---|---|
| `0x00` | int32 | year |
| `0x04` | int32 | month |
| `0x08` | int32 | day |
| `0x10` | double | hour |
| `0x18` | double | minute |
| `0x20` | double | second |

`0x187270` 公式证据：

```text
dayWithTime = day + (((second / 60 + minute) / 60 + hour) / 24)
yearForCorrection = month < 3 ? year - 1 : year
ordinalProbe = trunc(dayWithTime) + year * 372 + month * 31
gregorianCorrection = 0
if ordinalProbe >= 0x8fc1d:
  century = trunc(yearForCorrection / 100)
  gregorianCorrection = trunc(century / 4) - century + 2
formulaMonth = month < 3 ? (month | 12) : month
jd = floor(365.25 * (yearForCorrection + 4716))
   + floor(30.6001 * (formulaMonth + 1))
   + dayWithTime
   + gregorianCorrection
   - 1524.5
```

`0x187090` 公式证据：

```text
shifted = jd + 0.5
wholeDay = floor(shifted)
fraction = shifted - wholeDay
if wholeDay >= 0x231519:
  century = trunc((wholeDay - 1867216.25) / 36524.25)
  wholeDay = wholeDay + century - trunc(century / 4) + 1
b = wholeDay + 1524
c = floor((b - 122.1) / 365.25)
d = floor(365.25 * c)
e = floor((b - d) / 30.601)
day = b - d - floor(30.601 * e)
month = e < 14 ? e - 1 : e - 13
year = c + (e >= 14 ? 1 : 0) - 4716
hour = floor(fraction * 24)
minute = floor((fraction * 24 - hour) * 60)
second = remaining fraction * 60
```

Unit anchors:

| Date | JD-like value |
|---|---:|
| `2000-01-01 12:00:00` | `2451545.0` |
| `1998-02-20 09:40:30` | `2450864.903125` |
| `1582-10-04 00:00:00` | `2299159.5` |
| `1582-10-15 00:00:00` | `2299160.5` |

## `0x14dbd0` Field Map Extraction

2026-07-09 已给 `scripts/zwxy_reverse.py` 增加 Capstone-backed structure write extractor。它只抽取 native 指令对输出结构的写入偏移，供后续命名字段和移植算法使用；它不是 `0x14dbd0` 的 TypeScript port。

提取命令：

```bash
/Users/sizes-studio/Documents/Personal/apk-reverse/app-apk/.venv/bin/python \
  wiki/紫微/skills/ziwei-chart/scripts/zwxy_reverse.py writes \
  --so /Users/sizes-studio/Documents/Personal/apk-reverse/app-apk/unpacked/lib/x86_64/libziweixingyu.so \
  --start 0x14dbd0 --stop 0x14e9d6 --base rbx --json
```

边界证据：

- `rbx` 是 `0x14dbd0` 的输出结构基址。
- extractor 会跟踪简单 alias，例如 `r15 = rbx + 0x50`。
- `0x14dbd0` 在扫描范围内的第一个 `ret` 位于 `0x14e9d5`，所以提取 stop 使用 `0x14e9d6`。
- 当前 extractor 是 field-map 模式：同一 offset 多次写入时保留第一次写入，用来定位结构布局；它不是完整执行 trace。
- 加 `--trace` 时会保留重复写入。完整 `0x14dbd0` 范围目前抽到 76 次结构写入；例如 offset `0xa0` 会在 `0x14e0c5`、`0x14e46d`、`0x14e927` 三处写入。
- extractor 只收集 store-like `mov*` memory writes，不把 `nop/cmp/test` 等 memory operands 当结构写入。这个边界对 `0x14bed0` 尤其重要，因为 disassembly 中存在 `nop word ptr [...]`。

已抽取的首写入偏移：

| Offset / span | First-write evidence | Current reading |
|---|---|---|
| `0x00`, `0x10`, `0x20`, `0x30`, `0x40` | `0x14dc54`, `0x14dc5b`, `0x14dc73`, `0x14dc67`, `0x14dc6b` | 输入钟表日期结构拷贝，覆盖 byte span `0x00..0x4f`。已和 `0x187270` 的 `NativeDateTime` 前半部分对齐：year/month/day at `0x00/0x04/0x08`，hour/minute/second doubles at `0x10/0x18/0x20`。`0x30/0x40` 的额外拷贝字段仍待命名。 |
| `0x50`, `0x60`, `0x70`, `0x80`, `0x90` | `0x14dc8b`, `0x14dc8f`, `0x14dc93`, `0x14dc97`, `0x14dca2` | 经 `r15 = rbx + 0x50` alias 写入的第二套日期结构，byte span `0x50..0x9f`。初始从输入结构派生，后续会被 JD/时区/真太阳时相关分支覆盖；准确语义待完成 `0x14dbd0` 控制流移植后再命名。 |
| `0xa0`, `0xa4` | `0x14e0c5`, `0x14e0e7` | 一组 dword cyclic numeric fields。附近代码显示来自 floor 派生值的 mod 10 / mod 12 residue；暂不强命名为干支。 |
| `0xb0`, `0xb4` | `0x14e11b`, `0x14e145` | 第二组 mod 10 / mod 12 风格 dword fields，具体归属待和 `0x14bed0`、节气边界逻辑合并验证。 |
| `0xb8`, `0xbc` | `0x14e1a8`, `0x14e1ca` | 第三组 mod 10 / mod 12 风格 dword fields。 |
| `0xc0`, `0xc4` | `0x14e26e`, `0x14e29c` | 第四组 mod 10 / mod 12 风格 dword fields。 |
| `0xc8`, `0xcc`, `0xd0`, `0xd4` | `0x14e32f`, `0x14e33c`, `0x14e349`, `0x14e356` | `0x14bed0` lunar/calendar lookup 结果写回。`0xc8` 附近可见 `0x7c0 + local offset` 派生；`0xcc/0xd0/0xd4` 来自 local result bytes/words，准确字段名待解。 |
| `0xd8`, `0xe8`, `0xf8`, `0x108`, `0x118`, `0x128` | `0x14e4d3`, `0x14e4cb`, `0x14e4c3`, `0x14e4bc`, `0x14e497`, `0x14e4e4` | 一套 `0x187090` 派生日期结构加 dword tail，byte span `0xd8..0x12b`。 |
| `0x130`, `0x140`, `0x150`, `0x160`, `0x170`, `0x180` | `0x14e559`, `0x14e552`, `0x14e54a`, `0x14e543`, `0x14e51e`, `0x14e571` | 另一套 `0x187090` 派生日期结构加 dword tail，byte span `0x130..0x183`。 |

## `0x14dbd0` Cyclic Residue Primitive

2026-07-09 已将 `0x14dbd0` 反复出现的 signed mod10/mod12 residue primitive 移植到 `src/engine/native-cyclic.ts`。这只覆盖 native 取余算术，不代表 `0xa0..0xc4` 的最终字段语义已完成。

已确认指令模式：

| Output offsets | Store evidence | Native arithmetic |
|---|---|---|
| `0xa0`, `0xa4` first writes | `0x14e0a6..0x14e0e7` | seed 经 signed truncating remainder 分别取 mod 10 / mod 12。 |
| `0xb0`, `0xb4` | `0x14e0ed..0x14e145` | seed = prior value + `0x3938702`，再取 mod 10 / mod 12。 |
| `0xb8`, `0xbc` | `0x14e184..0x14e1ca` | another seed 经同一 mod 10 / mod 12 primitive。 |
| `0xc0`, `0xc4` | `0x14e24a..0x14e29c` | another seed 经同一 mod 10 / mod 12 primitive。 |

边界：

- TypeScript helper 使用 C/LLVM 风格 truncating remainder，负数保持负余数；这与“总是正数”的数学 modulo 不同。
- `0xa0` 与邻近字段存在后续覆盖：`0x14e46d` 会用 `pmovzxbd` 结果 16-byte 覆盖 `0xa0..0xac`，`0x14e927` 还可能 8-byte 条件修正 `0xa0..0xa7`。因此 `0xa0/0xa4` 的 first-write residue 不是最终字段结论。
- 这些 residue 很可能服务于干支/循环字段，但在和 `0x14bed0`、节气/月令边界、最终 JSON 字段对齐前，不在 runtime 中命名为干支。

## `0x14bed0` Consumed Return Slice

2026-07-09 已将 `0x14dbd0` 实际消费的 `0x14bed0` 返回结构片段固化到 `src/engine/native-calendar-lookup.ts`。这只覆盖 caller/callee layout contract，不代表 `0x14bed0` 的 lunar/calendar 查表算法已完成。

`0x14dbd0` 调用 `0x14bed0` 时使用局部输出结构：

```text
lea rdi, [rbp - 0x140]
call 0x14bed0
```

caller 读取与写回关系：

| `0x14bed0` output offset | `0x14bed0` write evidence | `0x14dbd0` read evidence | `0x14dbd0` output |
|---:|---|---|---:|
| `0x74` | `0x14c9ac` writes `dword ptr [rbx + 0x74]` | `0x14e324..0x14e32f`: `0x7c0 + [rbp - 0xcc]` | `0xc8` |
| `0x68` | `0x14c3fc` first writes `dword ptr [rbx + 0x68]`; `0x14c46d` may overwrite byte `0x68` | `0x14e335..0x14e33c`: byte `[rbp - 0xd8]` | `0xcc` |
| `0x1c` | `0x14c455` writes byte `[rbx + 0x1c]` | `0x14e342..0x14e349`: byte `[rbp - 0x124]` | `0xd0` |
| `0x6a` | `0x14c490` writes byte `[rbx + 0x6a]` | `0x14e34f..0x14e356`: byte `[rbp - 0xd6]` | `0xd4` |
| `0x78..0x7b` | `0x14c9d3..0x14ca47` | `0x14e464` `pmovzxbd` | `0xa0..0xac` |

Previous-day fallback at `0x14e388..0x14e3da` reads the same offsets from another local output structure at `[rbp - 0x200]` and writes the same `0xc8..0xd4` caller fields.

边界：

- `0xc8 = 0x7c0 + output[0x74]` is implemented as a layout transform constant, not as final semantic naming.
- `0xcc/0xd0/0xd4` are byte-level passthrough fields from `0x14bed0` offsets `0x68/0x1c/0x6a`.
- Offset `0x68` has repeated writes in `0x14bed0` trace; field-map mode records first write `0x14c3fc`, trace mode also shows byte overwrite `0x14c46d` and a 16-byte copy at `0x14c543`.
- The exact meanings of these bytes remain unresolved until `0x14bed0` table/cache logic and golden samples are aligned.

## `0x14bed0` Context Layout Reads

2026-07-09 已将 `0x14bed0` 当前可确认的 context layout 读点固化到 `src/engine/native-calendar-context.ts`。这一步只记录 context 指针结构里的表/记录边界 offset，以及这些 offset 如何喂给已观察的 lookup 输出字段；它仍不是 `0x14bed0` 查表算法移植。

2026-07-09 追加 `scripts/zwxy_reverse.py reads`，用于复查短窗口内指定 base register 的结构读取 offset。例如：

```bash
/Users/sizes-studio/Documents/Personal/apk-reverse/app-apk/.venv/bin/python \
  wiki/紫微/skills/ziwei-chart/scripts/zwxy_reverse.py reads \
  --so /Users/sizes-studio/Documents/Personal/apk-reverse/app-apk/unpacked/lib/x86_64/libziweixingyu.so \
  --start 0x14c259 --stop 0x14c285 --base rsi --json
```

该工具不做完整数据流追踪，所以 `0x14bed0` context 指针从 stack local 重新载入后的窗口需要分别指定当时持有 context 的 register，例如 `rax`、`rsi` 或 `rcx`。

入口附近证据：

| Context offset | Native evidence | Current reading |
|---:|---|---|
| `0x10` | `0x14c02d` reads `ctx + 0x10` into `r14` | record/cache begin pointer |
| `0x18` | `0x14c031` compares `r14` against `ctx + 0x18` | record/cache end pointer |
| `0x50` | `0x14c1cc` and `0x14c408` read `ctx + 0x50` | month boundary dword table used to compute output byte `0x1c` |
| `0x68` | `0x14c260` and `0x14c465` read `ctx + 0x68` | byte table feeding output byte `0x68` |
| `0x80` | `0x14c26e` and `0x14c470` read `ctx + 0x80` | adjacent byte table feeding output byte `0x69` |
| `0x98` | `0x14c27f` and `0x14c47e` read `ctx + 0x98` | comparison/index value feeding output bytes `0x6a` and `0x6b` |

Output-source relationship currently encoded:

| `0x14bed0` output | Context source | Store evidence | Boundary |
|---:|---:|---|---|
| `0x1c` | `ctx + 0x50` | `0x14c455` | byte day/segment value; final meaning unresolved |
| `0x68` | `ctx + 0x68` | `0x14c46d` after earlier dword write at `0x14c3fc` | repeated-write field; caller consumes byte `0x68` |
| `0x69` | `ctx + 0x80` | `0x14c47b` | adjacent lookup byte; not yet consumed by `0x14dbd0` slice mapped above |
| `0x6a` | `ctx + 0x98` | `0x14c490` | comparison result byte |
| `0x6b` | `ctx + 0x98` | `0x14c4a5` | next-index or `0xff` sentinel |

这些字段的中文/历法命名需要等 `0x14bed0` 控制流和 APP 黄金样本合并后再确定。

## `0x14bed0` Consumed Slice Static Port

2026-07-18 已在 `src/engine/native-calendar-lookup.ts` 移植 `0x14dbd0` 实际消费的日期切片。Public API 为 `nativeCalendarLookupConsumedSlice0x14bed0(context, year, month, day)`；它承诺输出 `0x1c/0x68/0x6a/0x74/0x78..0x7b`，不承诺该函数其余字符串和日选副产物。

已保留的 native 控制流：

| Segment | Evidence | Static port |
|---|---|---|
| month start / next month | `0x14bf11..0x14bfcf` | 以 `12:00:00.1` 构造当月一日与下月一日，经 `0x187270`、floor 后减 `0x256859` |
| cache coverage / refill | `0x14c02d..0x14c071` | cache 为空、月首早于 record 0、或下月不严格早于 record 24 时调用 `0x182880(ctx, firstDayIndex)` |
| month-boundary selection | `0x14c1c5..0x14c2a9`, per-day refresh `0x14c3ff..0x14c4a5` | 在 15 个 `ctx+0x50` boundaries 中选择包含最终 day index 的 0..13 段 |
| output `0x1c` | `0x14c455` | `dayIndex - boundary[index]` 的低 byte |
| output `0x68` | `0x14c46d` | `ctx+0x68[index]` 的低 byte |
| output `0x6a` | `0x14c47e..0x14c490` | `ctx+0x98 != 0 && ctx+0x98 == index` |
| output `0x74` | `0x14c7ca..0x14c9ac` | 扫描 `ctx+0x68 == 2` 且跳过 leap index 的 boundary，必要时减 365，再执行 `floor((reference + 0x16b2) / 365.2422 + 0.5)` |
| output `0x78/0x79` | `0x14c648..0x14c9f3` | 由 `record[3]`、目标日与 `16*365.25-35` 派生 alternate year offset，再对 `offset+0x2ee0` 取 mod10/mod12 |
| output `0x7a/0x7b` | `0x14c9f6..0x14ca47` | 对 `output[0x74]+0x2ee0` 取 mod10/mod12 |

1998-02-20 的 static-port context 输出为 `0x1c=23`、`0x68=2`、`0x6a=0`、`0x74=14`、`0x78..0x7b=4/2/4/2`。测试还锁定 1998-01-27 -> 01-28 的 boundary/leap 切换，以及 1998-02-27 的 `0x74` reference 切换。这些是 APK 指令与已移植 context 的回归结果，不是 APP JSON 黄金样本，也不对字段提前赋予中文历法名称。

## `0x14bed0` Event Vectors And `0x14dbd0` Boundary Selection

2026-07-18 已在 `native-calendar-event-vectors.ts` 移植 `0x14d2aa..0x14d69d`。该路径从 `ctx+0x10` 的 25 条 record 出发，经 `0x185800` 确定初始 24 分区角，再逐项调用 `0x1861d0` 反解相对日；每项按 native 顺序拼接 record 日与事件时分秒，写入 output `0x38` double vector，并把 mod24 标签写入 output `0x50` int vector。

1998 fixture 的 25 个绝对 JD 从 `2450804.720939805` 到 `2451169.9702385115`，标签完整序列为 `1..23,0,1`。`native-calendar-core-prefix.ts` 随后按 `0x14e475..0x14e7b9` 选择真太阳时前后的两项，写入 `0xd8..0x12b` 与 `0x130..0x183`；本 fixture 选中 label `5` / `6`，日期为 1998-02-19 10:57 与 1998-03-06 11:54。

2026-07-18 复核 `0x182dc8` 时发现 fallback leap-marker 移植曾少了一个 dword 偏移：原生读取 `0x4(boundaryBase, marker, 4)`，即 `monthBoundaries[marker + 1]`，而旧 TypeScript 误读成 `monthBoundaries[marker]`。修正后 1998 cache 的 `leapIndex0x98` 从错误的 `1` 回到 `7`，月序表为 `0,1,2,3,4,5,6,6,7,8,9,10,11,0`。1998-02-20 消费切片因此修正为 `0x1c=23` / `0x68=2` / `0x6a=0` / `0x74=14` / `0x78..0x7b=4/2/4/2`。这是直接的指令偏移修正，不是外部农历规则补丁。

## `0x124b80` Two-pass Calendar Wrapper

`src/engine/native-calendar-wrapper.ts` 已移植 mode 3 调用的双通道 wrapper：

- `0x124c58` 首次以 mode `0` 调用 `0x14dbd0`。
- `0x124c74..0x124cc7` 构造 `sourceJD + (sourceJD - firstTrueSolarJD)` 的 reflected date。
- `0x124d52` 再次以 mode `0` 调用 `0x14dbd0`。
- `0x124d67..0x124da4` 用原始输入日期覆盖最终结构 `0x50..0x77`。

mode 3 caller 在 `0x11dc4f..0x11ddee` 中的 `xmm4` 来源仍有独立未决点：字段 8 被 `stold` 到一个 stack slot，但 call 前可见 `xmm4` 从另一 slot 加载。因此 wrapper 的 `timezoneHours=-8` fixture 只是当前架构验证，不单独证明 mode 3 时区实参 parity。

## `0x11b600` Calendar Name Adapter

`src/engine/native-calendar-named.ts` 已移植 `0x11b600..0x11ba2a` 中被后续主链消费的结构适配：

| Calendar input offsets | Adapter output offsets | APK table / operation |
|---|---|---|
| `0xa0/0xa4` | `0xe0/0xf8` | stem `0x19ed00` / branch `0x19ee10` |
| `0xa8/0xac` | `0x110/0x128` | same stem / branch tables |
| `0xb0/0xb4` | `0x140/0x158` | same stem / branch tables |
| `0xb8/0xbc` | `0x178/0x190` | same stem / branch tables |
| `0xc0/0xc4` | `0x1a8/0x1c0` | same stem / branch tables |
| `0xc8/0xcc/0xd0/0xd4` | `0x1d8..0x214` | year integer, month table `0x1a5ca0`, day table `0x1a5d00`, leap flag |
| `0xd8..0x128` | `0x218/0x230` | `0x11ba60` formatted boundary date plus label |

Month normalization at `0x11b955..0x11b973` is exactly `index == 0 ? 11 : index == 1 ? 12 : index - 1`；闰月字符串来自 `0x734f4`。`0x11ba60` 使用 `0x7709e` 的 `%d-%02d-%02d %02d:%02d:%02d`，秒字段经 `cvttsd2si` 截断。

1998-02-20 fixture 在该适配层的直接结果为：两组年候选均为 `戊寅`，其后三组为 `甲寅` / `戊戌` / `丁巳`，农历为 `1998年正月廿四`。前两组年字段在最终 chart 中的角色仍等待 `0x155370` 读取链确认，因此 runtime 类型暂保留中性 offset 命名。

实现还覆盖 `0x14e8de..0x14e927` 的 label `3` 同日条件修正。当前明确边界是：当真太阳时不落在当前 25 项向量内部时，`0x14e7bf` 会重新调用 `0x14bed0` 获取下一 cache；TypeScript 目前以 `native-calendar-core-prefix:event-vector-rollover` 显式失败，不伪造跨界结果。

## `0x155370` Polarity And Palace Anchors

`src/engine/native-palace-anchors.ts` 已移植 chart orchestrator `0x155370` 的 `0x1553f2..0x1558d2` 前缀。该段先从 calendar adapter `0x110` 读取农历年干，以 APK 内联的 `甲丙戊庚壬` 判定阴阳，再按 gender 选择 `阳男` / `阴男` / `阳女` / `阴女`。四个字符串地址分别为 `0x60527`、`0x79189`、`0x6880f`、`0x70f52`。

命宫和身宫都以 `0x19f3d0` 的前 12 个标准地支及 `寅` 为锚点，直接消费 calendar adapter 的归一化农历月 `0x234` 和时支 `0x1c0`：

- 命宫：`mod12(index(寅) + normalizedMonth - hourBranchIndex - 1)`，存入 context `0x98`。
- 身宫：`mod12(index(寅) + normalizedMonth + hourBranchIndex - 1)`，存入 context `0xb0`。

1998 fixture 为阳男、命宫酉、身宫未。后续宫干、十二宫名、星曜、四化和最终 JSON 已组合进入 field-by-field golden test。

## `0x156fb0` Palace Nodes And Stems

`0x156fb0` 按 `0x19f3d0` 的 `子..亥` 循环创建 12 个 `0x1a0`-byte 宫节点，并在 `0x15712b` 调用 `0x1753a0(yearStem, branch)`，将结果写入节点 `+0x38`。`src/engine/native-palace-stems.ts` 移植了这条宫干路径。

`0x1753a0` 使用 `0x19f020` 的 `寅..丑` 作为支索引，使用 `0x19f080` 的 `甲..癸` 作为干表。五组年干比较和寅宫起干直接来自 native 常量：`甲己 -> 丙`、`乙庚 -> 戊`、`丙辛 -> 庚`、`丁壬 -> 壬`、`戊癸 -> 甲`；随后执行 `(branchIndexFromTiger + tigerStemIndex) % 10`。1998 戊年 fixture 的十二宫干支为 `甲子、乙丑、甲寅、乙卯、丙辰、丁巳、戊午、己未、庚申、辛酉、壬戌、癸亥`。

## `0x157500` Twelve Palace Names

`src/engine/native-palace-names.ts` 已移植函数 `[0x157500, 0x1583ca)`。入口先直接找到命宫支节点并把 `0x7a5ee` 的 `命宫` 写入 node `+0x38`；随后 11 次调用 `0x176260`，相对位移严格为 `-1..-11`，依次写入 `兄弟、夫妻、子女、财帛、疾厄、迁移、交友、官禄、田宅、福德、父母`。对应 APK 字符串地址已全部锁入 evidence contract。

1998 fixture 命宫为酉，因此十二宫分布为：命酉、兄弟申、夫妻未、子女午、财帛巳、疾厄辰、迁移卯、交友寅、官禄丑、田宅子、福德亥、父母戌。这里的相对宫序是 `0x157500` 实际指令结果，不引用外部排盘协议。

## `0x1586a0` Five-elements Bureau

`src/engine/native-five-elements-bureau.ts` 已移植 `[0x1586a0,0x159039)` 与 caller `0x155a6e..0x155b99`。helper 读取命宫节点的宫干与命宫支，将宫干匹配到五个 APK 内联组 `甲乙 / 丙丁 / 戊己 / 庚辛 / 壬癸`，宫支匹配到三个内联组 `子丑午未 / 寅卯申酉 / 辰巳戌亥`。两组均使用 1-based 序号；相加后若结果不小于 5 则减 5。x86_64 `0x1586cb..0x1586d7` 的首组原始字节为 `e7 94 b2 e4 b9 99`，即 `甲乙`；此前文档与 port 将末字误抄为 `丙`，已由该直接字节证据修正。

函数尾部构建的 native map 将 key `0..4` 映射为局数 `5,3,4,2,6`。caller 的相对字符串表 `0x83f10` 再把局数 `2..6` 映射为 `水二局、木三局、金四局、土五局、火六局`。1998 fixture 命宫酉、宫干辛，得到 `木三局`；该值与 ARM64 黄金 JSON 一致。2026-07-20 用户转录的 APP case 命宫巳、宫干乙，得到 `火六局`，并作为非黄金 characterization fixture 锁定。

## `0x159170` Major Limits

`src/engine/native-major-limits.ts` 已移植 `[0x159170,0x1597c8)`。函数直接比较 context `0x128` 的阴阳男女标签：`阳男` 或 `阴女` 写 context `0xc8 = 顺`，从命宫开始按相对位移 `0..11` 排 12 个大限；其余标签写 `逆`，按 `0..-11` 排。首限起始年龄就是五行局数，之后每宫加 10，node `+0xc8` 使用 APK `0x7ea7c` 的 `%d~%d` 格式写入起止年龄。

1998 fixture 是阳男、木三局、命宫酉，因此大限依次为 `酉 3~12、戌 13~22、亥 23~32、子 33~42`，继续顺排至 `申 113~122`。

## `0x1597d0` Minor Limits

`src/engine/native-minor-limits.ts` 已移植正常路径 `[0x1597d0,0x159f28)`。出生年支按 APK 四个内联组三合支决定 1 岁起宫：`寅午戌 -> 辰`、`申子辰 -> 戌`、`巳酉丑 -> 未`、`亥卯未 -> 丑`。函数只比较原始 gender 字符串是否为 `0x789fa` 的 `男`；男命相对位移为 `0..71`，女命为 `0..-71`，把 1 至 72 岁以 `0x7ea82` 的 `%d,` 追加到 palace node `+0xe0`。

1998 fixture 年支寅、男命，因此 1 岁从辰起；辰宫小限串为 `1,13,25,37,49,61,`，卯宫为 `12,24,36,48,60,72,`。

## `0x15a100` Life Lord And `0x15a6b0` Body Lord

`src/engine/native-life-body-lords.ts` 已移植两组 chart metadata。`[0x15a100,0x15a640)` 读取命宫支并写 context `0xe0` 命主：`子贪狼、丑亥巨门、寅戌禄存、卯酉文曲、辰申廉贞、巳未武曲、午破军`。`[0x15a6b0,0x15abf0)` 读取出生年支并写 context `0xf8` 身主：`子火星、丑未天相、寅申天梁、卯酉天同、辰戌文昌、巳亥天机、午铃星`。

所有 branch group 和星名地址均来自函数内联常量。1998 fixture 命宫酉、年支寅，因此命主文曲、身主天梁。

## Major-star Anchors Before `0x15aeb0`

`src/engine/native-major-star-anchors.ts` 已移植 orchestrator `0x155f35..0x155f7d` 的紫微起宫和 helper `[0x15ace0,0x15ae78)` 的天府镜像。紫微起宫读取 calendar adapter `0x210` 的 1-based 农历日数和五行局数：先求商余；有余数时令 `s = bureau - remainder`，把商调整到下一整局，再按 `s` 偶数加、奇数减，最终减一作为从寅起的相对位移。

天府 helper 把紫微宫支转换为标准支索引 `b`，然后执行 `b <= 4 ? 4-b : 16-b`。1998 fixture 为农历廿四、木三局，紫微落酉，天府镜像落丑；两组主星最终使紫微、贪狼同入酉宫。

## `0x15aeb0` And `0x15ba70` Fourteen Major Stars

`src/engine/native-major-stars.ts` 已分别移植紫微、天府两组十四主星。`[0x15aeb0,0x15b71f)` 以紫微锚点为 `0`，通过 `0x176260` 使用原生有符号偏移 `0,-1,-3,-4,-5,-8`，依次把 `紫微、天机、太阳、武曲、天同、廉贞` 写入对应宫节点 `+0x170`。`[0x15ba70,0x15c61b)` 以天府锚点为 `0`，使用偏移 `0,+1,+2,+3,+4,+5,+6,+10`，依次写入 `天府、太阴、贪狼、巨门、天相、天梁、七杀、破军`。

两组星名均由函数内联 UTF-8 immediate 逐字节复原，入口宫通过 `0x17b480` 查找，偏移宫通过 `0x17b300` 查找。1998 fixture 的紫微锚点为酉、天府锚点为丑；最终分布由 golden test 对原生 `星列表` 和 `星庙旺` 逐宫核对。未使用外部安星口诀或排盘库。

## `0x15caa0` Month-driven Stars

`src/engine/native-month-stars.ts` 已移植 `[0x15caa0,0x15e910)` 的完整正常路径。前四颗星直接调用 `0x176260`：`左辅 = 辰 + (month-1)`、`右弼 = 戌 + (1-month)`、`天刑 = 酉 + (month-1)`、`天姚 = 丑 + (month-1)`。其余 22 颗星逐月读取 APK relocation pointer tables `0x19f0d0..0x19f8b0`，每表 12 个 C-string 宫支，星名依次为 `阴煞、天月、天巫、解神、月马、天富、天财、天医、生气、岁刑、阴奸、水杀、恶杀、冤杀、天贼、天狗、五墓、三丘、雷火、注受、死神、飞符`。

全部星曜都写入宫节点 `+0x170`，但 `0x15d3d3` 明确检查 context `+0x450 == 1`：开关关闭时，在解神之后跳到函数尾部，因此只保留 4 个公式星与 `阴煞、天月、天巫、解神`；开关打开时才继续加入从月马到飞符的 18 颗扩展星。TypeScript API 要求调用者显式传入该开关。1998 fixture 为农历一月，公式星落宫为左辅辰、右弼戌、天刑酉、天姚丑；22 张表的一月结果已在 `native-month-stars.test.ts` 锁定。

## `0x15f510` Month-and-day Stars

`src/engine/native-month-day-stars.ts` 已移植正常路径 `[0x15f510,0x15f701)`。函数读取 normalized lunar month 与 calendar adapter `0x210` 的农历日，计算同一个 `month + day`：`三台 = 辰 + month + day - 2`，`八座 = 戌 + 2 - month - day`。两次宫支运算都调用 `0x176260`，星曜写入则调用 `0x1789c0`，不是主星/月星使用的 node `+0x170` 直接赋值。

1998 fixture 为农历一月廿四，三台落卯、八座落亥。

## `0x15f7f0` Hour-branch Stars

`src/engine/native-hour-stars.ts` 已移植正常路径 `[0x15f7f0,0x1600e5)`。orchestrator `0x15611b..0x156162` 从 calendar adapter `+0x1c0` 的时支字符串传入；函数先扫描 `0x19f3d0` 得到标准支索引 `h`，再安六星：`文昌 = 戌-h`、`文曲 = 辰+h`、`地空 = 亥-h`、`地劫 = 亥+h`、`台辅 = 午+h`、`封诰 = 寅+h`。六颗星均写入宫节点 `+0x170`。

1998 fixture 时柱为丁巳，`h=5`，得到文昌巳、文曲酉、地空午、地劫辰、台辅亥、封诰未。

## `0x1601b0` Year-branch Stars

`src/engine/native-year-branch-stars.ts` 已移植正常路径 `[0x1601b0,0x162279)`。函数从 calendar adapter `+0x128` 接收出生年支，并扫描 `0x19f3d0` 得到标准支索引 `y`。ARM64 黄金校正后的公式星为：`天哭=午-y`、`天虚=午+y`、`红鸾=卯-y`、`天喜=酉-y`、`龙池=辰+y`、`凤阁=戌-y`、`天德=酉+y`、`月德=巳+y`、`年解=戌-y`、`天空=出生年支+1`。

`天马、华盖、劫煞、咸池` 使用 `y mod 4` 读取 `0x19f910/30/50/70` 四张四项 relocation 表；`孤辰、寡宿、大耗、蜚廉、血刃` 使用 `y` 读取 `0x19f990、0x19f9f0、0x19fa50、0x19fab0、0x19fb10` 五张十二项表。破碎按函数内联字符串分三组：`子午卯酉->巳`、`辰戌丑未->丑`、`寅申巳亥->酉`。`0x16204f` 只有在 context `+0x450 == 1` 时才加入血刃，其余 19 颗不受该判断影响。

1998 fixture 为寅年；扩展开关打开时得到 20 颗年支星，逐星结果已锁入 `native-year-branch-stars.test.ts`。

## `0x17f450` Context Constructor Assets

2026-07-16 已将 context 构造器的初始数据移入 `native-context-assets.ts` 和 `native-context-state.ts`：

- `ctx+0x0` 保存指向 vector 对象的指针；构造器在 `0x17f7c3..0x17f7db` 从 `0x83f30` 拷贝 `0x170` bytes，即 23 条 binary128 records，SHA-256 `e997e6f431e53a919e9bbf4974e6cf4a0719372ba371efde8f83c2ec17370580`。
- `ctx+0x8` 同样是 vector 对象指针；`0x17f814..0x17f82c` 从 `0x840a0` 拷贝 `0x470` bytes，即 71 条 binary128 records，SHA-256 `7b58c8e2b9114146018e8c2b66241935e8cc370df03a3ab7c78acaf2c166bf08`。
- 构造器拼接两组 C-string fragments，再由 `0x17fa10` 连续调用 30 次 `0x1813d0` 展开 zero-run token。展开后 `ctx+0xa0` 长度 23,952，`ctx+0xb8` 长度 2,989，字符集仅为 `0/1/2`。
- `0x181c2e` 的 mode nonzero 路径使用 `ctx+0xa0`；mode zero 在 `0x18212c` 选择 `ctx+0xb8`，并以 `0x1827b0` 执行长度 1 的 substring。`0x1827b0` 不是另一层历法解码。

## `0x182880` Context Cache Refill Port

2026-07-09 已确认 `0x14bed0` 在 context cache 范围为空或不覆盖目标日期时会调用 `0x182880(ctx, targetDayIndex)`。该参数是 J2000 语境下的整数日序，不是公历年份。`0x182880` 开始处将 `rdi` context 指针保存到 `rbx`：

```text
0x1828c2 mov rbx, rdi
```

因此 `scripts/zwxy_reverse.py writes/reads` 已增加 `mov reg, reg` alias 跟踪，可用 `--base rdi` 直接复查 refill 对 context 的读写。

```bash
/Users/sizes-studio/Documents/Personal/apk-reverse/app-apk/.venv/bin/python \
  wiki/紫微/skills/ziwei-chart/scripts/zwxy_reverse.py writes \
  --so /Users/sizes-studio/Documents/Personal/apk-reverse/app-apk/unpacked/lib/x86_64/libziweixingyu.so \
  --start 0x1828c2 --stop 0x182ad0 --base rdi --json
```

当前已抽到的 refill skeleton：

| Context offset | Evidence | Current reading |
|---:|---|---|
| read `0x10` | `0x182925` reads `ctx + 0x10`; `0x182929` writes same pointer to `ctx + 0x18` | first record/cache begin copied to end before refill |
| write `0x30` | `0x1829bf` writes 16 bytes | cached date/vector anchor, exact semantic unresolved |
| write `0x40` | `0x1829ed` writes 16 bytes | cached date/vector anchor, exact semantic unresolved |
| read `0x50` | `0x182a4c` reads `ctx + 0x50`; `0x182a50` writes same pointer to `ctx + 0x58` | month boundary table begin copied to end before refill |
| write `0x98` | `0x182aad` zeros dword `ctx + 0x98` | leap/index marker reset before later refill logic |
| read `0x68`, `0x80` | `0x182ac1`, `0x182ac5` read pointers; `0x182ae1`, `0x182acc` copy them to `0x70`, `0x88` | byte table begin/end pair reset before refill |

已固化到 `src/engine/native-calendar-context.ts` 的早期 refill loops：

| Loop | Evidence | Current reading |
|---|---|---|
| `ctx + 0x10` record vector | `0x182940..0x182990`; append-like call `0x183000` at `0x18297d`; compare at `0x18298d` against `0x18` | counter starts at 0 and last inclusive counter is `0x18`, so this fills 25 16-byte records. Source helper is `0x181490(ctx, 0)`. |
| `ctx + 0x50` boundary table | `0x182a60..0x182aab`; append-like call `0x14bcb0` at `0x182a98`; compare at `0x182aa8` against `0x0e` | counter starts at 0 and last inclusive counter is `0x0e`, so this fills 15 dword entries. Source helper is `0x181490(ctx, 1)`. |
| `ctx + 0x80` and `ctx + 0x68` derived byte/index tables | `0x182b00..0x182b31`; reads adjacent `ctx+0x50` dwords at `0x182b05` and `0x182b09`; calls `0x14bcb0` at `0x182b15` and `0x183110` at `0x182b20`; compare at `0x182b2e` against `0x0d` | counter starts at 0 and last inclusive counter is `0x0d`, so this derives 14 paired entries from boundary differences. |

2026-07-10 已将这些 append-like helper 的 vector growth 机制移植到 `src/engine/native-vector.ts`。这只覆盖 C++ vector append/reallocation shape，不覆盖 `0x181490` 产生的 calendar 数值。

| Helper | Fast-path evidence | Reallocation evidence | Element bytes | Current reading |
|---|---|---|---:|---|
| `0x183000` | `0x183021` stores one `movaps` 16-byte record and advances current end by `0x10` | `0x18303a..0x1830d5`; new capacity is `max(size + 1, oldCapacity * 2)` | 16 | Used by `0x182880` to append 25 records into `ctx+0x10`. |
| `0x14bcb0` | `0x14bcd1` stores one dword and advances current end by `0x04` | `0x14bce8..0x14bd83`; new capacity is `max(size + 1, oldCapacity * 2)` | 4 | Used by `0x182880` to append 15 `ctx+0x50` boundary entries and 14 `ctx+0x80` difference entries. |
| `0x183110` | `0x183131` stores one dword and advances current end by `0x04` | `0x183148..0x1831e3`; same growth shape as `0x14bcb0` | 4 | Used by `0x182880` to append 14 `ctx+0x68` derived index entries. |
| `0x183230` | capacity-enough paths at `0x183300..0x183360` rewrite destination begin/end by `memmove` | `0x18325b..0x1832fa`; new capacity is `max(sourceCount, oldCapacity * 2)` when source count exceeds capacity | 16 | Used by `0x181490` mode 0 to assign/replace its local 16-byte record vector with the `ctx+0x8` range. |

已固化到 `src/engine/native-calendar-context.ts` 的尾段 index correction control flow：

| Segment | Evidence | Current reading |
|---|---|---|
| Seed range guard | `0x182b33..0x182bb7`; compares `(seed + 0xaa1)` against `0x269`; `ja 0x182d8a` | Out-of-range seeds enter the fallback marker path. Accepted seeds add `0x7d0` before the candidate loop. |
| 3-slot candidate loop | `0x182c20..0x182d85`; loop exits at `0x182c26` to `0x182e2b`; thresholds `-0x2d0`, `-0x1de`, `-0xdb`; helper calls `0x181490(ctx, 1)` at `0x182c83`, `0x182cf5`, `0x182d68` | Fills three stack-local candidate/class slots at `rbp-0x60..rbp-0x58` and `rbp-0x48..rbp-0x40`; classes observed are `2`, `2`, and `0x0b`. |
| Normal rewrite loop | `0x182e2b..0x182ef2`; reads `ctx+0x50` table at `0x182e76`; writes `ctx+0x68` table at `0x182e59`; mod-12 pattern starts at `0x182ed2`; exit compare at `0x182e69` | Rewrites 14 `ctx+0x68` entries from `ctx+0x50` boundaries and the three local candidates. |
| Fallback marker path | `0x182d8a..0x182e26`; writes `ctx+0x98` at `0x182df7`; decrements `ctx+0x68` entries at `0x182e13`; exit compare at `0x182e21` | Writes a marker index to `ctx+0x98`, then decrements `ctx+0x68` entries from that marker through index `0x0d`. |
| Fallback normalization loop | `0x182efb..0x182fd7`; reads `ctx+0x50` at `0x182f2d`; reads/writes `ctx+0x68` at `0x182f31`/`0x182f15`; sentinel load `0x0c` at `0x182f10`; mod-12 pattern starts at `0x182f5a` | Normalizes 14 fallback `ctx+0x68` entries and may emit `0x0c` sentinel values. |

实现状态：

- `native-context-refill.ts` 保留 double -> binary128 转换点和 binary128 helper 运算顺序，完成 25/15/14 三组 refill loops、正常 candidate rewrite 和 fallback normalization。
- `targetDayIndex=-680` 的实际 sampler 回归向量为：首条 record `-740`，最后一条 `-375`；15 条 boundary 从 `-762` 到 `-349`；`ctx+0x98=1`；`ctx+0x68=[0,0,1,2,3,4,5,6,7,8,9,10,11,0]`。这是 static-port characterization，还不是 APP JSON 黄金样本。
- 正常 candidate loop 对合法 context 应保持 boundary 落在三个 candidate 之后且 month offset `<=11`。原生越界索引会读取未在函数中初始化的栈 slot；TypeScript 对这两个不可证达分支显式报错，不猜测值。
- `0x182880` 输出仍只是 `0x14bed0` context 准备步骤，不能单独命名为农历、月令或闰月最终结果。

## `0x181490` Context Sample Helper Contract

2026-07-09 已将 `0x182880` 多处调用的 `0x181490(ctx, mode)` helper 结构固化到 `src/engine/native-calendar-context.ts`。该广义 contract 仍只是输入、vector 访问、mode 分支、hot/cold path 和返回结构的 argument map；`0x181a8b..0x181bde` interpolation 分支及其 shared final conversion 另已实现为中性 static port。

入口与返回：

| Item | Evidence | Current reading |
|---|---|---|
| Inputs | `rdi` saved to `rbx` at `0x1814ac`; `esi` saved to `r14d` at `0x1814a4`; `xmm0` saved at stack `rbp-0x80` at `0x1814a7` | `ctx`, mode flag, and target vector/quantity. |
| Primary vector | reads `ctx+0x0` vector begin/end at `0x1814ed` and `0x1814f0`; copies with allocation `0x19a130` and byte copy `0x19a150` | Local copy of 16-byte record vector. |
| Mode 0 extra vector | test at `0x181542`; mode nonzero jumps to `0x181587`; mode zero reads `ctx+0x8` at `0x18154e` and assigns the range through `0x183230` at `0x181570` | mode 0 replaces the local copy with the `ctx+0x8` range; mode 1 skips this range assignment. |
| Output | final conversion call `0x195b60` at `0x181a1a`; `mov eax, r14d` at `0x181a76`; hot return at `0x181a8a` | returns an integer derived from the final vector quantity. |

Mode paths currently encoded:

| Path | Evidence | Current reading |
|---|---|---|
| Mode 1 path | `0x181614..0x1817d6`; calls helper `0x1868e0`; correction helper `0x1859c0`; shared finalize at `0x1819b3`; constants include `0x25685f`, `2`, `0x8ead`, `0x15180`, `0x708`, `0x14a78` | Nonzero mode transform path used by `0x182880` for month-boundary/candidate calls. |
| Mode 0 path | `0x1817db..0x1819b3`; calls helper `0x186e40`; correction helper `0x1861d0`; constants include `0x25673b`, `0x18`, `0x0c`, `0x8ead`, `0x15180`, `0x04b0`, `0x14cd0` | Zero mode transform path used by record/cache vector refill. |
| Interpolation path | `0x181a8b..0x181bde`; range loop `0x181ad0..0x181b00`; base read `0x181b02`; step read `0x181b17`; stride `0x20`; exit jumps to shared finalize at `0x181a0f`, with int32 conversion at `0x181a1a` | Implemented in `src/engine/native-context-sample.ts` as a neutral binary128 numeric/context-sample static port. |
| Secondary cold path | `0x181be3..0x1822c4`; no-result jump `0x182041`; reads `ctx+0xa0` at `0x182025`, `ctx+0xa8` at `0x182035`, `ctx+0xb0` at `0x1821f6`; packed decode call `0x1827b0` at `0x18219e`; string adjust branches at `0x18226e` and `0x1822a1` | Consults packed/string buffers in the context before returning the final integer. |

### Interpolation Static Port Boundary

`nativeContextSampleInterpolation0x181a8b` 接收有限 binary128 `target` / `offset` 和奇数长度的交替 records：`[base, step, ..., sentinelBase]`，其中 base 严格递增、step 为正。Public API 拒绝非有限输入、非正 step、非递增 base 和不合法 shape；这是防御性 API contract，不声称 native 有同等 guard。

- Native range 为 `[records[0]-offset, last-offset)`；低于下界返回 `cold-path/below-range`，等于或高于上界返回 `cold-path/at-or-above-range`。这些是命名的边界结果，没有移植 `0x181be3..0x1822c4` secondary cold path。
- Pair selection 以 `probe = target + offset` 依次比较 next base，record 宽 `0x10`、pair stride `0x20`；在 next base 前 1 binary128 ULP、精确到达及后 1 ULP 均有测试锁定切换边界。
- 运算顺序不可合并：先 `q = floor((probe-base)/step)`，再 `rounded = floor(base + step*q + 0.5)`。Evidence fields 精确记录 `0x181b73` 的 double `0.5` load、`0x181b7b` 的 binary128 conversion 和 `0x181b87` 的 add。
- 若 `rounded == 0x19b004`，先加上 VA `0x830b0` 的原始 binary128 `+1`，再减 `0x256859`。`0x181bde` 随后跳回 shared finalize `0x181a0f`，并在 `0x181a1a` 通过 `0x195b60` 转为 int32；`0x256859` 只是已确认的减数，不命名其历法语义。
- Unit tests 覆盖 lower-below / upper-exact cold boundaries、pair switch `-1/0/+1` binary128 ULP、fractional rounding、特殊修正，以及 malformed、nonfinite、nonpositive 和 non-increasing 输入。

该 interpolation port 本身不是 mode 0/1 parity、secondary cold-path parity、calendar parity 或 chart parity。mode 0/1 热路径已在 `native-context-mode-zero.ts`、`native-context-mode-one.ts` 和 shared dispatch wrapper 中组合；`0x181490` 剩余 blocker 只是 secondary cold path helpers/data。

2026-07-10 已追加 `0x181490` dependency summary，记录 helper call count；这仍是依赖图，不是 mode 0/1 数值算法 port。

| Group | Calls observed inside `0x181490..0x1822c4` | Boundary |
|---|---|---|
| binary128/native numeric helpers | `0x194c80` x26, `0x195130` x7, `0x1951f0` x5, `0x1952a0` x13, `0x195a00` x33, `0x195b60` x1, `0x195be0` x2, `0x195c60` x35, `0x195cd0` x27, `0x196240` x17 | Numeric substrate only; does not name calendar semantics. |
| `0x195be0` call sites | `0x182019`, `0x18218a` | Converts floored binary128 values before `ctx+0xa0..0xb8` packed/string cold-path decoding. |
| libm long-double helpers | `floorl` `0x19a380` x11, `fmodl` `0x19a410` x2, `cosl` `0x19a420` x3 | `floorl` / `fmodl` are implemented as binary128 static ports; medium-range `cosl` / `sinl` are implemented in `native-trig.ts`, while large argument reduction remains unported. |
| native transform helpers | `0x1868e0`, `0x186e40`, `0x1859c0`, `0x1861d0`, `0x183830`, `0x1827b0`, `0x182340` | `0x183830` / `0x183380`, observed table-0 `0x183d40` paths, `0x1838a0`, `0x1842b0`, `0x185160`, `0x1859c0`, `0x1861d0`, `0x1868e0`, and `0x186e40` are implemented as static ports; secondary cold-path helpers remain unresolved. |

边界：

- `0x181490` 内部大量调用 `0x194c80`、`0x195130`、`0x1951f0`、`0x1952a0`、`0x195be0`、`0x195cd0`、`0x196240` 等 numeric helpers；当前已移植 binary128 位级表示、conversion、compare、add、subtract wrapper、multiply、divide、`floorl` 和 `fmodl` helper。
- `0x181490` mode 0/1 的 raw-target dispatch、`0x181a8b..0x181bde` 插值、两组 numeric path 和 shared final conversion 已作为中性 static port 组合；secondary cold path 仍未完成，不能直接命名为节气、朔望、闰月或农历日生成器。

## Native Numeric Helper Representation

2026-07-09 已将 `0x181490` 依赖的一部分 numeric helper 固化到 `src/engine/native-numeric.ts`。2026-07-10 追加 `0x195be0` binary128 -> uint64 conversion、`0x195cd0` multiply、`0x1952a0` divide、`0x19a380` `floorl` 和 `0x19a410` `fmodl` helper。2026-07-16 在 `native-trig.ts` 追加 signed-int32 quotient 范围的 binary128 `cosl` / `sinl` static port。2026-07-18 在 `native-inverse-trig.ts` 追加 finite `atan2l` 与 `0x184970` 实际消费的 direct-kernel `tanl`。这里的 static port 不等同于完整 calendar 或 chart parity。

已确认 representation：

| Field | Value | Evidence |
|---|---:|---|
| Sign bit | high qword `0x8000000000000000` | `0x195aa1`, `0x195c83`, `0x195bd0` |
| Exponent bits | high qword bits `48..62` | `0x195aa4`, `0x195ca3`, `0x195b6d..0x195b71` |
| Exponent bias | `0x3fff` | `0x195b79`, `0x195c9c`, double bias delta `0x3c00` at `0x195a7d` |
| Fraction bits | 112 total, high 48 bits in high qword plus low qword | high mask `0xffffffffffff` at `0x195b9f`; hidden bit `0x1000000000000` at `0x195bac` |

已移植的 conversion/compare/arithmetic helper：

| Helper | Evidence | TypeScript Target | Boundary |
|---|---|---|---|
| double -> binary128 | `0x195a00` | `nativeDoubleToBinary128Bits` | Handles zero sign, normal, subnormal, inf/NaN bit layout. |
| binary128 -> double | `0x196270` | `nativeBinary128BitsToDouble` | Handles signed zero, normal, double subnormal, inf/NaN, overflow, and round-to-nearest-even. |
| binary128 -> int32 | `0x195b60` | `nativeBinary128BitsToInt` | Matches native truncation and saturation branch at exponent `>= 0x401f`. |
| binary128 -> uint64 | `0x195be0` | `nativeBinary128BitsToUint64` | Returns `0` for negative or absolute values below `1`, saturates at exponent `>= 0x403f`, and truncates finite values; used by the `0x181490` cold packed decode path. |
| int32 -> binary128 | `0x195c60` | `nativeIntToBinary128Bits` | Handles signed int32 including `-0x80000000`. |
| compare, unordered positive | `0x195130` | `nativeBinary128Compare0x195130` | Returns `-1/0/1` for ordered less/equal/greater; NaN/unordered returns `1`. |
| compare, unordered negative | `0x1951f0` | `nativeBinary128Compare0x1951f0` | Returns `-1/0/1` for ordered less/equal/greater; NaN/unordered returns `-1`. |
| add | `0x194c80` | `nativeBinary128Add0x194c80` | Exact integer alignment with binary128 round-to-nearest-even; static port, not chart parity. |
| subtract wrapper | `0x196240` | `nativeBinary128Subtract0x196240` | Flips the second operand sign bit and delegates to the add helper, matching the native wrapper. |
| multiply | `0x195cd0` | `nativeBinary128Multiply0x195cd0` | Sign is operand sign XOR; finite product is rounded back to binary128 round-to-nearest-even; zero/infinity boundaries are covered. Static port, not chart parity. |
| divide | `0x1952a0` | `nativeBinary128Divide0x1952a0` | Sign is operand sign XOR; finite quotient is rounded back to binary128 round-to-nearest-even; zero/infinity boundaries are covered. Static port, not chart parity. |
| floor | `floorl` PLT `0x19a380` | `nativeBinary128Floorl0x19a380` | Clears fractional binary128 bits without converting through double; negative non-integers round toward negative infinity, signed zero/infinity are preserved, and NaN is quieted. |
| floating remainder | `fmodl` PLT `0x19a410` | `nativeBinary128Fmodl0x19a410` | Aligns finite binary128 mantissas and takes an exact integer remainder; result sign follows the dividend, with zero/infinity/NaN boundaries covered. |
| two-argument arctangent | `atan2l` PLT `0x19a440` | `nativeBinary128Atan2l0x19a440` | Ports the AOSP Bionic ld128 finite-input quadrants and `atanl` coefficient path used by `0x184970`; non-finite inputs are outside this scoped port. |
| tangent | `tanl` PLT `0x19a450` | `nativeBinary128Tanl0x19a450` | Ports the `abs(x)<pi/4` direct kernel consumed by `0x184970`; medium/large argument reduction remains explicitly unsupported. |

仍未完整移植的 arithmetic/helper 地址：

| Helper | Address | Current reading |
|---|---:|---|
| libm `cosl` / `sinl` PLT stubs | `0x19a420` / `0x19a430` | Medium argument-reduction paths are static-ported from the AOSP Bionic ld128 operation order; inputs outside the signed-int32 quotient range are rejected, so full libm parity is not claimed. |
| libm `tanl` remaining paths | `0x19a450` | Only the direct kernel required by `0x184970` is ported; other quadrants still require the Bionic `rem_pio2l` path. |

边界：

- `src/engine/native-numeric.ts` 可被后续 `0x181490` port 使用为 numeric substrate。
- 当前没有声称 `0x181490` 的 mode 0/1 numeric paths 已完成；这些 helper 只是后续 port 的 numeric substrate。
- 这些 helper 是 C++/compiler numeric support，不是紫微排盘语义字段；不得把 binary128 转换通过测试解读为 calendar parity。

## Native Shared Piecewise Transform `0x183380` / `0x183830`

2026-07-10 已将 `0x181490` 四次调用的 shared transform `0x183830` 及其唯一 native dependency `0x183380` 移植到 `src/engine/native-transform.ts`。两者都按中性 numeric transform 命名；没有从函数形状推断历法语义。

| Item | Native evidence | Static port boundary |
|---|---|---|
| `0x183830` wrapper | FDE `[0x183830, 0x183897)`; input/output in `xmm0`; calls at `0x1816b6`, `0x1817d1`, `0x181897`, `0x1819ae` | finite binary128 only, round-to-nearest-even |
| Wrapper operation order | divide by double `365.2425`; add int32 `2000`; call `0x183380`; divide by double `86400` | each conversion/arithmetic step uses the existing binary128 substrate in native order |
| `0x183380` piecewise transform | FDE `[0x183380, 0x183827)`; table path below `2015`, bridge path `2015..2115`, quadratic path above `2115` | branch identity and exact low/high limbs are tested at interior values and boundary +/-1 ULP |
| Raw table | VA/file offset `0x84510`, row stride `0x50`, 21 rows x 5 binary128 values `[x0,c0,c1,c2,c3]` | all 105 values stay as raw 16-byte words; no JavaScript-number round trip |
| Table integrity | APK slice `0x84510..0x84ba0`, length `0x690` | SHA-256 `eccd3c79a1ab13ca5ada8cfbe6aafc9a64e8d1c29ef7d8cd27df2bcd9ede42ef` |
| Repeated boundary add | native add call sites `0x1833bb` and `0x1834bf` both compute the upper bridge boundary | static port keeps both additions separate so operation order remains visible |

验证边界：

- Wrapper 的 5 个 exact vectors 覆盖普通 row、`2015`、`2115` 和 `-500` 输入构造。
- 另有 9 个由独立 `Fraction` + per-operation binary128 nearest-even evaluator 生成的 direct vectors，覆盖 nonzero low limb、1900/2015/2115 前后 1 ULP 和 branch selection。
- `0x183380/0x183830` 只移除了 `0x181490` dependency graph 中一个 shared numeric helper；interpolation 已另行实现为 static port。
- 本段 shared numeric helper、`0x181490` secondary cold path 与 `0x182880` context refill 已组合；剩余未完成项是 `0x14bed0/0x14dbd0` calendar output parity。

## Mode Transform Dependency Boundaries

2026-07-10 继续确认了 `0x181490` 两个 mode-specific transform 的边界。源码 contract 使用中性 `transformHelperAddress`，不再使用未经证明的 solar 命名。

| Helper | Function boundary and caller | Remaining direct blockers |
|---|---|---|
| `0x186e40` | FDE `[0x186e40, 0x187090)`; only observed caller `0x181870` in mode 0 | Implemented in `native-mode-transform.ts`: 13 APK double constants, `cosl` x2, `sinl` x1, fixed `0x183d40(xmm0, 0, 0, 8)`, and native binary128 operation order; no `0x181490` or calendar parity claimed |
| `0x1838a0` | FDE `[0x1838a0, 0x183d33)`; called twice by `0x1861d0` | Implemented in `native-periodic-correction.ts`: ten ordered `sinl` terms, APK binary128 constants, first amplitude double slope, and final `/100/(648000/pi)` operation order |
| `0x185800` | FDE `[0x185800, 0x1859b1)`; observed callers `0x14b2a5`, `0x14b5d1`, `0x14cfa3`, `0x14d341`, `0x14de2c`, `0x14eda8` | Implemented in `native-angle-series.ts`: fixed `0x183d40(x,0,0,-1)`, `0x1838a0`, eccentricity cosine correction, and final `0x194c80` add of `pi`; five exact binary128 vectors lock the operation order |
| `0x184970` | FDE `[0x184970, 0x185152)`; direct caller `0x14dbd0@0x14df07` | Implemented in `native-angle-transform.ts`: precision `50` `0x183d40`, node/obliquity/eccentricity/nutation terms, 8 `cosl`, 3 `sinl`, one `tanl`, one `atan2l`, two `fmodl`, native angle wrapping, and final `/ (2*pi)`; four exact binary128 vectors lock the orchestration |
| `0x1861d0` | FDE `[0x1861d0, 0x1868d2)`; observed callers include `0x18197b` and four calendar-side sites | Implemented in `native-iterated-correction.ts`: two correction passes using table-0 `0x183d40` precision `10/-1`, `0x1838a0`, eight `sinl`, two `cosl`, and original-input residual updates |
| `0x1842b0` | FDE `[0x1842b0, 0x184969)`; observed table-0 precisions `3/20/-1` all clamp to the full three-table path | Implemented in `native-mode-one-series.ts`: entry polynomials, `x > 10` correction, three full binary128 table orders, and `cosl` per six-value record |
| `0x185160` | FDE `[0x185160, 0x18561c)`; only observed caller `0x185c11` inside `0x1859c0` | Implemented in `native-mode-one-denominator.ts`: twelve ordered `sinl` terms with integer amplitudes `914..5` |
| `0x1859c0` | FDE `[0x1859c0, 0x1861c5)`; observed callers `0x14cd55` and mode-1 `0x18179e` | Implemented in `native-mode-one-correction.ts`: three passes, one `0x185160` denominator, direct `cosl` x3 and `sinl` x4 |
| `0x1868e0` | FDE `[0x1868e0, 0x186e3e)`; only observed caller `0x18168f` in mode 1 | Implemented in `native-mode-one-transform.ts`: `cosl` x6, `sinl` x3, fixed nested `0x1842b0(xmm0, 0, 20)`, and residual update |

推进边界：binary128 中等范围 `sinl/cosl`、两组表系列、mode-specific transform/correction helpers、`0x181490` mode 0/1 路径、构造器初始资产与 `0x182880` context refill 已通过 characterization vectors。下一步处理 `0x14bed0/0x14dbd0` calendar output parity。

2026-07-18 已确认 `0x1859a6` 是调用 `0x194c80` 将 `pi` 加到累计结果，不是除以 `pi`。`0x185800` 的 static port 严格保留该顺序；它消除了 `0x14dbd0@0x14de2c` 的一条直接数值依赖，但不扩大为 calendar parity 声明。

2026-07-18 已确认 `0x184970` 的三个 double-derived 常量必须先按 SSE double 运算再转 binary128：`648000/pi`、`20.5/(648000/pi)` 与 `(648000/pi)/pi`。尤其 `0x184de5..0x184e02` 使用第三个值作为偏心率修正除数，不能替换成 `648000/pi`。`native-angle-transform.ts` 保留该顺序，并以 `-680/36525` 的 1998 邻近输入锁定输出 limbs；这仍不等同于 `0x14dbd0` 输出结构 parity。

2026-07-16 已进一步组合 `0x181490` mode 0：entry raw target 在 `0x1814cf` 加 `0x256859`，以 `records[0]-7` 和固定 `0x252f47` 在 `0x1815d6/0x1815ea` 选择插值或 `0x1817db` 数值路径；数值路径同时覆盖 provisional window `[1200,85200]` 和 `0x1861d0` iterated fallback。

2026-07-16 已完成 `0x1842b0` 已观察调用路径：`0x84cc0[0]` 的有符号相对偏移 `0x11b610` 指向 `0x1a02d0` relocation 指针组，三段子表依次是 `0xdf6a0..0xe9c60`、`0xe9c60..0xed440`、`0xed440..0xed500`，共 `0xde60` bytes，SHA-256 为 `697fb572347570e6cf8eb5bcc128406fb4e63e30bd8fad2354ea1fdc12cacf87`。precision `3/20/-1` 在原生选段公式中都达到 clamp 上限，因此 static port 只保留实际需要的全表路径；每条六值记录是振幅加五项相位系数，相位为 `c1 + x*c2 + (x²/10000)*c3 + (x³/1e8)*c4 + (x⁴/1e8)*c5`。

2026-07-16 已组合 mode 1 热路径：`0x181490` mode 1 保留 `ctx+0x0` records，使用 offset `14`；`0x181614` 以 `29.5306` 归一化后调用 `0x1868e0`，在 `[1800,84600]` 秒窗口外调用 `0x1859c0`。

2026-07-16 已闭合 `0x181be3..0x1822c4` secondary cold path。mode 1 使用 `29.5306` 周期、三项 `cosl` correction 与 `floor(value+0.5)`；mode 0 使用 `365.2422/24` 周期并调用 `0x182340`，该 helper 包含 5 次 `cosl`、1 次 `sinl` 及两轮 residual。两种 mode 都按距最后 record boundary 的周期索引读取对应 libc++ ASCII marker string；marker `1` 加一、`2` 减一，索引等于长度不修正，超过长度显式报错。`nativeContextSample0x181490` 在提供 marker 时返回解析值，未提供时保持命名的 `secondary-cold-path`，不伪造 context 数据。

## Native Tables

`.data.rel.ro` 文件内容多为零，真实指针由 `.rela.dyn` 的 RELATIVE relocation addend 填充，不能直接把文件字节当表。

已确认 relocation 表：

- `0x19eb20`, count 159
  - 0-59: 六十甲子。
  - 60-69: 天干 `甲乙丙丁戊己庚辛壬癸`。
  - 82-105: 两套地支顺序。
  - 106-158: 称骨/命格长文本。
- `0x19f020`, count 601
  - 包含地支、天干、星曜、十二长生、博士十二神、将前、岁前等排盘表。
- `0x1a5ca0`, count 48
  - lunar month/day names: `冬 腊 正 二 三 四 五 六 七 八 九 十` 与 `初一` 等。

## Known Strings

| Address | Text |
|---:|---|
| `0x71ed7` | `$$` |
| `0x1eb53` | `check input` |
| `0x1a21e` | `输入的信息有误` |
| `0x6bc1f` | `1` |
| `0x200a5` | `2` |
| `0x789fa` | `男` |
| `0x6cd19` | `女` |

## Current Gaps

- `checks` 生成算法未还原；只知道 native 要求长度 18，并会拆成 6 组 3 字符做校验和时间窗口计算。
- `0x14dbd0` 已移植 1998 fixture 所在 cache 范围的主路径；跨 cache rollover 仍需更多 native 边界样本。
- `0x16d020` JSON serializer 的 canonical 字段已通过 APP 原生 JSON 逐字段 parity，但未追求无意义的字节序/键序一致。
- 当前只锁定一组完整 APP 黄金样本；仍缺女性、子时、节气、闰月、不同经度和 cache rollover 样本矩阵。
- 5205-12-17 23:12:51、经度 120 的 mode-2 完整构建在 `native-mode-one-series -> native-trig` 进入尚未移植的大参数 `rem_pio2l` 路径；下游盘面层已由转录 fixture 核对，但完整 calendar parity 仍受此 blocker 限制。
- 2026-07-30 的随机事件回归发现，远年 mode-0 太阳记录会先失去严格单调性，再导致农历月边界错位。runtime 现于 `0x182880` refill 后立即验证 25 条太阳记录；失序时显式报 `native-context-refill:non-monotonic-solar-record-cache`。这是一道防伪造盘的范围守卫，不代表远年 cache rollover 已经完成。

## Native Year-Stem Stars `0x1628d0`

2026-07-18 已移植年干星系函数 `[0x1628d0, 0x16420b)` 到 `native-year-stem-stars.ts`。函数从 calendar adapter `+0x110` 取年干，在 `0x19f080` 中定位十干索引。

| 分层 | 星曜 | 原生证据 |
|---|---|---|
| 相对定位 | 禄存表 `0x1a0180`；擎羊=禄存 `+1`；陀罗=禄存 `-1` | direct insert `0x162a87`，shift calls `0x162b0c` / `0x162cb5` |
| 基础年干表 | 天魁、天钺、天官、天福、截空、副截、天厨 | `0x19fb70..0x19fd50`，每表 10 项 |
| 扩展年干表 | 厨贵、太极、科名、节度、文星、福星、红艳、唐符、国印、昌贵 | `0x19fda0..0x1a0070`，只在 `context+0x450 == 1` 时插入 |
| 容器 | 全部星曜写入命中宫位 node `+0x170` | 每次 `0x17b480` 后的 `addq $0x170` |

`0x1635d6` 的比较是明确开关边界：假时直接跳过厨贵至昌贵，不影响禄存至天厨。1998 戊干 fixture 固定索引 4，原生表样例包括禄存巳、擎羊午、陀罗辰、天魁寅、天钺午。

## Native Remaining Stars And Palace Cycles `0x164d10`

2026-07-18 已移植 `[0x164d10, 0x169552)` 正常语义路径到 `native-remaining-stars.ts`。`0x169552` 后主要是前述容器循环的替代分支和异常清理；函数 FDE 延续到 `0x16b093`，不能把清理尾部误当成另一套排盘函数。

| 分层 | APK 逻辑 | 写入位置 |
|---|---|---|
| 火星、铃星 | 年支四组三合基点，再按时支索引调用 `0x176260` | node `+0x170` |
| 天贵、恩光 | `辰 + 日 + 时 - 2`；`戌 + 日 - 2 - 时` | node `+0x170` |
| 天才、天寿 | 命宫/身宫分别加年支索引 | node `+0x170` |
| 天伤、天使 | 查找交友宫、疾厄宫后直接插入 | node `+0x170` |
| 岁殿、斗杓 | 仅 `context+0x450 == 1`；岁殿按有序六十甲子集合，斗杓=`时支 + 月 + 3` | node `+0x170` |
| 旬空、副旬 | key=`mod12(年支索引-年干索引)` 查六组空亡；阴干交换主副 | node `+0x170` |
| 长生十二神 | 五行局决定起点；`阳男/阴女` 顺，`阴男/阳女` 逆 | node `+0x68` |
| 博士十二神 | 禄存宫起；`阳男/阴女` 顺，`阴男/阳女` 逆 | node `+0x80` |
| 将前十二神 | 年支三合组决定起点，固定顺行 | node `+0x98` |
| 岁前十二神 | 年支宫起，固定顺行；索引 7 的龙德另插星曜数组 | node `+0xb0` 与 `+0x170` |

岁殿输出只落子、寅、辰、午、申、戌六宫。六组比较常量合并后覆盖完整六十甲子；APK 同时在辰组和后续午组比较 `乙卯`，但辰组先命中并跳回主链，因此实际输出为辰。实现保留这一有序 `find`，没有把集合重排为无序映射。

1998 戊寅、正月廿四、巳时、命酉身未、木三局、阳男 fixture 的星曜、长生、博士、将前和岁前字段，以 ARM64 原生 JSON 逐宫锁定；详见 `tests/unit/app-golden-parity.test.ts`。这一组修正覆盖了早期使用错误五行局导致的锚点偏移。

2026-07-20 追加的 2717 丁丑、腊月初一、申时、命巳身酉、火六局、阴女 APP 人工转录样本进一步锁定顺逆分支。x86_64 `0x168a38..0x168ab7` 读取 chart `+0x128`，先比较 UTF-8 `阳男`，再比较 `阴女`；任一命中即进入 `0x168acc` 起的 `+index` 博士循环。转录盘的长生 `寅长生..子胎、丑养` 与博士 `午博士..子飞廉` 同时命中该顺行分支。旧 port 错把 `阳女` 纳入顺行，现已修正。

2026-07-22 追加的 5205 乙巳、冬月初二、子时、命身同子、火六局、阴女转录样本复用同一顺行分支，并新增 `hourCode=0` 子时、命身同宫、乙年宫干、冬月及农历初二覆盖。由已知农历字段组合得到的十二宫、星曜/庙旺、四化、大限/小限和四组周期与转录逐项一致；该结论不越界到 5205 calendar parity。

## Native Transformations `0x16b0a0` / `0x176530`

2026-07-18 已移植四化记录构造器 `0x176530` 与 orchestrator `0x16b0a0..0x16b985` 及其 out-of-line 正常块 `0x16b990..0x16bd3c` 到 `native-transformations.ts`。全局 chart 构造器 `0x150700..0x1511b0` 直接构造十干四化目标星表，顺序均为禄、权、科、忌：

| 干 | 禄 | 权 | 科 | 忌 |
|---|---|---|---|---|
| 甲 | 廉贞 | 破军 | 武曲 | 太阳 |
| 乙 | 天机 | 天梁 | 紫微 | 太阴 |
| 丙 | 天同 | 天机 | 文昌 | 廉贞 |
| 丁 | 太阴 | 天同 | 天机 | 巨门 |
| 戊 | 贪狼 | 太阴 | 右弼 | 天机 |
| 己 | 武曲 | 贪狼 | 天梁 | 文曲 |
| 庚 | 太阳 | 武曲 | 太阴 | 天同 |
| 辛 | 巨门 | 太阳 | 文曲 | 文昌 |
| 壬 | 天梁 | 紫微 | 左辅 | 武曲 |
| 癸 | 破军 | 巨门 | 太阴 | 贪狼 |

每条原生记录 stride 为 `0x68`：`+0x00` 四化名、`+0x18` 目标星、`+0x30` 目标地支、`+0x48` 目标宫名、`+0x60` 强度。属性固定为禄金、权火、科木、忌水；作用字符串由 chart `+0x20` 映射为放大、阻断、持续、终止。

强度表按子丑寅卯辰巳午未申酉戌亥排列，四行位于 `0x83e50 / 0x83e80 / 0x83eb0 / 0x83ee0`：

```text
禄 50 50 40 40 50 20 10 60 80 99 90 60
权 10 20 80 90 90 90 99 90 30 20 50 20
科 80 90 90 95 80 20 10 15 10 10 30 80
忌 99 95 35 20 30 30 10 30 80 90 50 80
```

orchestrator 先把生年干四化写入 chart `+0x420`，再按每宫宫干生成四条记录写入 node `+0xf8`。目标回到发起宫的记录复制到该 node `+0x118`；目标落发起宫对宫的记录复制到目标 node `+0x128`。这两个容器不重新计算四化。

`0x16b9a0..0x16bd3c` 还会以 libc++ `std::map<string,...>` 的 UTF-8 字节序遍历所有发起宫及 node `+0xf8` 记录。遇到禄，通过记录 `+0x30` 目标地支找到目标 node，把发起 node `+0x20` 的地支字符串追加到目标 `+0x140`；遇到忌则追加到目标 `+0x158`。所以 `追禄/追忌` 是按目标宫存放的反向来源地支列表，不是递归图链。

1998 戊年 fixture 的生年四化锁定为：贪狼禄到丑官禄 50，太阴权到子田宅 10，右弼科到戌父母 30，天机忌到辰疾厄 30。宫干层样例包括寅交友太阳自化忌、酉命宫文曲自化科；子田宅接收午子女的对宫太阴权，辰疾厄接收戌父母的对宫天梁禄与左辅科。

同一 fixture 的反向列表样例：子宫追禄 `[巳,辰]` / 追忌 `[丑,卯,申]`，辰宫追禄 `[丑,卯,戌]` / 追忌 `[午]`，酉宫追禄 `[亥,子,寅]` / 追忌 `[未,辰]`。数组顺序来自 native `std::map` 遍历，不是传统十二支顺序。

## Native JSON Serializer `0x16d020`

2026-07-18 已静态还原 serializer 的 key 集与宫位 node 布局。`0x16ce90` 只是一个短前置遍历；实际的大型 JSON 序列化路径从 `0x16d020` 开始，正常返回在 `0x172a0b`。

顶层其他信息的 key 顺序为：性别、五行局、命主、身主、身宫、命宫、经度、真太阳时、钟表时间、农历年、农历月、农历是否闰月、农历日、农历月计数、农历日计数、小时数、分钟数、秒数、时支、时干、日干、日支、月干、月支、年干、年支、立春年干、立春年支、最近节气、层1.1、层1.2、层2.1、层2.2、层3.1、层3.2。

每宫 key 及已确认偏移：

| Key | Node offset / source |
|---|---|
| 宫 | `+0x38` 宫名；`+0x20` 是外层地支 key |
| 宫干 | `+0x50` |
| 长生 / 生年博士 / 生年将前 / 生年岁前 | `+0x68 / +0x80 / +0x98 / +0xb0` |
| 大限 / 小限 | `+0xc8 / +0xe0` |
| 四化 / 自化 / 冲化 | `+0xf8 / +0x118 / +0x128` |
| 追禄 / 追忌 | `+0x140 / +0x158` string vectors |
| 星列表 | `+0x170` |
| 庙旺与星级详情 | `+0x188` map |

其余宫位 key 为身宫、所有元素列表、庙旺、级别值、星庙旺；最外层分组 key 为其他信息与十二宫信息。其中对宫入化的原生名称是 `冲化`，不应在 canonical chart 中无依据地改叫 generic opposite incoming。

## Native Star Brightness `0x16bf60`

2026-07-18 已移植星曜庙旺函数 `[0x16bf60, 0x16c453)` 到 `native-star-brightness.ts`。该函数遍历每宫 node `+0x170` 的星名，只处理全局 chart `+0x50` 中存在的星曜亮度表；不在表中的星保持空状态，不套用外部规则。

chart 构造器 `0x152e27..0x15462e` 在栈上直接创建 60 条、每条 `0x48` 的三字符串记录：星名、五行、按十二地支排列的 12 位状态码。随后 `0x154640..0x154939` 将每一位状态码按 `0x19f3d0` 的子丑寅卯辰巳午未申酉戌亥顺序装入 `chart+0x50` 的星名到地支映射。完整 60 条原始码已逐条静态写入实现并由测试锁定数量、长度和字符范围。

状态码转换在 `0x16c2f0..0x16c346`：先把单字符码转整数，再以 `0x83e30` 的八项相对偏移表取文本。精确映射为 `0:"", 1:陷, 2:不, 3:平, 4:利, 5:得, 6:旺, 7:庙`。结果写入 node `+0x188` 的星曜详情映射，文本在 value `+0x00`、数字码字符串在 value `+0x18`。

1998 fixture 的十四主星亮度锁定为：紫微巳旺、天机辰庙、太阳寅平、武曲丑庙、天同子庙、廉贞酉不；天府亥庙、太阴子庙、贪狼丑庙、巨门寅旺、天相卯庙、天梁辰庙、七杀巳旺、破军酉旺。

## Native Three-Layer Gua `0x16c4c0` / `0x178f00`

2026-07-18 已移植 `[0x16c4c0,0x16ccf2)` 到 `native-three-layer-gua.ts`。函数先按 `0x19f3d0` 的十二支顺序扫描宫节点，但明确跳过子、丑，再把 node `+0x50` 的宫干与农历年干比较；命中的宫支写 chart `+0x390`。因为十二宫干序列在子、丑重复前两干，跳过这两宫后命中值唯一。这个首字段就是来因宫所在支。

ARM64 入口 `0x160288` 的运行时读取证明，函数消费 APP `hourCode` 与固定 minute 字段，而不是公历日。若 `hourCode` 为偶数，先令 `adjustedMinute = minute + 60`；随后以 native magic divide 得到 `firstShift = trunc(adjustedMinute / 10)`，并得到 `secondShift = adjustedMinute % 12`。若 chart `+0xc8` 精确等于 `逆`，两个位移同时取负。两次均调用 `0x176260` 从来因宫支移动。

helper `0x178f00` 的完整映射是 `子->寅、丑->卯、寅->子、卯->丑`，其余八支返回空字符串。`0x16ce90` 随后的 JSON serializer 把六个字段原样输出为：chart `+0x390/+0x3a8/+0x3c0/+0x3d8/+0x3f0/+0x408` 对应 `层1.1/层1.2/层2.1/层2.2/层3.1/层3.2`。

1998-02-20 09:40 fixture 的 APP `hourCode=10`、固定 minute `30`，戊年宫干命中午，阳男方向为顺。故 `adjustedMinute=90`、两个位移为 `9` 与 `6`，六字段为 `午、空、卯、丑、子、寅`。这六个字段与 ARM64 黄金 JSON 完全一致。

## Runtime Architecture And Validation

正式链路已落地：

```text
出生时间/地点或经度/性别
  -> APP mode-2 normalization
  -> C++ calendar numeric/table ports
  -> palace/star/transformation/gua ports
  -> canonical chart.json
  -> chart.txt + chart.html + evidence.json
  -> ziwei-natal
```

`src/cli/ziwei-chart.ts build` 已是公开排盘入口，不再有 missing-capability gate。运行时只依赖 Node.js 与本仓 TypeScript 编译产物，不调用 APK、Qiling、Python 或第三方排盘引擎。

1998-02-20 09:40、男、杭州的 ARM64 原生 JSON 已保存为 fixture，并由 `app-golden-parity.test.ts` 对 canonical 字段逐项核对。当前验证边界仍是单一样本；下一阶段不是再补一套网上算法，而是采集女性、子时、节气/闰月、经度和 cache rollover 的 APP 原生黄金矩阵。
