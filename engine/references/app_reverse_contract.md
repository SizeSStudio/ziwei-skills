# 紫微星语 APP 排盘协议逆向记录

## Source Of Truth

目标 APK：`/Users/sizes-studio/Downloads/app.apk`

```text
SHA-256 f4d58744f71fed091e712a9a710ae94a41255531bec4097e400dc4cd82118ac4
native  libziweixingyu.so
JNI     Java_com_ziweixingyu_ziweixingyu_tools_getzwp
C++     zwds::get2(std::__ndk1::basic_string<char, ...>)
```

排盘 runtime 不调用 APK；APK 只作为逆向证据和黄金样本来源。网上口诀、开源排盘库和网页结果不属于证据。

## Gregorian Natal Protocol

ARM64 动态黄金样本确认，公历出生盘使用 mode 2，body 正好 13 个字段：

```text
2|YYYY|M|D|hourCode|30|30|longitude|-8|genderFlag|0|0|0
```

| 字段 | 已确认语义 |
|---|---|
| `2` | 公历出生盘 mode |
| `YYYY|M|D` | 用户出生公历日期 |
| `hourCode` | APP 两小时 UI 编码；09:40 映射 `10` |
| `30|30` | APP 固定传入 native calendar 的 minute/second 字段 |
| `longitude` | 三位小数经度；杭州为 `120.155` |
| `-8` | APP 东八区字段的符号约定 |
| `genderFlag` | `1=男`，`2=女` |
| `0|0|0` | mode-2 尾部开关 |

1998 杭州男命测试 body：

```text
2|1998|2|20|10|30|30|120.155|-8|1|0|0|0
```

完整 JNI 输入还带 APK 的 checks 前缀，但本地复刻直接从 body 后的参数进入已移植逻辑，不需要生成 checks。

## Mode 3 Is Not The Gregorian Natal Contract

Java 静态代码中还存在：

```text
<checks>#3|YYYY|M|D|hourCode|30|30|longitude|-8|sexFlag|0|0
```

这是另一条 12 字段 mode-3 路径。早期仅凭 Java 构造点把它误认为公历出生盘；ARM64 `get2` 黄金运行已经推翻该假设。正式 runtime、测试和文档必须使用 mode 2，mode 3 只保留为历史逆向线索。

## APP Time Labels

黄金 JSON 的中文键与直觉相反，必须按原始输出保留：

- `真太阳时`：`1998-02-20 10:30:30`
- `钟表时间`：`1998-02-20 10:43:39`

Canonical chart 另保留用户原始输入 `1998-02-20 09:40:00`，避免三个时间概念混用。

## Golden Fixture

原生 ARM64 输出保存在：

```text
tests/fixtures/app-1998-02-20-103030-male-hangzhou.raw.json
```

`tests/unit/app-golden-parity.test.ts` 逐字段核对：

- 性别、五行局、命主/身主、命宫/身宫、经度、时间、四柱和节气标号。
- 十二宫宫名/宫干、星曜、庙旺、大限、小限和四组周期字段。
- 四化、自化、冲化、追禄、追忌。
- 三层卦六字段。

该 fixture 的确认结果包括：阳男、木三局、命酉、身未、来因午、命主文曲、身主天梁，以及三层卦 `午/空、卯/丑、子/寅`。

## Validation Boundary

当前完整 APP golden parity 只证明上述单一样本。算法模块均来自 native 指令和表，但要证明全域一致仍需补充：

- 男女样本。
- 子时跨日与节气边界。
- 闰月/农历月界。
- 不同经度与时区。
- native calendar cache rollover。

对外可以说“指定黄金样本逐字段一致”，不能把它扩写为“所有日期已经证明与 APP 一致”。

## Transcribed Characterization Fixtures

`tests/fixtures/app-2717-12-25-162829-female-transcribed.json` 保存 2026-07-20 用户从 APP 人工转录的随机事件盘：丁丑年、腊月初一、申时、阴女、命巳身酉、火六局。`tests/unit/app-transcribed-characterization.test.ts` 从已知农历字段重新组合并核对十二宫宫名/宫干、全部转录星曜与庙旺、四化、大限、小限、四组周期、命主/身主及来因宫。

`tests/fixtures/app-5205-12-17-231251-female-transcribed.json` 保存 2026-07-22 的第二组随机事件盘：乙巳年、冬月初二、子时、阴女、命身同在子、火六局。用户确认随机事件盘默认经度为 `120.000`；mode-2 normalization 因而锁定 `hourCode=0` 与 body `2|5205|12|17|0|30|30|120.000|-8|2|0|0|0`。从已知农历字段向后的十二宫、全部转录星曜/庙旺、四化、限运、周期、命主/身主和来因宫逐项一致。

这两组 fixture 的证据类型是 `transcribed-sample`，不是 `golden-sample`：没有原始 APP JSON、自化/冲化/追禄/追忌与三层卦六字段，因此不参与完整 Gregorian/calendar parity 或 `golden-parity` 标记。它们可以证明转录覆盖字段上的女性、乙宫干、腊月/冬月、子时、命身同宫和阴女顺行 characterization，不能单独证明公历换算或真太阳时计算。以经度 120 运行 5205 完整链路时，当前 static port 在 `native-trig:unsupported-large-argument-reduction` 显式停止；这是远未来历法能力缺口，不是盘面字段差异。

## Input Profiles And Longitude Provenance

`natal` 与 `random-event` 必须是两个显式输入画像。出生盘默认使用 `natal`：只有调用者明确传入经度，或地点命中已验证经度表，才允许构造 mode-2 body。随机事件盘使用 `--profile random-event` 时，才复现 APP 的 `120.000` 默认值。

Canonical input 用 `longitudeSource` 保存来源：`explicit`、`verified-place` 或 `app-random-event-default`。这个字段是本地审计元数据，不是 APP serializer 字段；它防止把随机起盘的协议默认值误当成真实出生地。

从 `1.3.0` 起，`random-event` 不再把用户给出的分钟和秒错误压成出生盘 mode-2 的固定 `30:30`。它使用实际秒级钟表时间运行已移植的真太阳时链，再以真太阳时的小时和分钟计算三层卦；`natal` 仍保持 mode-2 协议不变。该行为标为 `random-event.actual-clock-derived`，属于本地随机事件输入语义，不冒充 APP mode-2 原生字段。

当前 native 太阳节气缓存的数值路径在远年会失去单调性。运行时在生成农历月边界之前检查 25 条太阳记录严格递增，失败即报 `native-context-refill:non-monotonic-solar-record-cache`，禁止继续生成貌似完整的盘。默认 `random` 命令因此将候选域保守限制在 `[2000, 2040)`，并将 deterministic rejection 记录到 `random-input.json`。

## Derived Palace Topology

APP 原生十二宫节点是排盘真值；本地 canonical JSON 在其上增加 `relations` 便利层，确定性记录对宫、三合宫、相邻宫、主星是否为空及对宫主星名称。该层标记为 `derived`，不参与原生 JSON parity，也不引入任何“空宫借星”的解释规则。
