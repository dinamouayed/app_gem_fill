#!/usr/bin/env python3
"""Backward-compatible entry point for procedural batch generation."""

from __future__ import annotations

import sys

from cli import main

if __name__ == "__main__":
    raise SystemExit(main(["batch", *sys.argv[1:]]))
