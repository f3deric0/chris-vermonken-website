# Come aggiornare il sito (GitHub + Vercel)

Questo sito è statico (HTML/CSS/JS puri, nessuna build). Il flusso è:
**modifichi i file → push su GitHub → Vercel pubblica in automatico.**

## 0. La prima volta soltanto: collegare Vercel

Se non l'hai già fatto, autentica la CLI di Vercel sul tuo Mac:

```bash
npm install -g vercel   # se non è già installata
vercel login
```

Ti aprirà il browser o ti manderà una mail di conferma — segui i passaggi.
Va fatto una volta sola per macchina.

## 1. Ogni volta che vuoi aggiornare il sito

### Passo 1 — Modifica i file
Apri i file in `index.html`, `about.html`, `css/`, `js/` e fai le tue modifiche.

### Passo 2 — Prova in locale (opzionale ma consigliato)
```bash
cd "/Users/fex/Progetti/Chris "
python3 -m http.server 8000
```
Poi apri [http://localhost:8000](http://localhost:8000) nel browser per controllare che sia tutto ok. `Ctrl+C` per fermare il server quando hai finito.

### Passo 3 — Salva le modifiche su GitHub
```bash
cd "/Users/fex/Progetti/Chris "
git add -A
git commit -m "Descrizione breve di cosa hai cambiato"
git push origin main
```

### Passo 4 — Pubblica su Vercel

**Opzione A — automatico (consigliata):** se il progetto Vercel è collegato al repository GitHub `f3deric0/chris-vermorken-website`, ogni `git push` su `main` fa partire da solo un nuovo deploy in produzione. Vai su [vercel.com/dashboard](https://vercel.com/dashboard), apri il progetto **chris**, e controlla che sotto *Deployments* sia comparso un nuovo deploy "Building..." o "Ready". Se è così, non devi fare altro: tra 1-2 minuti il sito live è aggiornato.

**Opzione B — manuale, da terminale:** se il collegamento automatico non è attivo (o vuoi forzare un deploy), da dentro la cartella del progetto:
```bash
cd "/Users/fex/Progetti/Chris "
vercel --prod
```
La prima volta ti chiederà di confermare/collegare il progetto: scegli il progetto esistente **chris**, non crearne uno nuovo.

## 2. Come aggiungere foto vere

I punti dove andranno le foto sono già pronti nel codice — cerca i commenti tipo:
```html
<!-- Drop in the extraction-face photo, then uncomment:
<picture>...</picture>
-->
```
1. Metti il file immagine dentro `assets/images/` con il nome indicato nel commento (es. `hero-quarry.jpg`).
2. Cancella le righe `<!--` e `-->` che racchiudono il blocco `<picture>`, lasciando il resto.
3. Ripeti Passo 3 e Passo 4 sopra per pubblicare.

## 3. Come aggiungere il video di apertura

1. Metti i file in `assets/video/`:
   - `opening.mp4`
   - `opening.webm` (opzionale ma consigliato)
   - `opening-poster.jpg` (l'immagine mostrata prima che il video parta)
2. Nessuna modifica al codice necessaria — i percorsi sono già collegati.
3. Ripeti Passo 3 e Passo 4 per pubblicare.

## Comandi utili di controllo

```bash
git status              # cosa hai modificato, non ancora salvato
git log --oneline -5     # ultimi 5 aggiornamenti fatti
vercel ls                # elenco degli ultimi deploy su Vercel
```
