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
  data/levels/          # Fichiers de niveaux (level1.ts, level2.ts…)
  hooks/                # Logique de jeu (useGame, useProgress…)
  utils/                # Utilitaires (flood fill, mélange, validation…)
  types/                # Types TypeScript

scripts/
  level-generator/      # Générateur Python image → niveau
  generate-level.js     # Ancien script Node (remplacé par le générateur Python)

assets/
  source/               # Images sources pour la génération de niveaux
```

## Créer un nouveau niveau à partir d'une image

Le générateur Python transforme une image en fichier de niveau TypeScript prêt à l'emploi. Il redimensionne l'image, regroupe les couleurs similaires (2 à 10 gemmes distinctes), et produit la grille cible (`targetGrid`) ainsi que la palette de couleurs.

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

### 4. Enregistrement automatique

Le générateur enregistre automatiquement le niveau dans `src/data/levels/index.ts`. Tu n'as rien à faire manuellement — relance simplement l'app et le niveau apparaît dans la liste.

Si tu as généré un niveau avant cette automatisation, ajoute-le à la main :

```typescript
import { level7 } from './level7';

export const ALL_LEVELS: Level[] = [
  // ...
  level7,
];
```

### 5. Comprendre ce qui est généré

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
