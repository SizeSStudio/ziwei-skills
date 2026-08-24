---
name: ziwei-chart
type: skill
status: 完成
---

# ziwei-chart — 离线纯 TypeScript 原生排盘 Skill

高精度紫微斗数排盘事实层引擎调用 Skill，支持出生盘（终身命盘）与事件盘（紫占三层卦）。

---

## 核心定位

- **事实与流派解耦**：专注于从出生/起念公历时间、经度与性别，确定性计算出标准化 `chart.json`、`chart.txt`、`chart.html` 和 `evidence.json`。
- **真太阳时与历法转换**：内置天文级平太阳时/真太阳时时差方程、公历农历互转、干支年首计算与二十四节气定位。
- **三层卦支持**：精确支持紫占所需的分钟级三层卦（主卦、流十分钟卦、流分钟卦）与四化合力模型。

---

## 快速使用

```bash
# 出生盘排盘 (Natal)
npm run cli -- build \
  --datetime "1998-02-20 09:40" \
  --place "杭州" \
  --gender male \
  --out-dir /tmp/ziwei-chart

# 事件/紫占排盘 (Random / Event)
npm run cli -- build \
  --datetime "2026-07-30 10:12:34" \
  --profile random-event \
  --gender female \
  --out-dir /tmp/ziwei-event
```
