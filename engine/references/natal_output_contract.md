# Natal Output Contract

`ziwei-chart` 对 `ziwei-natal` 的正式接口是同目录的 `chart.json` 与 `chart.txt`。HTML 只用于人工核对，不参与推演解析。

## Source Boundary

- 命盘必须由 APK-native TypeScript runtime、APP 原生 JSON，或两者校验后的 canonical object 产生。
- 禁止用外部排盘库补空字段。
- `validateCompleteChart` 失败时，JSON/TXT/HTML formatter 必须停止。

## Canonical JSON

顶层固定为：

```text
meta
input
calendar
anchors
palaces[12]
natalTransformations
transformationGraph
triLayerHexagram
evidence
```

`meta.calculationProfile` 必须显式声明计算画像：`ziweixingyu-native`、`ziwei-doushu-community` 或 `hybrid-zizhan`。同一 canonical schema 可以承载不同来源，但字段差异必须由 evidence 解释，不能用一个画像的 parity 标签统治其他画像。

每宫至少包含：

```text
branch / name / stem / markers
stars / majorStars / assistantStars / maleficStars / minorStars
transformationsProduced / selfTransformations / clashTransformations
followLu / followJi
decadeRange / annualAges
changsheng / doctor / generalFront / yearFront
relations.oppositeBranch / relations.oppositePalace
relations.trineBranches / relations.trinePalaces
relations.adjacentBranches / relations.adjacentPalaces
relations.hasMajorStars / relations.oppositeMajorStars
```

`relations` 是从十二宫地支几何与已生成主星列表确定性派生的便利层，证据类型为 `derived`。它不改写任何 APK-native 字段，也不预设空宫是否借星、借多少或如何解释；这些判断属于 `ziwei-natal` 或产品规则层。

四化边固定包含 source branch/palace、目标星、禄权科忌、力度、五行、动作和 target branch/palace。字段定义以 `src/schema/chart.ts` 为准。

## Structured Text

`chart.txt` 是 `ziwei-natal` 的默认输入，必须包含：

- 输入画像、经度来源、用户输入时间、APP 时间、真太阳时、阴历、四柱、性别、五行局。
- 来因宫、命宫、身宫、命主、身主。
- 正好十二个宫段：宫名、宫干、全部星曜/庙旺、四化、自化、冲化、追禄、追忌、大限、小限、小星、长生。
- 三层卦六字段。

示例宫段：

```text
酉宫 (命宫)
宫名：命宫
宫干：辛
宫内星：紫微(旺) 贪狼(不) ...
酉宫产生的四化：
  贪狼化禄99%  -> 酉命宫
自化：...
冲化：...
追禄：...
追忌：...
大限：3~12
小限：...
小星：...
长生：...
```

## Handoff

1. `ziwei-chart build` 生成四个产物。
2. `ziwei-natal` 读取 `chart.txt + 用户问题`。
3. 需要核对追忌、四化力度或三层卦时回查 `chart.json`。
4. `ziwei-natal` 只推演和归档，不维护第二套排盘公式。
