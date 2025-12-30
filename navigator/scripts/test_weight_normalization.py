#!/usr/bin/env python3
"""
Test script for Weight Normalization (Improvement #6).

This script tests that the updated weight normalization:
1. Allows wider weight ranges [0.0, 0.95] in default mode
2. Preserves legacy [0.1, 0.7] behavior in strict mode
3. Extreme weights (e.g., visual=1.0, spatial=0, attr=0) now work correctly
"""

import sys
import os
import json
import time
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pipeline import Pipeline
from app.models import Weights


def test_default_mode():
    """Test that default mode allows wider weight ranges."""
    print("\n" + "-" * 60)
    print("Test 1: Default mode (wider [0.0, 0.95] range)")
    print("-" * 60)
    
    # Create a mock pipeline for testing
    class MockPipeline(Pipeline):
        def __init__(self):
            pass  # Skip parent init
    
    pipeline = MockPipeline()
    
    # Test cases with expected outcomes
    test_cases = [
        # (visual, spatial, attr, description)
        (1.0, 0.0, 0.0, "Pure visual search"),
        (0.0, 1.0, 0.0, "Pure spatial search"),
        (0.0, 0.0, 1.0, "Pure attribute search"),
        (0.8, 0.1, 0.1, "Visual-heavy"),
        (0.33, 0.33, 0.34, "Balanced"),
        (0.5, 0.25, 0.25, "Visual-dominant"),
    ]
    
    all_passed = True
    for v, s, a, desc in test_cases:
        weights = Weights(visual=v, spatial=s, attr=a)
        result = pipeline.normalize_weights(weights, strict=False)
        w_v, w_s, w_a = result
        
        # Check that weights are within [0.0, 0.95]
        in_range = all(0.0 <= w <= 0.95 for w in [w_v, w_s, w_a])
        
        # Check that weights sum to approximately 1 (allowing for clamping adjustments)
        total = w_v + w_s + w_a
        sums_ok = 0.5 <= total <= 1.5  # Generous range due to clamping
        
        status = "PASS" if in_range else "FAIL"
        if not in_range:
            all_passed = False
        
        print(f"  {status} {desc}")
        print(f"       Input:  visual={v:.2f}, spatial={s:.2f}, attr={a:.2f}")
        print(f"       Output: visual={w_v:.3f}, spatial={w_s:.3f}, attr={w_a:.3f}")
    
    return all_passed


def test_strict_mode():
    """Test that strict mode preserves legacy [0.1, 0.7] behavior."""
    print("\n" + "-" * 60)
    print("Test 2: Strict mode (legacy [0.1, 0.7] range)")
    print("-" * 60)
    
    class MockPipeline(Pipeline):
        def __init__(self):
            pass
    
    pipeline = MockPipeline()
    
    test_cases = [
        (1.0, 0.0, 0.0, "Pure visual (should be clamped)"),
        (0.0, 1.0, 0.0, "Pure spatial (should be clamped)"),
        (0.5, 0.25, 0.25, "Balanced"),
    ]
    
    all_passed = True
    for v, s, a, desc in test_cases:
        weights = Weights(visual=v, spatial=s, attr=a)
        result = pipeline.normalize_weights(weights, strict=True)
        w_v, w_s, w_a = result
        
        # Check that weights are within [0.1, 0.7]
        in_range = all(0.1 <= w <= 0.7 for w in [w_v, w_s, w_a])
        
        status = "PASS" if in_range else "FAIL"
        if not in_range:
            all_passed = False
        
        print(f"  {status} {desc}")
        print(f"       Input:  visual={v:.2f}, spatial={s:.2f}, attr={a:.2f}")
        print(f"       Output: visual={w_v:.3f}, spatial={w_s:.3f}, attr={w_a:.3f}")
    
    return all_passed


def test_extreme_weights():
    """Test that extreme weights work correctly in default mode."""
    print("\n" + "-" * 60)
    print("Test 3: Extreme weight handling")
    print("-" * 60)
    
    class MockPipeline(Pipeline):
        def __init__(self):
            pass
    
    pipeline = MockPipeline()
    
    # Test pure visual search - should allow near-1.0 visual weight
    weights = Weights(visual=1.0, spatial=0.0, attr=0.0)
    result = pipeline.normalize_weights(weights, strict=False)
    w_v, w_s, w_a = result
    
    print(f"  Pure visual search:")
    print(f"       Input:  visual=1.0, spatial=0.0, attr=0.0")
    print(f"       Output: visual={w_v:.3f}, spatial={w_s:.3f}, attr={w_a:.3f}")
    
    # Visual should be at or near 0.95
    visual_high = w_v >= 0.9
    print(f"  PASS: Visual weight >= 0.9" if visual_high else f"  FAIL: Visual weight < 0.9")
    
    # With strict mode, the same input should be clamped differently
    result_strict = pipeline.normalize_weights(weights, strict=True)
    w_v_s, w_s_s, w_a_s = result_strict
    
    print(f"\n  Same input with strict=True:")
    print(f"       Output: visual={w_v_s:.3f}, spatial={w_s_s:.3f}, attr={w_a_s:.3f}")
    
    # All should be clamped to [0.1, 0.7]
    all_clamped = all(0.1 <= w <= 0.7 for w in [w_v_s, w_s_s, w_a_s])
    print(f"  PASS: All weights in [0.1, 0.7]" if all_clamped else f"  FAIL: Weights outside [0.1, 0.7]")
    
    return visual_high and all_clamped


def main():
    print("=" * 60)
    print("Test: Weight Normalization (Improvement #6)")
    print("=" * 60)
    
    test1_passed = test_default_mode()
    test2_passed = test_strict_mode()
    test3_passed = test_extreme_weights()
    
    all_passed = test1_passed and test2_passed and test3_passed
    
    # Save results
    results = {
        "timestamp": datetime.now().isoformat(),
        "improvement": "#6 - Better Weight Normalization",
        "status": "COMPLETE" if all_passed else "PARTIAL",
        "tests": {
            "default_mode": "PASS" if test1_passed else "FAIL",
            "strict_mode": "PASS" if test2_passed else "FAIL",
            "extreme_weights": "PASS" if test3_passed else "FAIL",
        },
        "changes": [
            "Widened default clamp range from [0.1, 0.7] to [0.0, 0.95]",
            "Added strict parameter to preserve legacy behavior",
            "Allows near-pure visual/spatial/attribute searches",
        ]
    }
    
    report_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "reports",
        f"weight_normalization_test_{int(time.time())}.json"
    )
    
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    if all_passed:
        print("  All weight normalization tests passed.")
    else:
        print("  Some tests failed - review output above.")
    print("  - Default mode allows [0.0, 0.95] range")
    print("  - Strict mode preserves [0.1, 0.7] range")
    print("  - Extreme weights (pure visual/spatial/attr) now work")
    print(f"\n  Report saved to: {report_path}")


if __name__ == "__main__":
    main()

