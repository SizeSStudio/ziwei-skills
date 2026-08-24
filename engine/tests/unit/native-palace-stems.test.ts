import test from "node:test";
import assert from "node:assert/strict";
import {
  nativePalaceStems0x156fb0,
  nativePalaceStemsEvidenceContract,
  NativePalaceStemsError,
} from "../../src/engine/native-palace-stems";

test("ports the 0x156fb0 palace-stem assignment for the 1998 戊 year fixture", () => {
  assert.deepEqual(
    nativePalaceStems0x156fb0("戊").map(({ branch, stem }) => `${stem}${branch}`),
    ["甲子", "乙丑", "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"],
  );
});

test("locks all five APK year-stem groups at the tiger palace", () => {
  const expected = new Map([
    ["甲", "丙"], ["己", "丙"],
    ["乙", "戊"], ["庚", "戊"],
    ["丙", "庚"], ["辛", "庚"],
    ["丁", "壬"], ["壬", "壬"],
    ["戊", "甲"], ["癸", "甲"],
  ]);

  for (const [yearStem, expectedTigerStem] of expected) {
    assert.equal(nativePalaceStems0x156fb0(yearStem)[2]?.stem, expectedTigerStem);
  }
});

test("rejects stems outside the APK table and exposes the evidence boundaries", () => {
  assert.throws(() => nativePalaceStems0x156fb0("A"), NativePalaceStemsError);
  const contract = nativePalaceStemsEvidenceContract();
  assert.equal(contract.helper, "0x15712b -> 0x1753a0");
  assert.equal(contract.yearStemGroups.length, 5);
});
