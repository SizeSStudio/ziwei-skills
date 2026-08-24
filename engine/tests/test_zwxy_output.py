import pathlib
import sys
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from zwxy_output import format_natal_chart_text, validate_chart  # noqa: E402


BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
PALACE_NAMES = ["田宅", "官禄", "交友", "迁移", "疾厄", "财帛", "子女", "夫妻", "兄弟", "命", "父母", "福德"]


def complete_chart():
    palaces = []
    for index, branch in enumerate(BRANCHES):
        name = PALACE_NAMES[index]
        palaces.append(
            {
                "branch": branch,
                "name": f"{name}宫",
                "stem": "甲",
                "stars": [{"name": "紫微", "brightness": "旺"}],
                "transformations": [
                    {
                        "star": "廉贞",
                        "type": "化禄",
                        "strength": 50,
                        "target_branch": "丑",
                        "target_palace": "官禄宫",
                    }
                ],
                "decade": "33~42",
                "annual_ages": [9, 21, 33, 45, 57, 69],
                "minor_stars": ["喜神", "灾煞"],
                "changsheng": "沐浴",
                "markers": [],
            }
        )
    palaces[6]["markers"] = ["来因宫"]
    palaces[9]["markers"] = ["命宫"]
    palaces[7]["markers"] = ["身宫寄此"]
    return {
        "meta": {
            "source": "ziweixingyu-apk-native",
            "chart_slug": "user-1998-02-20-M",
            "clock_time": "1998-02-20 09:40:30",
            "true_solar_time": "1998-02-20 09:26:43",
            "lunar_time": "1998年正月廿四日巳时",
            "four_pillars": "戊寅 甲寅 戊戌 丁巳",
            "gender": "阳男",
            "five_elements": "木三局",
            "laiyin": "午宫",
            "ming": "酉宫",
            "shen": "未宫",
            "ming_master": "文曲",
            "shen_master": "天梁",
        },
        "palaces": palaces,
    }


class ZwxyOutputTests(unittest.TestCase):
    def test_format_natal_chart_text_matches_ziwei_natal_entry_shape(self):
        text = format_natal_chart_text(complete_chart())

        self.assertIn("北京时间：1998-02-20 09:40:30", text)
        self.assertIn("真太阳时：1998-02-20 09:26:43", text)
        self.assertIn("四柱八字：戊寅 甲寅 戊戌 丁巳", text)
        self.assertIn("来因宫：午宫", text)
        self.assertIn("十二宫：", text)
        self.assertIn("午宫 (来因宫)", text)
        self.assertIn("未宫 (身宫寄此)", text)
        self.assertIn("酉宫 (命宫)", text)
        self.assertIn("宫内星：紫微(旺)", text)
        self.assertIn("子宫产生的四化", text)
        self.assertIn("廉贞化禄50%  → 丑官禄宫", text)
        self.assertIn("小限：9,21,33,45,57,69", text)
        self.assertEqual(text.count("宫名："), 12)

    def test_validate_chart_rejects_incomplete_palace(self):
        chart = complete_chart()
        del chart["palaces"][0]["transformations"]

        with self.assertRaises(ValueError):
            validate_chart(chart)


if __name__ == "__main__":
    unittest.main()
