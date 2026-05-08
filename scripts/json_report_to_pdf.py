#!/usr/bin/env python3
"""Convert a text JSON report into a simple PDF for WhatsApp document delivery."""

from __future__ import annotations

import argparse
from pathlib import Path


def pdf_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_pdf(lines: list[str]) -> bytes:
    page_width = 612
    page_height = 792
    font_size = 8
    line_height = 10
    margin_x = 36
    start_y = 756
    lines_per_page = int((start_y - 36) / line_height)
    pages = [lines[i : i + lines_per_page] for i in range(0, len(lines), lines_per_page)] or [[]]
    objects: list[bytes] = []

    def add(obj: bytes) -> int:
        objects.append(obj)
        return len(objects)

    catalog_id = add(b"")
    pages_id = add(b"")
    font_id = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")
    page_ids: list[int] = []
    content_ids: list[int] = []

    for page_lines in pages:
        commands = ["BT", f"/F1 {font_size} Tf", f"{margin_x} {start_y} Td"]
        for index, raw_line in enumerate(page_lines):
            line = pdf_escape(raw_line[:110])
            if index == 0:
                commands.append(f"({line}) Tj")
            else:
                commands.append(f"0 -{line_height} Td ({line}) Tj")
        commands.append("ET")
        stream = "\n".join(commands).encode("latin-1", errors="replace")
        content_id = add(
            b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream"
        )
        page_id = add(b"")
        content_ids.append(content_id)
        page_ids.append(page_id)

    objects[catalog_id - 1] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode()
    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode()
    for page_id, content_id in zip(page_ids, content_ids):
        objects[page_id - 1] = (
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {page_width} {page_height}] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        ).encode()

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n".encode()
    )
    return bytes(pdf)


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a JSON report to a simple PDF.")
    parser.add_argument("input", nargs="?", default="logs/judge-demo-report.json")
    parser.add_argument("output", nargs="?", default="logs/judge-demo-report.pdf")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    text = input_path.read_text(encoding="utf-8")
    lines = ["mnemochron Judge Demo JSON Report", "", *text.splitlines()]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(build_pdf(lines))
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
