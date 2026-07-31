"""Unified CLI for Gem Fill level tooling."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from generate_level import main as image_main

from level_generator.config import GENERATED_IMAGES_DIR, REPO_ROOT, THEMES_DIR
from level_generator.export import sync_levels_index
from level_generator.patterns import list_patterns
from level_generator.procedural import generate_batch_from_catalog, generate_from_themes
from level_generator.generate_images import generate_images_from_catalog
from level_generator.themes import default_catalog_path, load_themes


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Outils de génération de niveaux Gem Fill.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    image_parser = subparsers.add_parser(
        "image",
        help="Génère un niveau à partir d'une image source",
    )
    image_parser.add_argument("args", nargs=argparse.REMAINDER)

    batch_parser = subparsers.add_parser(
        "batch",
        help="Génère plusieurs niveaux procéduraux depuis un catalogue JSON",
    )
    batch_parser.add_argument(
        "--themes",
        default=str(default_catalog_path()),
        help="Chemin vers le fichier JSON de thèmes (défaut: themes/catalog.json)",
    )
    batch_parser.add_argument("--count", type=int, default=50)
    batch_parser.add_argument("--start-id", type=int, default=None)
    batch_parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Regénère des niveaux existants en conservant leur nom",
    )

    themes_parser = subparsers.add_parser(
        "themes",
        help="Génère exactement les thèmes listés dans un fichier JSON",
    )
    themes_parser.add_argument(
        "themes_file",
        help="Fichier JSON (ex: themes/objects.json)",
    )
    themes_parser.add_argument("--start-id", type=int, default=None)

    sync_parser = subparsers.add_parser(
        "sync-index",
        help="Regénère src/data/levels/levels.generated.ts depuis level*.ts",
    )

    patterns_parser = subparsers.add_parser(
        "patterns",
        help="Liste les motifs procéduraux disponibles",
    )

    images_parser = subparsers.add_parser(
        "images",
        help="Génère des PNG dans assets/source/generated (sans créer de niveaux)",
    )
    images_parser.add_argument(
        "--themes",
        default=str(THEMES_DIR / "everyday.json"),
        help="Fichier JSON de thèmes (défaut: themes/everyday.json)",
    )
    images_parser.add_argument(
        "--start-index",
        type=int,
        default=None,
        help="Numéro de départ pour les fichiers level_XX_slug.png",
    )
    images_parser.add_argument(
        "--output-dir",
        default=str(GENERATED_IMAGES_DIR),
        help="Dossier de sortie des PNG",
    )

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "image":
        return image_main(args.args if args.args else None)

    if args.command == "batch":
        print("----------------------------------------------------")
        action = "Regénération" if args.regenerate else "Génération"
        print(f"💎 {action} batch — {args.count} niveaux")
        print(f"   Catalogue : {args.themes}")
        print("----------------------------------------------------")
        created = generate_batch_from_catalog(
            args.count,
            themes_path=Path(args.themes),
            start_id=args.start_id,
            regenerate=args.regenerate,
        )
        print("----------------------------------------------------")
        print(f"✅ {len(created)} niveaux créés ({created[0]} → {created[-1]})")
        print("   Index synchronisé : src/data/levels/levels.generated.ts")
        print("----------------------------------------------------")
        return 0

    if args.command == "themes":
        themes_path = Path(args.themes_file)
        if not themes_path.is_absolute():
            themes_path = REPO_ROOT / themes_path
        themes = load_themes(themes_path)
        print("----------------------------------------------------")
        print(f"💎 Génération de {len(themes)} thèmes depuis {themes_path.name}")
        print("----------------------------------------------------")
        created = generate_from_themes(themes, start_id=args.start_id)
        print("----------------------------------------------------")
        print(f"✅ {len(created)} niveaux créés ({created[0]} → {created[-1]})")
        print("----------------------------------------------------")
        return 0

    if args.command == "sync-index":
        target = sync_levels_index()
        print(f"✅ Index synchronisé : {target.relative_to(REPO_ROOT)}")
        return 0

    if args.command == "patterns":
        for pattern in list_patterns():
            print(pattern)
        return 0

    if args.command == "images":
        themes_path = Path(args.themes)
        if not themes_path.is_absolute():
            themes_path = REPO_ROOT / themes_path
        print("----------------------------------------------------")
        print(f"🖼️  Génération d'images depuis {themes_path.name}")
        print(f"   Dossier : {Path(args.output_dir).relative_to(REPO_ROOT)}")
        print("----------------------------------------------------")
        created = generate_images_from_catalog(
            themes_path,
            start_index=args.start_index,
            output_dir=Path(args.output_dir),
        )
        print("----------------------------------------------------")
        print(f"✅ {len(created)} images créées")
        print("----------------------------------------------------")
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
