# DESIGN.md — Estado Atual Observado

Extraído do código em 2026-11-24; valores **OBSERVADOS**, não decisões finais.

## Paleta de Cores (`app/static/styles.css`, linhas 1–16)
- `--bg`: `#f4f7f9`
- `--surface`: `#ffffff`
- `--surface-muted`: `#f8fafc`
- `--border`: `#e2e8f0`
- `--text`: `#0f172a`
- `--text-muted`: `#475569`
- `--primary`: `#0f766e` (verde-petróleo — fora das cores da bandeira de Alagoas)
- `--primary-hover`: `#115e59`
- `--primary-soft`: `#ccfbf1`
- `--accent`: `#0284c7`
- `--danger`: `#dc2626` / `--danger-hover`: `#b91c1c`
- `.pill` (`styles.css:243`): fundo `#e0f2fe`, texto `#0369a1`

## Tipografia (`app/static/styles.css`, linhas 22–65)
- Família: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif` (sem webfont explícita carregada)
- `h1`: `26px`, peso `700`
- `h2`: `20px`
- `h3` (`.card-title`): `16px`, peso `700`
- Corpo: `14px`, `line-height: 1.5`
- Labels: `12px`, `uppercase`, `letter-spacing: 0.03em`

## Espaçamento, Raios e Sombras (`app/static/styles.css`)
- Container máximo: `1120px`, padding lateral `16px`
- `--radius`: `12px` (cards/painéis), `8px` (botões/inputs), `999px` (pills/chips)
- `--shadow`: `0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)`
- Grid de filtros: `1.2fr 1.2fr 1fr`, quebra em `820px`
- Grid de cards: `repeat(auto-fill, minmax(320px, 1fr))`, `gap: 16px`

## Movimento e Efeitos Existentes
- `.btn` (`styles.css:93`): `transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease` e `:active { transform: translateY(1px) }`
- Sem `prefers-reduced-motion` definido `[observado]`

## Tom Visual Observado `[inferido]`
- Visual limpo e funcional, porém genérico ("cara de dashboard/template padrão em teal"), sem identidade alagoana, sem banner institucional e sem recursos geográficos.

## Inconsistências Observadas
1. Cores hardcoded fora de `:root` em `.pill` (`#e0f2fe`, `#0369a1`) e `.topbar` (`#0f766e` → `#0d9488`).
2. `styles.css` usa `outline: 2px solid rgba(...)` apenas em `input:focus` e `select:focus`, sem `:focus-visible` explícito em botões, links e chips (impacta acessibilidade por teclado).
3. Falta `@media (prefers-reduced-motion: reduce)`.
