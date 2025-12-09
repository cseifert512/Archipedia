#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Geocode projects and append lat/lon to data/metadata/projects.csv.

Inputs:
  - data/metadata/projects.csv (must already exist; generate first)
  - data/metadata/{project_id}.json (optional, for richer location hints)

Outputs:
  - data/metadata/projects.csv (overwritten with added columns lat,lon)

Providers:
  - Nominatim (default, no key). Respectful rate limiting is applied.
  - Mapbox (set MAPBOX_TOKEN)
  - Google Geocoding (set GOOGLE_API_KEY)

Usage:
  python navigator/scripts/geocode_projects.py --data_dir navigator/data --limit 0
"""
from __future__ import annotations

import argparse
import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import pandas as pd
import requests
import re


@dataclass
class Providers:
	mapbox_token: Optional[str]
	google_key: Optional[str]


def _http_session() -> requests.Session:
	s = requests.Session()
	s.headers.update({"User-Agent": "Mozilla/5.0 (Archipedia geocoder)"})
	return s


def _read_project_json(meta_dir: Path, project_id: str) -> Dict[str, Any]:
	p = meta_dir / f"{project_id}.json"
	if not p.exists():
		return {}
	try:
		with p.open("r", encoding="utf-8") as f:
			return json.load(f)
	except Exception:
		return {}


def _normalize_project_id(pid: str) -> str:
	"""
	Some folder-derived IDs include prefixes like '..._diagrams_p_<pid>'.
	Return canonical '<pid>' by taking the last occurrence of 'p_' segment.
	"""
	if not pid:
		return pid
	i = pid.rfind("p_")
	return pid[i:] if i > 0 else pid


def _extract_location_hint(meta: Dict[str, Any], title: str, country: str) -> Optional[str]:
	pm = meta.get("projectMetadata") or {}
	# Prefer explicit location fields if present
	loc = (pm.get("location") or "").strip()
	if loc:
		return loc
	am = pm.get("allMetadata") or {}
	loc2 = (am.get("location") or "").strip() if isinstance(am, dict) else ""
	if loc2:
		return loc2
	# Fall back to title + country if country exists
	if country and country.lower() != "unknown":
		return f"{title}, {country}"
	# As a last resort, just use title (often contains city/region)
	return title if title else None


def _extract_location_from_page(url: str, session: Optional[requests.Session] = None) -> Optional[str]:
	s = session or _http_session()
	try:
		r = s.get(url, timeout=20)
		if r.status_code != 200 or not r.text:
			return None
		html = r.text
		# Look for JSON-like keys anywhere in the page
		def g(rx: str) -> Optional[str]:
			m = re.search(rx, html, flags=re.I | re.S)
			return m.group(1).strip() if m else None
		city = g(r'"addressLocality"\s*:\s*"([^"]{2,80})"')
		region = g(r'"addressRegion"\s*:\s*"([^"]{2,80})"')
		country = g(r'"addressCountry"\s*:\s*"([^"]{2,80})"')
		parts = [p for p in [city, region, country] if p]
		if parts:
			return ", ".join(parts)
		# Fallback to label-based capture
		m = re.search(r'>\s*Location\s*<\s*/[^>]+>\s*<[^>]*>\s*([^<]{3,120})<', html, flags=re.I)
		if m:
			return m.group(1).strip()
	except Exception:
		return None
	return None


def geocode_nominatim(query: str, *, email_or_app: str = "archipedia-geocoder", timeout: float = 15.0) -> Optional[Tuple[float, float]]:
	url = "https://nominatim.openstreetmap.org/search"
	params = {
		"q": query,
		"format": "json",
		"limit": 1,
		"addressdetails": 0,
	}
	headers = {
		"User-Agent": f"{email_or_app}",
	}
	try:
		resp = requests.get(url, params=params, headers=headers, timeout=timeout)
		resp.raise_for_status()
		data = resp.json()
		if isinstance(data, list) and data:
			item = data[0]
			return float(item["lat"]), float(item["lon"])
	except Exception:
		return None
	return None


def geocode_mapbox(query: str, token: str, *, timeout: float = 15.0) -> Optional[Tuple[float, float]]:
	url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{requests.utils.quote(query)}.json"
	params = {"access_token": token, "limit": 1}
	try:
		resp = requests.get(url, params=params, timeout=timeout)
		resp.raise_for_status()
		data = resp.json()
		features = data.get("features") or []
		if features:
			c = features[0].get("center")
			if isinstance(c, list) and len(c) == 2:
				# Mapbox returns [lon, lat]
				return float(c[1]), float(c[0])
	except Exception:
		return None
	return None


def geocode_google(query: str, key: str, *, timeout: float = 15.0) -> Optional[Tuple[float, float]]:
	url = "https://maps.googleapis.com/maps/api/geocode/json"
	params = {"address": query, "key": key}
	try:
		resp = requests.get(url, params=params, timeout=timeout)
		resp.raise_for_status()
		data = resp.json()
		results = data.get("results") or []
		if results:
			loc = results[0]["geometry"]["location"]
			return float(loc["lat"]), float(loc["lng"])
	except Exception:
		return None
	return None


def geocode(query: str, providers: Providers) -> Optional[Tuple[float, float]]:
	# Prefer paid providers if configured, fall back to Nominatim
	if providers.mapbox_token:
		coords = geocode_mapbox(query, providers.mapbox_token)
		if coords:
			return coords
	if providers.google_key:
		coords = geocode_google(query, providers.google_key)
		if coords:
			return coords
	return geocode_nominatim(query)


def main() -> int:
	ap = argparse.ArgumentParser(description="Append lat/lon to projects.csv by geocoding per-project metadata JSONs")
	ap.add_argument("--data_dir", default="data", help="Path to navigator data dir (contains /metadata and /images)")
	ap.add_argument("--limit", type=int, default=0, help="Limit number of rows to process (0 = all)")
	ap.add_argument("--sleep", type=float, default=1.0, help="Seconds to sleep between geocoding calls")
	args = ap.parse_args()

	data_dir = Path(args.data_dir)
	meta_dir = data_dir / "metadata"
	csv_path = meta_dir / "projects.csv"
	loc_csv = meta_dir / "locations.csv"

	if not csv_path.exists():
		raise FileNotFoundError(f"Missing CSV: {csv_path}. Generate it first.")

	df = pd.read_csv(csv_path)
	if args.limit and args.limit > 0:
		df = df.head(args.limit)

	mapbox_token = os.environ.get("MAPBOX_TOKEN")
	google_key = os.environ.get("GOOGLE_API_KEY")
	providers = Providers(mapbox_token=mapbox_token, google_key=google_key)
	http = _http_session()

	# Optional: external locations.csv overrides
	override_loc: Dict[str, str] = {}
	if loc_csv.exists():
		try:
			df_loc = pd.read_csv(loc_csv)
			for _, r in df_loc.iterrows():
				pid = str(r.get("project_id"))
				loc = str(r.get("location")) if pd.notna(r.get("location")) else ""
				if pid and loc:
					override_loc[pid] = loc
		except Exception:
			pass

	latitudes: Dict[int, Optional[float]] = {}
	longitudes: Dict[int, Optional[float]] = {}

	for idx, row in df.iterrows():
		pid = str(row.get("project_id"))
		pid_norm = _normalize_project_id(pid)
		title = str(row.get("title")) if pd.notna(row.get("title")) else ""
		country = str(row.get("country")) if pd.notna(row.get("country")) else ""
		meta = _read_project_json(meta_dir, pid)
		if not meta:
			meta = _read_project_json(meta_dir, pid_norm)

		# Prefer override from locations.csv; then JSON hints; then try page scrape; finally title
		query = override_loc.get(pid) or override_loc.get(pid_norm) or _extract_location_hint(meta, title=title, country=country)
		if not query:
			url = (meta.get("projectUrl") or "").strip()
			if url:
				query = _extract_location_from_page(url, session=http)
		if not query and title:
			query = title

		if not query:
			# as last resort, set (0,0) placeholder
			latitudes[idx] = 0.0
			longitudes[idx] = 0.0
			continue

		coords = geocode(query, providers)
		# Stronger fallback: try title-only geocode
		if coords is None and title:
			coords = geocode(title, providers)
		if coords:
			latitudes[idx], longitudes[idx] = coords
		else:
			# ensure fields are filled for experiments
			latitudes[idx] = 0.0
			longitudes[idx] = 0.0
		time.sleep(max(0.0, args.sleep))

	# Attach columns and write back
	df["lat"] = pd.Series(latitudes)
	df["lon"] = pd.Series(longitudes)
	df.to_csv(csv_path, index=False)
	print(f"Wrote {csv_path} with lat/lon columns.")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())


