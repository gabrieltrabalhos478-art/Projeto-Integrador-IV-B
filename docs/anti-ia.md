# Gate Anti-"Cara de IA" (`docs/anti-ia.md`)

## Momento: `diagnóstico` (2026-11-24)
Alvo: Portal Público (`app/static/index.html`, `styles.css`, `app.js`).

| Sinal | Camada | Onde | Evidência | Severidade | Correção | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Paleta padrão de dashboard em teal (`#0f766e` / `#0d9488`) sem identidade local | VISUAL | `styles.css:7, 36` | Degradê teal genérico no `.topbar` | **Alta** | Aplicar tema institucional da Bandeira de Alagoas (vermelho, branco, azul) com contraste WCAG AA e usar `image.png` | Pendente |
| Ausência de elementos específicos da marca/serviço na primeira dobra (sem banner institucional nem introdução clara) | ESPECIFICIDADE | `index.html:12-27` | Vai direto do título para os 3 selects | **Alta** | Adicionar banner institucional estilo Governo de Alagoas + introdução curta e objetiva | Pendente |
| Grade de cartões idênticos com 14 badges repetidas idênticas por card | VISUAL | `app.js:110-114` | Todas as UBSs exibem 14 `.vaccine-tag` iguais | **Média** | Resumir vacinas no card (ex.: contagem + expansível/modal ou primeiras + "+N vacinas") e destacar distância/favorito/compartilhar | Pendente |
| Botões, links e chips sem `:focus-visible` e sem `prefers-reduced-motion` | CÓDIGO / A11Y | `styles.css:93, 113` | Apenas `input:focus` e `select:focus` estilizados | **Alta** | Padronizar `:focus-visible` 3px de alto contraste e `@media (prefers-reduced-motion: reduce)` | Pendente |
| Metadados SEO/compartilhamento ausentes | CÓDIGO | `index.html:4-7` | Sem `<meta name="description">` nem Open Graph | **Média** | Adicionar meta description e tags Open Graph específicas de Alagoas | Pendente |

**Veredito (`diagnóstico`):** **`não passa`** (3 sinais altos e 2 médios pendentes).
*Nota:* Painel Admin (`/admin`) não entra no escopo de redesign por decisão explícita do usuário ("o admin não precisa tanto").

---

## Momento: `final` (2026-11-24)
Alvo: Portal Público (`app/static/index.html`, `styles.css`, `app.js`).

| Sinal | Camada | Onde | Evidência | Severidade | Correção Aplicada | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Paleta genérica em teal | VISUAL | `styles.css:1-20` | Degradê teal substituído por paleta Bandeira de Alagoas | **Alta** | Azul `#003875`/`#004A99` + Vermelho `#B91C1C` + Branco `#FFFFFF` com contraste AA | **Resolvido** |
| Falta de especificidade na primeira dobra | ESPECIFICIDADE | `index.html:18-62` | Faixa institucional, filete tricolor, `bandeira-alagoas.png` e introdução curta | **Alta** | Adicionados banner institucional de Alagoas e introdução clara | **Resolvido** |
| 14 badges repetidas por card | VISUAL | `app.js:322-350` | Resumo de 4 vacinas + `<details>` expansível | **Média** | Cartões limpos com ação de mapa, favoritar e compartilhar | **Resolvido** |
| Sem `:focus-visible` e `prefers-reduced-motion` | CÓDIGO / A11Y | `styles.css:40-49, 643-650` | Foco visível 3px global, `skip-link`, alvos ≥ 44px e `reduced-motion` | **Alta** | Implementados e validados no CSS/HTML | **Resolvido** |
| Metadados SEO ausentes | CÓDIGO | `index.html:6-9` | `<meta name="description">` e Open Graph adicionados | **Média** | Metadados específicos de Alagoas adicionados | **Resolvido** |

**Veredito (`final`):** **`passa`** (0 sinais altos ou médios pendentes).
