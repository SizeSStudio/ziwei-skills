import test from "node:test";
import assert from "node:assert/strict";
import { nativeMajorLimits0x159170 } from "../../src/engine/native-major-limits";
import { nativePalaceStems0x156fb0 } from "../../src/engine/native-palace-stems";
import {
  nativeSecondaryGuaBranch0x178f00,
  nativeThreeLayerGua0x16c4c0,
  nativeThreeLayerGuaEvidenceContract,
} from "../../src/engine/native-three-layer-gua";

test("ports the three-layer gua fields for the 1998 fixture", () => {
  const palaceStems = nativePalaceStems0x156fb0("戊");
  const direction = nativeMajorLimits0x159170({
    genderLabel: "阳男",
    bureauNumber: 6,
    mingPalaceBranchIndex: 9,
  }).direction0xc8;

  assert.deepEqual(
    nativeThreeLayerGua0x16c4c0({
      lunarYearStem: "戊",
      palaceStems,
      hourCode: 10,
      minuteField: 30,
      direction,
    }),
    {
      layer1_1_0x390: "午",
      layer1_2_0x3a8: "",
      layer2_1_0x3c0: "卯",
      layer2_2_0x3d8: "丑",
      layer3_1_0x3f0: "子",
      layer3_2_0x408: "寅",
      firstShift: 9,
      secondShift: 6,
    },
  );
});

test("reverses both native shifts when chart+0xc8 is 逆", () => {
  const result = nativeThreeLayerGua0x16c4c0({
    lunarYearStem: "戊",
    palaceStems: nativePalaceStems0x156fb0("戊"),
    hourCode: 10,
    minuteField: 30,
    direction: "逆",
  });
  assert.equal(result.firstShift, -9);
  assert.equal(result.secondShift, -6);
  assert.equal(result.layer2_1_0x3c0, "酉");
  assert.equal(result.layer2_2_0x3d8, "");
  assert.equal(result.layer3_1_0x3f0, "子");
  assert.equal(result.layer3_2_0x408, "寅");
});

test("ports the complete 0x178f00 secondary branch mapping", () => {
  assert.deepEqual(
    ["子", "丑", "寅", "卯", "辰"].map((branch) => nativeSecondaryGuaBranch0x178f00(branch)),
    ["寅", "卯", "子", "丑", ""],
  );
});

test("documents all six serialized APK field offsets", () => {
  const contract = nativeThreeLayerGuaEvidenceContract();
  assert.equal(contract.dateInputs, "calendar wrapper APP hourCode and fixed minute-field doubles");
  assert.deepEqual(Object.keys(contract.fields), ["层1.1", "层1.2", "层2.1", "层2.2", "层3.1", "层3.2"]);
});
