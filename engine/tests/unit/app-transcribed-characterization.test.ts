import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { nativeFiveElementsBureau0x1586a0 } from "../../src/engine/native-five-elements-bureau";
import { nativeHourStars0x15f7f0 } from "../../src/engine/native-hour-stars";
import { nativeLifeBodyLords } from "../../src/engine/native-life-body-lords";
import { nativeMajorLimits0x159170 } from "../../src/engine/native-major-limits";
import { nativeMajorStarAnchors } from "../../src/engine/native-major-star-anchors";
import { nativeMajorStars } from "../../src/engine/native-major-stars";
import { nativeMinorLimits0x1597d0 } from "../../src/engine/native-minor-limits";
import { nativeMonthDayStars0x15f510 } from "../../src/engine/native-month-day-stars";
import { nativeMonthStars0x15caa0 } from "../../src/engine/native-month-stars";
import { normalizeBirthInput } from "../../src/engine/normalize";
import { nativePalaceNames0x157500 } from "../../src/engine/native-palace-names";
import { nativePalaceStems0x156fb0 } from "../../src/engine/native-palace-stems";
import { nativeRemainingStars0x164d10 } from "../../src/engine/native-remaining-stars";
import { nativeStarBrightness0x16bf60 } from "../../src/engine/native-star-brightness";
import { nativeThreeLayerGua0x16c4c0 } from "../../src/engine/native-three-layer-gua";
import { nativeTransformations0x16b0a0 } from "../../src/engine/native-transformations";
import { nativeYearBranchStars0x1601b0 } from "../../src/engine/native-year-branch-stars";
import { nativeYearStemStars0x1628d0 } from "../../src/engine/native-year-stem-stars";

type FixturePalace = {
  palace: string;
  stem: string;
  stars: Record<string, string>;
  produced: string[];
  majorLimit: string;
  minorLimit: string;
  cycles: string[];
};

type Fixture = {
  provenance: { kind: string };
  reportedCalendar: { clockTime: string };
  inputs: {
    longitude: number;
    hourCode: number;
    appMode2Body: string;
    lunarYearStem: string;
    lunarYearBranch: string;
    lunarMonth: number;
    lunarDay: number;
    hourBranch: string;
    gender: "female";
    genderPolarity: "阳男" | "阴男" | "阳女" | "阴女";
    mingBranch: string;
    shenBranch: string;
  };
  expected: {
    fiveElements: string;
    laiyinBranch: string;
    mingMaster: string;
    shenMaster: string;
    palaces: Record<string, FixturePalace>;
  };
};

const fixturePaths = [
  "app-1330-12-23-104944-female-transcribed.json",
  "app-2717-12-25-162829-female-transcribed.json",
  "app-5205-12-17-231251-female-transcribed.json",
];

for (const filename of fixturePaths) {
  const fixture = JSON.parse(readFileSync(join(process.cwd(), "tests/fixtures", filename), "utf8")) as Fixture;
  test(`matches user-transcribed APP downstream fields: ${fixture.reportedCalendar.clockTime}`, () => {
    verifyFixture(fixture);
  });
}

function verifyFixture(fixture: Fixture): void {
  const input = fixture.inputs;
  assert.equal(fixture.provenance.kind, "transcribed-sample");
  const normalized = normalizeBirthInput({
    datetime: fixture.reportedCalendar.clockTime,
    longitude: input.longitude,
    gender: input.gender,
  });
  assert.equal(normalized.hourCode, input.hourCode);
  assert.equal(normalized.longitude, input.longitude.toFixed(3));
  assert.equal(normalized.appMode2Body, input.appMode2Body);

  const mingIndex = [..."子丑寅卯辰巳午未申酉戌亥"].indexOf(input.mingBranch);
  const palaceNames = nativePalaceNames0x157500(mingIndex);
  const palaceStems = nativePalaceStems0x156fb0(input.lunarYearStem);
  const palaces = palaceStems.map(({ branch, stem }) => ({
    branch,
    stem,
    name: requiredByBranch(palaceNames, branch).name,
  }));
  const mingPalace = requiredByBranch(palaces, input.mingBranch);
  const bureau = nativeFiveElementsBureau0x1586a0(mingPalace.stem, mingPalace.branch);
  assert.equal(bureau.bureauName0x110, fixture.expected.fiveElements);

  const majorAnchors = nativeMajorStarAnchors({
    lunarDayNumber: input.lunarDay,
    bureauNumber: bureau.bureauNumber,
  });
  const majorStars = nativeMajorStars({
    ziweiAnchorBranchIndex: majorAnchors.ziweiBranchIndex,
    tianfuAnchorBranchIndex: majorAnchors.tianfuBranchIndex,
  });
  const remaining = nativeRemainingStars0x164d10({
    lunarYearStem: input.lunarYearStem,
    lunarYearBranch: input.lunarYearBranch,
    normalizedLunarMonth: input.lunarMonth,
    lunarDayNumber: input.lunarDay,
    hourBranch: input.hourBranch,
    mingPalaceBranch: input.mingBranch,
    shenPalaceBranch: input.shenBranch,
    bureauNumber: bureau.bureauNumber,
    genderPolarityLabel0x128: input.genderPolarity,
    extendedStarsFlag0x450: false,
  });
  const placements = [
    ...majorStars.placements,
    ...nativeMonthStars0x15caa0({ normalizedLunarMonth: input.lunarMonth, extendedStarsFlag0x450: false }).placements,
    ...nativeMonthDayStars0x15f510({ normalizedLunarMonth: input.lunarMonth, lunarDayNumber: input.lunarDay }).placements,
    ...nativeHourStars0x15f7f0(input.hourBranch).placements,
    ...nativeYearBranchStars0x1601b0({ lunarYearBranch: input.lunarYearBranch, extendedStarsFlag0x450: false }).placements,
    ...nativeYearStemStars0x1628d0({ lunarYearStem: input.lunarYearStem, extendedStarsFlag0x450: false }).placements,
    ...remaining.placements,
  ].map(({ star, branch }) => ({ star, branch }));
  const brightness = nativeStarBrightness0x16bf60(placements);
  const starBranches = Object.fromEntries(placements.map(({ star, branch }) => [star, branch]));
  const transformations = nativeTransformations0x16b0a0({
    lunarYearStem: input.lunarYearStem,
    palaces,
    starBranches,
  });
  const majorLimits = nativeMajorLimits0x159170({
    genderLabel: input.genderPolarity,
    bureauNumber: bureau.bureauNumber,
    mingPalaceBranchIndex: mingIndex,
  });
  const minorLimits = nativeMinorLimits0x1597d0(input.lunarYearBranch, input.gender);
  const lords = nativeLifeBodyLords({
    mingPalaceBranch: input.mingBranch,
    lunarYearBranch: input.lunarYearBranch,
  });
  assert.equal(lords.lifeLord0xe0, fixture.expected.mingMaster);
  assert.equal(lords.bodyLord0xf8, fixture.expected.shenMaster);

  const gua = nativeThreeLayerGua0x16c4c0({
    lunarYearStem: input.lunarYearStem,
    palaceStems,
    hourCode: input.hourCode,
    minuteField: 30,
    direction: majorLimits.direction0xc8,
  });
  assert.equal(gua.layer1_1_0x390, fixture.expected.laiyinBranch);

  for (const [branch, expected] of Object.entries(fixture.expected.palaces)) {
    const palace = requiredByBranch(palaces, branch);
    const limit = requiredByBranch(majorLimits.limits, branch);
    const minor = requiredByBranch(minorLimits.palaces, branch);
    const cycles = requiredByBranch(remaining.palaceCycleFields, branch);
    const produced = requiredByBranch(transformations.palaces, branch).produced0xf8;
    assert.equal(palace.name, expected.palace, `${branch}.palace`);
    assert.equal(palace.stem, expected.stem, `${branch}.stem`);
    assert.deepEqual(
      Object.fromEntries(brightness.filter((star) => star.branch === branch).map((star) => [star.star, star.brightness ?? ""])),
      expected.stars,
      `${branch}.stars`,
    );
    assert.deepEqual(
      produced.map((edge) => `${edge.type}:${edge.star}:${edge.targetBranch}:${edge.strength}`),
      expected.produced,
      `${branch}.produced`,
    );
    assert.equal(limit.label0xc8, expected.majorLimit, `${branch}.majorLimit`);
    assert.equal(minor.ages.join(","), expected.minorLimit, `${branch}.minorLimit`);
    assert.deepEqual(
      [cycles.longsheng0x68, cycles.doctor0x80, cycles.general0x98, cycles.annual0xb0],
      expected.cycles,
      `${branch}.cycles`,
    );
  }
}

function requiredByBranch<T extends { branch: string }>(items: T[], branch: string): T {
  const item = items.find((candidate) => candidate.branch === branch);
  assert.ok(item, `missing branch ${branch}`);
  return item;
}
