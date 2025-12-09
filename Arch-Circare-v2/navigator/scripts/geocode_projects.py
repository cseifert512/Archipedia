#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Geocode projects to latitude/longitude using OpenStreetMap's Nominatim.

Inputs:
  - navigator/data/metadata/projects_enriched.json   (from enrich_projects.py)

Outputs:
  - navigator/data/metadata/projects_enriched_geo.json

Notes:
  - This uses public Nominatim (polite usage only). For higher volume,
    consider a paid provider and add API key support.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

THIS_DIR = Path(__file__).resolve().parent
DATA_DIR = THIS_DIR.parent / "data" / "metadata"
IN_JSON = DATA_DIR / "projects_enriched.json"
OUT_JSON = DATA_DIR / "projects_enriched_geo.json"

USER_AGENT = "archipedia-geocoder/1.0 (contact: admin@archipedia.local)"


def geocode(query: str, country_hint: Optional[str] = None) -> Optional[Dict[str, float]]:
	params = {"q": query, "format": "json", "limit": 1}
	if country_hint:
		params["country"] = country_hint
	try:
		resp = requests.get(
			"https://nominatim.openstreetmap.org/search",
			params=params,
			headers={"User-Agent": USER_AGENT},
			timeout=30,
		)
		resp.raise_for_status()
		results = resp.json()
		if not results:
			return None
		lat = float(results[0]["lat"])
		lon = float(results[0]["lon"])
		return {"lat": lat, "lon": lon}
	except Exception:
		return None


def main() -> int:
	parser = argparse.ArgumentParser(description="Add coordinates to enriched projects.")
	parser.add_argument("--sleep", type=float, default=1.0, help="Seconds between requests (be polite)")
	parser.add_argument("--overwrite", action="store_true", help="Overwrite output file if present")
	args = parser.parse_args()

	if OUT_JSON.exists() and not args.overwrite:
		print(f"Output exists. Use --overwrite to regenerate: {OUT_JSON}")
		return 0
	if not IN_JSON.exists():
		raise FileNotFoundError(f"Missing input JSON: {IN_JSON}. Run enrich_projects.py first.")

	with IN_JSON.open("r", encoding="utf-8") as f:
		items: List[Dict[str, Any]] = json.load(f)

	for i, item in enumerate(items, 1):
		if item.get("coordinates"):
			continue
		# Prefer explicit location string; otherwise use title + country as a soft query.
		loc = item.get("location")
		country = item.get("country")
		title = item.get("title")

		query = loc or f"{title}, {country}" if country else title
		if not query:
			continue
		coords = geocode(query, country_hint=country)
		if coords:
			item["coordinates"] = coords
			print(f"[{i}/{len(items)}] {item.get('project_id')} -> {coords}")
		else:
			print(f"[{i}/{len(items)}] {item.get('project_id')} -> NOT FOUND")
		time.sleep(args.sleep)

	with OUT_JSON.open("w", encoding="utf-8") as f:
		json.dump(items, f, ensure_ascii=False, indent=2)
	print(f"Wrote: {OUT_JSON}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())







