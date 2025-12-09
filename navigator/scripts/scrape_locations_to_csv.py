#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scrape human-readable locations from ArchDaily project pages and write locations.csv.

Inputs:
  - navigator/data/metadata/*.json  (expects fields: projectId, projectUrl)
Outputs:
  - navigator/data/metadata/locations.csv (project_id,location,source)

Usage:
  python navigator/scripts/scrape_locations_to_csv.py --data_dir navigator/data --limit 0
"""
from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests


LABEL_KEYWORDS = [
	"Location", "Address",
	"Ubicación", "Direccion", "Dirección", "Ubicacion",
	"Localização", "Localizacao",
	"Localisation",
	"Lage", "Adresse",
	"Ubicació", "Adreça",
	"Posizione", "Indirizzo",
]


def _http_session() -> requests.Session:
	s = requests.Session()
	s.headers.update({"User-Agent": "Mozilla/5.0 (Archipedia location scraper)"})
	return s


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


def _match_any(html: str, patterns: List[str]) -> Optional[str]:
	for rx in patterns:
		m = re.search(rx, html, flags=re.I | re.S)
		if m:
			return m.group(1).strip()
	return None


def _extract_location_from_html(html: str) -> Optional[str]:
	# 1) JSON-like keys commonly present
	json_candidates = [
		r'"addressLocality"\s*:\s*"([^"]{2,80})"',
		r'"addressRegion"\s*:\s*"([^"]{2,80})"',
		r'"addressCountry"\s*:\s*"([^"]{2,80})"',
		r'"location"\s*:\s*"([^"]{3,120})"',
	]
	city = _match_any(html, [json_candidates[0]])
	region = _match_any(html, [json_candidates[1]])
	country = _match_any(html, [json_candidates[2]])
	if city or region or country:
		parts = [p for p in [city, region, country] if p]
		if parts:
			return ", ".join(parts)
	loc = _match_any(html, [json_candidates[3]])
	if loc:
		return loc

	# 2) Microdata itemprops
	city2 = _match_any(html, [r'itemprop="addressLocality"[^>]*>\s*([^<]{2,80})<'])
	country2 = _match_any(html, [r'itemprop="addressCountry"[^>]*>\s*([^<]{2,80})<'])
	if city2 or country2:
		parts = [p for p in [city2, country2] if p]
		if parts:
			return ", ".join(parts)

	# 3) Label-based capture: various languages near a link or text node
	label_union = "|".join([re.escape(k) for k in LABEL_KEYWORDS])
	label_patterns = [
		rf'>\s*(?:{label_union})\s*<\s*/[^>]+>\s*<[^>]*>\s*([^<]{{3,120}})<',
		rf'(?:{label_union})\s*</[^>]+>\s*<a[^>]*>\s*([^<]{{3,120}})<',
	]
	loc3 = _match_any(html, label_patterns)
	if loc3:
		return loc3

	# 4) Breadcrumbs trail often includes city/country
	crumb = _match_any(html, [r'aria-label="breadcrumb"[\s\S]{0,2000}?<li[^>]*>\s*<a[^>]*>\s*([^<]{3,80})<'])
	if crumb:
		return crumb

	return None


def main() -> int:
	ap = argparse.ArgumentParser(description="Scrape locations into locations.csv")
	ap.add_argument("--data_dir", default="navigator/data", help="Path to data directory containing /metadata")
	ap.add_argument("--limit", type=int, default=0, help="Limit rows (0 = all)")
	ap.add_argument("--sleep", type=float, default=0.2, help="Seconds between requests")
	args = ap.parse_args()

	meta_dir = Path(args.data_dir) / "metadata"
	out_csv = meta_dir / "locations.csv"
	projects = _read_project_jsons(meta_dir)
	items = list(projects.items())
	if args.limit and args.limit > 0:
		items = items[:args.limit]

	s = _http_session()
	rows = ["project_id,location,source"]
	found = 0
	for pid, obj in items:
		url = (obj.get("projectUrl") or "").strip()
		if not url:
			continue
		try:
			r = s.get(url, timeout=25)
			if r.status_code != 200 or not r.text:
				continue
			loc = _extract_location_from_html(r.text)
			if loc:
				# Flatten commas for simple CSV writing
				clean = " ".join(loc.replace("\n", " ").split()).replace(",", " ").strip()
				rows.append(f"{pid},{clean},scrape")
				found += 1
		except Exception:
			continue
		time.sleep(max(0.0, args.sleep))

	out_csv.write_text("\n".join(rows), encoding="utf-8")
	print(f"Wrote {out_csv} with {found} scraped rows.")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())







