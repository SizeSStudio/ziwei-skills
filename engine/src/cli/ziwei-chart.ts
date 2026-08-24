#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  randomEventAudit,
  randomEventBirthInput,
  randomEventCandidate,
  randomEventSeed,
  type RandomEventAudit,
} from "../engine/random-event";
import { join } from "node:path";
import { buildChartFromNativeLogic } from "../engine/chart-engine";
import { normalizeBirthInput, type BirthInput, type InputProfile } from "../engine/normalize";
import { MODE2_APP_PROTOCOL_EVIDENCE, MODE2_NATIVE_DISPATCH_EVIDENCE } from "../schema/evidence";
import type { ZiweiChart } from "../schema/chart";
import { renderHtmlChart } from "../render/html-renderer";
import { renderJsonChart } from "../render/json-renderer";
import { renderNatalText } from "../render/text-renderer";

type CliOptions = Record<string, string | undefined>;

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const command = argv[0]?.startsWith("--") || argv.length === 0 ? "build" : argv[0];
  const options = parseOptions(command === "build" && argv[0]?.startsWith("--") ? argv : argv.slice(1));

  if (command === "protocol") {
    writeProtocolArtifacts(options);
    return 0;
  }
  if (command === "build") {
    const normalized = normalizeBirthInput(birthInputFromOptions(options));
    const chart = buildChartFromNativeLogic(normalized);
    writeChartArtifacts(chart, requiredOption(options, "out-dir"));
    return 0;
  }
  if (command === "random") {
    writeRandomChartArtifacts(options);
    return 0;
  }
  if (command === "render") {
    const chartPath = requiredOption(options, "chart-json");
    const chart = JSON.parse(readFileSync(chartPath, "utf8")) as ZiweiChart;
    writeChartArtifacts(chart, requiredOption(options, "out-dir"));
    return 0;
  }

  throw new Error(`unknown command: ${command}`);
}

function writeRandomChartArtifacts(options: CliOptions): void {
  const outDir = requiredOption(options, "out-dir");
  const seed = randomEventSeed(options.seed);
  const rejected: RandomEventAudit["attempts"] = [];
  const maximumAttempts = 64;

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const candidate = randomEventCandidate(seed, attempt, options.gender);
    try {
      const normalized = normalizeBirthInput(randomEventBirthInput(candidate));
      const chart = buildChartFromNativeLogic(normalized);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        join(outDir, "random-input.json"),
        `${JSON.stringify(randomEventAudit(seed, rejected, candidate), null, 2)}\n`,
        "utf8",
      );
      writeChartArtifacts(chart, outDir);
      return;
    } catch (error: unknown) {
      rejected.push({
        ...candidate,
        status: "rejected",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "random-input.json"),
    `${JSON.stringify(
      {
        algorithm: "sha256-rejection-v1",
        seed,
        attempts: rejected,
        selected: null,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  throw new Error(`random-event chart failed after ${maximumAttempts} deterministic attempts`);
}

function writeProtocolArtifacts(options: CliOptions): void {
  const normalized = normalizeBirthInput(birthInputFromOptions(options));
  const outDir = requiredOption(options, "out-dir");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "app-input.txt"), `${normalized.appMode2Body}\n`, "utf8");
  writeFileSync(
    join(outDir, "evidence.json"),
    `${JSON.stringify(
      {
        kind: "protocol-only",
        input: normalized,
        evidence: {
          appMode2Body: [MODE2_APP_PROTOCOL_EVIDENCE, MODE2_NATIVE_DISPATCH_EVIDENCE],
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function writeChartArtifacts(chart: ZiweiChart, outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "chart.json"), renderJsonChart(chart), "utf8");
  writeFileSync(join(outDir, "chart.txt"), renderNatalText(chart), "utf8");
  writeFileSync(join(outDir, "chart.html"), renderHtmlChart(chart), "utf8");
  writeFileSync(join(outDir, "evidence.json"), `${JSON.stringify(chart.evidence, null, 2)}\n`, "utf8");
}

function birthInputFromOptions(options: CliOptions): BirthInput {
  const timezone = options.timezone === undefined ? undefined : Number(options.timezone);
  if (timezone !== undefined && !Number.isFinite(timezone)) {
    throw new Error(`--timezone must be numeric: ${options.timezone}`);
  }
  const profile = options.profile ?? "natal";
  if (profile !== "natal" && profile !== "random-event") {
    throw new Error(`--profile must be natal or random-event: ${profile}`);
  }
  return {
    datetime: requiredOption(options, "datetime"),
    place: options.place,
    longitude: options.longitude,
    timezone,
    gender: requiredOption(options, "gender"),
    profile: profile as InputProfile,
  };
}

function parseOptions(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token?.startsWith("--")) {
      throw new Error(`unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`missing value for --${key}`);
    }
    options[key] = value;
    index += 1;
  }
  return options;
}

function requiredOption(options: CliOptions, key: string): string {
  const value = options[key];
  if (!value) {
    throw new Error(`--${key} is required`);
  }
  return value;
}

if (require.main === module) {
  runCli()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    });
}
