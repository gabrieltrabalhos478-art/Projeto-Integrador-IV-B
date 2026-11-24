# Relatório Antes / Depois (`M-17`)

Data: 2026-11-24

| Área / Métrica | Antes (2026-11-24) | Depois (2026-11-24) | Resultado |
| :--- | :--- | :--- | :--- |
| **Testes automatizados (`pytest -v`)** | `16 passed` | `16 passed` (1,38s) | **Passa** (zero regressão) |
| **Endpoints protegidos do P.I.** | `/cities`, `/cities/{id}`, `/vaccination-points/{cityId}`, `/health` | Intactos (`latitude`/`longitude` aditivos) | **Protegido** |
| **Coordenadas reais (CNES)** | `0 / 895` | `895 / 895` | **Resolvido** |
| **Identidade visual** | Teal genérico sem introdução | Banner institucional Alagoas + `bandeira-alagoas.png` + introdução curta | **Resolvido** |
| **Geolocalização, mapa, modais, favs, share** | Inexistentes | `navigator.geolocation`, posto mais próximo, Leaflet/OSM, tempos (a pé, carro, bike, ônibus), favoritos e compartilhamento | **Resolvido** |
| **Acessibilidade WCAG 2.1 AA** | Sem `:focus-visible`, `skip-link`, `reduced-motion` | Contraste AA (≥ 6,4:1), `:focus-visible` 3px, `skip-link`, `aria-pressed`, `aria-live`, alternativa em lista ao mapa, `prefers-reduced-motion` | **Resolvido** |
| **Gate Anti-"Cara de IA" (`P-13`)** | `não passa` | **`passa`** (`docs/anti-ia.md`) | **Passa** |

*Nota:* Métricas de Core Web Vitals em navegador headless (`playwright-cli`) permanecem `não medidas` por ausência do executor instalado localmente.
