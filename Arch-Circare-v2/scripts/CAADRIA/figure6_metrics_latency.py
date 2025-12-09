import argparse
from pathlib import Path
from typing import List, Optional

import matplotlib.pyplot as plt
import numpy as np

from common import ensure_output_dir


def draw_table(ax, data: List[List[str]], col_labels: List[str]):
	ax.axis("off")
	ax.axis("tight")
	table = ax.table(cellText=data, colLabels=col_labels, loc="center")
	table.auto_set_font_size(False)
	table.set_fontsize(9)
	table.scale(1, 1.4)


def draw_bars(ax, means: List[float], labels: List[str], std: Optional[List[float]] = None):
	x = np.arange(len(means))
	ax.bar(x, means, color=["#4C78A8", "#72B7B2", "#F58518"], yerr=std if std else None, capsize=3, alpha=0.9)
	ax.set_xticks(x)
	ax.set_xticklabels(labels)
	ax.set_ylim(0, 1.0)
	ax.set_ylabel("Score")
	for i, v in enumerate(means):
		ax.text(i, v + 0.02, f"{v:.2f}", ha="center", va="bottom", fontsize=9)
	ax.grid(axis="y", linestyle="--", alpha=0.3)


def draw_latency_boxplot(ax, latencies_ms: np.ndarray):
	ax.boxplot(latencies_ms, vert=True, widths=0.5, patch_artist=True,
	           boxprops=dict(facecolor="#D5E5F2", color="#4C78A8"),
	           medianprops=dict(color="#E45756", linewidth=2),
	           whiskerprops=dict(color="#4C78A8"),
	           capprops=dict(color="#4C78A8"))
	ax.set_ylabel("Latency (ms)")
	ax.set_xticks([1])
	ax.set_xticklabels(["End-to-end query"])
	ax.grid(axis="y", linestyle="--", alpha=0.3)


def build_figure6(out_path: Path, use_table: bool = True):
	# Defaults from spec
	mean_p5, med_p5, std_p5 = 0.53, 0.60, 0.27
	mean_ndcg, med_ndcg = 0.53, 0.54
	mean_map, med_map = 0.37, None

	# Generate a latency distribution centered around ~5 ms with an outlier ~25 ms
	np.random.seed(42)
	base = np.random.normal(loc=5.0, scale=0.8, size=49)
	base = np.clip(base, 2.5, 9.0)
	latencies = np.concatenate([base, np.array([25.0])])

	fig, (ax_left, ax_right) = plt.subplots(1, 2, figsize=(10, 3.5), dpi=200, constrained_layout=True)

	if use_table:
		data = [
			["{:.2f}".format(mean_p5), "{:.2f}".format(med_p5), "{:.2f}".format(std_p5)],
			["{:.2f}".format(mean_ndcg), "{:.2f}".format(med_ndcg), ""],
			["{:.2f}".format(mean_map), "–", ""],
		]
		draw_table(ax_left, data, col_labels=["Metric", "Mean", "Median", "Std. dev."])
		# Add metric labels as the first column left of the table (simple hack via text)
		metrics = ["P@5", "nDCG@10", "mAP@10"]
		for i, m in enumerate(metrics):
			ax_left.text(0.03, 0.76 - i * 0.25, m, transform=ax_left.transAxes, fontsize=9, va="center")
	else:
		draw_bars(ax_left, [mean_p5, mean_ndcg, mean_map], labels=["P@5", "nDCG@10", "mAP@10"])
		ax_left.set_title("Ranking metrics (means)")

	draw_latency_boxplot(ax_right, latencies)
	ax_right.set_title("Latency distribution")

	out_path.parent.mkdir(parents=True, exist_ok=True)
	fig.savefig(out_path, bbox_inches="tight")
	plt.close(fig)
	print(f"[ok] Wrote {out_path}")


def main():
	ap = argparse.ArgumentParser(description="Figure 6: Retrieval metrics and latency (composite).")
	ap.add_argument("--output-dir", type=str, default=None, help="Output directory")
	ap.add_argument("--filename", type=str, default="figure_6_metrics_latency.png", help="Output filename")
	ap.add_argument("--bars", action="store_true", help="Use bar chart instead of table on the left panel")
	args = ap.parse_args()

	out_dir = ensure_output_dir(args.output_dir)
	out_path = out_dir / args.filename
	build_figure6(out_path, use_table=not args.bars)


if __name__ == "__main__":
	main()





