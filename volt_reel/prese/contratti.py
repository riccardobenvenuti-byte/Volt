"""Contratti delle prese: che cosa entra e che cosa esce da ogni compito di IA.

Template, montaggio, sottotitoli ed etichette usano SOLO questi contratti e non sanno quale
modello c'è dietro. Un modello nuovo si collega scrivendo un adattatore che rispetta il
contratto della sua presa e cambiando «attivo» in motori.yaml. Il modello precedente resta
installato, così si torna indietro cambiando di nuovo una riga.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from math import gcd
from pathlib import Path

import numpy as np

FREQUENZA = 48000  # Hz. Ogni audio che esce dalla presa VOCE è mono, float32, a 48 kHz.


@dataclass
class Audio:
    """Audio mono in virgola mobile (valori tra -1 e 1)."""

    campioni: np.ndarray
    frequenza: int = FREQUENZA

    @property
    def durata(self) -> float:
        return len(self.campioni) / self.frequenza


def normalizza(campioni, frequenza: int) -> Audio:
    """Porta l'uscita di qualunque motore al formato del contratto: mono, float32, 48 kHz."""
    x = np.asarray(campioni, dtype=np.float32)
    if x.ndim == 2:  # più canali: si fa la media
        x = x.mean(axis=1 if x.shape[0] > x.shape[1] else 0)
    if int(frequenza) != FREQUENZA:
        from scipy.signal import resample_poly

        g = gcd(int(frequenza), FREQUENZA)
        x = resample_poly(x, FREQUENZA // g, int(frequenza) // g)
    return Audio(np.clip(x, -1.0, 1.0).astype(np.float32), FREQUENZA)


def controlla_audio(a: Audio, motore: str) -> Audio:
    """Verifica che un adattatore abbia rispettato il contratto della presa VOCE."""
    if not isinstance(a, Audio) or a.frequenza != FREQUENZA or a.campioni.ndim != 1 or a.campioni.dtype != np.float32:
        raise SystemExit(f"L'adattatore della voce «{motore}» non rispetta il contratto: deve restituire Audio mono, float32, a {FREQUENZA} Hz.")
    if len(a.campioni) == 0:
        raise SystemExit(f"L'adattatore della voce «{motore}» ha restituito un audio vuoto.")
    return a


class Presa(ABC):
    """Base comune: ogni adattatore riceve il proprio nome, le impostazioni da motori.yaml e la cartella del progetto."""

    def __init__(self, nome: str, impostazioni: dict, radice: Path):
        self.nome = nome
        self.impostazioni = impostazioni or {}
        self.radice = Path(radice)

    def controlla(self) -> list[str]:
        """Problemi che impediscono al motore di funzionare (file mancanti, librerie assenti). Lista vuota = pronto."""
        return []


class Voce(Presa):
    """VOCE · entra: una frase approvata e il profilo di chi parla · esce: Audio mono, float32, 48 kHz."""

    @abstractmethod
    def sintetizza(self, testo: str, profilo: str) -> Audio: ...


class Allineamento(Presa):
    """ALLINEAMENTO · entra: l'audio di una frase e i blocchi di sottotitolo che la compongono ·
    esce: per ogni blocco (inizio, fine) in secondi dall'inizio dell'audio."""

    @abstractmethod
    def allinea(self, audio: Audio, blocchi: list[str]) -> list[tuple[float, float]]: ...


class Volto(Presa):
    """VOLTO · entra: video base della persona (MP4) e audio (WAV) · esce: MP4 verticale 1080×1920, 30 fps, con il labiale sincronizzato."""

    @abstractmethod
    def anima(self, video_base: Path, audio: Path, uscita: Path) -> Path: ...


class Ritaglio(Presa):
    """RITAGLIO · entra: video della persona · esce: video maschera in bianco e nero, stesso formato e stessi fotogrammi."""

    @abstractmethod
    def ritaglia(self, video: Path, uscita: Path) -> Path: ...


class Ingrandimento(Presa):
    """INGRANDIMENTO · entra: video · esce: video 1080×1920, 30 fps."""

    @abstractmethod
    def ingrandisci(self, video: Path, uscita: Path) -> Path: ...


CONTRATTI = {
    "voce": Voce,
    "allineamento": Allineamento,
    "volto": Volto,
    "ritaglio": Ritaglio,
    "ingrandimento": Ingrandimento,
}
