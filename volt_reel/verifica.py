"""Controllo dell'ambiente: dice in italiano che cosa c'è e che cosa manca."""
import importlib
import platform
import shutil
import subprocess
import sys

from .impostazioni import MOTORE, PRESE, RADICE, RISORSE, motori

DATI_FUORI_DA_GIT = ["richieste/", "materiali/", "lavori/", "uscite/", "modelli/"]


def verifica() -> bool:
    esiti = []

    def esito(ok: bool, testo: str):
        esiti.append(ok)
        print(("[ok] " if ok else "[!!] ") + testo, flush=True)

    esito(sys.version_info >= (3, 10), f"Python {platform.python_version()}")

    for modulo, pacchetto in [("numpy", "numpy"), ("scipy", "scipy"), ("soundfile", "soundfile"), ("yaml", "PyYAML"),
                              ("playwright", "playwright"), ("imageio_ffmpeg", "imageio-ffmpeg")]:
        try:
            importlib.import_module(modulo)
            esito(True, f"libreria {pacchetto}")
        except Exception:
            esito(False, f"manca la libreria {pacchetto}: esegui «pip install -r requirements.txt»")

    try:
        from .montaggio import ffmpeg

        ff = ffmpeg()
        cod = subprocess.run([ff, "-hide_banner", "-encoders"], capture_output=True, text=True, timeout=60).stdout
        esito("libx264" in cod, f"ffmpeg con H.264 ({ff})")
    except (SystemExit, OSError, subprocess.SubprocessError) as e:
        esito(False, f"ffmpeg non funziona: {e}")

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            p.chromium.launch().close()
        esito(True, "Chromium per il motore dei template")
    except Exception:
        esito(False, "Chromium non parte: esegui «python -m playwright install chromium»")

    necessari = [MOTORE / "base.js", MOTORE / "scene.js"]
    necessari += [RISORSE / "font" / f for f in ("Ubuntu-Bold.ttf", "Ubuntu-Medium.ttf", "Ubuntu-Regular.ttf")]
    necessari += [RISORSE / "loghi" / f for f in ("logo-bianco.png", "logo-viola.png", "logo-stelle-bianco.png")]
    mancanti = [str(p.relative_to(RADICE)) for p in necessari if not p.is_file()]
    esito(not mancanti, "motore dei template, font e loghi" + (f": mancano {', '.join(mancanti)}" if mancanti else ""))

    try:
        from .prese import carica

        conf = motori()
        for nome in PRESE:
            attivo = conf[nome]["attivo"]
            problemi = carica(nome, attivo, conf[nome]["motori"][attivo]).controlla()
            esito(not problemi, f"presa {nome}: {attivo}" + (f" · {'; '.join(problemi)}" if problemi else ""))
    except SystemExit as e:
        esito(False, str(e))

    git = shutil.which("git")
    if git and (RADICE / ".git").exists():
        email = subprocess.run([git, "-C", str(RADICE), "config", "user.email"], capture_output=True, text=True).stdout.strip()
        ok = email.endswith("@users.noreply.github.com")
        esito(ok, f"identità Git del progetto: {email or 'non impostata'}"
              + ("" if ok else " · va usata l'email noreply di GitHub (INSTALLA.md, passo 3)"))
        ign = (RADICE / ".gitignore").read_text(encoding="utf-8") if (RADICE / ".gitignore").is_file() else ""
        fuori = [d for d in DATI_FUORI_DA_GIT if d not in ign]
        esito(not fuori, ".gitignore tiene fuori da Git dati personali e file pesanti" + (f": mancano {', '.join(fuori)}" if fuori else ""))
    else:
        print("[--] Git: controllo saltato, la cartella non è ancora un repository", flush=True)

    tutto = all(esiti)
    print("\nTutto pronto." if tutto else "\nC'è qualcosa da sistemare: guarda le righe con [!!].")
    return tutto
