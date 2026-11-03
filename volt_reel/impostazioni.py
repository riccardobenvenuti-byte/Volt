"""Percorsi del progetto e lettura di motori.yaml."""
from pathlib import Path

import yaml

RADICE = Path(__file__).resolve().parent.parent
MOTORE = RADICE / "motore"        # disegno dei template (canvas)
RISORSE = RADICE / "risorse"      # font e loghi Volt
REEL = RADICE / "reel"            # copioni (reel.json)
MODELLI = RADICE / "modelli"      # file dei modelli scaricati, fuori da Git
LAVORI = RADICE / "lavori"        # file intermedi, fuori da Git
USCITE = RADICE / "uscite"        # video finiti, fuori da Git

PRESE = ("voce", "allineamento", "volto", "ritaglio", "ingrandimento")


def motori() -> dict:
    """Legge motori.yaml e controlla che ogni presa abbia «attivo» e l'elenco dei «motori»."""
    with open(RADICE / "motori.yaml", encoding="utf-8") as f:
        conf = yaml.safe_load(f) or {}
    for p in PRESE:
        if p not in conf:
            raise SystemExit(f"motori.yaml: manca la presa «{p}».")
        if not isinstance(conf[p], dict) or "attivo" not in conf[p] or "motori" not in conf[p]:
            raise SystemExit(f"motori.yaml: la presa «{p}» deve avere «attivo» e «motori».")
        if conf[p]["attivo"] not in conf[p]["motori"]:
            raise SystemExit(f"motori.yaml: la presa «{p}» punta a «{conf[p]['attivo']}», che non è nell'elenco dei suoi motori.")
    return conf
