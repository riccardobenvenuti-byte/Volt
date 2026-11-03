"""Adattatore della presa VOCE per Chatterbox Multilingual (licenza MIT), da completare nell'ordine 10.

Funzionamento previsto: per ogni profilo (una persona con il consenso registrato) motori.yaml indica la
clip di riferimento del kit master; l'adattatore manda testo e clip al pod RunPod in un datacenter
europeo, riceve l'audio e lo restituisce con normalizza(), come vuole il contratto.
"""
from .contratti import Audio, Voce


class VoceChatterbox(Voce):
    def controlla(self) -> list[str]:
        return ["Chatterbox non è ancora collegato: si attiva nell'ordine 10, con il kit master e RunPod"]

    def sintetizza(self, testo: str, profilo: str) -> Audio:
        raise SystemExit(
            "Chatterbox non è ancora attivo: si collega nell'ordine 10, con il kit master e RunPod. "
            "Per ora in motori.yaml lascia la voce su «kokoro_prova»."
        )
