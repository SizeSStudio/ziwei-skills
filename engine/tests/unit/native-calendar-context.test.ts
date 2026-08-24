import test from "node:test";
import assert from "node:assert/strict";
import {
  NATIVE_CALENDAR_CONTEXT_REFILL_EVIDENCE,
  NATIVE_CALENDAR_LOOKUP_CONTEXT_EVIDENCE,
  NATIVE_CALENDAR_LOOKUP_CONTEXT_OFFSETS,
  nativeContextRefillIndexCorrection,
  nativeContextRefillLoops,
  nativeContextRefillSkeleton,
  nativeContextSampleHelperContract,
  nativeContextSampleHelperDependencySummary,
  nativeLookupContextFieldSources,
} from "../../src/engine/native-calendar-context";

test("documents the 0x14bed0 context table offsets used by lookup output fields", () => {
  assert.deepEqual(NATIVE_CALENDAR_LOOKUP_CONTEXT_OFFSETS, {
    recordBegin0x10: 0x10,
    recordEnd0x18: 0x18,
    monthBoundaryTable0x50: 0x50,
    byteTable0x68: 0x68,
    byteTable0x80: 0x80,
    leapIndex0x98: 0x98,
  });
});

test("maps consumed lookup output fields back to their observed context reads", () => {
  assert.deepEqual(nativeLookupContextFieldSources(), {
    output0x1c: {
      contextOffset: 0x50,
      outputOffset: 0x1c,
      evidenceAddress: "0x14c1cc",
      note: "month-boundary table read; byte output stored at 0x14c455",
    },
    output0x68: {
      contextOffset: 0x68,
      outputOffset: 0x68,
      evidenceAddress: "0x14c260",
      note: "byte table read; byte output stored at 0x14c46d after an earlier dword write",
    },
    output0x69: {
      contextOffset: 0x80,
      outputOffset: 0x69,
      evidenceAddress: "0x14c26e",
      note: "second byte table read adjacent to output0x68",
    },
    output0x6a: {
      contextOffset: 0x98,
      outputOffset: 0x6a,
      evidenceAddress: "0x14c27f",
      note: "leap/index comparison result stored at 0x14c490",
    },
    output0x6b: {
      contextOffset: 0x98,
      outputOffset: 0x6b,
      evidenceAddress: "0x14c493",
      note: "next-index or 0xff sentinel derived from the same comparison context",
    },
  });
});

test("keeps context evidence scoped to layout rather than lunar semantics", () => {
  assert.equal(NATIVE_CALENDAR_LOOKUP_CONTEXT_EVIDENCE.id, "calendar.native-lookup-context-0x14bed0");
  assert.equal(NATIVE_CALENDAR_LOOKUP_CONTEXT_EVIDENCE.kind, "apk-native");
  const note = NATIVE_CALENDAR_LOOKUP_CONTEXT_EVIDENCE.note ?? "";
  assert.match(note, /layout/);
  assert.doesNotMatch(note, /lunar parity/i);
});

test("documents the 0x182880 context refill entry alias and read/write skeleton", () => {
  assert.equal(NATIVE_CALENDAR_CONTEXT_REFILL_EVIDENCE.id, "calendar.native-context-refill-0x182880");
  assert.equal(NATIVE_CALENDAR_CONTEXT_REFILL_EVIDENCE.address, "0x1828c2");

  assert.deepEqual(nativeContextRefillSkeleton(), {
    entryAlias: {
      sourceRegister: "rdi",
      aliasRegister: "rbx",
      evidenceAddress: "0x1828c2",
      note: "0x182880 saves the context pointer from rdi into rbx",
    },
    fields: {
      recordEnd0x18: {
        readOffset: 0x10,
        writeOffset: 0x18,
        readEvidenceAddress: "0x182925",
        writeEvidenceAddress: "0x182929",
        note: "record/cache begin pointer copied to end before refill",
      },
      vectorAnchor0x30: {
        writeOffset: 0x30,
        writeEvidenceAddress: "0x1829bf",
        note: "16-byte cached date/vector anchor; semantic unresolved",
      },
      vectorAnchor0x40: {
        writeOffset: 0x40,
        writeEvidenceAddress: "0x1829ed",
        note: "16-byte cached date/vector anchor; semantic unresolved",
      },
      monthBoundaryEnd0x58: {
        readOffset: 0x50,
        writeOffset: 0x58,
        readEvidenceAddress: "0x182a4c",
        writeEvidenceAddress: "0x182a50",
        note: "month-boundary table begin pointer copied to end before refill",
      },
      byteTableEnd0x70: {
        readOffset: 0x68,
        writeOffset: 0x70,
        readEvidenceAddress: "0x182ac1",
        writeEvidenceAddress: "0x182ae1",
        note: "byte table begin pointer copied to end before refill",
      },
      byteTableEnd0x88: {
        readOffset: 0x80,
        writeOffset: 0x88,
        readEvidenceAddress: "0x182ac5",
        writeEvidenceAddress: "0x182acc",
        note: "adjacent byte table begin pointer copied to end before refill",
      },
      leapIndexReset0x98: {
        writeOffset: 0x98,
        writeEvidenceAddress: "0x182aad",
        note: "leap/index marker reset before later refill logic",
      },
    },
  });
});

test("keeps 0x182880 refill skeleton scoped away from full calendar parity", () => {
  const note = NATIVE_CALENDAR_CONTEXT_REFILL_EVIDENCE.note ?? "";
  assert.match(note, /skeleton/);
  assert.doesNotMatch(note, /parity/i);
});

test("documents the early 0x182880 refill loops and helper calls", () => {
  assert.deepEqual(nativeContextRefillLoops(), {
    recordVector0x10: {
      destinationOffset: 0x10,
      sourceHelperAddress: "0x181490",
      sourceMode: 0,
      appendHelperAddress: "0x183000",
      loopStartAddress: "0x182940",
      appendCallAddress: "0x18297d",
      compareAddress: "0x18298d",
      counterStart: 0,
      counterLastInclusive: 0x18,
      iterations: 25,
      itemBytes: 16,
      note: "fills the record/cache vector at ctx+0x10 with 25 16-byte records",
    },
    monthBoundaryTable0x50: {
      destinationOffset: 0x50,
      sourceHelperAddress: "0x181490",
      sourceMode: 1,
      appendHelperAddress: "0x14bcb0",
      loopStartAddress: "0x182a60",
      appendCallAddress: "0x182a98",
      compareAddress: "0x182aa8",
      counterStart: 0,
      counterLastInclusive: 0x0e,
      iterations: 15,
      itemBytes: 4,
      note: "fills the ctx+0x50 dword boundary table with 15 entries",
    },
    byteTableDerivation0x80And0x68: {
      sourceOffset: 0x50,
      primaryDestinationOffset: 0x80,
      primaryAppendHelperAddress: "0x14bcb0",
      secondaryDestinationOffset: 0x68,
      secondaryAppendHelperAddress: "0x183110",
      loopStartAddress: "0x182b00",
      differenceReadAddresses: ["0x182b05", "0x182b09"],
      primaryAppendCallAddress: "0x182b15",
      secondaryAppendCallAddress: "0x182b20",
      compareAddress: "0x182b2e",
      counterStart: 0,
      counterLastInclusive: 0x0d,
      iterations: 14,
      note: "derives 14 adjacent byte/index entries from ctx+0x50 boundary differences",
    },
  });
});

test("documents the 0x182880 tail index correction control flow", () => {
  assert.deepEqual(nativeContextRefillIndexCorrection(), {
    seedRangeGuard: {
      recordSourceOffset: 0x10,
      seedBuildStartAddress: "0x182b33",
      compareAddress: "0x182bb2",
      branchAddress: "0x182bb7",
      fallbackTargetAddress: "0x182d8a",
      compareBias: 0xaa1,
      acceptedLimitInclusive: 0x269,
      acceptedSeedAddend: 0x7d0,
      note: "unsigned guard sends out-of-range seeds into the fallback marker path",
    },
    candidateLoop: {
      loopEntryAddress: "0x182c2f",
      counterAdvanceAddress: "0x182c20",
      exitCompareAddress: "0x182c26",
      normalTargetAddress: "0x182e2b",
      counterStart: 0,
      counterLastInclusive: 2,
      iterations: 3,
      localCandidateOffsets: [-0x60, -0x5c, -0x58],
      localClassOffsets: [-0x48, -0x44, -0x40],
      stages: [
        {
          threshold: -0x2d0,
          thresholdCompareAddress: "0x182c35",
          skipBranchAddress: "0x182c3c",
          helperCallAddress: "0x182c83",
          candidateStoreAddress: "0x182c94",
          classStoreAddress: "0x182c98",
          classValue: 2,
        },
        {
          threshold: -0x1de,
          thresholdCompareAddress: "0x182ca0",
          skipBranchAddress: "0x182ca7",
          helperCallAddress: "0x182cf5",
          candidateStoreAddress: "0x182d06",
          classStoreAddress: "0x182d0a",
          classValue: 2,
        },
        {
          threshold: -0xdb,
          thresholdCompareAddress: "0x182d12",
          skipBranchAddress: "0x182d19",
          helperCallAddress: "0x182d68",
          candidateStoreAddress: "0x182d79",
          classStoreAddress: "0x182d7d",
          classValue: 0x0b,
        },
      ],
      note: "fills three local candidate/class slots before the normal ctx+0x68 rewrite",
    },
    normalRewriteLoop: {
      sourceOffset: 0x50,
      destinationOffset: 0x68,
      loopStartAddress: "0x182e2b",
      sourceReadAddress: "0x182e76",
      destinationWriteAddress: "0x182e59",
      exitCompareAddress: "0x182e69",
      moduloEvidenceAddress: "0x182ed2",
      moduloDivisor: 12,
      counterStart: 0,
      counterLastInclusive: 0x0d,
      iterations: 14,
      note: "rewrites 14 ctx+0x68 entries from ctx+0x50 boundaries and local candidates",
    },
    fallbackMarkerPath: {
      pathStartAddress: "0x182d8a",
      sourceOffset: 0x50,
      recordSourceOffset: 0x10,
      markerWriteOffset: 0x98,
      markerWriteAddress: "0x182df7",
      adjustmentTableOffset: 0x68,
      decrementLoopStartAddress: "0x182e10",
      decrementWriteAddress: "0x182e13",
      exitCompareAddress: "0x182e21",
      counterLastInclusive: 0x0d,
      note: "fallback writes ctx+0x98 and decrements ctx+0x68 entries from the marker through index 13",
    },
    fallbackNormalizationLoop: {
      sourceOffset: 0x50,
      destinationOffset: 0x68,
      loopStartAddress: "0x182efb",
      sourceReadAddress: "0x182f2d",
      destinationReadAddress: "0x182f31",
      destinationWriteAddress: "0x182f15",
      exitCompareAddress: "0x182f21",
      sentinelValue: 0x0c,
      sentinelLoadAddress: "0x182f10",
      moduloEvidenceAddress: "0x182f5a",
      moduloDivisor: 12,
      counterStart: 0,
      counterLastInclusive: 0x0d,
      iterations: 14,
      note: "fallback normalizes 14 ctx+0x68 entries and may emit 0x0c sentinel values",
    },
  });
});

test("documents the 0x181490 context sample helper contract used by refill", () => {
  assert.deepEqual(nativeContextSampleHelperContract(), {
    functionAddress: "0x181490",
    hotReturnAddress: "0x181a8a",
    inputRegisters: {
      context: "rdi",
      mode: "esi",
      targetVector: "xmm0",
    },
    savedLocations: {
      contextStackOffset: -0xc8,
      modeRegister: "r14d",
      targetStackOffset: -0x80,
    },
    output: {
      register: "eax",
      finalizeCallAddress: "0x181a1a",
      returnMoveAddress: "0x181a76",
      note: "0x195b60 converts the final vector quantity to the returned int",
    },
    sourceVectors: {
      primaryVectorOffset: 0x00,
      primaryBeginReadAddress: "0x1814ed",
      primaryEndReadAddress: "0x1814f0",
      recordBytes: 16,
      copyAllocationCallAddress: "0x181509",
      copyBytesCallAddress: "0x181528",
      modeZeroExtraVectorOffset: 0x08,
      modeZeroExtraReadAddress: "0x18154e",
      modeZeroRangeAssignCallAddress: "0x181570",
      note: "ctx+0x0 and ctx+0x8 are pointers to heap vector objects, not inline vectors; mode 0 replaces the local copy with the dereferenced ctx+0x8 range through 0x183230, while mode 1 keeps the dereferenced ctx+0x0 copy",
    },
    modeBranch: {
      testAddress: "0x181542",
      modeNonZeroTargetAddress: "0x181587",
      modeZeroConstant: 7,
      modeZeroConstantAddress: "0x18157d",
      modeNonZeroConstant: 0x0e,
      modeNonZeroConstantAddress: "0x181538",
    },
    modeOnePath: {
      startAddress: "0x181614",
      endJumpAddress: "0x1817d6",
      transformHelperAddress: "0x1868e0",
      correctionHelperAddress: "0x1859c0",
      sharedFinalizeAddress: "0x1819b3",
      constants: [0x25685f, 2, 0x8ead, 0x15180, 0x708, 0x14a78],
    },
    modeZeroPath: {
      startAddress: "0x1817db",
      endAddress: "0x1819b3",
      transformHelperAddress: "0x186e40",
      correctionHelperAddress: "0x1861d0",
      sharedFinalizeAddress: "0x1819b3",
      constants: [0x25673b, 0x18, 0x0c, 0x8ead, 0x15180, 0x04b0, 0x14cd0],
    },
    interpolationPath: {
      startAddress: "0x181a8b",
      rangeLoopStartAddress: "0x181ad0",
      rangeLoopCompareAddress: "0x181ad6",
      rangeLoopAdvanceAddress: "0x181af9",
      recordPairStrideBytes: 0x20,
      lowerRecordReadAddress: "0x181b02",
      upperRecordReadAddress: "0x181b17",
      exitJumpAddress: "0x181bde",
      note: "selects a bracketing pair from the copied 16-byte record vector before final conversion",
    },
    secondaryColdPath: {
      startAddress: "0x181be3",
      noResultTargetAddress: "0x182041",
      contextFlagOffset: 0xa0,
      contextFlagReadAddress: "0x182025",
      contextLongBufferOffset: 0xa8,
      contextLongBufferReadAddress: "0x182035",
      contextShortBufferOffset: 0xb0,
      contextShortBufferReadAddress: "0x1821f6",
      contextPackedBufferOffset: 0xb8,
      packedDecodeCallAddress: "0x18219e",
      stringAdjustAddresses: ["0x18226e", "0x1822a1"],
      note: "mode 1 indexes the decoded marker string at ctx+0xa0 directly; mode 0 takes a one-byte substring from ctx+0xb8 through 0x1827b0 before applying the 1/2 adjustment",
    },
  });
});

test("documents 0x181490 helper dependencies before algorithm parity", () => {
  assert.deepEqual(nativeContextSampleHelperDependencySummary(), {
    functionAddress: "0x181490",
    binary128Helpers: [
      { name: "add", targetAddress: "0x194c80", callCount: 26 },
      { name: "comparePositiveUnordered", targetAddress: "0x195130", callCount: 7 },
      { name: "compareNegativeUnordered", targetAddress: "0x1951f0", callCount: 5 },
      { name: "divide", targetAddress: "0x1952a0", callCount: 13 },
      { name: "doubleToBinary128", targetAddress: "0x195a00", callCount: 33 },
      { name: "binary128ToInt32", targetAddress: "0x195b60", callCount: 1 },
      {
        name: "binary128ToUint64",
        targetAddress: "0x195be0",
        callCount: 2,
        callSites: ["0x182019", "0x18218a"],
        note: "converts floored binary128 values before ctx+0xa0..0xb8 packed/string cold-path decoding",
      },
      { name: "int32ToBinary128", targetAddress: "0x195c60", callCount: 35 },
      { name: "multiply", targetAddress: "0x195cd0", callCount: 27 },
      { name: "subtractWrapper", targetAddress: "0x196240", callCount: 17 },
    ],
    libmLongDoubleHelpers: [
      { name: "floorl", targetAddress: "0x19a380", callCount: 11 },
      { name: "fmodl", targetAddress: "0x19a410", callCount: 2 },
      { name: "cosl", targetAddress: "0x19a420", callCount: 3 },
    ],
    nativeTransformHelpers: [
      { name: "modeOneTransformHelper", targetAddress: "0x1868e0", callCount: 1 },
      { name: "modeZeroTransformHelper", targetAddress: "0x186e40", callCount: 1 },
      { name: "modeOneCorrectionHelper", targetAddress: "0x1859c0", callCount: 1 },
      { name: "modeZeroCorrectionHelper", targetAddress: "0x1861d0", callCount: 1 },
      { name: "sharedTransformHelper", targetAddress: "0x183830", callCount: 4 },
      { name: "coldPackedDecodeHelper", targetAddress: "0x1827b0", callCount: 1 },
      { name: "coldPostTransformHelper", targetAddress: "0x182340", callCount: 1 },
      { name: "modeZeroVectorRangeAssignHelper", targetAddress: "0x183230", callCount: 1 },
    ],
    note: "dependency map only; it does not claim 0x181490 mode 0/1 numeric path parity",
  });
});
