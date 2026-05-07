# Spoki Claude Proxy — Vercel

Piccolo proxy serverless che inoltra le richieste dell'app Spoki Meeting Agent verso l'API di Claude (Anthropic), tenendo la API key lato server.

## Struttura

```
vercel-proxy/
├── api/
│   └── claude.js     ← funzione serverless (endpoint POST /api/claude)
├── package.json
├── vercel.json
└── README.md
```

## Come si deploya

Vedi la guida `SETUP-VERCEL.md` nella cartella superiore (parente di questa).

## Variabile d'ambiente richiesta

| Nome | Valore |
|------|--------|
| `ANTHROPIC_API_KEY` | la tua API key di Anthropic, formato `sk-ant-...` |

Da configurare in **Vercel → Project → Settings → Environment Variables** (Production + Preview).

## Endpoint

Una volta deployato, l'endpoint sarà:

```
https://<nome-progetto>.vercel.app/api/claude
```

Quel URL va incollato nell'app `app-claude.html` nel campo "Worker URL" / "Proxy URL".
