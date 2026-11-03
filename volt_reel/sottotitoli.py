"""Divisione del testo in blocchi di sottotitolo: frasi spezzate alla punteggiatura, al massimo due righe bilanciate.

Nel testo dei sottotitoli le parole chiave stanno tra *asterischi* e diventano gialle.
"""

RIGA = 28  # caratteri per riga, circa

PAROLE_DEBOLI = {"i", "il", "lo", "la", "le", "gli", "un", "una", "uno", "di", "del", "della", "dei", "delle", "a", "al",
                 "alla", "ai", "e", "ed", "o", "che", "per", "con", "in", "nel", "nella", "su", "da", "dal", "non", "è",
                 "sono", "sulle", "sul"}


def parole(testo: str) -> list[dict]:
    out, chiave = [], False
    for tok in testo.split():
        inizio = tok.startswith("*") or tok.startswith("«*")
        w = tok.replace("*", "")
        if inizio:
            chiave = True
        out.append({"w": w, "kw": chiave})
        if tok.rstrip(".,:;?!»").endswith("*"):
            chiave = False
    return out


def _lun(ws) -> int:
    return sum(len(x["w"]) for x in ws) + max(0, len(ws) - 1)


def _due_righe(ws, riga=RIGA):
    if _lun(ws) <= riga:
        return [ws]
    migliore, idx = None, 1
    for i in range(1, len(ws)):
        a, b = _lun(ws[:i]), _lun(ws[i:])
        if a > riga + 2 or b > riga + 2:
            continue
        punteggio = max(a, b) + (3 if len(ws[i:]) == 1 or len(ws[:i]) == 1 else 0)
        if migliore is None or punteggio < migliore:
            migliore, idx = punteggio, i
    return [ws[:idx], ws[idx:]]


def blocchi(testo: str, riga: int = RIGA) -> list[list[list[dict]]]:
    """Restituisce i blocchi: ogni blocco è una lista di righe, ogni riga una lista di parole {"w", "kw"}."""
    ws = parole(testo)
    frasi, cur = [], []
    for w in ws:
        cur.append(w)
        e = w["w"].rstrip("»")
        if e[-1:] in ".?!:;" or (e.endswith(",") and _lun(cur) >= 22):
            frasi.append(cur)
            cur = []
    if cur:
        frasi.append(cur)
    unite = []  # frasi brevissime unite alla successiva se stanno in una riga
    for f in frasi:
        if unite and _lun(unite[-1]) < 12 and _lun(unite[-1] + f) <= riga:
            unite[-1] = unite[-1] + f
        else:
            unite.append(f)
    res = []
    for f in unite:
        n = max(1, -(-_lun(f) // 50))
        if n == 1:
            res.append(_due_righe(f, riga))
            continue
        tagli, inizio = [], 0
        for k in range(1, n):
            obiettivo = _lun(f) * k / n
            migliore, idx = None, None
            for i in range(inizio + 1, len(f) - 1):
                ultima = f[i - 1]["w"].lower().strip(",.:;")
                pen = abs(_lun(f[:i]) - obiettivo) + (25 if ultima in PAROLE_DEBOLI else 0) - (8 if f[i - 1]["w"].endswith(",") else 0)
                if migliore is None or pen < migliore:
                    migliore, idx = pen, i
            if idx is None:
                break
            tagli.append(idx)
            inizio = idx
        confini = [0] + tagli + [len(f)]
        for a, b in zip(confini, confini[1:]):
            res.append(_due_righe(f[a:b], riga))
    return res


def testo_blocco(blocco) -> str:
    return " ".join(" ".join(w["w"] for w in r) for r in blocco)
