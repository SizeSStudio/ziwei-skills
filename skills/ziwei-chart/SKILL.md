---
name: ziwei-chart
description: Builds canonical Ziwei charts for natal and event/divination use, with explicit calculation profiles, field-level provenance, structured JSON, ziwei-natal text, and visual HTML. Use for chart generation, engine comparison, Ziwei Xingyu compatibility, and Ziwei-zhanbu three-layer chart preparation.
---

# ziwei-chart

`ziwei-chart` 是统一的紫微排盘事实层：从出生或起念时间、地点/经度、性别生成 `chart.json`、`chart.txt`、`chart.html` 和 `evidence.json`。它不绑定单一解读学派；紫微星语 native 复刻是当前已落地的紫占计算画像。`ziwei-doushu / iztro` 可参考其产品与工程结构，但安星口径未经本项目验证，不得直接作为紫占输入源。

## Source Strategy

- 能力完整性优先于对单一软件的全字段复刻；不存在唯一的“排盘真值”，只有明确版本、流派、输入规则和验证范围的计算画像。
- 允许使用历法库和其他开源实现补充明确隔离的历法字段，但必须记录版本、许可证、输入规则和字段来源，不得无标识混合。`ziwei-doushu / iztro` 的安星输出不得直接进入紫占 canonical chart。
- 紫微星语 Java/native、常量表和黄金输出保留为 `ziweixingyu-native` 画像的兼容证据，以及三层卦、力度、追禄追忌等特色字段的研究来源；它不再支配整个产品路线。
- `chart.json` 是唯一 canonical chart；TXT/HTML 只能由它渲染。
- 每张盘必须声明 `meta.calculationProfile`；每个非通用字段必须能回溯 evidence。跨画像差异应并列呈现或通过显式策略合并，不能静默取代。
- 排盘事实与解读流派分离：`ziwei-natal` 和 `ziwei-zhanbu` 可以坚持原始紫微/紫占方法，不必继承通用排盘项目的倪海厦式解读。
- 只有实际通过对应样本的字段才能写 `golden-parity`。该标签只描述某个计算画像的兼容程度，不代表其他画像错误。

当前 CLI 的完整 build 由原生 TypeScript `ziweixingyu-native` 高精度引擎实现；社区项目只作产品/工程参考，未完成字段级差分验证前不得假装已经切换默认引擎。

## Direct Build & CLI

在引擎目录或安装后的路径下构建与执行：

```bash
# 源码构建与运行
npm run build
node dist/src/cli/ziwei-chart.js build \
  --datetime "1998-02-20 09:40" \
  --place "杭州" \
  --gender male \
  --out-dir /tmp/ziwei-chart
```

正式输出：

```text
/tmp/ziwei-chart/chart.json
/tmp/ziwei-chart/chart.txt
/tmp/ziwei-chart/chart.html
/tmp/ziwei-chart/evidence.json
```

地点未收入已验证经度表时，必须显式给经度：

```bash
node dist/src/cli/ziwei-chart.js build \
  --datetime "1998-02-20 09:40" \
  --place "杭州" \
  --longitude 120.155 \
  --gender male \
  --out-dir /tmp/ziwei-chart
```

APP 的随机事件起盘默认经度为 `120.000`；本地 CLI 的出生盘画像为保留审计性仍要求明确地点或经度，不会静默猜测出生地点。

随机事件起盘可显式选择 APP 输入画像，此时且仅此时允许省略经度并使用 `120.000`：

```bash
node dist/src/cli/ziwei-chart.js random \
  --seed "optional-reproducible-seed" \
  --out-dir /tmp/ziwei-event
```

`random` 会生成 `random-input.json`、`chart.json`、`chart.txt`、`chart.html` 和 `evidence.json`。同一 seed 产生同一候选序列；默认年份域为 `[2000, 2040)`，因为当前 native 节气缓存从更晚年份开始可能失去单调性。候选失败会被记录后确定性重试，不能静默换盘。

随机事件也可由调用者指定任意起卦时刻：

```bash
node dist/src/cli/ziwei-chart.js build \
  --datetime "2026-07-30 10:12:34" \
  --profile random-event \
  --gender female \
  --out-dir /tmp/ziwei-event-explicit
```

`random-event` 使用实际秒级钟表时间进入真太阳时链，并用真太阳时的小时和分钟计算三层卦；出生盘 `natal` 仍保留 APP mode-2 固定 `30:30` 协议语义。出生盘默认画像仍必须提供已验证地点或明确经度。输出 `input.longitudeSource` 会区分 `explicit`、`verified-place` 与 `app-random-event-default`，不得把随机事件默认值解释成出生地点。

性别接受 `male/female`、`m/f`、`男/女`。时区默认东八区；其他时区用 `--timezone` 明确指定。

## Handoff

给其他 skill：优先读 `chart.json`；需要中文结构化盘时读 `chart.txt`；需要人工核对时打开 `chart.html`。交给 `ziwei-natal` 或 `ziwei-zhanbu` 时必须保留 `meta.calculationProfile` 和 evidence，解释层不得根据自己偏好的流派偷偷重排。

## Other Commands

只检查 APK mode-2 协议：

```bash
node dist/src/cli/ziwei-chart.js protocol --datetime "1998-02-20 09:40" --place "杭州" --gender male --out-dir /tmp/ziwei-protocol
```

从已有 canonical JSON 重渲染：

```bash
node dist/src/cli/ziwei-chart.js render --chart-json /path/to/chart.json --out-dir /tmp/ziwei-rendered
```

## Verification & Build

```bash
npm run build
```

排盘引擎经过完整的单元测试与黄金真值矩阵对齐，包括历法标签、十二宫、星曜/庙旺、大限/小限、四化/自化/冲化、追禄/追忌和三层卦等计算。

`chart.json` 的每宫 `relations` 是从十二个 APK-native 宫节点确定性派生的结构化关系：对宫、三合宫、相邻宫、是否有十四主星，以及对宫主星列表。它的证据类型是 `derived`，方便独立站和下游 skill 使用，但不属于 APP 原生 JSON 字段，也不包含“借星后如何解释”等流派判断。
