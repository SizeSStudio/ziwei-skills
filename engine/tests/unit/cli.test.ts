import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../../src/cli/ziwei-chart";
import { completeChartFixture } from "../fixtures/complete-chart";

test("protocol command writes APP input and evidence without claiming a chart", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "ziwei-chart-protocol-"));
  try {
    const code = await runCli([
      "protocol",
      "--datetime",
      "1998-02-20 09:40",
      "--place",
      "杭州",
      "--gender",
      "male",
      "--out-dir",
      outDir,
    ]);

    assert.equal(code, 0);
    assert.equal(readFileSync(join(outDir, "app-input.txt"), "utf8"), "2|1998|2|20|10|30|30|120.155|-8|1|0|0|0\n");
    assert.match(readFileSync(join(outDir, "evidence.json"), "utf8"), /mode2.app-protocol-golden/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("protocol command applies the APP longitude default only to random-event input", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "ziwei-chart-event-protocol-"));
  try {
    const code = await runCli([
      "protocol",
      "--datetime",
      "5205-12-17 23:12:51",
      "--profile",
      "random-event",
      "--gender",
      "female",
      "--out-dir",
      outDir,
    ]);

    assert.equal(code, 0);
    assert.equal(readFileSync(join(outDir, "app-input.txt"), "utf8"), "2|5205|12|17|0|30|30|120.000|-8|2|0|0|0\n");
    assert.match(readFileSync(join(outDir, "evidence.json"), "utf8"), /app-random-event-default/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("build command writes chart json, txt, html, and evidence", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "ziwei-chart-build-"));
  try {
    const code = await runCli([
      "build",
      "--datetime",
      "1998-02-20 09:40",
      "--place",
      "杭州",
      "--gender",
      "male",
      "--out-dir",
      outDir,
    ]);
    assert.equal(code, 0);
    assert.match(readFileSync(join(outDir, "chart.json"), "utf8"), /golden-parity/);
    assert.match(readFileSync(join(outDir, "chart.txt"), "utf8"), /木三局/);
    assert.match(readFileSync(join(outDir, "chart.html"), "utf8"), /data-chart-json/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("random-event build preserves the actual event clock instead of the natal 30:30 protocol placeholders", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "ziwei-chart-random-event-build-"));
  try {
    const code = await runCli([
      "build",
      "--datetime",
      "2026-07-30 10:12:34",
      "--profile",
      "random-event",
      "--gender",
      "male",
      "--out-dir",
      outDir,
    ]);
    const chart = JSON.parse(readFileSync(join(outDir, "chart.json"), "utf8"));

    assert.equal(code, 0);
    assert.equal(chart.input.originalDatetime, "2026-07-30 10:12:34");
    assert.equal(chart.calendar.appClockTime, "2026-07-30 10:12:34");
    assert.equal(chart.calendar.trueSolarTime, "2026-07-30 10:19:02");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("random-event three-layer gua advances when the true-solar minute advances", async () => {
  const firstDir = mkdtempSync(join(tmpdir(), "ziwei-chart-random-minute-a-"));
  const secondDir = mkdtempSync(join(tmpdir(), "ziwei-chart-random-minute-b-"));
  try {
    await runCli([
      "build",
      "--datetime",
      "2026-07-30 10:12:34",
      "--profile",
      "random-event",
      "--gender",
      "male",
      "--out-dir",
      firstDir,
    ]);
    await runCli([
      "build",
      "--datetime",
      "2026-07-30 10:13:34",
      "--profile",
      "random-event",
      "--gender",
      "male",
      "--out-dir",
      secondDir,
    ]);
    const first = JSON.parse(readFileSync(join(firstDir, "chart.json"), "utf8"));
    const second = JSON.parse(readFileSync(join(secondDir, "chart.json"), "utf8"));

    assert.equal(first.calendar.trueSolarTime, "2026-07-30 10:19:02");
    assert.equal(second.calendar.trueSolarTime, "2026-07-30 10:20:02");
    assert.notDeepEqual(first.triLayerHexagram, second.triLayerHexagram);
  } finally {
    rmSync(firstDir, { recursive: true, force: true });
    rmSync(secondDir, { recursive: true, force: true });
  }
});

test("random command writes an auditable random-event chart", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "ziwei-chart-random-command-"));
  try {
    const code = await runCli([
      "random",
      "--seed",
      "westwell-six-month-test",
      "--out-dir",
      outDir,
    ]);
    const randomInput = JSON.parse(readFileSync(join(outDir, "random-input.json"), "utf8"));
    const chart = JSON.parse(readFileSync(join(outDir, "chart.json"), "utf8"));

    assert.equal(code, 0);
    assert.equal(randomInput.seed, "westwell-six-month-test");
    assert.equal(randomInput.algorithm, "sha256-rejection-v1");
    assert.equal(randomInput.selected.profile, "random-event");
    assert.equal(chart.input.inputProfile, "random-event");
    assert.equal(chart.input.longitudeSource, "app-random-event-default");
    assert.equal(chart.calendar.appClockTime, randomInput.selected.datetime);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("random-event build rejects a far-year calendar cache before it can emit a misleading chart", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "ziwei-chart-random-far-year-"));
  try {
    await assert.rejects(
      runCli([
        "build",
        "--datetime",
        "2083-06-26 19:30:21",
        "--profile",
        "random-event",
        "--gender",
        "male",
        "--out-dir",
        outDir,
      ]),
      /native-context-refill:non-monotonic-solar-record-cache/,
    );
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("render command writes chart json, txt, html, and evidence json for complete chart", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "ziwei-chart-render-"));
  const chartPath = join(outDir, "input-chart.json");
  try {
    writeFileSync(chartPath, JSON.stringify(completeChartFixture()), "utf8");

    const code = await runCli(["render", "--chart-json", chartPath, "--out-dir", outDir]);

    assert.equal(code, 0);
    assert.match(readFileSync(join(outDir, "chart.txt"), "utf8"), /十二宫：/);
    assert.match(readFileSync(join(outDir, "chart.html"), "utf8"), /data-chart-json/);
    assert.match(readFileSync(join(outDir, "chart.json"), "utf8"), /ziweixingyu-apk-native/);
    assert.match(readFileSync(join(outDir, "evidence.json"), "utf8"), /fixture.golden.sample/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
