#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enrich project metadata using the OpenAI API and output normalized JSON.

Inputs:
  - navigator/data/metadata/projects.csv

Outputs:
  - navigator/data/metadata/projects_enriched.jsonl
  - navigator/data/metadata/projects_enriched.json

Environment:
  - OPENAI_API_KEY must be set for live enrichment. If not set, the script
    will run in "dry" mode and produce a best-effort JSON using only CSV data.

Usage:
  python navigator/scripts/enrich_projects.py [--model gpt-4o-mini] [--limit N] [--overwrite]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import requests

THIS_DIR = Path(__file__).resolve().parent
DATA_DIR = THIS_DIR.parent / "data" / "metadata"
CSV_PATH = DATA_DIR / "projects.csv"
OUT_JSONL = DATA_DIR / "projects_enriched.jsonl"
OUT_JSON = DATA_DIR / "projects_enriched.json"


@dataclass
class ProjectRow:
	"""Row parsed from projects.csv."""
	project_id: str
	title: str
	country: Optional[str]
	climate_bin: Optional[str]
	typology: Optional[str]
	massing_type: Optional[str]
	wwr_band: Optional[str]
	image_ids: Optional[str]
	plan_ids: Optional[str]
	tags: Optional[str]


@dataclass
class ProjectEnriched:
	"""Normalized JSON schema for a project."""
	project_id: str
	title: str
	country: Optional[str]
	project_type: Optional[str]
	climate_zone: Optional[str]
	massing_type: Optional[str]
	wwr_band: Optional[str]
	tags: List[str]
	image_ids: List[str]
	plan_ids: List[str]
	# Enriched fields (nullable)
	architect: Optional[str] = None
	location: Optional[str] = None
	completion_year: Optional[int] = None
	area_sq_ft: Optional[float] = None
	stories: Optional[int] = None
	design_narrative: Optional[str] = None
	key_features: Optional[List[str]] = None
	budget_usd: Optional[float] = None
	cost_per_sqft_usd: Optional[float] = None
	awards: Optional[List[str]] = None
	source_urls: Optional[List[str]] = None
	coordinates: Optional[Dict[str, float]] = None  # {"lat": ..., "lon": ...}


def _safe_split_list(raw: Optional[str]) -> List[str]:
	if raw is None or str(raw).strip() == "":
		return []
	s = str(raw).strip()
	# Support legacy CSV encodings like "['i_hero','i_plan']" or "i1|i2|i3"
	if s.startswith("[") and s.endswith("]"):
		# Attempt JSON first, then literal eval fallback
		try:
			val = json.loads(s.replace("'", '"'))
			return [str(x) for x in val if str(x).strip()]
		except Exception:
			pass
	# Pipe-delimited format
	if "|" in s:
		return [x.strip() for x in s.split("|") if x.strip()]
	# Comma-delimited fallback
	return [x.strip() for x in s.split(",") if x.strip()]


def _build_prompt_inputs(row: ProjectRow) -> Dict[str, Any]:
	return {
		"title": row.title,
		"country": row.country,
		"typology": row.typology,
		"massing_type": row.massing_type,
		"climate_bin": row.climate_bin,
		"wwr_band": row.wwr_band,
		"tags": _safe_split_list(row.tags),
	}


def _enrich_locally(project_id: str, base: Dict[str, Any]) -> Dict[str, Any]:
	"""Fallback when OPENAI_API_KEY is missing: fill safe derived fields only."""
	tags = base.get("tags") or []
	key_features = tags[:5] if tags else None
	narrative = None
	if tags or base.get("typology") or base.get("massing_type"):
		t = base.get("typology") or "building"
		m = base.get("massing_type") or "massing"
		cl = base.get("climate_bin") or "climate"
		tag_text = ", ".join(tags[:5]) if tags else "context-driven strategies"
		narrative = (
			f"This {t} uses a {m} approach adapted for {cl}. "
			f"Key considerations include {tag_text}. "
			f"Details like year, area, and budget are not available in the current dataset."
		)
	return {
		"architect": None,
		"location": None,
		"completion_year": None,
		"area_sq_ft": None,
		"stories": None,
		"design_narrative": narrative,
		"key_features": key_features,
		"budget_usd": None,
		"cost_per_sqft_usd": None,
		"awards": None,
		"source_urls": None,
	}


def _call_openai_enrichment(model: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
	"""
	Call OpenAI Responses API with a strict JSON schema.
	We instruct the model to rely ONLY on provided inputs to avoid hallucinations.
	"""
	schema = {
		"name": "ProjectEnrichment",
		"schema": {
			"type": "object",
			"additionalProperties": False,
			"properties": {
				"architect": {"type": "string", "nullable": True},
				"location": {"type": "string", "nullable": True},
				"completion_year": {"type": "integer", "nullable": True},
				"area_sq_ft": {"type": "number", "nullable": True},
				"stories": {"type": "integer", "nullable": True},
				"design_narrative": {"type": "string", "nullable": True},
				"key_features": {
					"type": "array",
					"items": {"type": "string"},
					"nullable": True,
				},
				"budget_usd": {"type": "number", "nullable": True},
				"cost_per_sqft_usd": {"type": "number", "nullable": True},
				"awards": {"type": "array", "items": {"type": "string"}, "nullable": True},
				"source_urls": {"type": "array", "items": {"type": "string"}, "nullable": True},
			},
			"required": [],
		},
		"strict": True,
	}
	system_msg = (
		"Given minimal project metadata, draft a short neutral narrative and optional key features. "
		"Use ONLY the provided fields (title, country, typology, massing type, climate, tags). "
		"Do not add specific facts (years, area, costs, awards, cities) unless explicitly stated in inputs. "
		"If a field is unknown, return null. Keep the narrative 2–4 sentences and general."
	)
	user_msg = json.dumps(inputs, ensure_ascii=False)

	api_key = os.environ.get("OPENAI_API_KEY")
	if not api_key:
		return _enrich_locally(inputs.get("title", ""), inputs)

	resp = requests.post(
		"https://api.openai.com/v1/responses",
		headers={
			"Authorization": f"Bearer {api_key}",
			"Content-Type": "application/json",
		},
		json={
			"model": model,
			"input": [
				{"role": "system", "content": system_msg},
				{"role": "user", "content": user_msg},
			],
			"response_format": {"type": "json_schema", "json_schema": schema},
		},
		timeout=60,
	)
	resp.raise_for_status()
	data = resp.json()
	try:
		# Responses API: output[0].content[0].text
		text = data["output"][0]["content"][0]["text"]
		return json.loads(text)
	except Exception:
		# Fallback to raw dump if structure differs
		return _enrich_locally(inputs.get("title", ""), inputs)


def _row_to_enriched(row: ProjectRow, model: str) -> ProjectEnriched:
	inputs = _build_prompt_inputs(row)
	enriched = _call_openai_enrichment(model, inputs)
	return ProjectEnriched(
		project_id=row.project_id,
		title=row.title,
		country=row.country,
		project_type=row.typology,
		climate_zone=row.climate_bin,
		massing_type=row.massing_type,
		wwr_band=row.wwr_band,
		tags=_safe_split_list(row.tags),
		image_ids=_safe_split_list(row.image_ids),
		plan_ids=_safe_split_list(row.plan_ids),
		architect=enriched.get("architect"),
		location=enriched.get("location"),
		completion_year=enriched.get("completion_year"),
		area_sq_ft=enriched.get("area_sq_ft"),
		stories=enriched.get("stories"),
		design_narrative=enriched.get("design_narrative"),
		key_features=enriched.get("key_features"),
		budget_usd=enriched.get("budget_usd"),
		cost_per_sqft_usd=enriched.get("cost_per_sqft_usd"),
		awards=enriched.get("awards"),
		source_urls=enriched.get("source_urls"),
	)


def _read_rows(limit: Optional[int]) -> List[ProjectRow]:
	if not CSV_PATH.exists():
		raise FileNotFoundError(f"Missing metadata CSV: {CSV_PATH}")
	df = pd.read_csv(CSV_PATH)
	if limit:
		df = df.head(limit)
	rows: List[ProjectRow] = []
	for _, r in df.iterrows():
		rows.append(
			ProjectRow(
				project_id=str(r.get("project_id")),
				title=str(r.get("title")),
				country=str(r.get("country")) if pd.notna(r.get("country")) else None,
				climate_bin=str(r.get("climate_bin")) if pd.notna(r.get("climate_bin")) else None,
				typology=str(r.get("typology")) if pd.notna(r.get("typology")) else None,
				massing_type=str(r.get("massing_type")) if pd.notna(r.get("massing_type")) else None,
				wwr_band=str(r.get("wwr_band")) if pd.notna(r.get("wwr_band")) else None,
				image_ids=str(r.get("image_ids")) if pd.notna(r.get("image_ids")) else None,
				plan_ids=str(r.get("plan_ids")) if pd.notna(r.get("plan_ids")) else None,
				tags=str(r.get("tags")) if pd.notna(r.get("tags")) else None,
			)
		)
	return rows


def main() -> int:
	parser = argparse.ArgumentParser(description="Enrich projects into JSON using OpenAI.")
	parser.add_argument("--model", default="gpt-4o-mini", help="OpenAI model to use")
	parser.add_argument("--limit", type=int, default=None, help="Limit number of rows to process")
	parser.add_argument("--overwrite", action="store_true", help="Overwrite output files if present")
	parser.add_argument("--sleep", type=float, default=0.2, help="Sleep seconds between API calls")
	args = parser.parse_args()

	if (OUT_JSON.exists() or OUT_JSONL.exists()) and not args.overwrite:
		print(f"Output exists. Use --overwrite to regenerate:\n  {OUT_JSON}\n  {OUT_JSONL}")
		return 0

	rows = _read_rows(args.limit)
	records: List[Dict[str, Any]] = []

	# Ensure output directory exists
	DATA_DIR.mkdir(parents=True, exist_ok=True)

	with OUT_JSONL.open("w", encoding="utf-8") as fout:
		for idx, row in enumerate(rows, 1):
			item = _row_to_enriched(row, args.model)
			record = asdict(item)
			records.append(record)
			fout.write(json.dumps(record, ensure_ascii=False) + "\n")
			print(f"[{idx}/{len(rows)}] {row.project_id} - {row.title}")
			time.sleep(args.sleep)

	with OUT_JSON.open("w", encoding="utf-8") as fjson:
		json.dump(records, fjson, ensure_ascii=False, indent=2)

	print(f"\nWrote:\n- {OUT_JSONL}\n- {OUT_JSON}")
	return 0


if __name__ == "__main__":
	sys.exit(main())







