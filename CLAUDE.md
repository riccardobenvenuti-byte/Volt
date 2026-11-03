# Volt Reel · istruzioni per Claude Code

## Con chi lavori

Riccardo, volontario della comunicazione di Volt Roma. Non è un tecnico.

- Rispondigli in italiano semplice. Dopo ogni lavoro spiega in 2–3 frasi che cosa è cambiato e che cosa deve fare lui, senza gergo.
- Prima di installare programmi, spendere soldi o cancellare file, chiedigli conferma.

## Il progetto

Volt Reel trasforma una richiesta (testo, foto, video) in un reel verticale di circa 60 secondi (1080×1920, 30 fps) per Instagram e TikTok. Usa i quattro template approvati (Motion, Schermo diviso, Notizia commentata, Spiegone) con il livello grafico di Volt.

**Fase attuale: si costruisce e si prova tutto solo su Riccardo.** Nessun'altra persona, nessun volontario e nessun dato di terzi entra nel sistema finché Volt Italia non ha dato i permessi (ordine 15 del piano di lavoro).

## Come è fatto

| Cartella o file | Contenuto |
|---|---|
| `reel/` | i copioni dei reel, formato `volt-reel/1` (vedi `reel/LEGGIMI.md`) |
| `volt_reel/` | il programma: fase voce, montaggio, controlli |
| `volt_reel/prese/` | le prese: contratti e adattatori dei modelli di IA |
| `motore/` | il disegno dei template su canvas (`base.js`, `scene.js`) |
| `risorse/` | font Ubuntu e loghi Volt |
| `motori.yaml` | quale modello è attivo per ogni presa |
| `banco-di-prova/` | il test fisso per confrontare i modelli |
| `modelli/`, `lavori/`, `uscite/`, `richieste/`, `materiali/` | fuori da Git: modelli scaricati, file intermedi, video finiti, richieste e kit delle persone |

Comandi, dalla cartella del progetto (su Windows l'interprete è `.venv/Scripts/python`):

- `python -m volt_reel verifica` controlla l'ambiente
- `python -m volt_reel prova` crea il video di prova
- `python -m volt_reel crea <reel>` crea un reel in `uscite/<id>.mp4`
- `python -m volt_reel fotogrammi <reel> [secondi…]` salva JPG da guardare in `lavori/<id>/fotogrammi/`
- `python -m volt_reel prese` mostra i motori attivi
- `python -m volt_reel modelli` scarica i modelli che girano sul PC

## Regole fisse

1. **Non pubblicare mai niente.** Il lavoro finisce con il file in `uscite/`; pubblica una persona, dall'app.
2. **Etichetta IA sempre.** Ogni reel ha il campo `etichetta`, visibile dal primo all'ultimo fotogramma. Non toglierla e non renderla meno leggibile.
3. **Dati personali mai in Git.** Richieste, kit delle persone, file intermedi, video e modelli restano nelle cartelle escluse da `.gitignore`. Prima di ogni commit controlla `git status`.
4. **Solo prese.** Template e montaggio non chiamano mai un modello direttamente: si passa sempre da `presa("voce")`, `presa("volto")` e così via.
5. **Licenze prima di tutto.** Niente modelli o librerie con licenza non commerciale, con divieti di uso politico o con pesi di licenza poco chiara. Nel dubbio, chiedi.
6. **Niente GPU né servizi a pagamento senza l'ok di Riccardo in chat.** RunPod solo in datacenter europei e solo con la REST API v2; a fine sessione nessun pod resta acceso.
7. **Volto e voce di una persona solo con il suo consenso scritto e registrato.** Per ora l'unica persona è Riccardo.
8. **Niente musica nel file finale.** Si aggiunge nell'app al momento della pubblicazione.
9. **Fatti verificabili.** Ogni dato mostrato nel reel ha la sua fonte nel copione.
10. **Git con l'identità del progetto.** Commit in italiano, solo con l'email `…@users.noreply.github.com` del progetto, mai con l'email personale di Riccardo.

## Le prese e il cambio di modello

Ogni compito di IA è una presa con ingresso e uscita fissi (`volt_reel/prese/contratti.py`).

| Presa | Entra | Esce |
|---|---|---|
| voce | frase approvata e profilo di chi parla | audio mono, 48 kHz |
| allineamento | audio di una frase e blocchi di sottotitolo | inizio e fine di ogni blocco |
| volto | video base e audio | MP4 1080×1920, 30 fps, labiale sincronizzato |
| ritaglio | video della persona | video maschera |
| ingrandimento | video | video 1080×1920 |

Per cambiare modello:

1. Verifica la licenza: pesi e componenti, uso politico, uso nell'Unione europea.
2. Scrivi l'adattatore in `volt_reel/prese/` (una classe che rispetta il contratto) e aggiungi il motore in `motori.yaml`, senza toccare template e montaggio.
3. Passa il banco di prova: stesse frasi e stessi materiali, misure automatiche e voto alla cieca.
4. Se vince, ha la licenza pulita e costa uguale o meno, cambia `attivo` in `motori.yaml`. Il motore precedente resta in elenco per tornare indietro.
5. Scrivi nel commit che cosa è cambiato e perché.

## Controllare il lavoro

Prima di dire che un reel è pronto, genera i fotogrammi e guardali. Controlla testi tagliati o sovrapposti, etichetta IA e logo presenti, zone sicure rispettate: a parte logo ed etichetta, niente testo sopra l'11% o sotto il 78% dell'altezza, e colonna destra libera (x oltre 940, y tra 1050 e 1650).
