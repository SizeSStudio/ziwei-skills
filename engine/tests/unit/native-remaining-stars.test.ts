import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeRemainingStars0x164d10,
  nativeRemainingStarsEvidenceContract,
} from "../../src/engine/native-remaining-stars";

const FIXTURE = {
  lunarYearStem: "戊",
  lunarYearBranch: "寅",
  normalizedLunarMonth: 1,
  lunarDayNumber: 24,
  hourBranch: "巳",
  mingPalaceBranch: "酉",
  shenPalaceBranch: "未",
  bureauNumber: 6 as const,
  genderPolarityLabel0x128: "阳男" as const,
  extendedStarsFlag0x450: true,
};

test("ports remaining stars for the 1998 戊寅 fixture", () => {
  const result = nativeRemainingStars0x164d10(FIXTURE);
  assert.deepEqual(result.placements.map(({ star, branch }) => ({ star, branch })), [
    { star: "火星", branch: "午" },
    { star: "铃星", branch: "申" },
    { star: "天贵", branch: "未" },
    { star: "恩光", branch: "卯" },
    { star: "天才", branch: "亥" },
    { star: "天寿", branch: "酉" },
    { star: "天伤", branch: "寅" },
    { star: "天使", branch: "辰" },
    { star: "岁殿", branch: "午" },
    { star: "斗杓", branch: "酉" },
    { star: "旬空", branch: "申" },
    { star: "副旬", branch: "酉" },
    { star: "龙德", branch: "酉" },
  ]);
});

test("ports 长生, 博士, 将前, and 岁前 fields for the fixture", () => {
  const result = nativeRemainingStars0x164d10(FIXTURE);
  assert.equal(result.cycleDirection, "forward");
  assert.deepEqual(result.longshengByBranch, {
    寅: "长生", 卯: "沐浴", 辰: "冠带", 巳: "临官", 午: "帝旺", 未: "衰",
    申: "病", 酉: "死", 戌: "墓", 亥: "绝", 子: "胎", 丑: "养",
  });
  assert.deepEqual(result.doctorByBranch, {
    巳: "博士", 午: "力士", 未: "青龙", 申: "小耗", 酉: "将军", 戌: "奏书",
    亥: "飞廉", 子: "喜神", 丑: "病符", 寅: "大耗", 卯: "伏兵", 辰: "官府",
  });
  assert.deepEqual(result.generalByBranch, {
    午: "将星", 未: "攀鞍", 申: "岁驿", 酉: "息神", 戌: "华盖", 亥: "劫煞",
    子: "灾煞", 丑: "天煞", 寅: "指背", 卯: "咸池", 辰: "月煞", 巳: "亡神",
  });
  assert.deepEqual(result.annualByBranch, {
    寅: "岁建", 卯: "晦气", 辰: "丧门", 巳: "贯索", 午: "官符", 未: "小耗",
    申: "大耗", 酉: "龙德", 戌: "白虎", 亥: "天德", 子: "吊客", 丑: "病符",
  });
});

test("preserves the ordered APK 岁殿 comparison sets for all sixty ganzhi", () => {
  const contract = nativeRemainingStarsEvidenceContract();
  const stems = [..."甲乙丙丁戊己庚辛壬癸"];
  const branches = [..."子丑寅卯辰巳午未申酉戌亥"];
  const cycle = Array.from({ length: 60 }, (_, index) => stems[index % 10] + branches[index % 12]);
  const compared = new Set(contract.suidianGroups.flatMap(({ ganzhi }) => ganzhi));
  assert.deepEqual([...compared].sort(), [...cycle].sort());
  assert.equal(compared.size, 60);
  assert.ok(contract.suidianGroups[2]?.ganzhi.includes("乙卯"));
  assert.ok(contract.suidianGroups[3]?.ganzhi.includes("乙卯"));

  const yiMao = nativeRemainingStars0x164d10({ ...FIXTURE, lunarYearStem: "乙", lunarYearBranch: "卯" });
  assert.equal(yiMao.placements.find(({ star }) => star === "岁殿")?.branch, "辰");
});

test("honors the 0x450 gate and reverses cycle fields for 阴男", () => {
  const result = nativeRemainingStars0x164d10({
    ...FIXTURE,
    genderPolarityLabel0x128: "阴男",
    extendedStarsFlag0x450: false,
  });
  assert.ok(!result.placements.some(({ star }) => star === "岁殿" || star === "斗杓"));
  assert.equal(result.cycleDirection, "reverse");
  assert.equal(result.longshengByBranch.寅, "长生");
  assert.equal(result.longshengByBranch.丑, "沐浴");
  assert.equal(result.doctorByBranch.巳, "博士");
  assert.equal(result.doctorByBranch.辰, "力士");
});

test("moves 长生 and 博士 forward for the transcribed 2717 阴女 APP case", () => {
  const result = nativeRemainingStars0x164d10({
    ...FIXTURE,
    lunarYearStem: "丁",
    lunarYearBranch: "丑",
    normalizedLunarMonth: 12,
    lunarDayNumber: 1,
    hourBranch: "申",
    mingPalaceBranch: "巳",
    shenPalaceBranch: "酉",
    genderPolarityLabel0x128: "阴女",
    extendedStarsFlag0x450: false,
  });
  assert.equal(result.cycleDirection, "forward");
  assert.equal(result.longshengByBranch.寅, "长生");
  assert.equal(result.longshengByBranch.巳, "临官");
  assert.equal(result.longshengByBranch.子, "胎");
  assert.equal(result.doctorByBranch.午, "博士");
  assert.equal(result.doctorByBranch.子, "飞廉");
});

test("swaps 旬空 and 副旬 for yin stems", () => {
  const result = nativeRemainingStars0x164d10({ ...FIXTURE, lunarYearStem: "乙", lunarYearBranch: "丑" });
  const voidStars = result.placements.filter(({ star }) => star === "旬空" || star === "副旬");
  assert.deepEqual(voidStars.map(({ star, branch }) => ({ star, branch })), [
    { star: "副旬", branch: "戌" },
    { star: "旬空", branch: "亥" },
  ]);
});
