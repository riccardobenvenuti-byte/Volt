"""Collega ogni presa al motore indicato da «attivo» in motori.yaml."""
from __future__ import annotations

import importlib

from ..impostazioni import RADICE, motori
from .contratti import CONTRATTI
from .nessuno import Nessuno

_attive: dict = {}


def presa(nome: str):
    """Restituisce l'adattatore attivo della presa (voce, allineamento, volto, ritaglio, ingrandimento)."""
    if nome in _attive:
        return _attive[nome]
    if nome not in CONTRATTI:
        raise SystemExit(f"La presa «{nome}» non esiste. Prese: {', '.join(CONTRATTI)}.")
    conf = motori()[nome]
    attivo = conf["attivo"]
    obj = carica(nome, attivo, conf["motori"][attivo])
    _attive[nome] = obj
    return obj


def carica(nome: str, motore: str, impostazioni: dict):
    """Importa l'adattatore («modulo:Classe») e controlla che rispetti il contratto della presa."""
    rif = (impostazioni or {}).get("adattatore", "")
    if ":" not in rif:
        raise SystemExit(f"motori.yaml: il motore «{motore}» della presa «{nome}» deve indicare «adattatore: modulo:Classe».")
    modulo, classe = rif.split(":", 1)
    try:
        cls = getattr(importlib.import_module(modulo), classe)
    except (ImportError, AttributeError) as e:
        raise SystemExit(f"Non riesco a caricare l'adattatore «{rif}» della presa «{nome}»: {e}")
    if cls is not Nessuno and not issubclass(cls, CONTRATTI[nome]):
        raise SystemExit(f"L'adattatore «{rif}» non rispetta il contratto della presa «{nome}».")
    return cls(motore, impostazioni, RADICE) if cls is not Nessuno else Nessuno(motore, impostazioni, RADICE, presa=nome)
