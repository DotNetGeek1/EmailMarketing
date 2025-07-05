#!/usr/bin/env python3
"""
Debug script to help identify text comparison issues.
Usage: python debug_text_comparison.py "expected_text" "actual_text"
"""

import sys

def analyze_text(text, label):
    """Analyze text and show detailed character information."""
    print(f"\n=== {label} ===")
    print(f"Text: '{text}'")
    print(f"Length: {len(text)}")
    print(f"Bytes: {text.encode('utf-8')}")
    print(f"Repr: {repr(text)}")
    print("Character by character:")
    for i, char in enumerate(text):
        print(f"  {i:2d}: '{char}' (U+{ord(char):04X})")
    print(f"ASCII only: {text.isascii()}")
    print(f"Printable only: {text.isprintable()}")

def compare_texts(expected, actual):
    """Compare two texts and show differences."""
    print("=" * 50)
    print("TEXT COMPARISON DEBUG")
    print("=" * 50)
    
    analyze_text(expected, "EXPECTED")
    analyze_text(actual, "ACTUAL")
    
    print(f"\n=== COMPARISON ===")
    print(f"Direct comparison (expected == actual): {expected == actual}")
    print(f"Length comparison: {len(expected)} vs {len(actual)}")
    
    # Normalize both texts
    expected_norm = ' '.join(expected.strip().split())
    actual_norm = ' '.join(actual.strip().split())
    
    print(f"\nAfter normalization:")
    print(f"Expected normalized: '{expected_norm}'")
    print(f"Actual normalized: '{actual_norm}'")
    print(f"Normalized comparison: {expected_norm == actual_norm}")
    
    if expected_norm != actual_norm:
        print(f"\n=== DIFFERENCES ===")
        min_len = min(len(expected_norm), len(actual_norm))
        for i in range(min_len):
            if expected_norm[i] != actual_norm[i]:
                print(f"First difference at position {i}:")
                print(f"  Expected: '{expected_norm[i]}' (U+{ord(expected_norm[i]):04X})")
                print(f"  Actual:   '{actual_norm[i]}' (U+{ord(actual_norm[i]):04X})")
                break
        else:
            if len(expected_norm) != len(actual_norm):
                print(f"Length difference: expected has {len(expected_norm)} chars, actual has {len(actual_norm)} chars")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python debug_text_comparison.py 'expected_text' 'actual_text'")
        sys.exit(1)
    
    expected = sys.argv[1]
    actual = sys.argv[2]
    
    compare_texts(expected, actual) 