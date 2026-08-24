import test from "node:test";
import assert from "node:assert/strict";
import { nativeMonthDayStars0x15f510, nativeMonthDayStarsEvidenceContract } from "../../src/engine/native-month-day-stars";

test("ports 三台 and 八座 for the 1998 lunar-month-one day-24 fixture", () => {
  assert.deepEqual(nativeMonthDayStars0x15f510({ normalizedLunarMonth: 1, lunarDayNumber: 24 }), {
    normalizedLunarMonth: 1,
    lunarDayNumber: 24,
    monthDaySum: 25,
    placements: [
      { star: "三台", baseBranch: "辰", offset: 23, branchIndex: 3, branch: "卯" },
      { star: "八座", baseBranch: "戌", offset: -23, branchIndex: 11, branch: "亥" },
    ],
  });
});

test("locks the native formulas and distinct insertion helper", () => {
  const contract = nativeMonthDayStarsEvidenceContract();
  assert.equal(contract.formulas[0]?.expression, "month + day - 2");
  assert.equal(contract.formulas[1]?.expression, "2 - (month + day)");
  assert.equal(contract.insertionHelper, "0x1789c0");
});

test("rejects month and day values outside the adapter range", () => {
  assert.throws(() => nativeMonthDayStars0x15f510({ normalizedLunarMonth: 0, lunarDayNumber: 1 }), /month/);
  assert.throws(() => nativeMonthDayStars0x15f510({ normalizedLunarMonth: 1, lunarDayNumber: 32 }), /day/);
});
