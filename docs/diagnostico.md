# Diagnóstico (`M-3`)

Data: 2026-11-24
Fontes de auditoria: `accessibility` / `frontend-a11y` (WCAG 2.2 AA) + `make-interfaces-feel-better` / `no-ai-slop` + `P-13` (gate anti-"cara de IA").

| # | Achado | Evidência | Categoria | Severidade | Impacto | Esforço | Toca "Não Pode Mudar"? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Tabela `vaccination_points` e CSV sem `latitude`/`longitude` | `scripts/seed.py:21-30`, `data/vaccination_points.csv` | TÉCNICO | **Crítico** | Impede calcular distância real, posto mais próximo, mapa e tempo por modal | Médio | Não (campos extras opcionais não quebram contratos `GET` existentes) |
| 2 | Ausência de `:focus-visible` global, `skip-link` e `prefers-reduced-motion` | `app/static/styles.css:113-118`, `app/static/index.html:10` | QUALIDADE (WCAG AA) | **Alto** | Usuários de teclado e sensíveis a movimento ficam sem indicador claro de foco ou redução de animação | Baixo | Reforça restrição obrigatória WCAG AA |
| 3 | Sem introdução explicando a função do portal antes dos filtros | `app/static/index.html:12-27` | CONTEÚDO / ESTRUTURA | **Alto** | Visitante cai direto nos selects sem entender o propósito do portal | Baixo | Não |
| 4 | Tema genérico em verde-petróleo (`#0f766e`) sem identidade de Alagoas | `app/static/styles.css:7-9, 36` | MARCA / CARA DE IA | **Alto** | Visual genérico de template; não reflete a bandeira de Alagoas nem o banner institucional pedido | Médio | Não |
| 5 | Falta geolocalização, mapa, tempos por modal, favoritos e compartilhamento | `app/static/index.html`, `app/static/app.js` | ESTRUTURA / FUNCIONALIDADE | **Alto** | Funcionalidade principal pedida pelo usuário não existe ainda | Alto | Não |
| 6 | Tags de vacinas sem limite/agrupamento no cartão (14 tags repetidas em toda UBS) | `app/static/app.js:110-114` | ACABAMENTO / CARA DE IA | **Médio** | Poluição visual e cartões altos demais no celular | Baixo | Não |
| 7 | Falta `meta description` e Open Graph no `index.html` | `app/static/index.html:1-8` | QUALIDADE (SEO) | **Médio** | Compartilhamento de links fica sem título/descrição estruturados | Baixo | Não |
| 8 | Botões de ação na tabela do Admin usam `onclick="..."` inline | `app/static/admin.js:128-129` | TÉCNICO | **Baixo** | Mantido no `/admin` por decisão de não redesenhar Admin (anotado no backlog) | Baixo | Sim (Admin mantido) |
