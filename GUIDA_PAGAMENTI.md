# Guida alla Configurazione dei Pagamenti (Stripe & PayPal)

Questa guida spiega come configurare correttamente le credenziali di sviluppo (test) e produzione (live) per abilitare i pagamenti sul portale Kudjo.

---

## 1. 💳 Configurazione di Stripe

Stripe gestisce i pagamenti con carta di credito, Google Pay e Apple Pay. 

### A. Ottenere le Chiavi API
1. Accedi al [Dashboard di Stripe](https://dashboard.stripe.com/).
2. Attiva la modalità **"Test Mode"** (in alto a destra) per ottenere le chiavi di sviluppo.
3. Vai in **Developers -> API Keys**.
4. Copia le seguenti chiavi e incollale nel file `.env.local` locale o nelle variabili d'ambiente di Vercel:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (es. `pk_test_...`)
   - `STRIPE_SECRET_KEY` (es. `sk_test_...`)

### B. Configurare il Webhook (Fondamentale per accreditare le buste!)
Il webhook permette a Stripe di informare il nostro server quando un pagamento è andato a buon fine.

#### Per lo Sviluppo Locale (Localhost):
1. Scarica la [Stripe CLI](https://docs.stripe.com/stripe-cli).
2. Effettua il login digitando nel terminale:
   ```bash
   stripe login
   ```
3. Avvia il reindirizzamento dei webhook verso il tuo server locale:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. La CLI ti restituirà una chiave segreta del tipo `whsec_...`. Copiala e inseriscila nel file `.env.local` come `STRIPE_WEBHOOK_SECRET`.

#### Per la Produzione (Vercel/Live):
1. Nel Dashboard di Stripe, vai in **Developers -> Webhooks**.
2. Clicca su **Add endpoint**.
3. Inserisci come URL del tuo sito: `https://tuo-dominio.com/api/webhooks/stripe`.
4. In **Select events**, seleziona: `checkout.session.completed`.
5. Clicca su **Add endpoint**.
6. Copia il "Signing secret" (`whsec_...`) e inseriscilo nelle impostazioni delle variabili d'ambiente su Vercel come `STRIPE_WEBHOOK_SECRET`.

---

## 2. 💛 Configurazione di PayPal

PayPal gestisce gli acquisti tramite account PayPal e pagamento rapido Express Checkout.

### A. Ottenere le Chiavi API (Sandbox / Live)
1. Accedi a [PayPal Developer Portal](https://developer.paypal.com/).
2. Vai in **Apps & Credentials**.
3. Crea una nuova app cliccando su **Create App** (seleziona *Platform* come tipologia se richiesto, o *REST API App* standard).
4. Scegli un nome (es. `Kudjo TCG`) e creala.
5. Inserisci le credenziali di test nel file `.env.local`:
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (Client ID)
   - `PAYPAL_CLIENT_SECRET` (Secret Key)

### B. Passaggio in Produzione (Live)
1. Nel portale PayPal Developer, sposta lo switch in alto da **Sandbox** a **Live**.
2. Copia il Client ID e il Secret reali e incollali nelle variabili d'ambiente di Vercel.

---

## 📝 Riepilogo Variabili d'Ambiente (.env)

Aggiungi o aggiorna queste chiavi in produzione (su Vercel) o in locale (`.env.local`):

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://ivedfxqjaefofqtywdvj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # Necessaria per far scrivere le API di webhook bypassando la RLS

# STRIPE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PAYPAL
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```
