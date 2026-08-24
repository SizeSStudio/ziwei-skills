#!/usr/bin/env python3
"""Small ELF helpers for reverse-engineering libziweixingyu.so tables."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

STORE_MNEMONIC_PREFIXES = ("mov", "vmov")
NON_READING_MEMORY_MNEMONICS = ("lea", "nop")

try:
    from elftools.elf.elffile import ELFFile
except ImportError as exc:  # pragma: no cover - exercised by environment.
    raise SystemExit("pyelftools is required; use the apk-reverse venv python") from exc

try:
    from capstone import Cs, CS_ARCH_X86, CS_MODE_64
    from capstone.x86 import X86_OP_MEM, X86_OP_REG
except ImportError:  # pragma: no cover - optional until disassembly helpers are used.
    Cs = None
    CS_ARCH_X86 = CS_MODE_64 = X86_OP_MEM = X86_OP_REG = None


class ElfView:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self._fh = self.path.open("rb")
        self.elf = ELFFile(self._fh)
        self.ptr_size = 8 if self.elf.elfclass == 64 else 4
        self.endian = "little" if self.elf.little_endian else "big"
        self._relative_relocations = self._load_relative_relocations()

    def close(self) -> None:
        self._fh.close()

    def __enter__(self) -> "ElfView":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def _load_relative_relocations(self) -> dict[int, int]:
        relocs: dict[int, int] = {}
        for section in self.elf.iter_sections():
            if not section.name.startswith(".rel"):
                continue
            if not hasattr(section, "iter_relocations"):
                continue
            for relocation in section.iter_relocations():
                entry = relocation.entry
                if "r_addend" not in entry:
                    continue
                if entry["r_info_sym"] != 0:
                    continue
                relocs[int(entry["r_offset"])] = int(entry["r_addend"])
        return relocs

    def section_for_vaddr(self, vaddr: int):
        for section in self.elf.iter_sections():
            start = int(section["sh_addr"])
            size = int(section["sh_size"])
            if start <= vaddr < start + size:
                return section
        raise ValueError(f"address 0x{vaddr:x} is not covered by an ELF section")

    def read_bytes_at_vaddr(self, vaddr: int, size: int) -> bytes:
        section = self.section_for_vaddr(vaddr)
        if section["sh_type"] == "SHT_NOBITS":
            raise ValueError(f"address 0x{vaddr:x} is in non-file-backed section {section.name}")
        offset = int(section["sh_offset"]) + (vaddr - int(section["sh_addr"]))
        self._fh.seek(offset)
        data = self._fh.read(size)
        if len(data) != size:
            raise ValueError(f"short read at 0x{vaddr:x}: wanted {size}, got {len(data)}")
        return data

    def read_pointer(self, vaddr: int) -> int:
        if vaddr in self._relative_relocations:
            return self._relative_relocations[vaddr]
        data = self.read_bytes_at_vaddr(vaddr, self.ptr_size)
        return int.from_bytes(data, self.endian)

    def read_c_string(self, vaddr: int, *, limit: int = 4096) -> str:
        section = self.section_for_vaddr(vaddr)
        if section["sh_type"] == "SHT_NOBITS":
            raise ValueError(f"address 0x{vaddr:x} is in non-file-backed section {section.name}")

        start = int(section["sh_addr"])
        end = start + int(section["sh_size"])
        max_size = min(limit, end - vaddr)
        data = self.read_bytes_at_vaddr(vaddr, max_size)
        nul = data.find(b"\x00")
        if nul != -1:
            data = data[:nul]
        return data.decode("utf-8", errors="replace")

    def decode_reloc_pointer_table(self, vaddr: int, count: int) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for index in range(count):
            slot = vaddr + index * self.ptr_size
            target = self.read_pointer(slot)
            text = "" if target == 0 else self.read_c_string(target)
            rows.append(
                {
                    "index": index,
                    "slot": f"0x{slot:x}",
                    "target": f"0x{target:x}",
                    "text": text,
                }
            )
        return rows

    def disassemble_x86(self, start: int, stop: int) -> list[dict[str, Any]]:
        if Cs is None:
            raise RuntimeError("capstone is required for disassembly; use the apk-reverse venv python")
        if stop <= start:
            raise ValueError("stop address must be greater than start address")
        code = self.read_bytes_at_vaddr(start, stop - start + 15)
        md = Cs(CS_ARCH_X86, CS_MODE_64)
        md.detail = True
        rows: list[dict[str, Any]] = []
        for insn in md.disasm(code, start):
            if insn.address >= stop:
                break
            rows.append(
                {
                    "address": f"0x{insn.address:x}",
                    "mnemonic": insn.mnemonic,
                    "op_str": insn.op_str,
                    "_insn": insn,
                }
            )
        return rows

    def decode_x86_structure_writes(
        self,
        start: int,
        stop: int,
        *,
        base_register: str,
        dedupe: bool = True,
    ) -> list[dict[str, Any]]:
        aliases = {base_register: 0}
        writes: list[dict[str, Any]] = []
        seen_offsets: set[int] = set()

        for row in self.disassemble_x86(start, stop):
            insn = row["_insn"]
            operands = insn.operands
            _track_x86_register_alias(insn, aliases)

            if not operands:
                continue
            if not insn.mnemonic.startswith(STORE_MNEMONIC_PREFIXES):
                continue
            destination = operands[0]
            if destination.type != X86_OP_MEM:
                continue
            base = insn.reg_name(destination.mem.base)
            if base not in aliases:
                continue
            offset = aliases[base] + int(destination.mem.disp)
            if dedupe and offset in seen_offsets:
                continue
            seen_offsets.add(offset)
            writes.append(
                {
                    "address": row["address"],
                    "mnemonic": row["mnemonic"],
                    "op_str": row["op_str"],
                    "base": base,
                    "base_offset": f"0x{aliases[base]:x}",
                    "offset": f"0x{offset:x}",
                    "size": destination.size,
                }
            )

        return writes

    def decode_x86_structure_reads(
        self,
        start: int,
        stop: int,
        *,
        base_register: str,
        dedupe: bool = True,
    ) -> list[dict[str, Any]]:
        aliases = {base_register: 0}
        reads: list[dict[str, Any]] = []
        seen_offsets: set[int] = set()

        for row in self.disassemble_x86(start, stop):
            insn = row["_insn"]
            operands = insn.operands
            _track_x86_register_alias(insn, aliases)

            if not operands:
                continue
            if insn.mnemonic.startswith(NON_READING_MEMORY_MNEMONICS):
                continue

            for operand_index, operand in enumerate(operands):
                if operand.type != X86_OP_MEM:
                    continue
                if _is_store_destination(insn.mnemonic, operand_index):
                    continue
                base = insn.reg_name(operand.mem.base)
                if base not in aliases:
                    continue
                offset = aliases[base] + int(operand.mem.disp)
                if dedupe and offset in seen_offsets:
                    continue
                seen_offsets.add(offset)
                reads.append(
                    {
                        "address": row["address"],
                        "mnemonic": row["mnemonic"],
                        "op_str": row["op_str"],
                        "base": base,
                        "base_offset": f"0x{aliases[base]:x}",
                        "offset": f"0x{offset:x}",
                        "size": operand.size,
                        "operand_index": operand_index,
                    }
                )

        return reads


def _track_x86_register_alias(insn, aliases: dict[str, int]) -> None:
    operands = insn.operands
    if len(operands) < 2 or operands[0].type != X86_OP_REG:
        return

    destination = insn.reg_name(operands[0].reg)
    source = operands[1]
    if insn.mnemonic == "lea" and source.type == X86_OP_MEM:
        base = insn.reg_name(source.mem.base)
        if base in aliases:
            aliases[destination] = aliases[base] + int(source.mem.disp)
    elif insn.mnemonic == "mov" and source.type == X86_OP_REG:
        source_register = insn.reg_name(source.reg)
        if source_register in aliases:
            aliases[destination] = aliases[source_register]


def _is_store_destination(mnemonic: str, operand_index: int) -> bool:
    return operand_index == 0 and mnemonic.startswith(STORE_MNEMONIC_PREFIXES)


def _parse_int(value: str) -> int:
    return int(value, 0)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    table_parser = subparsers.add_parser("table", help="decode a relocation pointer table")
    table_parser.add_argument("--so", required=True)
    table_parser.add_argument("--addr", type=_parse_int, required=True)
    table_parser.add_argument("--count", type=int, required=True)
    table_parser.add_argument("--json", action="store_true")

    string_parser = subparsers.add_parser("string", help="read a C string at virtual address")
    string_parser.add_argument("--so", required=True)
    string_parser.add_argument("--addr", type=_parse_int, required=True)

    writes_parser = subparsers.add_parser("writes", help="decode x86_64 writes to a base register structure")
    writes_parser.add_argument("--so", required=True)
    writes_parser.add_argument("--start", type=_parse_int, required=True)
    writes_parser.add_argument("--stop", type=_parse_int, required=True)
    writes_parser.add_argument("--base", default="rbx")
    writes_parser.add_argument("--trace", action="store_true", help="include repeated writes instead of one field-map row per offset")
    writes_parser.add_argument("--json", action="store_true")

    reads_parser = subparsers.add_parser("reads", help="decode x86_64 reads from a base register structure")
    reads_parser.add_argument("--so", required=True)
    reads_parser.add_argument("--start", type=_parse_int, required=True)
    reads_parser.add_argument("--stop", type=_parse_int, required=True)
    reads_parser.add_argument("--base", required=True)
    reads_parser.add_argument("--trace", action="store_true", help="include repeated reads instead of one field-map row per offset")
    reads_parser.add_argument("--json", action="store_true")

    args = parser.parse_args()
    with ElfView(args.so) as elf:
        if args.command == "table":
            rows = elf.decode_reloc_pointer_table(args.addr, args.count)
            if args.json:
                print(json.dumps(rows, ensure_ascii=False, indent=2))
            else:
                for row in rows:
                    print(f"{row['index']:04d} {row['slot']} -> {row['target']} {row['text']}")
        elif args.command == "string":
            print(elf.read_c_string(args.addr))
        elif args.command == "writes":
            rows = elf.decode_x86_structure_writes(args.start, args.stop, base_register=args.base, dedupe=not args.trace)
            if args.json:
                print(json.dumps(rows, ensure_ascii=False, indent=2))
            else:
                for row in rows:
                    print(
                        f"{row['address']} {row['offset']:>6} size={row['size']:<2} "
                        f"{row['mnemonic']} {row['op_str']}"
                    )
        elif args.command == "reads":
            rows = elf.decode_x86_structure_reads(args.start, args.stop, base_register=args.base, dedupe=not args.trace)
            if args.json:
                print(json.dumps(rows, ensure_ascii=False, indent=2))
            else:
                for row in rows:
                    print(
                        f"{row['address']} {row['offset']:>6} size={row['size']:<2} "
                        f"operand={row['operand_index']} {row['mnemonic']} {row['op_str']}"
                    )
        else:
            parser.error(f"unknown command: {args.command}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
