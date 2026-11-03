"""Lettura e controllo di un reel.json, il copione neutro di un reel (vedi reel/LEGGIMI.md)."""
import json
from pathlib import Path

from .impostazioni import RADICE, REEL

FORMATO = "volt-reel/1"
TIPI_SCENA = {"band", "beforeafter", "bignum", "clip", "corner", "cutout", "end", "map", "photo", "pills",
              "presenter", "preview", "proof", "recap", "steps", "title_photo", "video"}


def trova(nome: str) -> Path:
    """Accetta un percorso («reel/demo-motion.json») o solo il nome («demo-motion»)."""
    candidati = [Path(nome), RADICE / nome, REEL / nome, REEL / f"{nome}.json"]
    for p in candidati:
        if p.is_file():
            return p.resolve()
    raise SystemExit(f"Non trovo il reel «{nome}». I reel stanno nella cartella reel/.")


def carica(nome: str) -> dict:
    p = trova(nome)
    try:
        with open(p, encoding="utf-8") as f:
            r = json.load(f)
    except json.JSONDecodeError as e:
        raise SystemExit(f"{p.name} non è un JSON valido: {e}")
    errori = []
    if r.get("formato") != FORMATO:
        errori.append(f"«formato» deve essere «{FORMATO}»")
    for k in ("id", "titolo", "voce", "etichetta", "scene"):
        if not r.get(k):
            errori.append(f"manca «{k}»" + (" (l'etichetta IA è obbligatoria)" if k == "etichetta" else ""))
    visti = set()
    for i, sc in enumerate(r.get("scene") or [], 1):
        if sc.get("k") not in TIPI_SCENA:
            errori.append(f"scena {i}: tipo «{sc.get('k')}» sconosciuto")
        if not str(sc.get("v", "")).strip():
            errori.append(f"scena {i}: manca il testo parlato «v»")
        if not sc.get("id") or sc["id"] in visti:
            errori.append(f"scena {i}: «id» mancante o ripetuto")
        visti.add(sc.get("id"))
    if r.get("scene") and r["scene"][-1].get("k") != "end":
        errori.append("l'ultima scena deve essere la chiusura («k»: «end»)")
    if errori:
        raise SystemExit(f"{p.name} non è valido:\n - " + "\n - ".join(errori))
    r["_file"] = str(p)
    return r
