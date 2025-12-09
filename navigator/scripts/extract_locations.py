#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract location strings from ArchDaily project pages into metadata/locations.csv.

Input:
  - navigator/data/metadata/*.json with keys {projectId, projectUrl}
Output:
  - navigator/data/metadata/locations.csv with columns: project_id,location,source

Usage:
  python navigator/scripts/extract_locations.py --data_dir navigator/data --limit 0
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Optional, Tuple

import requests


def _read_project_jsons(meta_dir: Path) -> Dict[str, Dict]:
	out: Dict[str, Dict] = {}
	for p in sorted(meta_dir.glob("p_*.json")):
		try:
			obj = json.loads(p.read_text(encoding="utf-8"))
			pid = obj.get("projectId") or obj.get("project_id")
			if pid:
				out[pid] = obj
		except Exception:
			continue
	return out


def _extract_from_html(html: str) -> Tuple[Optional[str], Optional[str]]:
	"""
	Heuristically extract a human-readable 'City, Country' style location string.
	Returns: (location, source_hint)
	"""
	# Strategy 1: look for a JSON snippet like "location":"City, Country"
	m = re.search(r'"location"\s*:\s*"([^"]{3,120})"', html, flags=re.I)
	if m:
		return m.group(1).strip(), "json:location"
	# Strategy 2: find label 'Location' followed by a sibling text/link
	m = re.search(r'>\s*Location\s*<\s*/[^>]+>\s*<[^>]*>\s*([^<]{3,120})<', html, flags=re.I)
	if m:
		return m.group(1).strip(), "label:block"
	# Strategy 3: nearby context around 'Location' (link text)
	m = re.search(r'Location\s*</[^>]+>\s*<a[^>]*>\s*([^<]{3,120})<', html, flags=re.I)
	if m:
		return m.group(1).strip(), "label:anchor"
	# Strategy 4: look for breadcrumb-like microdata
	m = re.search(r'itemprop="addressLocality"[^>]*>\s*([^<]{2,80})<', html, flags=re.I)
	if m:
		city = m.group(1).strip()
		m2 = re.search(r'itemprop="addressCountry"[^>]*>\s*([^<]{2,80})<', html, flags=re.I)
		if m2:
			return f"{city}, {m2.group(1).strip()}", "microdata:address"
		return city, "microdata:locality"
	return None, None


def main() -> int:
	ap = argparse.ArgumentParser(description="Extract locations from projectUrl into locations.csv")
	ap.add_argument("--data_dir", default="navigator/data", help="Path to data dir containing /metadata")
	ap.add_argument("--limit", type=int, default=0, help="Limit number of projects (0 = all)")
	ap.add_argument("--sleep", type=float, default=0.3, help="Seconds to sleep between requests")
	args = ap.parse_args()

	meta_dir = Path(args.data_dir) / "metadata"
	out_csv = meta_dir / "locations.csv"

	projects = _read_project_jsons(meta_dir)
	items = list(projects.items())
	if args.limit and args.limit > 0:
		items = items[:args.limit]

	rows = ["project_id,location,source"]
	s = requests.Session()
	s.headers.update({"User-Agent": "Mozilla/5.0 (Archipedia extractor)"})

	for pid, obj in items:
		url = obj.get("projectUrl")
		if not url:
			continue
		try:
			r = s.get(url, timeout=20)
			if r.status_code != 200 or not r.text:
				continue
			loc, src = _extract_from_html(r.text)
			if loc:
				# sanitize commas in CSV
				clean = loc.replace(",", " ").strip()
				rows.append(f"{pid},{clean},{src or ''}")
		except Exception:
			continue

	out_csv.write_text("\n".join(rows), encoding="utf-8")
	print(f"Wrote {out_csv} with {len(rows)-1} rows.")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())







