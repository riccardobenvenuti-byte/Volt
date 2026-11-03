"""Fase VOCE: dal copione (reel.json) all'audio del reel e ai tempi di scene e sottotitoli (timeline.json).

Usa solo le prese «voce» e «allineamento»: il modello che c'è dietro lo decide motori.yaml.
"""
import hashlib
import json

import numpy as np
import soundfile as sf

from . import sottotitoli
from .impostazioni import LAVORI
from .prese import presa
from .prese.contratti import FREQUENZA, Audio, controlla_audio

FPS = 30
ANTICIPO, CODA = 0.10, 0.28   # secondi prima e dopo la voce in ogni scena
CHIUSURA_MIN = 2.7            # la scena di chiusura dura almeno così


def _sintetizza(voce, testo: str, profilo: str) -> Audio:
    """Sintesi con memoria: la stessa frase con lo stesso motore e profilo non si rigenera."""
    imp = (voce.impostazioni.get("profili") or {}).get(profilo, {})
    chiave = hashlib.sha1(json.dumps([voce.nome, profilo, imp, testo], ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:16]
    p = LAVORI / "_memoria_voce" / f"{chiave}.wav"
    if p.is_file():
        x, sr = sf.read(str(p), dtype="float32")
        if sr == FREQUENZA and x.ndim == 1:
            return Audio(x, sr)
    a = controlla_audio(voce.sintetizza(testo, profilo), voce.nome)
    p.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(p), a.campioni, a.frequenza, subtype="FLOAT")
    return a


def _rifila(x: np.ndarray) -> np.ndarray:
    """Toglie il silenzio all'inizio e alla fine della frase."""
    idx = np.where(np.abs(x) > 0.012)[0]
    if len(idx):
        x = x[max(0, idx[0] - int(0.03 * FREQUENZA)): min(len(x), idx[-1] + int(0.06 * FREQUENZA))]
    return x


def _inviluppo(x: np.ndarray, durata: float) -> list:
    """Volume della voce fotogramma per fotogramma: muove la bocca del presentatore disegnato."""
    n = int(round(durata * FPS))
    env = np.zeros(n)
    hop = FREQUENZA // FPS
    for i in range(n):
        c = int((i / FPS - ANTICIPO) * FREQUENZA)
        a, b = max(0, c - hop), min(len(x), c + hop)
        if b > a:
            env[i] = float(np.sqrt(np.mean(x[a:b] ** 2)))
    if env.max() > 0:
        env = env / np.percentile(env[env > 0], 95)
    return [round(float(min(1.0, v)), 3) for v in env]


def costruisci(reel: dict) -> dict:
    voce, allineamento = presa("voce"), presa("allineamento")
    cartella = LAVORI / reel["id"]
    cartella.mkdir(parents=True, exist_ok=True)
    t, scene, traccia = 0.0, [], []
    for sc in reel["scene"]:
        profilo = sc.get("voce", reel["voce"])
        x = _rifila(_sintetizza(voce, sc["v"], profilo).campioni)
        alen = len(x) / FREQUENZA
        if sc["k"] == "end":
            dur = max(CHIUSURA_MIN, ANTICIPO + alen + 1.0)
        else:
            dur = max(float(sc.get("min", 0)), ANTICIPO + alen + CODA)
        dur = round(dur * FPS) / FPS
        d = dict(sc)
        d.update({"start": round(t, 4), "dur": dur, "alen": round(alen, 3), "voce": profilo})
        if sc.get("subs", True):
            bl = sottotitoli.blocchi(sc.get("s", sc["v"]))
            tempi = allineamento.allinea(Audio(x), [sottotitoli.testo_blocco(b) for b in bl])
            d["chunks"] = [{"t0": round(ANTICIPO + a, 3), "t1": round(ANTICIPO + b, 3), "lines": blocco}
                           for blocco, (a, b) in zip(bl, tempi)]
            d["chunks"][-1]["t1"] = round(dur - 0.05, 3)
        d["env"] = _inviluppo(x, dur)
        scene.append(d)
        traccia.append((t + ANTICIPO, x))
        t += dur
    totale = round(t, 4)
    audio = np.zeros(int(totale * FREQUENZA) + FREQUENZA, dtype=np.float32)
    for inizio, x in traccia:
        i = int(inizio * FREQUENZA)
        audio[i:i + len(x)] += x
    audio = audio[:int(totale * FREQUENZA)]
    picco = float(np.abs(audio).max()) or 1.0
    sf.write(str(cartella / "voce.wav"), audio / picco * 0.89, FREQUENZA)
    timeline = {"id": reel["id"], "titolo": reel["titolo"], "topic": reel.get("topic"), "etichetta": reel["etichetta"],
                "fps": FPS, "dur": totale, "frames": int(round(totale * FPS)), "scenes": scene,
                "motori": {"voce": voce.nome, "allineamento": allineamento.nome}}
    with open(cartella / "timeline.json", "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False)
    return timeline
