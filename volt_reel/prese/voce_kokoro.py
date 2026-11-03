"""Adattatore della presa VOCE per Kokoro: voce sintetica generica di prova, gira sul PC senza GPU.

Non è la voce di nessuno e serve solo a provare template e montaggio finché non è attiva la voce clonata.
"""
from .contratti import Audio, Voce, normalizza


class VoceKokoro(Voce):
    _motore = None

    def _file(self):
        f = self.impostazioni.get("file", {})
        return self.radice / f.get("modello", ""), self.radice / f.get("voci", "")

    def controlla(self) -> list[str]:
        problemi = []
        try:
            import kokoro_onnx  # noqa: F401
        except ImportError:
            problemi.append("manca la libreria kokoro-onnx (pip install -r requirements.txt)")
        for p in self._file():
            if not p.is_file():
                problemi.append(f"manca {p.relative_to(self.radice)} (esegui: python -m volt_reel modelli)")
        return problemi

    def _kokoro(self):
        if VoceKokoro._motore is None:
            problemi = self.controlla()
            if problemi:
                raise SystemExit("Voce di prova non pronta: " + "; ".join(problemi))
            from kokoro_onnx import Kokoro

            modello, voci = self._file()
            VoceKokoro._motore = Kokoro(str(modello), str(voci))
        return VoceKokoro._motore

    def sintetizza(self, testo: str, profilo: str) -> Audio:
        profili = self.impostazioni.get("profili", {})
        p = profili.get(profilo)
        if p is None:
            raise SystemExit(f"Il motore «{self.nome}» non conosce il profilo «{profilo}». Profili: {', '.join(profili) or 'nessuno'}.")
        campioni, frequenza = self._kokoro().create(testo, voice=p["voce"], speed=float(p.get("velocita", 1.0)), lang="it")
        return normalizza(campioni, frequenza)
