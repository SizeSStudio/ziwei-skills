import test from "node:test";
import assert from "node:assert/strict";
import { nativeYearStemStars0x1628d0, nativeYearStemStarsEvidenceContract } from "../../src/engine/native-year-stem-stars";

test("ports all year-stem stars for the 1998 戊-year fixture with extended stars", () => {
  const result = nativeYearStemStars0x1628d0({ lunarYearStem: "戊", extendedStarsFlag0x450: true });
  assert.equal(result.yearStemIndex, 4);
  assert.deepEqual(result.placements.map(({ star, branch }) => ({ star, branch })), [
    { star: "禄存", branch: "巳" }, { star: "擎羊", branch: "午" }, { star: "陀罗", branch: "辰" },
    { star: "天魁", branch: "寅" }, { star: "天钺", branch: "午" }, { star: "天官", branch: "卯" },
    { star: "天福", branch: "卯" }, { star: "截空", branch: "子" }, { star: "副截", branch: "丑" },
    { star: "天厨", branch: "午" }, { star: "厨贵", branch: "申" }, { star: "太极", branch: "巳" },
    { star: "科名", branch: "巳" }, { star: "节度", branch: "寅" }, { star: "文星", branch: "丑" },
    { star: "福星", branch: "申" }, { star: "红艳", branch: "辰" }, { star: "唐符", branch: "子" },
    { star: "国印", branch: "丑" }, { star: "昌贵", branch: "申" },
  ]);
});

test("honors the native 0x450 gate after 天厨", () => {
  const result = nativeYearStemStars0x1628d0({ lunarYearStem: "戊", extendedStarsFlag0x450: false });
  assert.equal(result.placements.length, 10);
  assert.equal(result.placements.at(-1)?.star, "天厨");
  assert.ok(!result.placements.some(({ star }) => star === "厨贵"));
});

test("locks the native year-stem relocation tables and relative 羊陀 calls", () => {
  const contract = nativeYearStemStarsEvidenceContract();
  assert.equal(contract.tables.length, 18);
  assert.equal(contract.tables[0]?.address, "0x1a0180");
  assert.equal(contract.tables.at(-1)?.address, "0x1a0070");
  assert.deepEqual(contract.relativeStars.map(({ star, offset }) => ({ star, offset })), [
    { star: "擎羊", offset: 1 }, { star: "陀罗", offset: -1 },
  ]);
  assert.equal(contract.extendedGate.compareAddress, "0x1635d6");
});

test("rejects invalid year stems", () => {
  assert.throws(() => nativeYearStemStars0x1628d0({ lunarYearStem: "A", extendedStarsFlag0x450: true }), /outside APK table/);
});
