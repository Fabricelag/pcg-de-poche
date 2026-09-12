// Convertit les données de la maquette (JS) en fichiers sources JSON définitifs,
// en ajoutant les sous-comptes officiels manquants et en corrigeant quelques libellés.
// Usage : node scripts/import-maquette.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
ctx.window = ctx; // window.PCG et PCG désignent le même objet
vm.createContext(ctx);
for (const f of ["data-plan.js", "data-plan2.js", "data-infos.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "maquette", f), "utf8"), ctx, { filename: f });
}
const PCG = ctx.PCG;
let FIX_FRAGMENTS;

// ---- Sous-comptes de la nomenclature officielle (système développé) absents de la maquette
const ADD = [
  // classe 1
  ["10131", "Capital non amorti"], ["10132", "Capital amorti"],
  ["1057", "Autres écarts de réévaluation en France"], ["1058", "Autres écarts de réévaluation à l'étranger"],
  ["10611", "Réserve légale proprement dite"], ["10612", "Plus-values nettes à long terme"],
  ["10641", "Plus-values nettes à long terme"], ["10643", "Réserves consécutives à l'octroi de subventions d'investissement"], ["10648", "Autres réserves réglementées"],
  ["10681", "Réserve de propre assureur"], ["10688", "Réserves diverses"],
  ["1381", "État"], ["1382", "Régions"], ["1383", "Départements"], ["1384", "Communes"], ["1385", "Collectivités publiques"], ["1386", "Entreprises publiques"], ["1387", "Entreprises et organismes privés"], ["1388", "Autres"],
  ["13911", "État"], ["13912", "Régions"], ["13913", "Départements"], ["13914", "Communes"], ["13915", "Collectivités publiques"], ["13916", "Entreprises publiques"], ["13917", "Entreprises et organismes privés"], ["13918", "Autres"],
  ["1423", "Provisions pour reconstitution des gisements miniers et pétroliers"], ["1424", "Provisions pour investissement (participation des salariés)"],
  ["1431", "Hausse des prix"], ["1432", "Fluctuation des cours"],
  ["16881", "sur emprunts obligataires convertibles"], ["16883", "sur autres emprunts obligataires"], ["16884", "sur emprunts auprès des établissements de crédit"],
  ["16885", "sur dépôts et cautionnements reçus"], ["16886", "sur participation des salariés aux résultats"], ["16887", "sur emprunts et dettes assortis de conditions particulières"], ["16888", "sur autres emprunts et dettes assimilées"],
  // classe 2
  ["20121", "Frais de prospection"], ["20122", "Frais de publicité"],
  ["2314", "Constructions sur sol d'autrui"],
  ["2382", "Terrains"], ["2383", "Constructions"], ["2385", "Installations techniques, matériel et outillage industriels"], ["2388", "Autres immobilisations corporelles"],
  ["2681", "Principal"], ["2688", "Intérêts courus"],
  ["27682", "sur titres immobilisés (droit de créance)"], ["27684", "sur prêts"], ["27685", "sur dépôts et cautionnements versés"], ["27688", "sur créances diverses"],
  ["28011", "Frais de constitution"], ["28012", "Frais de premier établissement"], ["28013", "Frais d'augmentation de capital et d'opérations diverses"],
  ["2811", "Terrains de gisement"],
  ["28131", "Bâtiments"], ["28135", "Installations générales, agencements, aménagements des constructions"], ["28138", "Ouvrages d'infrastructure"],
  ["28141", "Bâtiments sur sol d'autrui"], ["28145", "Installations générales, agencements, aménagements des constructions sur sol d'autrui"], ["28148", "Ouvrages d'infrastructure sur sol d'autrui"],
  ["28151", "Installations complexes spécialisées"], ["28153", "Installations à caractère spécifique"], ["28154", "Matériel industriel"], ["28155", "Outillage industriel"], ["28157", "Agencements et aménagements du matériel et outillage industriels"],
  ["2912", "Agencements et aménagements de terrains"], ["2914", "Constructions sur sol d'autrui"],
  ["2931", "Immobilisations corporelles en cours"], ["2932", "Immobilisations incorporelles en cours"],
  ["2968", "Créances rattachées à des sociétés en participation"],
  // classe 4
  ["40971", "Fournisseurs d'exploitation"], ["40974", "Fournisseurs d'immobilisations"],
  ["4431", "Créances sur l'État résultant de la suppression de la règle du décalage d'un mois en matière de TVA"], ["4438", "Intérêts courus sur créances figurant au compte 4431"],
  ["44582", "Acomptes - Régime du forfait"],
  ["45611", "Apports en nature"], ["45615", "Apports en numéraire"],
  ["45621", "Actionnaires - Capital souscrit et appelé, non versé"], ["45625", "Associés - Capital appelé, non versé"],
  // classe 5
  ["5111", "Coupons échus à l'encaissement"],
  // classe 6
  ["61636", "sur achats"], ["61637", "sur ventes"], ["61638", "sur autres biens"],
  ["66181", "des dettes commerciales"], ["66188", "des dettes diverses"],
  ["6741", "Opérations liées à la constitution de fiducie - Transfert des éléments"], ["6742", "Opérations liées à la liquidation de la fiducie"],
  ["68161", "Immobilisations incorporelles"], ["68162", "Immobilisations corporelles"],
  // classe 7
  ["7093", "sur ventes de produits résiduels"],
  ["7741", "Opérations liées à la constitution de fiducie - Transfert des éléments"], ["7742", "Opérations liées à la liquidation de la fiducie"],
  ["78111", "Immobilisations incorporelles"], ["78112", "Immobilisations corporelles"],
  ["78161", "Immobilisations incorporelles"], ["78162", "Immobilisations corporelles"],
  ["78662", "Immobilisations financières"], ["78665", "Valeurs mobilières de placement"],
  ["78726", "Provision spéciale de réévaluation"], ["78727", "Plus-values réinvesties"],
  // classe 8
  ["80161", "Crédit-bail mobilier"], ["80165", "Crédit-bail immobilier"], ["80261", "Crédit-bail mobilier"], ["80265", "Crédit-bail immobilier"],
  // seconde passe (confirmés par le PCG14-DEV de Dolibarr 16)
  ["102", "Fonds fiduciaires"], ["162", "Obligations représentatives de passifs nets remis en fiducie"],
  ["1781", "Principal"], ["1788", "Intérêts courus"],
  ["2116", "Compte d'ordre sur immobilisations"], ["21141", "Carrières"],
  ["21151", "Ensembles immobiliers industriels (A, B, ...)"], ["21155", "Ensembles immobiliers administratifs et commerciaux (A, B, ...)"], ["21158", "Autres ensembles immobiliers"],
  ["211581", "Affectés aux opérations professionnelles (A, B, ...)"], ["211588", "Affectés aux opérations non professionnelles (A, B, ...)"],
  ["21311", "Ensembles immobiliers industriels (A, B, ...)"], ["21315", "Ensembles immobiliers administratifs et commerciaux (A, B, ...)"], ["21318", "Autres ensembles immobiliers"],
  ["213181", "Affectés aux opérations professionnelles (A, B, ...)"], ["213188", "Affectés aux opérations non professionnelles (A, B, ...)"],
  ["21351", "Ensembles immobiliers industriels (A, B, ...)"], ["21355", "Ensembles immobiliers administratifs et commerciaux (A, B, ...)"], ["21358", "Autres ensembles immobiliers"],
  ["213581", "Affectés aux opérations professionnelles (A, B, ...)"], ["213588", "Affectés aux opérations non professionnelles (A, B, ...)"],
  ["21381", "Voies de terre"], ["21382", "Voies de fer"], ["21383", "Voies d'eau"], ["21384", "Barrages"], ["21385", "Pistes d'aérodromes"],
  ["21511", "Installations complexes spécialisées sur sol propre"], ["21514", "Installations complexes spécialisées sur sol d'autrui"],
  ["21531", "Installations à caractère spécifique sur sol propre"], ["21534", "Installations à caractère spécifique sur sol d'autrui"],
  ["25", "Parts dans des entreprises liées et créances sur des entreprises liées"],
  ["2661", "Droits représentatifs d'actifs nets remis en fiducie"],
  ["3211", "Matières (ou groupe) C"], ["3212", "Matières (ou groupe) D"],
  ["3311", "Produits en cours P1"], ["3312", "Produits en cours P2"], ["3351", "Travaux en cours T1"], ["3352", "Travaux en cours T2"],
  ["3411", "Études en cours E1"], ["3412", "Études en cours E2"], ["3451", "Prestations de services en cours S1"], ["3452", "Prestations de services en cours S2"],
  ["3511", "Produits intermédiaires (ou groupe) A"], ["3512", "Produits intermédiaires (ou groupe) B"], ["3551", "Produits finis (ou groupe) A"], ["3552", "Produits finis (ou groupe) B"],
  ["36", "Stocks provenant d'immobilisations (compte à ouvrir, le cas échéant)"],
  ["38", "Stocks en voie d'acheminement, mis en dépôt ou donnés en consignation (compte à ouvrir, le cas échéant)"],
  ["3911", "Matières (ou groupe) A"], ["3912", "Matières (ou groupe) B"], ["3917", "Fournitures A, B, C, ..."],
  ["3921", "Matières consommables"], ["3922", "Fournitures consommables"], ["3926", "Emballages"],
  ["3931", "Produits en cours"], ["3935", "Travaux en cours"], ["3941", "Études en cours"], ["3945", "Prestations de services en cours"],
  ["3951", "Produits intermédiaires"], ["3955", "Produits finis"], ["3971", "Marchandises (ou groupe) A"], ["3972", "Marchandises (ou groupe) B"],
  ["5021", "Actions destinées à être attribuées aux employés et affectées à des plans déterminés"],
  ["5022", "Actions disponibles pour être attribuées aux employés ou pour la régularisation des cours de bourse"],
  ["60211", "Matières (ou groupe) C"], ["60212", "Matières (ou groupe) D"],
  ["6612", "Charges de la fiducie, résultat de la période"], ["7612", "Produits de la fiducie, résultat de la période"]
];
// ---- Libellés « fragments » de la nomenclature, complétés pour être lisibles seuls
Object.assign(FIX_FRAGMENTS = {}, {
  "6091": "Rabais, remises et ristournes obtenus sur achats de matières premières (et fournitures)",
  "6092": "Rabais, remises et ristournes obtenus sur achats d'autres approvisionnements stockés",
  "6094": "Rabais, remises et ristournes obtenus sur achats d'études et prestations de services",
  "6095": "Rabais, remises et ristournes obtenus sur achats de matériel, équipements et travaux",
  "6096": "Rabais, remises et ristournes obtenus sur achats d'approvisionnements non stockés",
  "6097": "Rabais, remises et ristournes obtenus sur achats de marchandises",
  "6152": "Entretien et réparations sur biens immobiliers",
  "6155": "Entretien et réparations sur biens mobiliers",
  "7091": "Rabais, remises et ristournes accordés sur ventes de produits finis",
  "7092": "Rabais, remises et ristournes accordés sur ventes de produits intermédiaires",
  "7093": "Rabais, remises et ristournes accordés sur ventes de produits résiduels",
  "7094": "Rabais, remises et ristournes accordés sur travaux",
  "7095": "Rabais, remises et ristournes accordés sur études",
  "7096": "Rabais, remises et ristournes accordés sur prestations de services",
  "7097": "Rabais, remises et ristournes accordés sur ventes de marchandises",
  "7098": "Rabais, remises et ristournes accordés sur produits des activités annexes",
  "16881": "Intérêts courus sur emprunts obligataires convertibles",
  "16883": "Intérêts courus sur autres emprunts obligataires",
  "16884": "Intérêts courus sur emprunts auprès des établissements de crédit",
  "16885": "Intérêts courus sur dépôts et cautionnements reçus",
  "16886": "Intérêts courus sur participation des salariés aux résultats",
  "16887": "Intérêts courus sur emprunts et dettes assortis de conditions particulières",
  "16888": "Intérêts courus sur autres emprunts et dettes assimilées",
  "27682": "Intérêts courus sur titres immobilisés (droit de créance)",
  "27684": "Intérêts courus sur prêts",
  "27685": "Intérêts courus sur dépôts et cautionnements versés",
  "27688": "Intérêts courus sur créances diverses",
  "61636": "Assurance-transport sur achats",
  "61637": "Assurance-transport sur ventes",
  "61638": "Assurance-transport sur autres biens",
  "66116": "Intérêts des emprunts et dettes assimilées",
  "66117": "Intérêts des dettes rattachées à des participations",
  "66181": "Intérêts des dettes commerciales",
  "66188": "Intérêts des dettes diverses"
});
// ---- Libellés à aligner sur la nomenclature officielle
const FIX = {
  "44583": "Remboursement de taxes sur le chiffre d'affaires demandé",
  "44586": "Taxes sur le chiffre d'affaires sur factures non parvenues",
  "44587": "Taxes sur le chiffre d'affaires sur factures à établir",
  "491": "Dépréciations des comptes de clients",
  "651": "Redevances pour concessions, brevets, licences, marques, procédés, logiciels, droits et valeurs similaires",
  "6816": "Dotations pour dépréciations des immobilisations incorporelles et corporelles",
  "6817": "Dotations pour dépréciations des actifs circulants",
  "6866": "Dotations pour dépréciations des éléments financiers",
  "6876": "Dotations pour dépréciations exceptionnelles",
  "1688": "Intérêts courus",
  "672": "Charges sur exercices antérieurs",
  "772": "Produits sur exercices antérieurs"
};

const map = new Map(PCG.accounts.map(([n, l]) => [n, l]));
let added = 0;
for (const [n, l] of ADD) { if (!map.has(n)) { map.set(n, l); added++; } }
for (const [n, l] of Object.entries(FIX)) { if (map.has(n)) map.set(n, l); }
for (const [n, l] of Object.entries(FIX_FRAGMENTS)) { map.set(n, l); }
const comptes = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([n, l]) => ({ n, l }));

const out = path.join(ROOT, "data");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "comptes.json"), JSON.stringify(comptes, null, 1).replace(/\{\n\s+"n": ("[^"]+"),\n\s+"l": ("[^"]*")\n\s*\}/g, '{"n":$1,"l":$2}') + "\n");
fs.writeFileSync(path.join(out, "classes.json"), JSON.stringify(PCG.classes, null, 1) + "\n");
fs.writeFileSync(path.join(out, "nature.json"), JSON.stringify(PCG.nature, null, 1) + "\n");
fs.writeFileSync(path.join(out, "fiches.json"), JSON.stringify(PCG.infos, null, 1) + "\n");
console.log(`comptes: ${comptes.length} (ajoutés: ${added}, corrigés: ${Object.keys(FIX).length}) | fiches: ${Object.keys(PCG.infos).length}`);
