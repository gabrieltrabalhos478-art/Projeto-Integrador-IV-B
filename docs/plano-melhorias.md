# Plano de Melhorias em Camadas (`M-4`)

Data: 2026-11-24
Objetivo: Evoluir o Portal (`/`) com banner institucional de Alagoas, tema da bandeira (WCAG AA), introdução curta, geolocalização + posto mais próximo, mapa com tempo por modal (a pé, carro, outros), favoritos e compartilhamento — mantendo 100% intactos os 3 endpoints `GET` do P.I., `/health`, `/admin` e Supabase.

---

## Camada 1 — Dados Geográficos (`lat`/`lng` do CNES) + Segurança & Base WCAG
- **Itens:**
  1. Atualizar `scripts/fetch_data.py` para incluir `latitude` e `longitude` reais do CNES em `data/vaccination_points.csv` (mantendo fallback `null` se ausente).
  2. Atualizar `scripts/seed.py`, `app/repositories/vaccination_point_repository.py`, `app/schemas/vaccination_point.py` e `app/services/vaccination_point_service.py` para expor `latitude: float | None = None` e `longitude: float | None = None` (aditivo, não quebra o contrato existente) e garantir migração segura de colunas no PostgreSQL/Supabase (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) caso o banco já esteja populado.
  3. Base WCAG AA em `styles.css`: `:focus-visible` de alto contraste em todos os controles interativos, `@media (prefers-reduced-motion: reduce)` e `skip-link`.
- **Impacto:** Alto | **Esforço:** Médio | **Risco:** Baixo (aditivo).
- **Reversão:** `git revert` do commit da camada; colunas `latitude`/`longitude` opcionais não afetam leitores antigos.
- **Métrica de sucesso:** `pytest -v` 100% verde + pontos com coordenadas reais carregados no banco.

## Camada 2 — Identidade Alagoas (Banner Institucional + Tema Bandeira WCAG AA + Introdução)
- **Itens:**
  1. Copiar `image.png` para `app/static/bandeira-alagoas.png` com `alt="Bandeira do Estado de Alagoas"`.
  2. Criar **banner institucional no topo** inspirado em portais públicos de Alagoas (faixa superior institucional + cabeçalho com a bandeira de Alagoas, paleta **azul `#004A99`**, **vermelho `#B91C1C`** e **branco `#FFFFFF`** com contraste >= 4.5:1 validado).
  3. Adicionar **introdução curta** (2–3 linhas objetivas) explicando como encontrar o posto mais próximo e consultar vacinas.
  4. Organizar hierarquia visual dos cartões (resumo limpo das vacinas sem poluição, mantendo acesso completo).
- **Impacto:** Alto | **Esforço:** Médio | **Risco:** Baixo.
- **Reversão:** Commit isolado em `app/static/`.
- **Métrica de sucesso:** Contraste WCAG AA >= 4.5:1 e gate `P-13` pós-camada sem sinais altos/médios.

## Camada 3 — Geolocalização, Mapa Interativo, Tempos por Modal, Favoritos e Compartilhamento
- **Itens:**
  1. **Geolocalização ("Usar minha localização"):** usa `navigator.geolocation`, calcula distância (Haversine) até os postos com coordenadas, ordena e destaca o **Posto Mais Próximo**.
  2. **Mapa Interativo (Leaflet + OpenStreetMap):** exibe marcador do usuário e marcadores das UBSs filtradas; ao selecionar um posto (ou no posto mais próximo), exibe **tempo estimado por modal** — **A pé** (~5 km/h / rota OSRM), **Carro** (~35–40 km/h / rota OSRM) e **Bicicleta / Transporte público** — com fallback determinístico caso a API externa de rotas esteja indisponível + botão "Abrir rota no Google Maps".
  3. **Alternativa acessível ao mapa (WCAG AA):** lista estruturada com distância e tempos legível por leitor de tela e navegável por teclado.
  4. **Favoritar (`localStorage`):** botão acessível (`aria-pressed`) para salvar/remover postos favoritos + filtro rápido "Apenas favoritos".
  5. **Compartilhar:** botão por posto usando `navigator.share` (Web Share API) com fallback para copiar link/resumo ou abrir WhatsApp.
- **Impacto:** Muito Alto | **Esforço:** Médio/Alto | **Risco:** Médio (dependência de CDN Leaflet/tiles OSM; mitigado com fallback em lista).
- **Reversão:** Commit isolado da Camada 3.
- **Métrica de sucesso:** Testes funcionais de geolocalização simulada, favoritos, compartilhamento e teclado passando.

## Camada 4 — Verificação Final (`M-17`) e Entrega (`M-18`)
- Revisão de segurança (`vibe-security`), regressão `pytest -v`, verificação WCAG AA + `P-13` final, atualização de `docs/antes-depois.md`, `docs/melhorias.md`, `CLAUDE.md`, `DESIGN.md`, e **publicação no GitHub/Render apenas após sua aprovação explícita**.

## Itens Adiados (`docs/backlog.md`)
- Remoção de `onclick` inline na tabela do `/admin` (mantido fora do escopo atual por decisão do usuário).
