# Estado Inicial (`M-0`)

- **Data:** 2026-11-24
- **URL em produção:** https://projeto-integrador-iv-b.onrender.com
- **Repositório:** https://github.com/gabrieltrabalhos478-art/Projeto-Integrador-IV-B
- **Pasta local:** `c:\Users\Luiz\Documents\gabriel\P.I`
- **Branch base / Tag de snapshot:** `main` (`7dc1852`) · Tag `v1.1.0-pre-melhoria`
- **Branch de trabalho:** `feat/portal-alagoas-mapa`
- **Stack:** Python 3.14, FastAPI, Uvicorn, Pydantic v2, `psycopg[binary]` (PostgreSQL/Supabase via `DATABASE_URL` em produção), SQLite (local/testes), HTML/CSS/JS vanilla (`app/static/`), `pytest` (16 testes).
- **Hospedagem e Banco:** Render (Free Web Service) + Supabase (PostgreSQL via Session Pooler).
- **Ambiente de teste:** Local (`.venv` + `pytest -v` com SQLite temporário via `tmp_path` e servidor local `uvicorn`).
- **Como publicar:** Push na branch `main` (apenas após aprovação explícita do usuário).

## NÃO PODE MUDAR (Protegido)
1. Endpoints obrigatórios do P.I. IV-B e seus contratos JSON / status codes (`200`, `400 INVALID_ID`, `404 CITY_NOT_FOUND`, `500 INTERNAL_ERROR`):
   - `GET /cities`
   - `GET /cities/{id}`
   - `GET /vaccination-points/{cityId}`
   - `GET /health`
2. Rotas existentes: `/` (Portal), `/admin` (Painel Admin), `/docs` (Swagger), `/api/admin/*`.
3. Persistência no Supabase (`DATABASE_URL`) e funcionamento do seed idempotente.
4. Conformidade com **Acessibilidade WCAG 2.1 AA** (contraste nas cores da bandeira de Alagoas, teclado, foco visível, `aria-labels`, alternativa acessível ao mapa, `prefers-reduced-motion`).
5. Painel Admin (`/admin`) mantido funcional sem necessidade de redesign.
