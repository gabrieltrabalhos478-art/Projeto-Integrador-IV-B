# Baseline (`M-2`)

Data: 2026-11-24
Ferramentas utilizadas: medição direta dos arquivos estáticos (`Get-Item`), suíte automatizada (`pytest -q`, 16 testes) e auditoria manual de código (`accessibility`, `frontend-a11y`, `make-interfaces-feel-better`).

| Área | Métrica | Valor Antes (2026-11-24) | Observação |
| :--- | :--- | :--- | :--- |
| **Peso Portal (`/`)** | HTML + CSS + JS | `15.192 bytes` (~14,8 KB) | `index.html` (2.403 B) + `styles.css` (7.608 B) + `app.js` (5.181 B) |
| **Peso Admin (`/admin`)** | HTML + CSS + JS | `21.366 bytes` (~20,9 KB) | `admin.html` (5.079 B) + `styles.css` (7.608 B) + `admin.js` (8.679 B) |
| **Mídia (`image.png`)** | Bandeira de Alagoas | `30.564 bytes` (~29,8 KB) | Ainda não vinculada ao HTML |
| **Testes Automatizados** | `pytest -q` | `16 passed` (1,22s) | API REST, erros JSON, Portal HTML e CRUD Admin |
| **Core Web Vitals (LCP/CLS/INP)** | Medição em navegador | `Não medido` | Sem executor headless (`playwright-cli`/`agent-browser`) instalado nesta fase |
| **Acessibilidade (WCAG AA)** | Auditoria estática | Gaps encontrados | Falta `:focus-visible` global, `skip-link`, `prefers-reduced-motion` e `aria-describedby`/regiões estruturadas |
| **Sinais "Cara de IA" (`P-13`)** | Diagnóstico inicial | `não passa` (3 altos, 3 médios) | Ver detalhes em [docs/anti-ia.md](anti-ia.md) |
