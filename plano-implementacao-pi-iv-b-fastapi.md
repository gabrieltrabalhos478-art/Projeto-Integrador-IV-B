# Plano de implementação — API REST de Pontos de Vacinação (Alagoas)

> **Como usar:** cole este arquivo inteiro na IA de código (Claude Code, Cursor, Copilot, etc.) e peça:
> *"Implemente este plano fase por fase. Ao fim de cada fase, rode os testes/comandos de verificação, me mostre o resultado e só então passe para a próxima. Não invente dados."*

---

## 1. Contexto

Projeto Integrador IV-B (CESMAC), disciplinas **Arquitetura de Sistemas** e **Integração de Aplicações**. Equipe de 2 pessoas.

**Objetivo:** fornecer uma **API REST** que lista pontos de vacinação, com escopo **somente no estado de Alagoas**.

**O que será avaliado (projeto vale 8 pontos):**
- Os 3 endpoints obrigatórios respondem corretamente, sempre em JSON.
- Códigos de status HTTP coerentes (200, 400, 404).
- Escopo de Alagoas coberto (cidades e pontos de vacinação).
- Decisões de arquitetura **documentadas** e padrões **justificados**.
- Entrega pelo Conecte-se com todos os integrantes (feita manualmente por mim, fora do código).

**Fora de escopo agora:** apresentação/slides. O foco é deixar a API **operante e online**.

---

## 2. Endpoints obrigatórios (contrato)

Apenas método **GET**.

| Endpoint | Descrição | Respostas |
|---|---|---|
| `GET /cities` | Lista as cidades disponíveis | 200 |
| `GET /cities/{id}` | Detalhes de uma cidade | 200, 400 (id não numérico), 404 (cidade inexistente) |
| `GET /vaccination-points/{cityId}` | Pontos de vacinação de uma cidade | 200 (lista, **pode ser `[]`** se a cidade existe e não tem pontos), 400, 404 (cidade inexistente) |

Endpoint extra: `GET /health` → `{"status": "ok"}` (usado para health check e ping de manter acordado).

### Exemplos de resposta (os campos podem ser ajustados conforme os dados reunidos)

`GET /cities`
```json
[
  { "id": 1, "name": "Maceió", "ibge_code": 2704302 },
  { "id": 2, "name": "Arapiraca", "ibge_code": 2700300 }
]
```

`GET /cities/1`
```json
{
  "id": 1,
  "name": "Maceió",
  "state": "AL",
  "ibge_code": 2704302,
  "vaccination_points_count": 12
}
```

`GET /vaccination-points/1`
```json
[
  {
    "id": 10,
    "city_id": 1,
    "name": "UBS Jacintinho",
    "address": "Rua Exemplo, 123",
    "neighborhood": "Jacintinho",
    "phone": null,
    "opening_hours": null,
    "vaccines": ["Pólio", "Sarampo"]
  }
]
```

### Formato único de erro

```json
{ "error": { "code": "CITY_NOT_FOUND", "message": "Cidade com id 999 não encontrada." } }
```

Códigos sugeridos: `CITY_NOT_FOUND` (404), `INVALID_ID` (400), `INTERNAL_ERROR` (500).

Regras:
- Todas as respostas, inclusive erros, são JSON.
- Id não numérico deve retornar **400** (não o 422 padrão do FastAPI): registrar um handler para `RequestValidationError` que devolva 400 no formato de erro acima.
- Cidade inexistente → 404. Cidade existente sem pontos → 200 com `[]`.

---

## 3. Stack

- **Python 3.11+**
- **FastAPI** + **Uvicorn**
- **SQLite** (módulo `sqlite3` da biblioteca padrão; SQLAlchemy só se achar que simplifica)
- **Pydantic** para os schemas de resposta
- **pytest** + `TestClient` do FastAPI
- Deploy no **Render** (Web Service gratuito)

Restrição importante: o disco do Render gratuito é **efêmero**. Como a API é somente leitura, o banco SQLite deve ser **recriado a cada deploy** por um script de seed a partir de arquivos versionados no Git (`data/*.csv`). Nada de depender de banco externo.

---

## 4. Estrutura de pastas (arquitetura em camadas)

```
.
├── app/
│   ├── main.py              # cria o app, registra routers e handlers de erro
│   ├── database.py          # conexão com o SQLite
│   ├── errors.py            # exceções de domínio e handlers (formato único de erro)
│   ├── routers/
│   │   ├── cities.py        # só mapeia URL + método e chama o service
│   │   └── vaccination_points.py
│   ├── services/            # regras de negócio (ex.: cidade existe? senão, 404)
│   │   ├── city_service.py
│   │   └── vaccination_point_service.py
│   ├── repositories/        # ÚNICO lugar que fala com o banco
│   │   ├── city_repository.py
│   │   └── vaccination_point_repository.py
│   └── schemas/             # modelos Pydantic (formato do JSON)
│       ├── city.py
│       └── vaccination_point.py
├── data/
│   ├── cities.csv           # municípios de Alagoas (fonte: IBGE)
│   └── vaccination_points.csv
├── scripts/
│   └── seed.py              # cria o banco a partir dos CSVs
├── tests/
│   ├── test_cities.py
│   ├── test_vaccination_points.py
│   └── conftest.py
├── docs/
│   └── architecture.md
├── requirements.txt
├── render.yaml              # opcional
└── README.md
```

Regra de dependência: `routers → services → repositories → database`. Router nunca acessa o banco; repository nunca conhece HTTP.

---

## 5. Modelo de dados

```sql
CREATE TABLE cities (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  ibge_code  INTEGER NOT NULL UNIQUE
);

CREATE TABLE vaccination_points (
  id            INTEGER PRIMARY KEY,
  city_id       INTEGER NOT NULL REFERENCES cities(id),
  name          TEXT NOT NULL,
  address       TEXT,
  neighborhood  TEXT,
  phone         TEXT,
  opening_hours TEXT,
  vaccines      TEXT   -- JSON ou lista separada por ; (converter para lista na resposta)
);

CREATE INDEX idx_points_city ON vaccination_points(city_id);
```

---

## 6. Fases de implementação

Execute **uma fase por vez**, verifique e só então avance.

### Fase 1 — Setup do projeto
- Criar a estrutura de pastas acima, `requirements.txt` (fastapi, uvicorn, pytest, httpx) e `.gitignore` (incluindo `*.db`, `.venv`, `__pycache__`).
- App mínimo com `GET /health`.
- **Verificação:** `uvicorn app.main:app --reload` sobe e `curl localhost:8000/health` retorna `{"status":"ok"}`.

### Fase 2 — Dados (a fase mais importante, não invente nada)
1. **Cidades:** baixar os municípios de Alagoas (código IBGE do estado: 27) pela API de localidades do IBGE: `https://servicodados.ibge.gov.br/api/v1/localidades/estados/27/municipios`. Gerar `data/cities.csv` (id sequencial, nome, código IBGE). Esperado: 102 municípios.
2. **Pontos de vacinação:** buscar uma fonte pública oficial (sugestão: CNES / OpenDataSUS, filtrando unidades básicas de saúde de Alagoas). Gerar `data/vaccination_points.csv` ligando cada ponto a uma cidade pelo código IBGE.
   - Se a fonte oficial não estiver acessível ou não for adequada, **pare e me avise** com a alternativa proposta. **Não gere endereços ou nomes fictícios sem me avisar.**
   - Priorizar Maceió e Arapiraca com dados completos; as demais cidades podem ter menos pontos. É melhor poucos dados corretos do que muitos inventados.
3. **Vacinas por ponto:** se não houver fonte por unidade, usar a lista do calendário básico do PNI para todos e deixar isso **explícito** (coluna/nota no README: "dado ilustrativo, baseado no calendário básico").
4. Anotar a fonte e a data de coleta de cada arquivo em `data/README.md`.
5. Escrever `scripts/seed.py` que **recria o banco do zero** (drop/create + insert a partir dos CSVs). Deve ser idempotente.
- **Verificação:** rodar `python scripts/seed.py` e imprimir quantas cidades e pontos foram inseridos, mais quantos pontos por cidade nas 5 maiores.

### Fase 3 — Camadas e endpoints
- Implementar repositories (SQL parametrizado, nunca concatenar string), services, schemas Pydantic e routers.
- Implementar o formato único de erro e o handler que converte erro de validação de id em **400**.
- Mapear exceções de domínio (`CityNotFoundError`) para 404.
- Rota `/vaccination-points/{cityId}` deve checar a existência da cidade antes de listar os pontos.
- **Verificação (rodar todos e colar a saída):**
  ```bash
  curl -i localhost:8000/cities
  curl -i localhost:8000/cities/1
  curl -i localhost:8000/cities/abc          # esperado 400
  curl -i localhost:8000/cities/99999        # esperado 404
  curl -i localhost:8000/vaccination-points/1
  curl -i localhost:8000/vaccination-points/99999   # esperado 404
  ```

### Fase 4 — Testes automatizados
- `pytest` com banco de teste (fixture que cria um SQLite temporário com poucos registros).
- Cobrir no mínimo: lista de cidades; cidade por id (200); id inválido (400); cidade inexistente (404); pontos de uma cidade (200); cidade existente sem pontos (200 com `[]`); cidade inexistente em pontos (404); formato do JSON de erro; `content-type: application/json`.
- **Verificação:** `pytest -q` com todos os testes passando.

### Fase 5 — Documentação
- **README.md:** o que é o projeto, como rodar localmente (venv, install, seed, uvicorn), como rodar os testes, lista de endpoints com exemplos, fontes dos dados e limitações (quais dados são ilustrativos), link da API online (preencher depois do deploy) e autores.
- **docs/architecture.md** (critério de Arquitetura de Sistemas, escrever com cuidado), contendo:
  1. Visão geral e diagrama simples (pode ser Mermaid): cliente → router → service → repository → SQLite.
  2. Uma seção por decisão, no formato **Contexto → Decisão → Justificativa → Consequências/trade-offs**, para:
     - **Cliente–servidor:** separa quem consome de quem fornece os dados.
     - **REST:** recursos `cities` e `vaccination-points`, métodos HTTP padronizados, JSON.
     - **Arquitetura em camadas:** cada camada com uma responsabilidade; mudanças isoladas.
     - **Repository:** isola o acesso a dados; trocar SQLite por outro banco só afeta essa camada.
     - **Monolito:** escopo pequeno, equipe de 2, API só de leitura; microsserviços seriam complexidade sem benefício.
     - **MVC:** explicar que em API JSON a "view" é a serialização (schemas Pydantic) e por isso o padrão dominante é em camadas.
     - **SQLite + seed versionado:** simplicidade e deploy reproduzível num disco efêmero.
  3. Estrutura de pastas e regra de dependência entre camadas.
  4. Como os recursos refletem a hierarquia Estado → Cidade → Ponto de vacinação.
  5. Decisões de tratamento de erro e status codes.
- (Opcional) A documentação interativa em `/docs` (Swagger) já é gerada pelo FastAPI; adicionar `title`, `description` e exemplos de resposta nos routers para ficar bom.

### Fase 6 — Deploy no Render
- Subir o código no GitHub.
- Criar um **Web Service** no Render ligado ao repositório:
  - **Build command:** `pip install -r requirements.txt && python scripts/seed.py`
  - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - **Health check path:** `/health`
  - Definir a variável `PYTHON_VERSION` com a versão completa de Python suportada pelo Render (conferir na doc deles).
- Se o serviço gratuito dormir por inatividade, o primeiro acesso demora; configurar um monitor externo (ex.: UptimeRobot) fazendo ping em `/health` a cada poucos minutos.
- Habilitar CORS (`CORSMiddleware`) caso exista um front consumindo a API.
- **Verificação:** repetir os `curl` da Fase 3 contra a URL pública e confirmar os mesmos status codes. Colocar a URL no README.

---

## 7. Checklist final (espelha o checklist do enunciado)

**Técnico**
- [ ] Os três endpoints respondem corretamente na URL pública
- [ ] Todos os dados (inclusive erros) voltam em JSON
- [ ] Escopo de Alagoas coberto (cidades e pontos)
- [ ] Status codes fazem sentido (200, 400, 404)

**Avaliação**
- [ ] Decisões de arquitetura documentadas (`docs/architecture.md`)
- [ ] Padrões escolhidos e justificados
- [ ] README com instruções, fontes dos dados e URL online
- [ ] Testes passando (`pytest -q`)

**Entrega (manual, fora do código)**
- [ ] Submeter pelo Conecte-se com link do repositório e URL da API
- [ ] Adicionar **todos** os integrantes na submissão

---

## 8. Regras para a IA que for implementar

1. Trabalhe **fase por fase** e mostre a verificação de cada uma antes de seguir.
2. **Não invente dados** de pontos de vacinação. Se não achar fonte confiável, pare e pergunte.
3. Não adicione endpoints além dos listados (exceto `/health`). Nada de POST/PUT/DELETE.
4. Use SQL parametrizado. Sem segredos no repositório.
5. Se uma decisão desviar deste plano (stack, estrutura, campos), explique o motivo e registre em `docs/architecture.md`.
6. Prioridade se o tempo apertar: (1) 3 endpoints com dados reais e status corretos, (2) deploy online estável, (3) `architecture.md`, (4) testes e README, (5) extras.
