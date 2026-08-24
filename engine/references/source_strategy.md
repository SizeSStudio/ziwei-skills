# Ziwei Chart Source Strategy

## First Principle

排盘引擎回答的是“给定一套输入规则，输出什么结构化盘”；解读体系回答的是“如何理解这张盘”。两者必须解耦。倪海厦、原始紫微、飞星或紫占的分歧，不应被错误地压缩成“只能选择一个排盘程序”。

## Calculation Profiles

### `ziweixingyu-native`

当前已实现。价值是复现紫微星语特色字段与行为，包括真太阳时链、四化力度、自化/冲化、追禄/追忌、来因宫和三层卦。Native 指令与 APP 黄金样本用于该画像内部的兼容验证，不作为其他画像的裁判。

### `ziwei-doushu-community`

隔离的比较画像。以 `Renhuai123/ziwei-doushu` 的产品结构与公开 TypeScript 模型为工程参考；它依赖的 `iztro` 安星口径与本项目紫占盘存在差异，不能直接承担紫占 canonical chart 的十二宫与星曜事实层。`lunar-javascript` 或等价开源历法库只能在字段级来源可追溯时补充历法覆盖。

接入要求：固定上游 commit/package version，保留 MIT notice，建立与 canonical schema 的 adapter，并以社区样本、传统边界样本和现有 APP 样本做差分矩阵。差异应被记录为 profile difference，而不是自动判错。

### `hybrid-zizhan`

候选画像。十二宫、星曜、来因宫、三层卦、力度和追禄追忌必须优先保持已验证的 native/本地口径；覆盖不足时可替换明确隔离的历法字段，但不能拿社区安星结果补位。每个字段保留自己的 evidence，禁止把两套输出拼接后伪装成单一来源。

## Interpretation Profiles

解释层不进入 `ziwei-chart`：

- `ziwei-natal`：原始紫微的人生结构推演。
- `ziwei-zhanbu`：起念时间、三层卦、正向应卦、物象化与现实校验。
- 倪海厦式格局和断语：可作为隔离的 reference/alternative profile，不作为默认解释。

因此，采用 `ziwei-doushu` 的排盘和产品能力，不等于采用它的倪海厦解读体系。

## Merge Rules

1. 先比较输入语义：子时换日、真太阳时、历法边界、宫干和四化口径。
2. 再比较同名字段；同名不等于同义时保留两个 profile-specific 字段。
3. 只有相同语义且结果一致的字段才能提升为 shared canonical field。
4. Hybrid 字段必须记录 `sourceProfile` 与 evidence；不得用“多数实现如此”覆盖紫占特色字段。
5. 外部数据集可用于覆盖和异常发现，但不能在没有输入语义对齐时充当黄金答案。

## Implementation Order

1. 为 canonical meta 增加 `calculationProfile`，先把当前 native 输出显式化。
2. 建立 `ziwei-doushu-community` differential adapter，只用于比较，不直接进入紫占 runtime。
3. 建立 profile differential report，覆盖现有 1330/1998/2717/5205 样本和子时、闰月、经度边界。
4. 先定义 `hybrid-zizhan` 的历法字段替换表；安星字段只有逐项验证后才可进入合并表。
5. 完成后再决定独立站默认画像；在证据不足前不得用文档宣称已经默认切换。
