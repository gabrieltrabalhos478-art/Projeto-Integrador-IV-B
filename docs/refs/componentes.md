# Inventário de Componentes e Dependências (`docs/refs/componentes.md`)

Extraído de `requirements.txt` e `app/static/` em 2026-11-24.

| Nome | Versão | Onde aparece | Licença |
| :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.115.0,<1.0.0` | `app/main.py`, `app/routers/*` | MIT `[confirmar]` |
| `uvicorn[standard]` | `>=0.32.0,<1.0.0` | `render.yaml`, execução local | BSD-3-Clause `[confirmar]` |
| `pydantic` | `>=2.10.0,<3.0.0` | `app/schemas/*` | MIT `[confirmar]` |
| `psycopg[binary]` | `>=3.2.0,<4.0.0` | `app/database.py` | LGPL-3.0 `[confirmar]` |
| `pytest` / `httpx` | `>=8.3.0` / `>=0.27.0` | `tests/*`, `scripts/fetch_data.py` | MIT / BSD `[confirmar]` |
| HTML/CSS/JS Vanilla | — | `app/static/*` | Próprio |
