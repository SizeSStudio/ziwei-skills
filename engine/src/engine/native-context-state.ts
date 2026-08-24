import {
  nativeContextInitialRecords,
  nativeContextMarkerString,
} from "./native-context-assets";
import type { NativeBinary128Bits } from "./native-numeric";

export type NativeCalendarContextState = {
  modeOneRecords0x0: readonly NativeBinary128Bits[];
  modeZeroRecords0x8: readonly NativeBinary128Bits[];
  recordCache0x10: NativeBinary128Bits[];
  anchor0x30: NativeBinary128Bits;
  anchor0x40: NativeBinary128Bits;
  monthBoundaries0x50: number[];
  byteTable0x68: number[];
  byteTable0x80: number[];
  leapIndex0x98: number;
  modeOneMarkers0xa0: string;
  modeZeroMarkers0xb8: string;
};

const ZERO_BINARY128: NativeBinary128Bits = { low: 0n, high: 0n };

export function nativeCalendarContextState0x17f450(): NativeCalendarContextState {
  return {
    modeOneRecords0x0: nativeContextInitialRecords(1),
    modeZeroRecords0x8: nativeContextInitialRecords(0),
    recordCache0x10: [],
    anchor0x30: ZERO_BINARY128,
    anchor0x40: ZERO_BINARY128,
    monthBoundaries0x50: [],
    byteTable0x68: [],
    byteTable0x80: [],
    leapIndex0x98: 0,
    modeOneMarkers0xa0: nativeContextMarkerString(1),
    modeZeroMarkers0xb8: nativeContextMarkerString(0),
  };
}
