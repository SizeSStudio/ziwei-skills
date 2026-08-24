# 🔮 Ziwei Skills (紫微智械)

> 纯 TypeScript 原生紫微排盘引擎、原始紫微知识库与 Claude Code / Codex 高保真推演 Skill 套件。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

---

## 🌟 核心特性

- 🎯 **事实层与解读层彻底解耦**：
  - **事实层（Engine）**：离线纯 TypeScript 原生计算，内置天文级真太阳时（时差方程 + 经度修正）、二十四节气定位、公历农历精准互转、APK 原生算法对齐与 227+ 项黄金测试。
  - **解读层（Skills & KB）**：拒绝庸俗的“吉凶神煞/算命套话”，基于系统论与**原始紫微 / 翻星摇斗**第一性原理，提供具备高保真现实校验（Yes/No 回证）与改命实操路径的深度推演。
- 📦 **全套三位一体 Skill 矩阵**：
  - `/ziwei-chart`：原生高精度排盘，输出标准化 `chart.json`、结构化 `chart.txt` 与可交互排盘画布 `chart.html`。
  - `/ziwei-natal`：终生命盘深度系统解析（三锚定位、生年四化主线、命身飞化追忌对冲、一六共宗表里互证、正向应卦实操表）。
  - `/ziwei-zhanbu`：针对具体突发事件的紫微紫占推演（心念起卦、分钟级三层卦分针/秒针钟表模型、同音象形物象化）。
- 📚 **开箱即用的完整知识库（KB）**：
  - 包含 14 主星、5 辅星、6 煞星、14 宫位、四化合力、断事方法与紫占方法论的全部 Markdown 知识沉淀与讲义源文。

---

## 🚀 快速上手 (1 分钟一键安装)

### 1. 环境准备
确保本地安装了 [Node.js](https://nodejs.org/) (>= 18.0.0)。

### 2. 克隆仓库与一键安装
```bash
git clone https://github.com/SizeSStudio/ziwei-skills.git
cd ziwei-skills
npm install

# 一键将 skills 挂载到本地 Claude Code / Codex / Agents 环境
npm run install-skills
```

安装脚本会自动检测本地的 `~/.claude/skills`、`~/.codex/skills`、`~/.cc-switch/skills` 等目录并自动建立软链接。

---

## 💻 命令行（CLI）使用指南

在终端中可直接使用 `npm run cli` 进行本地独立排盘：

### 1. 出生盘排盘 (Natal Chart)
```bash
npm run cli -- build \
  --datetime "2000-01-01 12:00" \
  --place "北京" \
  --gender male \
  --out-dir ./output
```
生成的输出文件：
- `./output/chart.json`：事实层全量结构化 JSON（供下游程序与 Agent 读取）
- `./output/chart.txt`：人类与大模型易读的 12 宫四化文本排盘
- `./output/chart.html`：本地浏览器可视化的十二宫排盘看板
- `./output/evidence.json`：排盘算法与历法字段审计证据

### 2. 经度与真太阳时精确排盘
若地点未在内置城市库中，可直接指定经度（如 116.407°E）：
```bash
npm run cli -- build \
  --datetime "2000-01-01 12:00" \
  --longitude 116.407 \
  --gender male \
  --out-dir ./output
```

### 3. 紫占/随机事件三层卦排盘 (Event Chart)
```bash
npm run cli -- build \
  --datetime "2026-08-24 10:12:34" \
  --profile random-event \
  --gender female \
  --out-dir ./output-event
```

---

## 🤖 在 Claude Code / Codex 中使用

安装完成后，在终端启动 Claude Code 或 Codex，即可在任意会话中直接调用：

### 场景一：排盘并深度解析终生命盘
```text
/ziwei-chart 排个盘，张三，男，2000年1月1日 12:00，出生地是北京，排完盘之后直接用 /ziwei-natal 做个解析
```

### 场景二：针对具体突发事情进行紫占推演
```text
/ziwei-zhanbu 我在今天 14:35 突然起念想知道这次跳槽面试能不能过？
```

---

## 🧠 方法论体系：原始紫微第一性原理

本套件严格遵守**原始紫微**与**翻星摇斗**系统论模型，彻底杜绝江湖套话：

### 1. 三大上位公理
- **命盘惯性（合力模型）**：命盘不是宿命论，而是由各大星曜与四化分力合成的一道系统矢量惯性。解盘的本质是计算合力方向与阻力点。
- **宫位关系（立体网络）**：运用“一六共宗（命表疾里、官表田里、财表友里）”与“对宫镜像”解构潜意识与外部环境的深层因果。
- **宫星四化合力（君臣佐使）**：
  - **君**：主事宫与核心矛盾（命宫破局行动底色 + 身宫后天价值收敛点）；
  - **臣**：生年禄权与资源支持网络；
  - **佐**：生年忌、地空地劫与飞化对冲带来的内在审计与限制；
  - **使**：能量传导链与自化触发。

### 2. 五大断事方法动作
1. **星意还原**：所有星曜回归物理第一性原理（贪狼=体积变化/探索，紫微=尊/优秀/标杆，七杀=线与面/直球目标，地空=倒空/腾挪...）；
2. **宫位立太极**：按所问人事动态切换分析坐标系；
3. **正向应卦（硬约束）**：同一组星曜在不同现实行为下吉凶截然相反——给出具体的【对号顺用（吉） vs 不对号阻滞（凶）】实操清单；
4. **追忌网络**：追踪命身飞化冲克，挖掘内心深层的焦虑来源；
5. **现实校验**：输出 4~6 条严格基于盘面硬结构的 Yes/No 历史/生活事实回证问题。

---

## 📁 目录结构

```
ziwei-skills/
├── README.md                      # 快速开始与使用指南
├── LICENSE                        # MIT 开源许可证
├── package.json                   # 根项目配置与 npm 脚本
├── engine/                        # 原生 TypeScript 排盘引擎源码
│   ├── src/                       # 历法算法、节气、真太阳时、排盘核心、渲染器、CLI
│   ├── tests/                     # 227 项自动化单元测试与黄金对齐测试
│   └── tsconfig.json
├── skills/                        # 挂载至 AI 的 Skill 定义
│   ├── ziwei-chart/               # 排盘 Skill
│   ├── ziwei-natal/               # 终生命盘深度解析 Skill
│   └── ziwei-zhanbu/              # 紫占推演 Skill
├── kb/                            # 原始紫微纯知识库
│   ├── README.md                  # 学派立场
│   ├── 星曜/                      # 14 主星、5 辅星、6 煞星
│   ├── 宫位/                      # 12 宫 + 身宫 + 来因宫
│   ├── 四化/                      # 禄权科忌
│   ├── 断事方法/                  # 命盘惯性、宫位关系、正向应卦等
│   └── 紫占方法/                  # 三层卦、物象化、十二相、追禄等
├── sources/                       # 经典核心讲义源文
└── scripts/
    └── install-skills.sh          # 一键安装脚本
```

---

## 🧪 自动化测试

```bash
# 运行全部 227 项单元测试与回归矩阵
npm test
```

---

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 许可证。
