#!/usr/bin/env python3
"""Fusionne les fichiers data/fiches-*.json (rédigés par lots) dans data/fiches.json.

Contrôles : JSON valide, aucun doublon avec les fiches existantes, tous les numéros cités existent,
champ « i » présent et de longueur raisonnable. Les fichiers partiels sont supprimés après fusion.
"""
import glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

def main():
    comptes = {c["n"] for c in json.load(open(os.path.join(DATA, "comptes.json"), encoding="utf-8"))}
    fiches = json.load(open(os.path.join(DATA, "fiches.json"), encoding="utf-8"))
    parts = sorted(glob.glob(os.path.join(DATA, "fiches-*.json")))
    if not parts:
        print("aucun fichier partiel à fusionner"); return 0
    errors, added = [], 0
    for p in parts:
        name = os.path.basename(p)
        try:
            part = json.load(open(p, encoding="utf-8"))
        except Exception as e:
            errors.append(f"{name} : JSON invalide ({e})"); continue
        for n, f in part.items():
            where = f"{name} / {n}"
            if n not in comptes: errors.append(f"{where} : compte inexistant"); continue
            if n in fiches: errors.append(f"{where} : fiche déjà existante, ignorée"); continue
            if not isinstance(f, dict) or not f.get("i"): errors.append(f"{where} : champ « i » manquant"); continue
            if len(f["i"]) > 420: errors.append(f"{where} : explication trop longue ({len(f['i'])} caractères)")
            clean = {"i": f["i"].strip()}
            if f.get("k"): clean["k"] = [str(x).strip() for x in f["k"] if str(x).strip()]
            nc = []
            for x in f.get("nc", []):
                m, why = (x[0], x[1] if len(x) > 1 else "") if isinstance(x, list) else (x, "")
                if str(m) not in comptes: errors.append(f"{where} : « ne pas confondre » vers {m} inexistant"); continue
                nc.append([str(m), str(why).strip()])
            if nc: clean["nc"] = nc
            rel = [str(m) for m in f.get("rel", []) if str(m) in comptes]
            for m in f.get("rel", []):
                if str(m) not in comptes: errors.append(f"{where} : compte lié {m} inexistant")
            if rel: clean["rel"] = rel
            fiches[n] = clean; added += 1
    fiches = dict(sorted(fiches.items(), key=lambda kv: kv[0]))
    with open(os.path.join(DATA, "fiches.json"), "w", encoding="utf-8") as fh:
        json.dump(fiches, fh, ensure_ascii=False, indent=1); fh.write("\n")
    for p in parts: os.remove(p)
    print(f"{added} fiches ajoutées depuis {len(parts)} fichiers ; total {len(fiches)} fiches pour {len(comptes)} comptes")
    for e in errors: print("ATTENTION :", e)
    return 0

if __name__ == "__main__":
    sys.exit(main())
