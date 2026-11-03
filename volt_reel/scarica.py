"""Scarica i file dei modelli che girano sul PC. Per ora solo la voce di prova (Kokoro, circa 120 MB)."""
import hashlib
import urllib.request

from .impostazioni import MODELLI

BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
FILE = [
    ("kokoro/kokoro-v1.0.int8.onnx", BASE + "kokoro-v1.0.int8.onnx", 92361271,
     "6e742170d309016e5891a994e1ce1559c702a2ccd0075e67ef7157974f6406cb"),
    ("kokoro/voices-v1.0.bin", BASE + "voices-v1.0.bin", 28214398,
     "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"),
]


def _sha256(p) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for blocco in iter(lambda: f.read(1 << 20), b""):
            h.update(blocco)
    return h.hexdigest()


def scarica() -> None:
    for rel, url, dim, impronta in FILE:
        p = MODELLI / rel
        if p.is_file() and p.stat().st_size == dim and _sha256(p) == impronta:
            print(f"[ok] {rel} è già presente")
            continue
        p.parent.mkdir(parents=True, exist_ok=True)
        parz = p.with_name(p.name + ".parziale")
        print(f"Scarico {rel} ({dim / 1e6:.0f} MB)…", flush=True)
        with urllib.request.urlopen(url, timeout=60) as r, open(parz, "wb") as f:
            letti, prossimo = 0, 10
            while True:
                blocco = r.read(1 << 20)
                if not blocco:
                    break
                f.write(blocco)
                letti += len(blocco)
                while prossimo <= 100 and letti * 100 >= prossimo * dim:
                    print(f"  {prossimo}%", flush=True)
                    prossimo += 10
        if _sha256(parz) != impronta:
            parz.unlink(missing_ok=True)
            raise SystemExit(f"Il file {rel} è arrivato danneggiato: riprova.")
        parz.replace(p)
        print(f"[ok] {rel}")
