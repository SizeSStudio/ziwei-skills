#!/usr/bin/env python3
"""Construct and validate Ziwei Xingyu APK native input strings.

This module intentionally does not calculate a Ziwei chart. It only models the
13-field Gregorian mode 2 protocol captured from the APK native path.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Any


NATIVE_LABEL_GENDER_FLAGS = {
    "male": "1",
    "m": "1",
    "男": "1",
    "female": "2",
    "f": "2",
    "女": "2",
}


@dataclass(frozen=True)
class Mode2Input:
    year: int
    month: int
    day: int
    hour_code: int
    minute_field: int = 30
    second_field: int = 30
    longitude: Decimal = Decimal("120.000")
    timezone_field: int = -8
    gender_flag: str = "1"
    tail_1: int = 0
    tail_2: int = 0
    tail_3: int = 0

    def fields(self) -> list[str]:
        return [
            "2",
            str(self.year),
            str(self.month),
            str(self.day),
            str(self.hour_code),
            str(self.minute_field),
            str(self.second_field),
            format_longitude(self.longitude),
            str(self.timezone_field),
            self.gender_flag,
            str(self.tail_1),
            str(self.tail_2),
            str(self.tail_3),
        ]


def format_longitude(value: Decimal | float | str) -> str:
    decimal = Decimal(str(value)).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
    return f"{decimal:.3f}"


def gender_to_native_label_flag(gender: str) -> str:
    key = gender.strip().lower()
    try:
        return NATIVE_LABEL_GENDER_FLAGS[key]
    except KeyError as exc:
        raise ValueError(f"unsupported gender for native label branch: {gender!r}") from exc


def build_mode2_body(
    year: int,
    month: int,
    day: int,
    hour_code: int,
    *,
    longitude: Decimal | float | str = Decimal("120.000"),
    gender: str = "male",
    minute_field: int = 30,
    second_field: int = 30,
    timezone_field: int = -8,
    tail_1: int = 0,
    tail_2: int = 0,
    tail_3: int = 0,
) -> str:
    mode2 = Mode2Input(
        year=int(year),
        month=int(month),
        day=int(day),
        hour_code=int(hour_code),
        minute_field=int(minute_field),
        second_field=int(second_field),
        longitude=Decimal(str(longitude)),
        timezone_field=int(timezone_field),
        gender_flag=gender_to_native_label_flag(gender),
        tail_1=int(tail_1),
        tail_2=int(tail_2),
        tail_3=int(tail_3),
    )
    body = "|".join(mode2.fields())
    parsed = parse_mode2_body(body)
    if parsed["field_count"] != 13:
        raise AssertionError(f"mode 2 body must have 13 fields, got {parsed['field_count']}")
    return body


def build_native_input(body: str, *, checks: str | None = None) -> str:
    if checks is None or checks == "":
        raise ValueError("checks prefix is required for native getzwp input")
    if "#" in checks:
        raise ValueError("checks prefix must not contain '#'")
    parse_mode2_body(body)
    return f"{checks}#{body}"


def parse_mode2_body(body: str) -> dict[str, Any]:
    fields = body.split("|")
    if len(fields) != 13:
        raise ValueError(f"mode 2 body must have 13 fields, got {len(fields)}")
    if fields[0] != "2":
        raise ValueError(f"mode 2 body must start with '2', got {fields[0]!r}")
    if fields[9] not in {"1", "2"}:
        raise ValueError(f"mode 2 gender flag must be 1 or 2, got {fields[9]!r}")
    return {
        "field_count": len(fields),
        "mode": int(fields[0]),
        "year": int(fields[1]),
        "month": int(fields[2]),
        "day": int(fields[3]),
        "hour_code": int(fields[4]),
        "minute_field": int(fields[5]),
        "second_field": int(fields[6]),
        "longitude": fields[7],
        "timezone_field": int(fields[8]),
        "gender_flag": fields[9],
        "tail_1": int(fields[10]),
        "tail_2": int(fields[11]),
        "tail_3": int(fields[12]),
    }


def _add_mode2_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--month", type=int, required=True)
    parser.add_argument("--day", type=int, required=True)
    parser.add_argument("--hour-code", type=int, required=True)
    parser.add_argument("--gender", default="male")
    parser.add_argument("--longitude", default="120.000")
    parser.add_argument("--minute-field", type=int, default=30)
    parser.add_argument("--second-field", type=int, default=30)
    parser.add_argument("--timezone-field", type=int, default=-8)
    parser.add_argument("--tail-1", type=int, default=0)
    parser.add_argument("--tail-2", type=int, default=0)
    parser.add_argument("--tail-3", type=int, default=0)


def _body_from_args(args: argparse.Namespace) -> str:
    return build_mode2_body(
        year=args.year,
        month=args.month,
        day=args.day,
        hour_code=args.hour_code,
        longitude=args.longitude,
        gender=args.gender,
        minute_field=args.minute_field,
        second_field=args.second_field,
        timezone_field=args.timezone_field,
        tail_1=args.tail_1,
        tail_2=args.tail_2,
        tail_3=args.tail_3,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    body_parser = subparsers.add_parser("body", help="print the 13-field mode 2 body")
    _add_mode2_args(body_parser)

    native_parser = subparsers.add_parser("native", help="print checks#mode2 body")
    _add_mode2_args(native_parser)
    native_parser.add_argument("--checks", required=True)

    parse_parser = subparsers.add_parser("parse", help="parse a mode 2 body as JSON")
    parse_parser.add_argument("body")

    args = parser.parse_args()
    if args.command == "body":
        print(_body_from_args(args))
    elif args.command == "native":
        print(build_native_input(_body_from_args(args), checks=args.checks))
    elif args.command == "parse":
        print(json.dumps(parse_mode2_body(args.body), ensure_ascii=False, indent=2))
    else:
        parser.error(f"unknown command: {args.command}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
