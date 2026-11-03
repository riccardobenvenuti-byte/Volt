"""Adattatore della presa ALLINEAMENTO: divide il tempo di una frase in proporzione al testo dei blocchi.

Basta finché la voce si genera una frase alla volta. Quando servirà la precisione parola per parola
(per esempio per far comparire la parola chiave nel momento esatto) si aggiunge un motore di
allineamento forzato con un modello italiano a licenza libera e si cambia «attivo» in motori.yaml.
"""
import re

from .contratti import Allineamento, Audio


def peso(testo: str) -> float:
    """Le pause cadono sulla punteggiatura: virgole e punti «pesano» più delle lettere."""
    return len(testo) + 6 * testo.count(",") + 10 * len(re.findall(r"[.?!:;]", testo)) + 4


class AllineamentoProporzionale(Allineamento):
    def allinea(self, audio: Audio, blocchi: list[str]) -> list[tuple[float, float]]:
        pesi = [peso(b) for b in blocchi]
        totale = sum(pesi) or 1
        t, tempi = 0.0, []
        for w in pesi:
            durata = audio.durata * w / totale
            tempi.append((t, t + durata))
            t += durata
        return tempi
