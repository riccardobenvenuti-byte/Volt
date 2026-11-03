"""Comandi di Volt Reel. Uso: python -m volt_reel <comando> (python -m volt_reel -h per l'elenco)."""
import argparse
import sys
import time


def _crea(nome: str):
    from . import fase_voce, montaggio
    from .reel import carica

    t0 = time.time()
    r = carica(nome)
    print(f"Reel «{r['titolo']}» ({r['id']}): {len(r['scene'])} scene")
    print("1/2 Voce e tempi…", flush=True)
    tl = fase_voce.costruisci(r)
    print(f"  {tl['dur']:.1f} s di reel · voce: {tl['motori']['voce']} · allineamento: {tl['motori']['allineamento']}")
    print("2/2 Montaggio…", flush=True)
    finale = montaggio.monta(r["id"])
    mb = finale.stat().st_size / 1e6
    print(f"\nFATTO: {finale} ({tl['dur']:.1f} s, {mb:.1f} MB) in {time.time() - t0:.0f} s")
    return finale


def _prese():
    from .impostazioni import PRESE, motori

    conf = motori()
    for nome in PRESE:
        attivo = conf[nome]["attivo"]
        altri = [m for m in conf[nome]["motori"] if m != attivo]
        print(f"{nome:<14} attivo: {attivo:<14} {conf[nome]['motori'][attivo].get('descrizione', '')}")
        if altri:
            print(f"{'':<14} disponibili: {', '.join(altri)}")


def main():
    for flusso in (sys.stdout, sys.stderr):
        try:
            flusso.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(prog="python -m volt_reel", description="Volt Reel: reel verticali 1080×1920 per Volt Roma.")
    sub = ap.add_subparsers(dest="comando", required=True, metavar="comando")
    sub.add_parser("verifica", help="controlla che sul PC ci sia tutto il necessario")
    sub.add_parser("modelli", help="scarica i modelli che girano sul PC (voce di prova, circa 120 MB)")
    sub.add_parser("prese", help="mostra quale motore è attivo per ogni presa")
    sub.add_parser("prova", help="crea il video di prova (reel/demo-motion.json)")
    for nome, aiuto in [("crea", "crea un reel completo: voce, tempi e montaggio"),
                        ("voce", "solo voce e tempi (lavori/<id>/voce.wav e timeline.json)"),
                        ("monta", "solo montaggio, dopo la voce")]:
        p = sub.add_parser(nome, help=aiuto)
        p.add_argument("reel", help="nome o percorso del reel.json, per esempio demo-motion")
    p = sub.add_parser("fotogrammi", help="salva fotogrammi JPG da controllare (di default uno per scena)")
    p.add_argument("reel")
    p.add_argument("secondi", nargs="*", type=float, help="istanti da salvare, in secondi")
    a = ap.parse_args()

    if a.comando == "verifica":
        from .verifica import verifica

        sys.exit(0 if verifica() else 1)
    elif a.comando == "modelli":
        from .scarica import scarica

        scarica()
    elif a.comando == "prese":
        _prese()
    elif a.comando in ("crea", "prova"):
        _crea(a.reel if a.comando == "crea" else "demo-motion")
    elif a.comando == "voce":
        from . import fase_voce
        from .reel import carica

        tl = fase_voce.costruisci(carica(a.reel))
        print(f"Voce e tempi pronti: {tl['dur']:.1f} s, {len(tl['scenes'])} scene")
    elif a.comando == "monta":
        from . import montaggio
        from .reel import carica

        print(f"FATTO: {montaggio.monta(carica(a.reel)['id'])}")
    elif a.comando == "fotogrammi":
        from . import fase_voce, montaggio
        from .reel import carica

        r = carica(a.reel)
        fase_voce.costruisci(r)
        for p in montaggio.fotogrammi(r["id"], a.secondi):
            print(p)


if __name__ == "__main__":
    main()
