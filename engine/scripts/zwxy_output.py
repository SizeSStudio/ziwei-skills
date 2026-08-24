#!/usr/bin/env python3
"""Format reproduced APK chart data for ziwei-natal.

This formatter is deliberately downstream-only: it accepts a complete chart
object and refuses incomplete data instead of filling algorithm gaps.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REQUIRED_META = [
    "clock_time",
    "true_solar_time",
    "lunar_time",
    "four_pillars",
    "gender",
    "five_elements",
    "laiyin",
    "ming",
    "shen",
    "ming_master",
    "shen_master",
]

REQUIRED_PALACE = [
    "branch",
    "name",
    "stem",
    "stars",
    "transformations",
    "decade",
    "annual_ages",
    "minor_stars",
    "changsheng",
]


def validate_chart(chart: dict[str, Any]) -> None:
    if not isinstance(chart, dict):
        raise ValueError("chart must be an object")
    meta = chart.get("meta")
    if not isinstance(meta, dict):
        raise ValueError("chart.meta must be an object")
    for key in REQUIRED_META:
        if key not in meta or meta[key] in (None, ""):
            raise ValueError(f"chart.meta.{key} is required")

    palaces = chart.get("palaces")
    if not isinstance(palaces, list):
        raise ValueError("chart.palaces must be a list")
    if len(palaces) != 12:
        raise ValueError(f"chart.palaces must contain 12 palaces, got {len(palaces)}")

    for index, palace in enumerate(palaces):
        if not isinstance(palace, dict):
            raise ValueError(f"chart.palaces[{index}] must be an object")
        for key in REQUIRED_PALACE:
            if key not in palace:
                raise ValueError(f"chart.palaces[{index}].{key} is required")
        if not isinstance(palace["stars"], list):
            raise ValueError(f"chart.palaces[{index}].stars must be a list")
        if not isinstance(palace["transformations"], list):
            raise ValueError(f"chart.palaces[{index}].transformations must be a list")


def format_natal_chart_text(chart: dict[str, Any]) -> str:
    validate_chart(chart)
    meta = chart["meta"]
    lines: list[str] = [
        "出生于",
        f"北京时间：{meta['clock_time']}",
        f"真太阳时：{meta['true_solar_time']}",
        f"阴历时间：{meta['lunar_time']}",
        f"四柱八字：{meta['four_pillars']}",
        f"性别：{meta['gender']}",
        f"五行局：{meta['five_elements']}",
        f"来因宫：{meta['laiyin']}",
        f"命宫：{meta['ming']}",
        f"身宫：{meta['shen']}",
        f"命主：{meta['ming_master']}",
        f"身主：{meta['shen_master']}",
        "",
        "十二宫：",
    ]

    for palace in chart["palaces"]:
        lines.extend(["", _format_palace_header(palace)])
        lines.append(f"宫名：{palace['name']}")
        lines.append(f"宫干：{palace['stem']}")
        lines.append(f"宫内星：{_format_stars(palace['stars'])}")
        transformation_title = f"{palace['branch']}宫产生的四化"
        if "来因宫" in palace.get("markers", []):
            transformation_title += " (即生年四化)"
        lines.append(f"{transformation_title}：")
        for transformation in palace["transformations"]:
            lines.append(f"  {_format_transformation(transformation)}")
        lines.append(f"大限：{palace['decade']}")
        lines.append(f"小限：{_join_values(palace['annual_ages'])}")
        lines.append(f"小星：{_join_values(palace['minor_stars'], sep='、')}")
        lines.append(f"长生：{palace['changsheng']}")

    return "\n".join(lines).rstrip() + "\n"


def _format_palace_header(palace: dict[str, Any]) -> str:
    markers = palace.get("markers") or []
    suffix = ""
    if markers:
        suffix = " (" + " / ".join(markers) + ")"
    return f"{palace['branch']}宫{suffix}"


def _format_stars(stars: list[Any]) -> str:
    rendered = []
    for star in stars:
        if isinstance(star, str):
            rendered.append(star)
        elif isinstance(star, dict):
            name = star.get("name")
            if not name:
                raise ValueError("star.name is required")
            brightness = star.get("brightness")
            rendered.append(f"{name}({brightness})" if brightness else name)
        else:
            raise ValueError("stars must contain strings or objects")
    return " ".join(rendered)


def _format_transformation(transformation: dict[str, Any]) -> str:
    for key in ["star", "type", "strength", "target_branch", "target_palace"]:
        if key not in transformation:
            raise ValueError(f"transformation.{key} is required")
    return (
        f"{transformation['star']}{transformation['type']}{transformation['strength']}%  "
        f"→ {transformation['target_branch']}{transformation['target_palace']}"
    )


def _join_values(values: list[Any], *, sep: str = ",") -> str:
    return sep.join(str(value) for value in values)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="complete chart JSON file")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    chart = json.loads(args.input.read_text(encoding="utf-8"))
    text = format_natal_chart_text(chart)
    if args.out:
        args.out.write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
