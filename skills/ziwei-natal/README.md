---
name: ziwei-natal
type: skill
status: 完成
---

# ziwei-natal — 紫微斗数终生命盘推演 Skill

基于原始紫微学派（翻星摇斗 / 原始星意）立场，针对个人终生命盘（一生格局、性格特征、关键人生阶段与现实症状）进行结构化推演的 Claude Skill。

---

## 核心定位

- **服务范围**：终生命盘深度分析与单次特定人生主题解答（性格/关系/事业/健康）。
- **学派立场**：坚守**原始星意**还原、拒绝传统吉凶格局断语、强化**正向应卦**与**现实校验**。
- **输出与归档**：
  - `memo.md`：累积式终身分析备忘录，存放在 `cases/natal/<chart-slug>/memo.md`。
  - `replies/<date>-<topic>.md`：单次回答归档。

---

## 目录结构

```
skills/ziwei-natal/
├── SKILL.md                  # Skill 定义、SOP 流程与知识库依赖
├── README.md                 # 本说明文件
└── templates/                # memo.md 模板与回复模板
```

---

## 知识库依赖

- 核心方法论：`wiki/紫微/kb/断事方法/`（正向应卦、星意还原、宫位立太极、关系反推、现实校验）
- 星曜字典：`wiki/紫微/kb/星曜/`（14主星、6煞星、5辅星）
- 归档目标：`cases/natal/<chart-slug>/`
