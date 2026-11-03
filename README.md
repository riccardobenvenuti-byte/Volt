# Volt Reel

Strumento di Volt Roma che trasforma una richiesta in un reel verticale di circa 60 secondi (1080×1920, 30 fps) con i quattro template approvati e il livello grafico di Volt.

**Versione 0.1 · 1° novembre 2026.** Motore dei template, quattro reel dimostrativi e struttura «a prese» con una voce sintetica di prova.

## Iniziare

L'installazione su Windows è in [INSTALLA.md](INSTALLA.md). Poi:

    python -m volt_reel verifica
    python -m volt_reel prova

Le regole del progetto, valide anche per Claude Code, sono in [CLAUDE.md](CLAUDE.md).

## Le prese

Ogni compito di IA è una presa con ingresso e uscita fissi. Un solo file, [motori.yaml](motori.yaml), dice quale modello è attivo: cambiare modello vuol dire cambiare una riga, e il precedente resta disponibile per tornare indietro.

| Presa | Motore attivo | Prossimo passo |
|---|---|---|
| voce | `kokoro_prova`, voce generica solo per le prove | Chatterbox Multilingual con il kit master (ordine 10) |
| allineamento | `proporzionale` | allineamento parola per parola, se servirà |
| volto | nessuno | LatentSync 1.6 o InfiniteTalk, dopo il banco di prova (ordine 10) |
| ritaglio | nessuno | quando un template lo richiede |
| ingrandimento | nessuno | quando un template lo richiede |

## Licenze dei materiali inclusi

- Font Ubuntu: Ubuntu Font Licence 1.0 (`risorse/font/UFL.txt`).
- Loghi Volt: di Volt, solo per la comunicazione di Volt.
- Voce di prova: modello Kokoro-82M (Apache-2.0) tramite kokoro-onnx (MIT), scaricato a parte in `modelli/`.
- Il codice del progetto è riservato a Volt Roma.
