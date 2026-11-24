# Projeto: Portal & API de Pontos de Vacinação — Alagoas

## Contexto
API REST e Portal Web somente-leitura para consulta de municípios (102) e Unidades Básicas de Saúde (895) em Alagoas, com Painel Administrativo protegido por senha para CRUD de pontos `[inferido: app/main.py, README.md]`.
- **Stack:** Python 3.14, FastAPI, Uvicorn, Pydantic v2, `psycopg[binary]` (PostgreSQL/Supabase via `DATABASE_URL`), SQLite (`DB_PATH` local/testes), HTML/CSS/JS vanilla em `app/static/`, `pytest` `[inferido: requirements.txt, app/database.py]`.
- **Estado:** No ar em https://projeto-integrador-iv-b.onrender.com (Render + Supabase).
- **Variáveis de ambiente (apenas nomes):** `DATABASE_URL`, `DB_PATH`, `ADMIN_PASSWORD`, `SECRET_KEY`, `CORS_ORIGINS`, `PORT`.
- **Comandos:**
  - Rodar local: `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload`
  - Seed local: `.\.venv\Scripts\python.exe scripts/seed.py`
  - Testar: `.\.venv\Scripts\python.exe -m pytest -v`

## O que não pode mudar
- Endpoints obrigatórios do P.I. IV-B (`GET /cities`, `GET /cities/{id}`, `GET /vaccination-points/{cityId}`, `GET /health`) com seus contratos JSON e status codes (`200`, `400 INVALID_ID`, `404 CITY_NOT_FOUND`, `500 INTERNAL_ERROR`) `[confirmado pelo usuário]`.
- Rotas existentes (`/`, `/admin`, `/docs`, `/api/admin/*`) e persistência no Supabase `[confirmado pelo usuário]`.
- Acessibilidade **WCAG 2.1 AA** (contraste, teclado, foco visível, rótulos, alternativa acessível ao mapa, `prefers-reduced-motion`) `[confirmado pelo usuário]`.
- Painel Admin (`/admin`) mantido funcional sem redesign `[confirmado pelo usuário]`.

## Convenções observadas
- **Arquitetura em camadas:** `routers → services → repositories → database` (`app/routers/`, `app/services/`, `app/repositories/`, `app/database.py`) `[inferido: docs/architecture.md]`.
- **Front-end:** HTML/CSS/JS puro em `app/static/` servido pelo FastAPI via `StaticFiles` e `FileResponse`, sem build step Node/React `[inferido: app/main.py]`.
- **Erros:** Envelope único `{"error": {"code": ..., "message": ...}}` (`app/errors.py`).
- Estas convenções vencem qualquer skill externa.

## Precedência
1. Restrições do usuário e "O que não pode mudar" (inclui WCAG 2.1 AA)
2. Pedido atual (`M11` + `M5` + `M2/M3`: introdução, geolocalização, mapa com modais, favoritos, compartilhamento, banner institucional e tema bandeira de Alagoas)
3. `DESIGN.md` e convenções existentes
4. Skill mestre / skills de revisão (`accessibility`, `frontend-a11y`, `no-ai-slop`, `vibe-security`)
5. Qualidade (vence a estética)
6. Economia

## Regras
- **Tipo de intervenção atual:** `M11` + `M5` + `M2/M3`.
- Nada de publicar sem aprovação explícita do usuário.
- Uma camada por vez, com aprovação e commits pequenos/reversíveis.
- Rodar o gate anti-"cara de IA" (`P-13`) no diagnóstico, após cada camada visual/funcional e no final.
- Sempre que houver referência (efeito, modal, menu, transição), mostrar a escolha de vídeo de referência (`P-14`).
- Pedidos de ajuste visual seguem o `P-15` (classificar, agrupar em lote, registrar em `docs/ajustes.md` e não sair da camada).
- Tipografia, disposição, tipo de item e componentes seguem `docs/escolhas.md` (`P-16`).
- Nenhum elemento visual novo/alterado sem referência aprovada em `docs/refs/mapa-elementos.md` (`P-17`).
- Nenhum efeito novo/alterado sem propósito, fallback (`prefers-reduced-motion`) e referência aprovada em `docs/refs/mapa-efeitos.md` (`P-18`).
- Nenhum segredo em arquivo versionado.
