"""
Generate geographic filter examples for multiple reference locations.

This script demonstrates how to use the figure_geographic_filter.py script
to generate filtering visuals for different cities/regions.
"""

import subprocess
from pathlib import Path

# Define reference locations (lat, lon) for various cities
REFERENCE_LOCATIONS = {
    "cambridge_ma": (42.3601, -71.0589),
    "beijing": (39.9526, 116.4074),
    "dubai": (25.2048, 55.2708),
    "london": (51.5074, -0.1278),
    "tokyo": (35.6762, 139.6503),
    "sydney": (33.8688, 151.2093),
    "new_york": (40.7128, -74.0060),
}

DATA_DIR = r"C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data"
OUTPUT_DIR = Path(__file__).resolve().parent / "OUTPUTS"
SCRIPT = Path(__file__).resolve().parent / "figure_geographic_filter.py"


def generate_for_location(location_name: str, lat: float, lon: float) -> None:
    """Generate a geographic filter visual for a specific location."""
    filename = f"figure_geographic_filter_{location_name}.jpg"
    
    cmd = [
        "python",
        str(SCRIPT),
        "--data-dir", DATA_DIR,
        "--ref-lat", str(lat),
        "--ref-lon", str(lon),
        "--filename", filename,
        "--num-images", "120",
    ]
    
    print(f"\n[info] Generating for {location_name} ({lat}, {lon})...")
    print(f"[cmd] {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    if result.returncode != 0:
        print(f"[error] Failed with return code {result.returncode}")
    else:
        output_path = OUTPUT_DIR / filename
        if output_path.exists():
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"[ok] Generated {output_path.name} ({size_mb:.2f} MB)")


def main():
    print("Geographic Filter Example Generator")
    print("====================================")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Data directory: {DATA_DIR}")
    print()
    
    # Generate for all locations (comment out ones you don't want)
    for location_name, (lat, lon) in REFERENCE_LOCATIONS.items():
        generate_for_location(location_name, lat, lon)
    
    print("\n[done] All examples generated!")


if __name__ == "__main__":
    main()






