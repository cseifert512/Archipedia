#!/usr/bin/env python3
# Quick probe to see if ArchDaily pages expose JSON-LD with geo/address.
import re, json, sys, requests

def probe(url: str) -> None:
	html = requests.get(url, timeout=20).text
	blocks = re.findall(r'<script type="application/ld\\+json">(.*?)</script>', html, flags=re.S)
	print("JSONLD blocks:", len(blocks))
	for i, b in enumerate(blocks):
		try:
			data = json.loads(b.strip())
		except Exception as e:
			print("parse err", i, e)
			continue
		if isinstance(data, dict):
			at = data.get("@type")
			print(f"block {i} @type={at}, keys={list(data.keys())[:10]}")
			if "geo" in data:
				print(" geo:", data["geo"])
			if "address" in data:
				print(" address:", data["address"])
		elif isinstance(data, list):
			print(f"block {i} list len={len(data)}")
			for j, item in enumerate(data[:5]):
				if isinstance(item, dict):
					at = item.get("@type")
					if "geo" in item or "address" in item:
						print(f"  item {j} @type={at} geo={item.get('geo')} addr={item.get('address')}")

if __name__ == "__main__":
	url = sys.argv[1] if len(sys.argv) > 1 else "https://www.archdaily.com/1022020/no-7-ceramic-art-research-base-phase-one-atelier-cns"
	probe(url)







