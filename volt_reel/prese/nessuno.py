"""Motore «nessuno»: la presa esiste ma per ora non ha un modello collegato."""
from pathlib import Path


class Nessuno:
    def __init__(self, nome: str, impostazioni: dict, radice: Path, presa: str = ""):
        self.nome = nome
        self.impostazioni = impostazioni or {}
        self.radice = Path(radice)
        self.presa = presa

    def controlla(self) -> list[str]:
        return []

    def __getattr__(self, metodo):
        def non_attivo(*args, **kwargs):
            raise SystemExit(f"La presa «{self.presa}» non ha un motore attivo: in motori.yaml è impostata su «nessuno».")

        return non_attivo
