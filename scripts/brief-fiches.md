# Rédaction des fiches (i) du plan comptable — consignes

## Contexte
Application « PCG de poche » pour un cabinet d'expertise comptable de Nouvelle-Calédonie (25 collaborateurs).
C'est le plan comptable général français, nomenclature **antérieure** au règlement ANC 2022-06 (comptes 67/77 exceptionnels, 791 transferts de charges, etc.), libellés métropolitains conservés.
L'utilisateur tape une racine ou un mot, tombe sur un compte, ouvre le petit (i) et lit une fiche **courte** : ce qu'on met dans ce compte, en langage courant, lisible en cinq secondes.

## Fichiers
- `data/comptes.json` : la liste complète des comptes `[{"n": "401", "l": "Fournisseurs"}, ...]`. Seuls ces numéros existent.
- `data/fiches.json` : les fiches déjà rédigées. **C'est la référence de style. Ne les modifiez pas, ne créez pas d'entrée pour un numéro qui y figure déjà.**
- Vous rédigez uniquement les comptes des classes qui vous sont attribuées.

## Ce qu'il faut produire
Un fichier `data/fiches-cX.json` (X = vos classes, par exemple `fiches-c34.json`), JSON strict, UTF-8, sans commentaires :
```json
{
  "4091": {
    "i": "Acomptes versés à un fournisseur avant la livraison. Se solde à réception de la facture.",
    "k": ["acompte versé", "avance fournisseur", "arrhes"],
    "nc": [["4191", "acompte reçu d'un client"]],
    "rel": ["401"]
  }
}
```
- `i` : obligatoire si l'entrée existe. 1 à 3 phrases, 60 à 260 caractères. Français courant, adressé au collaborateur (« vos achats », « vous »). Dire concrètement ce qu'on y enregistre ; ajouter le sens (débit/crédit) ou la contrepartie habituelle seulement quand ça aide ; pour les comptes de régularisation, parler de la clôture. Pas de texte réglementaire, pas de jargon inutile, aucun chiffre (seuil, taux, durée). Variez les tournures, évitez « Ce compte enregistre » à répétition.
- `k` : 2 à 8 mots-clés qu'un comptable taperait pour tomber sur ce compte : synonymes, objets concrets, abréviations courantes (FNP, FAE, CCA, PCA, IK, IS, RAN, ICNE, VNC…). Minuscules, accents normaux. Inutile de répéter les mots du libellé, ils sont déjà cherchés. Termes locaux bienvenus quand ils sont évidents : TGC (la TVA locale), CAFAT (sécurité sociale locale), RUAMM, OPT (poste, chèques postaux, télécoms), provinces (l'équivalent des départements), Enercal, EEC.
- `nc` : 0 à 4 comptes « à ne pas confondre avec », chacun avec une raison de 12 mots maximum qui explique la différence. Uniquement des numéros présents dans `comptes.json`.
- `rel` : 0 à 4 comptes liés : contrepartie habituelle, compte d'amortissement ou de dépréciation associé, reprise correspondante, compte principal pour un sous-compte d'intérêts courus. Uniquement des numéros présents dans `comptes.json`.

## Quand ne rien écrire
Si vous n'avez rien d'utile à dire, **ne créez pas d'entrée**. C'est le cas des subdivisions purement nominatives : « Matières (ou groupe) A », « Travaux de catégorie B », les ventilations par collectivité (13912 Régions, 13913 Départements…), « Produits en cours P1 ». En revanche, un sous-compte qui a un sens propre mérite une fiche (44562 TVA sur immobilisations, 6063 petit équipement, 16884 intérêts courus sur emprunts bancaires…). Ordre de grandeur attendu : la grande majorité des comptes à 2, 3 et 4 chiffres ont une fiche.

## Points d'attention
- **Intérêts courus** (1688 et ses sous-comptes 1688x, 1788, 2678, 2688, 2768 et 2768x, 4088, 4188, 4438, 4558, 4588, 5088, 518, 5181, 5188, 5198…) : le cabinet veut une explication systématique. Dire à chaque fois : intérêts qui ont couru jusqu'à la date de clôture sans être encore échus ni payés ; on les rattache à l'exercice à la clôture ; contrepartie : la charge d'intérêts (6611, 6615, 6616…) pour une dette, le produit financier (762x, 763x, 764, 768) pour une créance ; contre-passation à l'ouverture de l'exercice suivant. Mots-clés : « intérêts courus », « ICNE », « cut-off », « clôture ». En `rel`, le compte principal correspondant (par exemple 164 pour 16884) et le compte de charge ou de produit.
- **Formation** : la cotisation obligatoire à la formation professionnelle va en 6313 ou 6333 (impôts et taxes sur rémunérations, selon l'organisme collecteur) ; les formations suivies par le personnel vont en 6228, selon l'usage du cabinet ; les séminaires et colloques en 6185. N'inventez pas d'autre règle.
- **604 / 611** : 604 = études et prestations achetées et incorporées directement dans ce qui est vendu au client ; 611 = sous-traitance générale, non incorporée directement au produit vendu.
- **Amortissements (28x) et dépréciations (29x, 39x, 49x, 59x)** : dire de quelle dotation (68xx) et de quelle reprise (78xx) ils sont la contrepartie, et sur quelle immobilisation ou quel actif ils portent.
- **Classe 8** : engagements hors bilan (cautions données ou reçues, effets escomptés non échus, crédit-bail restant à courir), 88 résultat en instance d'affectation, 89 bilan d'ouverture et de clôture : expliquer à quoi ça sert concrètement.
- **Comptes de régularisation et de tiers** : penser au « à la clôture » (FNP, FAE, CCA, PCA, charges à payer, produits à recevoir) et à ce qui se passe à l'ouverture.
- Les tags « Actif / Passif / Charge / Produit » et « solde débiteur / créditeur » sont déjà affichés par l'application : ne les répétez pas mécaniquement.

## Avant de rendre
1. Vérifiez que le fichier est du JSON valide : `python -c "import json; json.load(open('data/fiches-cX.json', encoding='utf-8'))"`.
2. Vérifiez que tous les numéros cités (clés, `nc`, `rel`) existent dans `data/comptes.json` et qu'aucune clé n'existe déjà dans `data/fiches.json`.
3. Rendez un court rapport : nombre de fiches rédigées, liste des comptes volontairement laissés sans fiche.
