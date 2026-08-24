export type EvidenceKind =
  | "apk-java"
  | "apk-native"
  | "native-table"
  | "golden-sample"
  | "transcribed-sample"
  | "derived"
  | "external-reference"
  | "fixture";

export type EvidenceRef = {
  id: string;
  kind: EvidenceKind;
  source?: string;
  address?: string;
  note?: string;
};

export type EvidenceMap = Record<string, EvidenceRef[]>;

export const APK_SHA256 = "f4d58744f71fed091e712a9a710ae94a41255531bec4097e400dc4cd82118ac4";

export const MODE2_APP_PROTOCOL_EVIDENCE: EvidenceRef = {
  id: "mode2.app-protocol-golden",
  kind: "golden-sample",
  source: "Qiling arm64 get2: 2|1998|2|20|10|30|30|120.155|-8|1|0|0|0",
  note: "Captured mode 2 APP chart protocol with 13 fields and gender 1/2.",
};

export const MODE2_NATIVE_DISPATCH_EVIDENCE: EvidenceRef = {
  id: "mode2.native-dispatch-arm64-0x120210",
  kind: "apk-native",
  address: "arm64:0x120210",
  note: "Native mode 2 branch consumes the 13-field Gregorian chart body.",
};
