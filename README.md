# Gem Fill

Jeu de puzzle mobile où l'objectif est de trier des gemmes colorées sur une grille pour reconstituer une image pixel art. Déplace des groupes de gemmes de même couleur, utilise la zone de réserve, et complète le niveau le plus rapidement possible.

Construit avec **Expo** (SDK 54) et **React Native**.

## Prérequis

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/)
- [Python 3](https://www.python.org/) 3.10+ (uniquement pour générer des niveaux depuis une image)
- [Expo Go](https://expo.dev/go) sur téléphone, ou un émulateur iOS / Android

## Installation

```bash
git clone <url-du-repo>
cd app_gem_fill
npm install
```

## Lancer l'application

```bash
npm start
```

Puis scanne le QR code avec Expo Go, ou lance :

```bash
npm run ios      # simulateur iOS
npm run android  # émulateur Android
npm run web      # navigateur
```

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm start` | Démarre le serveur de développement Expo |
| `npm run ios` | Lance l'app sur iOS |
| `npm run android` | Lance l'app sur Android |
| `npm run web` | Lance l'app dans le navigateur |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm test` | Lance les tests en mode watch |
| `npm run test:run` | Lance les tests une fois |
| `npm run generate-level -- <image>` | Génère un niveau depuis une image |

## Structure du projet

```
app/                    # Écrans (Expo Router)
  index.tsx             # Accueil
  levels.tsx            # Liste des niveaux
  game/[levelId].tsx    # Partie en cours
  settings.tsx          # Paramètres

src/
  components/           # Composants UI (grille, gemmes, modales…)
  data/levels/          # Fichiers de niveaux + registre auto-généré
    level1.ts …         # Données d'un niveau
    levels.generated.ts # AUTO-GÉNÉRÉ — imports + ALL_LEVELS
    registry.ts         # Helpers (getLevelById, unlock…)
    index.ts            # Barrel export public
  hooks/                # Logique de jeu (useGame, useProgress…)
  utils/                # Utilitaires (flood fill, mélange, validation…)
  types/                # Types TypeScript

scripts/
  level-generator/      # Générateur Python (image ou procédural)
    cli.py                # Point d'entrée unifié
    generate_level.py     # Pipeline image (legacy entry)
    generate_batch.py     # Wrapper batch (legacy entry)
    level_generator/      # Package Python modulaire
    themes/               # Catalogues JSON (données, pas du code)
      catalog.json        # Thèmes procéduraux par défaut
  generate-level.js     # Ancien script Node (obsolète)

assets/
  source/               # Images sources pour la génération de niveaux
```

| `npm run generate-level -- <image>` | Génère un niveau depuis une image |
| `npm run generate-levels-batch` | Génère N niveaux procéduraux (motifs prédéfinis) |
| `npm run sync-levels-index` | Resynchronise la liste des niveaux dans l'app |

## Gestion des niveaux

### Deux pipelines — ne pas les confondre

Il existe **deux façons** de créer un niveau. Elles ne produisent **pas** le même type de résultat.

| | **Pipeline image** | **Pipeline procédural** |
|---|---|---|
| **Commande** | `npm run generate-level -- assets/source/mon-image.png` | `npm run generate-levels-batch` ou `npm run levels -- themes …` |
| **Entrée** | Une image (PNG, JPG…) | Un fichier JSON (`name` + `pattern`) |
| **Résultat visuel** | **Unique** — fidèle à ton image pixelisée | **Motifs prédéfinis** (~50 icônes : cœur, chat, arbre…) |
| **Style** | Dépend de l'image source | Toujours le même rendu (ciel/sol, palettes aléatoires) |
| **Nouvel objet sans code ?** | **Oui** — il suffit d'une nouvelle image | **Non** — le `pattern` doit déjà exister dans le code |

**En clair :**

- Pour un objet précis (avocat, télé, piano, personnage…), utilise une **image** dans `assets/source/`. C'est la méthode recommandée.
- Le mode **procédural** ne invente pas de nouveaux dessins. Le JSON sert seulement à **choisir** parmi les motifs déjà codés dans `level_generator/patterns/renderer.py` et à leur donner un nom affiché dans le jeu.
- Ajouter une entrée dans `themes/objects.json` avec `"pattern": "avocat"` ne créera **pas** un avocat tant que ce motif n'existe pas dans le code (ou tant que tu n'as pas fourni d'image).

**Exemple — plusieurs objets uniques via images :**

```bash
npm run generate-level -- assets/source/avocat.png --name "Avocat"
npm run generate-level -- assets/source/ours.png --name "Ours"
npm run generate-level -- assets/source/tele.png --name "Télévision"
```

**Exemple — niveaux procéduraux (style icône, motifs connus) :**

```bash
npm run generate-levels-batch -- --count 5 --start-id 61
npm run levels -- patterns   # liste les ~50 motifs disponibles
```

### Structure côté app

| Fichier | Rôle | Édition manuelle |
|---------|------|------------------|
| `level<N>.ts` | Données d'un niveau | Non (généré) |
| `levels.generated.ts` | Liste `ALL_LEVELS` | **Non** — auto-généré |
| `registry.ts` | Logique de déblocage | Oui |
| `index.ts` | Exports publics | Rarement |

Après ajout/suppression d'un `level*.ts`, synchroniser l'index :

```bash
npm run sync-levels-index
```

### CLI unifiée

Toutes les commandes passent par `npm run levels -- <commande>` :

| Commande | Description |
|----------|-------------|
| `image <fichier>` | Niveau depuis une image |
| `batch` | N niveaux procéduraux depuis un catalogue JSON |
| `themes <fichier.json>` | Génère exactement les thèmes listés |
| `sync-index` | Regénère `levels.generated.ts` |
| `patterns` | Liste les motifs procéduraux disponibles |

---

## Créer un niveau depuis une image *(pipeline recommandé pour du contenu unique)*

Le générateur Python transforme une image en fichier de niveau TypeScript prêt à l'emploi. Il redimensionne l'image, regroupe les couleurs similaires (2 à 10 gemmes distinctes), et produit la grille cible (`targetGrid`) ainsi que la palette de couleurs.

> Chaque image différente → un niveau visuellement différent. C'est la voie à privilégier pour enrichir le jeu avec de nouveaux sujets.

### 1. Installer le générateur (une seule fois)

```bash
cd scripts/level-generator
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ../..
```

### 2. Déposer l'image source

Place ton image dans `assets/source/`, par exemple :

```
assets/source/perroquet.jpg
```

Formats supportés : JPG, PNG, WebP… Toute image lisible par Pillow fonctionne.

### 3. Générer le niveau

Depuis la racine du projet :

```bash
npm run generate-level -- assets/source/perroquet.jpg
```

Le script crée automatiquement `src/data/levels/level<N>.ts` où `<N>` est le prochain ID disponible.

**Options utiles :**

```bash
npm run generate-level -- assets/source/perroquet.jpg \
  --id 7 \
  --name "Perroquet" \
  --colors 8 \
  --rows 20 \
  --cols 16 \
  --preview-shuffle
```

| Option | Description |
|---|---|
| `--id` | ID du niveau (auto si omis) |
| `--name` | Nom affiché dans le jeu (déduit du nom de fichier si omis) |
| `--colors` | Nombre de couleurs forcé (2–10). Auto si omis |
| `--rows` / `--cols` | Dimensions de la grille. Auto selon le ratio de l'image si omis |
| `--output` | Chemin de sortie personnalisé |
| `--preview-shuffle` | Affiche un aperçu ASCII de la grille résolue et du mélange de départ |

**Exemple de sortie :**

```
💎 GEM FILL — Générateur de niveau
 Image     : assets/source/perroquet.jpg
 ID        : 7
 Nom       : Perroquet
 Grille    : 24x18
 Couleurs  : 10
 Sortie    : src/data/levels/level7.ts
```

### 4. Index automatique

Le générateur crée `level<N>.ts` **et** synchronise `levels.generated.ts`. Aucune édition manuelle de l'index n'est nécessaire.

---

## Créer des niveaux procéduraux *(motifs prédéfinis, style uniforme)*

Génère des niveaux à partir d'une bibliothèque de **~50 motifs** déjà dessinés en code (cœur, étoile, chat, fusée…). Utile pour remplir rapidement le jeu avec des formes simples, **pas** pour créer des objets réalistes uniques.

Les thèmes sont définis dans des **fichiers JSON** (quels motifs utiliser, sous quel nom) — le JSON **ne crée pas** de nouveaux visuels.

### Catalogue par défaut

`scripts/level-generator/themes/catalog.json` — 50 motifs (cœur, étoile, chat…).

### Générer N niveaux depuis le catalogue

```bash
npm run generate-levels-batch -- --count 5 --start-id 61
```

### Générer une liste précise de thèmes

1. Copier `themes/objects.example.json` → `themes/objects.json`
2. Éditer les entrées `{ "name": "…", "pattern": "…" }`
3. Lancer :

```bash
npm run levels -- themes scripts/level-generator/themes/objects.json --start-id 61
```

Motifs disponibles :

```bash
npm run levels -- patterns
```

Pour ajouter un **nouveau motif**, éditer `level_generator/patterns/renderer.py` — pas `generate_batch.py`.

---

## Comprendre ce qui est généré

Chaque fichier de niveau contient :

- **`palette`** — les couleurs de gemmes (`id`, `hex`, `name`)
- **`targetGrid`** — la grille **résolue** (l'image pixelisée)

L'état de **départ** de la partie (gemmes mélangées) n'est pas stocké dans le fichier. Il est calculé au lancement via un algorithme de mélange groupé (`src/utils/shuffleGrid.ts`) qui place des grappes de même couleur aux mauvais endroits, pour un gameplay plus satisfaisant.

### Conseils pour de bons résultats

- Privilégie des images avec des zones de couleur nettes (illustrations, pixel art, photos contrastées).
- Un ratio portrait fonctionne bien (la grille max est ~24×18).
- Si le résultat manque de couleurs, force `--colors 8` ou `--colors 10`.
- Si la grille est trop grande ou trop petite, ajuste `--rows` et `--cols`.
- Utilise `--preview-shuffle` pour vérifier le rendu avant de tester in-game.

### Utilisation en Python

Le générateur peut aussi être appelé depuis un script :

```python
from pathlib import Path
import sys

sys.path.insert(0, "scripts/level-generator")
from generate_level import generate_level_from_image, export_level_typescript

level = generate_level_from_image("assets/source/perroquet.jpg", name="Perroquet")
export_level_typescript(level, "src/data/levels/level7.ts")
```

## Tests

```bash
npm run test:run
```

## Licence

Voir [LICENSE](LICENSE).
