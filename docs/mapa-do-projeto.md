# Mapa do Projeto (`M-1`)

Data: 2026-11-24

## 1. Páginas e Endpoints (URLs)
- `GET /` → Portal Público (`app/static/index.html`)
- `GET /admin` → Painel Administrativo (`app/static/admin.html`)
- `GET /docs` → Swagger UI (FastAPI)
- `GET /health` → Health check (`{"status": "ok"}`)
- `GET /cities` → Lista dos 102 municípios (`app/routers/cities.py`)
- `GET /cities/{id}` → Detalhe do município (`app/routers/cities.py`)
- `GET /vaccination-points/{cityId}` → Pontos de vacinação da cidade (`app/routers/vaccination_points.py`)
- `POST /api/admin/login` → Autenticação admin (`app/routers/admin.py`)
- `POST /api/admin/vaccination-points` → Criar ponto (`app/routers/admin.py`)
- `PUT /api/admin/vaccination-points/{point_id}` → Atualizar ponto (`app/routers/admin.py`)
- `DELETE /api/admin/vaccination-points/{point_id}` → Remover ponto (`app/routers/admin.py`)
- `/static/*` → Arquivos estáticos (`app/static/`)

## 2. Stack e Dependências (`requirements.txt`)
- `fastapi>=0.115.0,<1.0.0`, `uvicorn[standard]>=0.32.0,<1.0.0`, `pydantic>=2.10.0,<3.0.0`, `psycopg[binary]>=3.2.0,<4.0.0`, `pytest>=8.3.0,<9.0.0`, `httpx>=0.27.0,<1.0.0`.
- Todas as dependências estão em uso (`httpx` usado em `scripts/fetch_data.py` e `TestClient`).

## 3. Estilos e Tokens
- `app/static/styles.css` (CSS puro com variáveis em `:root`, sem Tailwind/build).
- Fontes: system stack (sem webfont carregada).

## 4. Formulários e Destinos
- `#loginForm` (`app/static/admin.html:34`) → `POST /api/admin/login` (token em `sessionStorage`).
- `#pointForm` (`app/static/admin.html:66`) → `POST /api/admin/vaccination-points` ou `PUT /api/admin/vaccination-points/{id}`.

## 5. Integrações e Banco
- **Banco:** PostgreSQL/Supabase (`DATABASE_URL`) em produção; SQLite (`vaccination.db`) local/testes (`app/database.py`).
- **Fontes de dados (`scripts/fetch_data.py`):** IBGE Localidades (`UF=27`) e CNES Dados Abertos (`codigo_tipo_unidade=2`). *Nota:* O CNES retorna `latitude_estabelecimento_decimo_grau` e `longitude_estabelecimento_decimo_grau`, hoje não salvos em `data/vaccination_points.csv`.
- **Mapas/Analytics:** Nenhuma integração de mapa ou rastreamento (analytics/pixels) existe hoje.

## 6. Mídia Existente
- `image.png` na raiz (30.564 bytes) — Bandeira oficial de Alagoas fornecida pelo usuário para o banner institucional.
- Nenhuma imagem referenciada em `app/static/` atualmente.

## 7. Pontos Frágeis Notados
1. `data/vaccination_points.csv` e tabela `vaccination_points` ainda não armazenam `latitude` e `longitude` (necessários para distância real, posto mais próximo, mapa e tempo por modal).
2. `app/static/styles.css` não possui `:focus-visible` global nem `@media (prefers-reduced-motion: reduce)` (WCAG 2.1 AA).
3. `app/static/index.html` não possui *skip link* ("Ir para o conteúdo principal"), meta `description` SEO nem `og:title`/`og:description`.
