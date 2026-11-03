# Installazione su Windows · istruzioni per Claude Code

Segui i passi in ordine, sul PC di Riccardo, e parlagli in italiano semplice.
Prima di installare un programma chiedigli conferma. Se un passo non riesce, fermati e spiegagli che cosa è successo prima di tentare altro.

Le istruzioni sono scritte per la shell di Claude Code su Windows (Git Bash): `~` è la cartella dell'utente, per esempio `C:\Users\Riccardo`.
Alcuni comandi (installazione delle librerie, download, video di prova) durano diversi minuti: dai loro un tempo massimo di 10 minuti invece dei 2 predefiniti.

## 1. Programmi necessari

- Git c'è già, perché serve a Claude Code: `git --version`.
- Python 3.12: controlla con `py -0p`. Se manca, con l'ok di Riccardo:
  `winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements`
  Se poi `py` non viene trovato, chiedi a Riccardo di chiudere e riaprire Claude Code e riparti da qui.
- ffmpeg non serve installarlo: arriva con le librerie Python del passo 5.

## 2. Il repository

Il progetto vive in `~/Volt`. Non metterlo in Documenti o in altre cartelle sincronizzate con OneDrive: conterrà file pesanti e, più avanti, dati personali.

Prima di clonare, chiedi a Riccardo di controllare che nel browser sia entrato su GitHub come **riccardobenvenuti-byte**, o di uscire da altri account GitHub: l'accesso che si apre durante il clone usa l'account attivo nel browser.

- Se `~/Volt` non esiste:
  `git clone https://riccardobenvenuti-byte@github.com/riccardobenvenuti-byte/Volt.git ~/Volt`
- Se esiste già, allinea l'indirizzo e aggiorna:
  `git -C ~/Volt remote set-url origin https://riccardobenvenuti-byte@github.com/riccardobenvenuti-byte/Volt.git`
  `git -C ~/Volt pull`

Il nome utente dentro l'indirizzo serve a far usare a Windows l'account GitHub del progetto e non quello di altri progetti. Se si apre il browser per l'accesso, Riccardo deve entrare come **riccardobenvenuti-byte**. Un avviso di repository vuoto è normale.

## 3. Identità Git solo per questo progetto

I commit non devono mai mostrare l'email personale di Riccardo.

1. Trova il numero dell'account: `curl -s https://api.github.com/users/riccardobenvenuti-byte` e leggi il campo `"id"`.
   Se risponde «Not Found», chiedi a Riccardo di copiarti da GitHub → Settings → Emails l'indirizzo che finisce con `@users.noreply.github.com`.
2. Dentro `~/Volt`:
   `git config --local user.name "riccardobenvenuti-byte"`
   `git config --local user.email "<ID>+riccardobenvenuti-byte@users.noreply.github.com"`

## 4. I file del pacchetto

Il pacchetto è `volt-reel-v0.1.zip` nella cartella Download (`~/Downloads`); se il browser l'ha rinominato, per esempio con «(1)», usa quel nome. Estrai il **contenuto** della cartella `volt-reel-v0.1` nella radice di `~/Volt`, accanto alla cartella `.git`, sovrascrivendo un eventuale README.md. Per esempio:

    py -3.12 -c "import zipfile, pathlib; h = pathlib.Path.home(); zipfile.ZipFile(h / 'Downloads' / 'volt-reel-v0.1.zip').extractall(h / 'volt-reel-tmp')"
    cp -r ~/volt-reel-tmp/volt-reel-v0.1/. ~/Volt/

Controlla che in `~/Volt` ci siano `CLAUDE.md`, `motori.yaml` e la cartella `volt_reel`, poi cancella `~/volt-reel-tmp`. Da qui in avanti lavora dentro `~/Volt` e leggi anche `CLAUDE.md`: contiene le regole del progetto.

## 5. Ambiente Python

    cd ~/Volt
    py -3.12 -m venv .venv
    .venv/Scripts/python -m pip install --upgrade pip
    .venv/Scripts/python -m pip install -r requirements.txt
    .venv/Scripts/python -m playwright install chromium

## 6. Modelli e controllo

    .venv/Scripts/python -m volt_reel modelli
    .venv/Scripts/python -m volt_reel verifica

`modelli` scarica la voce di prova (circa 120 MB). `verifica` deve chiudersi con «Tutto pronto.»: ogni riga `[!!]` dice che cosa sistemare.

## 7. Video di prova

    .venv/Scripts/python -m volt_reel prova

La prima volta servono alcuni minuti. Il risultato è `uscite/demo-motion.mp4`, lungo 50,8 secondi, uguale alla demo «Motion» già approvata, con l'etichetta «DEMO · FATTI INVENTATI · VOCE IA» in alto a destra. Aprilo con il lettore di Windows e chiedi a Riccardo di guardarlo con l'audio.

## 8. Primo caricamento su GitHub

1. `git status`: non devono comparire `.venv/`, `modelli/`, `lavori/` né `uscite/`.
2. `git add -A`
3. `git commit -m "Primo caricamento: motore dei template e struttura a prese (v0.1)"`
4. `git branch -M main`
5. `git push -u origin main`

Se il push chiede l'accesso, Riccardo entra come riccardobenvenuti-byte. Se GitHub rifiuta il push per via dell'email, ricontrolla il passo 3 e correggi il commit con `git commit --amend --reset-author --no-edit`.

## 9. Riepilogo per Riccardo

Scrivi un riepilogo breve che Riccardo possa girare a Claude, con:

- versione di Python;
- le righe stampate da `verifica`;
- tempo impiegato da `prova` e dimensione del video;
- risultato di `git log --oneline -1` e di `git remote -v`;
- problemi incontrati e come li hai risolti.
