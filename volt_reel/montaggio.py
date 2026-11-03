"""Montaggio: disegna i fotogrammi con il motore dei template (canvas in Chromium) e li codifica con ffmpeg."""
import base64
import json
import shutil
import subprocess
import time
from pathlib import Path

from .impostazioni import LAVORI, MOTORE, RISORSE, USCITE

FPS = 30
FONT = [("UB", "Ubuntu-Bold.ttf", 700), ("UM", "Ubuntu-Medium.ttf", 500), ("UR", "Ubuntu-Regular.ttf", 400)]
LOGHI = {"logoW": "logo-bianco.png", "logoV": "logo-viola.png", "starsW": "logo-stelle-bianco.png"}


def ffmpeg() -> str:
    """ffmpeg di sistema se c'è, altrimenti quello incluso nel pacchetto Python imageio-ffmpeg."""
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        raise SystemExit("Non trovo ffmpeg: esegui «pip install -r requirements.txt».")


def _dati(p: Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def _pagina() -> str:
    js = (MOTORE / "base.js").read_text(encoding="utf-8") + "\n" + (MOTORE / "scene.js").read_text(encoding="utf-8")
    return ("<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;background:#000}canvas{display:block}</style>"
            "</head><body><canvas id='c' width='1080' height='1920'></canvas><script>" + js + "</script></body></html>")


def _timeline(reel_id: str) -> dict:
    p = LAVORI / reel_id / "timeline.json"
    if not p.is_file():
        raise SystemExit(f"Manca {p.relative_to(LAVORI.parent)}: prima va fatta la fase voce.")
    return json.loads(p.read_text(encoding="utf-8"))


class _Pagina:
    def __init__(self, tl: dict):
        from playwright.sync_api import sync_playwright

        self._pw = sync_playwright().start()
        self.browser = self._pw.chromium.launch()
        self.page = self.browser.new_page(viewport={"width": 1080, "height": 1920})
        self.errori = []
        self.page.on("pageerror", lambda e: self.errori.append(str(e)))
        self.page.on("console", lambda m: self.errori.append(m.text) if m.type == "error" else None)
        try:
            self.page.set_content(_pagina())
            font = [[n, _dati(RISORSE / "font" / f, "font/ttf"), w] for n, f, w in FONT]
            loghi = {k: _dati(RISORSE / "loghi" / f, "image/png") for k, f in LOGHI.items()}
            self.page.evaluate("([tl,f,i]) => init(tl,f,i)", [tl, font, loghi])
        except Exception as e:
            self.chiudi()
            raise SystemExit(f"Il motore dei template non è partito: {e}")
        if self.errori:
            self.chiudi()
            raise SystemExit("Errori nel motore dei template: " + " | ".join(self.errori))

    def fotogramma(self, i: int) -> bytes:
        url = self.page.evaluate(f"frame({int(i)})")
        return base64.b64decode(url.split(",", 1)[1])

    def chiudi(self):
        self.browser.close()
        self._pw.stop()


def fotogrammi(reel_id: str, secondi=None) -> list:
    """Salva alcuni fotogrammi JPG da guardare (di default uno per scena, al 60% della scena)."""
    tl = _timeline(reel_id)
    od = LAVORI / reel_id / "fotogrammi"
    od.mkdir(parents=True, exist_ok=True)
    if not secondi:
        secondi = [round(s["start"] + s["dur"] * 0.6, 2) for s in tl["scenes"]]
    pg = _Pagina(tl)
    out = []
    try:
        for s in secondi:
            i = min(int(round(float(s) * FPS)), tl["frames"] - 1)
            p = od / f"f{i:05d}.jpg"
            p.write_bytes(pg.fotogramma(i))
            out.append(p)
    finally:
        pg.chiudi()
    return out


def monta(reel_id: str) -> Path:
    tl = _timeline(reel_id)
    lav = LAVORI / reel_id
    sd = lav / "scene"
    sd.mkdir(parents=True, exist_ok=True)
    ff = ffmpeg()
    t0 = time.time()
    pg = _Pagina(tl)
    nomi = []
    try:
        n = len(tl["scenes"])
        for k, s in enumerate(tl["scenes"]):
            f0 = int(round(s["start"] * FPS))
            f1 = int(round((s["start"] + s["dur"]) * FPS)) if k < n - 1 else tl["frames"]
            nome = f"s{k:02d}.mp4"
            parz = sd / f"s{k:02d}.parziale.mp4"
            cmd = [ff, "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
                   "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS), str(parz)]
            pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
            for i in range(f0, f1):
                pr.stdin.write(pg.fotogramma(i))
            pr.stdin.close()
            if pr.wait() != 0:
                raise SystemExit(f"ffmpeg si è fermato sulla scena {k + 1}.")
            parz.replace(sd / nome)
            nomi.append(nome)
            print(f"  scena {k + 1}/{n} ({f1 - f0} fotogrammi) · {time.time() - t0:.0f} s", flush=True)
    finally:
        pg.chiudi()
    elenco = sd / "elenco.txt"
    elenco.write_text("".join(f"file '{x}'\n" for x in nomi), encoding="utf-8")
    muto = lav / "video-muto.mp4"
    subprocess.run([ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(elenco), "-c", "copy", str(muto)], check=True)
    USCITE.mkdir(parents=True, exist_ok=True)
    finale = USCITE / f"{reel_id}.mp4"
    parz = USCITE / f"{reel_id}.parziale.mp4"
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(muto), "-i", str(lav / "voce.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
                    "-metadata", f"comment={tl.get('etichetta', '')}", "-movflags", "+faststart", "-shortest", str(parz)], check=True)
    parz.replace(finale)
    print(f"  video pronto in {time.time() - t0:.0f} s", flush=True)
    return finale
