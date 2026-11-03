# I copioni dei reel · formato volt-reel/1

Ogni reel è un file JSON in questa cartella. Il programma lo legge, genera voce e tempi con le prese e monta il video in `uscite/<id>.mp4`. I quattro file `demo-*.json` sono esempi completi, uno per template.

## Campi del reel

| Campo | Contenuto |
|---|---|
| `formato` | sempre `"volt-reel/1"` |
| `id` | nome del file finale, senza spazi |
| `titolo` | titolo per riconoscerlo |
| `template` | `motion`, `schermo-diviso`, `notizia-commentata` o `spiegone` |
| `voce` | profilo di chi parla, definito in `motori.yaml` (per ora `prova-donna` o `prova-uomo`) |
| `etichetta` | testo dell'etichetta IA, obbligatorio |
| `topic` | facoltativo: pillola dell'argomento, usata da Spiegone |
| `scene` | le scene, in ordine; l'ultima è sempre la chiusura `end` |

## Campi di ogni scena

| Campo | Contenuto |
|---|---|
| `id` | nome breve e unico (m1, m2…) |
| `k` | tipo di scena, vedi sotto |
| `v` | testo letto dalla voce, con numeri e sigle scritti come si pronunciano |
| `s` | testo dei sottotitoli, se diverso da `v`: numeri in cifre e parole chiave tra *asterischi*, che diventano gialle |
| `subs` | `false` se la scena scrive già il testo con titoli o grafiche |
| `min` | durata minima in secondi |
| `voce` | profilo diverso da quello del reel, per esempio per una citazione |
| `trans` | `"band"` per entrare con la transizione a fasce |

## Tipi di scena

| `k` | Che cosa mostra | Campi propri | Esempio |
|---|---|---|---|
| `title_photo` | foto con titolo d'aggancio su due righe, la seconda gialla | `title`, `kicker`, `photo` | demo-motion m1 |
| `photo` | foto con movimento lento | `photo`, `kb` | demo-motion m2 |
| `bignum` | numero grande con etichetta e fonte | `num`, `suffix`, `label`, `source` | demo-motion m3 |
| `video` | riprese con tagli | `shots`, `cuts`, `name`, `title` | demo-motion m4 |
| `steps` | passi numerati su card | `cards`, `keep` | demo-motion m5–m6 |
| `map` | mappa | — | demo-motion m7 |
| `proof` | documento con la frase evidenziata e la fonte | `pill`, `head`, `body`, `hl` | demo-motion m8 |
| `pills` | parole in pillole e titolo | `pills`, `title` | demo-motion m9 |
| `presenter` | persona in camera | `frame` (`wide`/`tight`), `title`, `kicker`, `punch`, `card`, `question`, `qsub` | demo-schermo-diviso d1 |
| `band` | schermo diviso: contenuto sopra, persona sotto | `band`, `shutter`, `num`, `label`, `chapter` | demo-schermo-diviso d2 |
| `cutout` | persona scontornata su uno sfondo | `bg` | demo-notizia-commentata n3 |
| `clip` | spezzone citato, con nome e fonte | `name`, `credit` | demo-notizia-commentata n4 |
| `corner` | riprese con la persona in un angolo | `shots`, `cuts` | demo-notizia-commentata n7 |
| `preview` | anteprima dei punti | `items` | demo-spiegone s2 |
| `beforeafter` | prima e dopo | — | demo-spiegone s5 |
| `recap` | riepilogo dei punti | `items`, `title` | demo-spiegone s9 |
| `end` | chiusura con fasce, logo e «Vieni a conoscerci» | — | ultima scena di ogni reel |

Nella versione 0.1 foto, riprese, mappe e persone sono disegni segnaposto (per esempio `"photo": "piazza"`). I materiali veri delle richieste si collegano con lo schema del brief (ordine 12).
