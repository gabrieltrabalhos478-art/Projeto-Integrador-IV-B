# API REST — Pontos de Vacinação (Alagoas)

API REST somente leitura desenvolvida para o **Projeto Integrador IV-B (CESMAC)** — disciplinas de **Arquitetura de Sistemas** e **Integração de Aplicações**.

Fornece consulta aos **102 municípios de Alagoas** e a **895 Unidades Básicas de Saúde (UBSs)** ativas no SUS.

- **Documentação interativa (Swagger):** https://projeto-integrador-iv-b.onrender.com/docs
- **Arquitetura e decisões:** [docs/architecture.md](docs/architecture.md)
- **URL da API online:** https://projeto-integrador-iv-b.onrender.com

---

## Stack Utilizada

- **Python 3.11+** (testado em 3.14)
- **FastAPI** + **Uvicorn**
- **Pydantic v2**
- **SQLite** (`sqlite3` da biblioteca padrão)
- **pytest** + **httpx** (`TestClient`)

---

## Como Rodar Localmente (Windows / PowerShell)

```powershell
# 1. Criar e ativar ambiente virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Criar/popular o banco SQLite a partir dos CSVs versionados
python scripts/seed.py

# 4. Iniciar o servidor
uvicorn app.main:app --reload
```

A API ficará disponível em `http://127.0.0.1:8000` (Swagger em `http://127.0.0.1:8000/docs`).

---

## Como Rodar os Testes

```powershell
pytest -v
```

Os testes utilizam um banco SQLite temporário (`tmp_path`), sem alterar o arquivo `vaccination.db` local.

---

## Endpoints Disponíveis

### `GET /health`
Verifica se a API está operante.
```json
{ "status": "ok" }
```

### `GET /cities`
Lista os 102 municípios de Alagoas.
```json
[
  { "id": 1, "name": "Anadia", "ibge_code": 2700201 },
  { "id": 2, "name": "Arapiraca", "ibge_code": 2700300 }
]
```

### `GET /cities/{id}`
Retorna os detalhes de uma cidade e a quantidade de pontos cadastrados.
```json
{
  "id": 46,
  "name": "Maceió",
  "state": "AL",
  "ibge_code": 2704302,
  "vaccination_points_count": 73
}
```

### `GET /vaccination-points/{cityId}`
Lista os pontos de vacinação de uma cidade (retorna `[]` caso a cidade exista e não possua pontos).
```json
[
  {
    "id": 189,
    "city_id": 1,
    "name": "USF TAPERA",
    "address": "POVOADO TAPERA, 1",
    "neighborhood": "ZONA RURAL",
    "phone": "( )",
    "opening_hours": "ATENDIMENTOS NOS TURNOS DA MANHA E A TARDE",
    "vaccines": ["BCG", "Hepatite B", "Penta (DTP+Hib+HB)"]
  }
]
```

### Padrão de Erros (JSON)
- `400 INVALID_ID` — ID não numérico, zero ou negativo.
- `404 CITY_NOT_FOUND` — Cidade não encontrada.
- `500 INTERNAL_ERROR` — Erro interno inesperado.

```json
{
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "Cidade com id 99999 não encontrada."
  }
}
```

---

## Fontes de Dados e Limitações

Detalhes completos em [data/README.md](data/README.md):
- **Municípios:** API de Localidades do IBGE (UF `27` — Alagoas).
- **Pontos de Vacinação:** API Dados Abertos do Ministério da Saúde / CNES (`codigo_tipo_unidade = 2`, unidades ativas com atendimento SUS).
- **Limitação (`vaccines`):** O CNES não informa estoque de vacinas por unidade; portanto, o campo `vaccines` apresenta a lista padrão do calendário básico do PNI (**dado ilustrativo, baseado no calendário básico**).

---

## Autores
- Integrante 1 *(preencher)*
- Integrante 2 *(preencher)*
