# PCG de poche

Plan comptable général de poche : application interne du cabinet (Lagarde Expertise & Conseil, L'Agent Comptable).
Elle remplace l'accordéon plastifié : on tape une racine (`401`) ou un mot (`loyer`, `voiture`), on ouvre le petit (i) et on lit en cinq secondes ce qu'on met dans le compte.

- Nomenclature du PCG **antérieure au règlement ANC 2022-06** (la refonte 2025 ne s'applique pas encore localement), libellés français.
- Application web installable (PWA) : s'installe sur iPhone et Android depuis le navigateur, fonctionne hors ligne, se met à jour seule.
- Aucun serveur, aucune base de données : un dossier de fichiers statiques à héberger n'importe où.

## Organisation du dépôt

| Dossier | Contenu |
|---|---|
| `app/` | L'application telle qu'elle est servie (HTML, CSS, JS, polices, icônes, `data.js` généré). |
| `data/` | **Les données sources** : `comptes.json` (numéros et libellés), `fiches.json` (explications, mots-clés, « à ne pas confondre », comptes liés), `nature.json` (actif/passif quand la classe ne suffit pas), `classes.json`. `plan-comptable.xlsx` est l'export Excel de ces mêmes données. |
| `scripts/` | `build.py` construit l'application à partir des données ; `brief-fiches.md` est le cahier des charges de rédaction des fiches. |
| `assets/` | Logos d'origine. |
| `maquette/` | La maquette validée au départ (conservée pour mémoire). |

## Mettre à jour le contenu

Deux façons, au choix.

**Dans Excel.** Ouvrir `data/plan-comptable.xlsx`, modifier les onglets *Comptes* (numéro, libellé) et *Fiches* (explication, mots-clés séparés par `;`, « à ne pas confondre » sous la forme `numéro : raison | numéro : raison`, comptes liés séparés par `;`), enregistrer, puis :

```bash
python scripts/build.py --from-xlsx
```

**Dans les fichiers JSON** de `data/`, puis :

```bash
python scripts/build.py --xlsx
```

Dans les deux cas, le script contrôle que tous les numéros cités existent, régénère `app/data.js` et change la version de cache dans `app/sw.js` : les téléphones récupèrent la nouvelle version à l'ouverture suivante (une bannière « Nouvelle version disponible » propose de recharger).

Pour générer le QR code de la page d'installation vers l'adresse définitive :

```bash
python scripts/build.py --url https://adresse-de-l-application/
```

Il faut Python 3 avec `openpyxl` (Excel) et `segno` (QR code) : `pip install openpyxl segno`.

## Tester sur le PC

```bash
python -m http.server 8766 --directory app
```

puis ouvrir http://localhost:8766/ dans un navigateur.

## Publier

Le contenu du dossier `app/` se dépose tel quel sur n'importe quel hébergement de fichiers statiques en HTTPS (GitHub Pages, Cloudflare Pages, Netlify, un sous-domaine du cabinet). La page `installer.html` explique aux collaborateurs comment ajouter l'application à leur écran d'accueil.
