# Opravna obuvi a výroba klíčů Machalovi

Statický web + CMS podle architektury Crystal Valley: jeden veřejný `index.html`, oddělený `admin.html`, obsah v JSON souborech ve složce `data/`, ukládání přes Vercel funkci `/api/save` do GitHub repozitáře.

## Struktura

```
index.html      – celý veřejný web (jedna stránka, žádné routy)
admin.html      – administrace (login + záložky pro každou sekci)
css/            – style.css (web), admin.css (administrace)
js/             – main.js (render webu z JSON), admin.js (logika CMS)
data/           – veškerý obsah webu (hero, about, services, why, pricing,
                  gallery, faq, reviews, contact, footer, seo)
assets/         – obrázky (sem admin nahrává fotky)
api/save.js     – Vercel serverless funkce, commituje do GitHubu
```

## Nasazení (Vercel + GitHub)

1. Vytvořte GitHub repozitář (např. `machalovi-web`) a nahrajte do něj celý obsah této složky.
2. Na Vercelu importujte repozitář (Framework preset: **Other**, žádný build).
3. V **Settings → Environment Variables** nastavte:
   - `GH_TOKEN` – GitHub token s právem zápisu do repozitáře (fine-grained: Contents → Read and write). **Token existuje jen zde, nikdy ve frontendu.**
   - `GH_OWNER` – vlastník repozitáře (např. `PetrBroz-ofc`)
   - `GH_REPO`  – název repozitáře (např. `machalovi-web`)
4. V `js/main.js` a `js/admin.js` upravte konstanty `GH_OWNER` / `GH_REPO` (nebo je nastavte v adminu v záložce **Nastavení** – ukládají se do localStorage).

## Administrace

- Otevřete `/admin.html`.
- Výchozí přihlášení: **admin / machalovi2026** (změňte v záložce Nastavení).
- Každá sekce webu má vlastní záložku; ukládá se tlačítkem 💾. Seznamy (služby, ceník, galerie, FAQ, recenze) podporují přetahování pro změnu pořadí.
- Nahrané obrázky se ukládají do složky `assets/` v repozitáři.

Pozn.: Ukládání a upload fungují až na nasazeném webu (potřebují `/api/save`). Lokálně web funguje jen pro čtení.

## Demo obsah

Texty, telefon, e-mail a adresa v `data/*.json` jsou ukázkové – před spuštěním je upravte v administraci.
