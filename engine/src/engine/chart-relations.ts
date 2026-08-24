import type { Palace, PalaceRelations } from "../schema/chart";

const BRANCHES = [..."子丑寅卯辰巳午未申酉戌亥"];

export const PALACE_RELATIONS_EVIDENCE_ID = "derived.palace-topology.v1";

export function attachPalaceRelations(palaces: ReadonlyArray<Omit<Palace, "relations">>): Palace[] {
  if (palaces.length !== 12) {
    throw new Error(`palace relations require 12 palaces, got ${palaces.length}`);
  }
  const byBranch = new Map(palaces.map((palace) => [palace.branch, palace]));
  if (byBranch.size !== 12 || BRANCHES.some((branch) => !byBranch.has(branch))) {
    throw new Error("palace relations require one palace for every earthly branch");
  }

  return palaces.map((palace) => ({
    ...palace,
    relations: buildRelations(palace, byBranch),
  }));
}

function buildRelations(
  palace: Omit<Palace, "relations">,
  byBranch: ReadonlyMap<string, Omit<Palace, "relations">>,
): PalaceRelations {
  const branchIndex = BRANCHES.indexOf(palace.branch);
  const oppositeBranch = shiftBranch(branchIndex, 6);
  const trineBranches: [string, string] = [shiftBranch(branchIndex, 4), shiftBranch(branchIndex, 8)];
  const adjacentBranches: [string, string] = [shiftBranch(branchIndex, -1), shiftBranch(branchIndex, 1)];
  const opposite = requiredByBranch(byBranch, oppositeBranch);

  return {
    oppositeBranch,
    oppositePalace: opposite.name,
    trineBranches,
    trinePalaces: trineBranches.map((branch) => requiredByBranch(byBranch, branch).name) as [string, string],
    adjacentBranches,
    adjacentPalaces: adjacentBranches.map((branch) => requiredByBranch(byBranch, branch).name) as [string, string],
    hasMajorStars: palace.majorStars.length > 0,
    oppositeMajorStars: opposite.majorStars.map((star) => star.name),
    evidenceIds: [PALACE_RELATIONS_EVIDENCE_ID],
  };
}

function shiftBranch(index: number, offset: number): string {
  return BRANCHES[((index + offset) % 12 + 12) % 12] as string;
}

function requiredByBranch<T>(byBranch: ReadonlyMap<string, T>, branch: string): T {
  const palace = byBranch.get(branch);
  if (palace === undefined) throw new Error(`palace is absent for branch: ${branch}`);
  return palace;
}
