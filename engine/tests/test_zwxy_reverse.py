import os
import pathlib
import sys
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from zwxy_reverse import ElfView  # noqa: E402


DEFAULT_SO = pathlib.Path(
    "/Users/sizes-studio/Documents/Personal/apk-reverse/app-apk/unpacked/lib/x86_64/libziweixingyu.so"
)


class ZwxyReverseTests(unittest.TestCase):
    def setUp(self):
        self.so_path = pathlib.Path(os.environ.get("ZWXY_SO", DEFAULT_SO))
        if not self.so_path.exists():
            self.skipTest(f"native library not found: {self.so_path}")

    def test_relocation_table_decodes_ganzhi_seed(self):
        with ElfView(self.so_path) as elf:
            rows = elf.decode_reloc_pointer_table(0x19EB20, 3)

        self.assertEqual([row["text"] for row in rows], ["甲子", "乙丑", "丙寅"])

    def test_bss_address_is_not_file_backed(self):
        with ElfView(self.so_path) as elf:
            with self.assertRaises(ValueError):
                elf.read_c_string(0x1A5F30)

    def test_x86_structure_write_extractor_tracks_rbx_and_alias_writes(self):
        with ElfView(self.so_path) as elf:
            writes = elf.decode_x86_structure_writes(0x14DBD0, 0x14E560, base_register="rbx")

        by_offset = {row["offset"]: row for row in writes}
        self.assertEqual(by_offset["0x0"]["address"], "0x14dc54")
        self.assertEqual(by_offset["0x10"]["address"], "0x14dc5b")
        self.assertEqual(by_offset["0x50"]["address"], "0x14dc8b")
        self.assertEqual(by_offset["0xa0"]["address"], "0x14e0c5")
        self.assertEqual(by_offset["0xd8"]["address"], "0x14e4d3")
        self.assertEqual(by_offset["0x130"]["address"], "0x14e559")

    def test_x86_structure_write_trace_keeps_repeated_writes_to_same_offset(self):
        with ElfView(self.so_path) as elf:
            writes = elf.decode_x86_structure_writes(0x14DBD0, 0x14E9D6, base_register="rbx", dedupe=False)

        offset_a0_writes = [row for row in writes if row["offset"] == "0xa0"]
        self.assertEqual(
            [row["address"] for row in offset_a0_writes],
            ["0x14e0c5", "0x14e46d", "0x14e927"],
        )
        self.assertEqual(offset_a0_writes[0]["size"], 4)
        self.assertEqual(offset_a0_writes[1]["size"], 16)
        self.assertEqual(offset_a0_writes[2]["size"], 8)

    def test_x86_structure_write_extractor_ignores_non_store_memory_operands(self):
        with ElfView(self.so_path) as elf:
            writes = elf.decode_x86_structure_writes(0x14BED0, 0x14D7A3, base_register="rbx")

        mnemonics = {row["mnemonic"] for row in writes}
        offsets = {row["offset"] for row in writes}
        self.assertNotIn("nop", mnemonics)
        self.assertTrue({"0x1c", "0x68", "0x6a", "0x74"}.issubset(offsets))

    def test_x86_structure_write_extractor_tracks_register_move_aliases(self):
        with ElfView(self.so_path) as elf:
            writes = elf.decode_x86_structure_writes(0x1828C2, 0x182AD0, base_register="rdi")

        by_offset = {row["offset"]: row for row in writes}
        self.assertEqual(by_offset["0x18"]["address"], "0x182929")
        self.assertEqual(by_offset["0x30"]["address"], "0x1829bf")
        self.assertEqual(by_offset["0x40"]["address"], "0x1829ed")
        self.assertEqual(by_offset["0x58"]["address"], "0x182a50")
        self.assertEqual(by_offset["0x98"]["address"], "0x182aad")
        self.assertEqual(by_offset["0x88"]["address"], "0x182acc")

    def test_x86_structure_read_extractor_tracks_0x14bed0_context_offsets(self):
        with ElfView(self.so_path) as elf:
            entry_reads = elf.decode_x86_structure_reads(0x14C026, 0x14C036, base_register="rax")
            month_reads = elf.decode_x86_structure_reads(0x14C1C5, 0x14C1D0, base_register="rax")
            table_reads = elf.decode_x86_structure_reads(0x14C259, 0x14C285, base_register="rsi")
            repeat_reads = elf.decode_x86_structure_reads(0x14C45E, 0x14C47F, base_register="rcx")

        entry_by_offset = {row["offset"]: row for row in entry_reads}
        self.assertEqual(entry_by_offset["0x10"]["address"], "0x14c02d")
        self.assertEqual(entry_by_offset["0x18"]["address"], "0x14c031")

        month_by_offset = {row["offset"]: row for row in month_reads}
        self.assertEqual(month_by_offset["0x50"]["address"], "0x14c1cc")

        table_by_offset = {row["offset"]: row for row in table_reads}
        self.assertEqual(table_by_offset["0x68"]["address"], "0x14c260")
        self.assertEqual(table_by_offset["0x80"]["address"], "0x14c26e")
        self.assertEqual(table_by_offset["0x98"]["address"], "0x14c27f")
        self.assertEqual(table_by_offset["0x98"]["size"], 4)

        repeat_by_offset = {row["offset"]: row for row in repeat_reads}
        self.assertEqual(repeat_by_offset["0x68"]["address"], "0x14c465")
        self.assertEqual(repeat_by_offset["0x80"]["address"], "0x14c470")
        self.assertEqual(repeat_by_offset["0x98"]["address"], "0x14c47e")

    def test_x86_structure_read_extractor_ignores_store_destinations(self):
        with ElfView(self.so_path) as elf:
            reads = elf.decode_x86_structure_reads(0x14C455, 0x14C46E, base_register="rbx")

        self.assertEqual(reads, [])

    def test_x86_structure_read_extractor_tracks_register_move_aliases(self):
        with ElfView(self.so_path) as elf:
            reads = elf.decode_x86_structure_reads(0x1828C2, 0x182AD0, base_register="rdi")

        by_offset = {row["offset"]: row for row in reads}
        self.assertEqual(by_offset["0x10"]["address"], "0x182925")
        self.assertEqual(by_offset["0x50"]["address"], "0x182a4c")
        self.assertEqual(by_offset["0x68"]["address"], "0x182ac1")
        self.assertEqual(by_offset["0x80"]["address"], "0x182ac5")


if __name__ == "__main__":
    unittest.main()
