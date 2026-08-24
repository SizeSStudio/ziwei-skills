import pathlib
import sys
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from zwxy_protocol import (  # noqa: E402
    build_mode2_body,
    build_native_input,
    gender_to_native_label_flag,
    parse_mode2_body,
)


class ZwxyProtocolTests(unittest.TestCase):
    def test_mode2_body_uses_native_field_order(self):
        body = build_mode2_body(
            year=1998,
            month=2,
            day=20,
            hour_code=6,
            longitude=120.0,
            gender="male",
        )

        self.assertEqual(body, "2|1998|2|20|6|30|30|120.000|-8|1|0|0|0")
        self.assertEqual(len(body.split("|")), 13)
        self.assertEqual(parse_mode2_body(body)["mode"], 2)

    def test_gender_flags_use_native_mode2_values(self):
        self.assertEqual(gender_to_native_label_flag("male"), "1")
        self.assertEqual(gender_to_native_label_flag("female"), "2")

    def test_native_input_requires_checks_prefix(self):
        body = build_mode2_body(1998, 2, 20, 6, gender="female")

        with self.assertRaises(ValueError):
            build_native_input(body)

        self.assertEqual(
            build_native_input(body, checks="123456789012345678"),
            "123456789012345678#2|1998|2|20|6|30|30|120.000|-8|2|0|0|0",
        )


if __name__ == "__main__":
    unittest.main()
