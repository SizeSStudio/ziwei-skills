import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeBrightness = "" | "陷" | "不" | "平" | "利" | "得" | "旺" | "庙";

export type NativeBrightnessPlacement = {
  star: string;
  branch: string;
  branchIndex: number;
  element?: string;
  brightnessCode?: number;
  brightness?: NativeBrightness;
};

const BRIGHTNESS_BY_CODE = ["", "陷", "不", "平", "利", "得", "旺", "庙"] as const;

const STAR_TABLES = [
  ["紫微", "土", "777666776666"], ["天府", "土", "777676676667"],
  ["天梁", "土", "667671761671"], ["天机", "木", "767674112236"],
  ["贪狼", "木", "677761142266"], ["天相", "木", "667751111146"],
  ["左辅", "木", "776663333337"], ["右弼", "木", "777772221117"],
  ["太阳", "火", "113777776421"], ["廉贞", "火", "126777773231"],
  ["火星", "火", "117666761321"], ["七杀", "金", "667656677677"],
  ["武曲", "金", "675477657777"], ["擎羊", "金", "455444337773"],
  ["太阴", "水", "774121115667"], ["巨门", "水", "776521116767"],
  ["破军", "水", "776677776667"], ["天同", "水", "775521115657"],
  ["地空", "水", "774432116777"], ["地劫", "水", "777777777777"],
  ["铃星", "火", "755474777777"], ["文昌", "木", "455444337774"],
  ["文曲", "水", "777677173616"], ["禄存", "水", "607607607607"],
  ["天马", "水", "006002006003"], ["天魁", "水", "660700700006"],
  ["天钺", "水", "006006067700"], ["红鸾", "水", "716776617616"],
  ["天喜", "水", "617617716716"], ["天刑", "水", "317731311771"],
  ["天姚", "水", "136713361771"], ["天哭", "水", "373734137233"],
  ["天虚", "水", "176716317613"], ["天官", "水", "003666770336"],
  ["天福", "水", "306306307707"], ["截空", "水", "121317777700"],
  ["副截", "水", "121317777700"], ["旬空", "水", "131317717713"],
  ["副旬", "水", "131317717713"], ["三台", "水", "173173673763"],
  ["八座", "水", "177367637737"], ["恩光", "水", "373773763172"],
  ["天贵", "水", "763663761763"], ["天伤", "水", "133133113336"],
  ["天使", "水", "113313333116"], ["天才", "水", "637617637617"],
  ["天寿", "水", "376173366376"], ["龙池", "水", "633771273716"],
  ["凤阁", "水", "737617312776"], ["天德", "水", "773376673273"],
  ["解神", "水", "737776732672"], ["年解", "金", "737776732672"],
  ["孤辰", "水", "003001003001"], ["寡宿", "水", "030010030010"],
  ["华盖", "水", "010070010030"], ["劫煞", "水", "003001003001"],
  ["咸池", "水", "100300100300"], ["天空", "水", "131377716613"],
  ["大耗", "水", "631231631231"], ["破碎", "水", "010001000300"],
] as const satisfies ReadonlyArray<readonly [string, string, string]>;

const TABLE_BY_STAR = Object.fromEntries(STAR_TABLES.map(([star, element, codes]) => [star, { element, codes }]));

export function nativeStarBrightness0x16bf60(
  placements: ReadonlyArray<{ star: string; branch: string }>,
): NativeBrightnessPlacement[] {
  return placements.map(({ star, branch }) => {
    const branchIndex = nativeBranchIndex(branch);
    const table = TABLE_BY_STAR[star];
    if (table === undefined) return { star, branch, branchIndex };
    const codeText = table.codes.at(branchIndex);
    if (codeText === undefined || codeText < "0" || codeText > "7") {
      throw new NativeStarBrightnessError(`invalid APK brightness code for ${star} at ${branch}`);
    }
    const brightnessCode = Number(codeText);
    const brightness = BRIGHTNESS_BY_CODE[brightnessCode];
    return { star, branch, branchIndex, element: table.element, brightnessCode, brightness };
  });
}

export function nativeStarBrightnessEvidenceContract() {
  return {
    functionRange: "[0x16bf60, 0x16c453)",
    constructorRange: "0x152e27..0x15462e",
    tableDestination: "chart+0x50",
    sourceStars: "node+0x170",
    destinationDetails: "node+0x188 map value: label +0x00, numeric code +0x18",
    branchOrder: [...NATIVE_PALACE_BRANCHES_0X19F3D0],
    brightnessLabels: ["", ...BRIGHTNESS_BY_CODE.slice(1)],
    labelOffsetTable: "0x83e30",
    records: STAR_TABLES.map(([star, element, codes]) => ({ star, element, codes })),
  };
}

function nativeBranchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeStarBrightnessError(`branch is outside APK table: ${branch}`);
  return index;
}

export class NativeStarBrightnessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeStarBrightnessError";
  }
}
