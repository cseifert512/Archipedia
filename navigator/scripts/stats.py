#!/usr/bin/env python3
"""Extract and compute summary statistics for benchmark metrics."""

import csv
import numpy as np

# Read the CSV
ndcg_values = []
map_values = []

with open('../reports/benchmark_1763178890.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            ndcg_values.append(float(row['ndcg_at_10']))
            map_values.append(float(row['map_at_10']))
        except (ValueError, KeyError):
            pass

ndcg_arr = np.array(ndcg_values)
map_arr = np.array(map_values)

print("=== nDCG@10 ===")
print(f"Mean: {ndcg_arr.mean():.4f}")
print(f"Std Dev: {ndcg_arr.std():.4f}")
print(f"Min: {ndcg_arr.min():.4f}")
print(f"Max: {ndcg_arr.max():.4f}")
print(f"Median: {np.median(ndcg_arr):.4f}")
print(f"Count: {len(ndcg_arr)}")

print("\n=== mAP@10 ===")
print(f"Mean: {map_arr.mean():.4f}")
print(f"Std Dev: {map_arr.std():.4f}")
print(f"Min: {map_arr.min():.4f}")
print(f"Max: {map_arr.max():.4f}")
print(f"Median: {np.median(map_arr):.4f}")
print(f"Count: {len(map_arr)}")

print("\n=== 95% Confidence Intervals (mean ± 1.96*SE) ===")
se_ndcg = ndcg_arr.std() / np.sqrt(len(ndcg_arr))
se_map = map_arr.std() / np.sqrt(len(map_arr))
print(f"nDCG@10: [{ndcg_arr.mean() - 1.96*se_ndcg:.4f}, {ndcg_arr.mean() + 1.96*se_ndcg:.4f}]")
print(f"mAP@10: [{map_arr.mean() - 1.96*se_map:.4f}, {map_arr.mean() + 1.96*se_map:.4f}]")

