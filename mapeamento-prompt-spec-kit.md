# Mapeamento Universal: Prompt de Revisão Técnica → Spec Kit

Este guia detalha **exatamente quais diretrizes** do prompt vão para **cada artefato e comando do Spec Kit**, de forma **universal** (aplicável a qualquer projeto, novo ou em andamento).

---

## Visão Geral: Para onde vai cada parte

| Parte do Prompt | Destino principal no Spec Kit | Destinos secundários |
| :--- | :--- | :--- |
| **Papel, Objetivo e Regras Importantes** | `constitution.md` (`/speckit.constitution`) | `/speckit.converge` |
| **Critérios 1 a 12** (Arquitetura, Segurança, etc.) | `/speckit.checklist` e `plan.md` (`/speckit.plan`) | `spec.md` (RNF) e `/speckit.analyze` |
| **Estrutura por Problema** (`P0`–`P3`, Evidências) | `/speckit.converge` e `tasks.md` (`/speckit.tasks`) | `plan.md` (Riscos) |
| **Também identifique** (Boas práticas / Não alterar) | `constitution.md` (`/speckit.constitution`) | `/speckit.analyze` |
| **Relatório Final** (Roadmap, Quick Wins, Dívida) | Backlog → `/speckit.specify` (PRD) | `plan.md` (Fases) |

---

## 1. Papel, Objetivo e Regras Importantes

### O que extrair do prompt
- Não reescrever o projeto do zero; preservar o que já está bem implementado.
- Evitar alterações por preferência pessoal; toda recomendação precisa de **justificativa técnica** e análise de **custo × benefício**.
- Não inventar problemas; se faltar contexto, **explicitar a incerteza** em vez de assumir.

### Onde e como usar no Spec Kit
1. **`constitution.md` (`/speckit.constitution`):**
   - Adicione uma seção **Princípios de Evolução e Revisão**:
     - *"Proibido propor reescritas completas sem justificativa de inviabilidade técnica."*
     - *"Toda mudança sugerida no plano deve declarar o ganho real (custo × benefício)."*
     - *"Quando houver lacuna de requisito ou contexto, registrar como dúvida aberta antes de planejar."*
2. **`/speckit.clarify`:**
   - Use a regra de *"explicitar incertezas em vez de assumir"* como critério para disparar perguntas antes de gerar o `plan.md`.
3. **`/speckit.converge`:**
   - Ao avaliar um código já existente, instrua o agente a listar primeiro o que **deve ser mantido** antes de sugerir novas tarefas.

---

## 2. Critérios de Avaliação (Itens 1 a 12)

Em vez de deixar os 12 critérios soltos, distribua cada grupo no momento exato do fluxo:

### A. Vão para `spec.md` (`/speckit.specify` — PRD / Requisitos Não-Funcionais)
- **Segurança (3):** requisitos de autenticação, autorização, controle de acesso, proteção de dados sensíveis e conformidade (ex.: LGPD).
- **Front-end (7):** requisitos de UX, acessibilidade, responsividade e internacionalização.
- **Escalabilidade (12):** metas de carga, volume de usuários e tempo de resposta esperado.

### B. Vão para `plan.md` (`/speckit.plan` — TRD / Arquitetura)
- **Arquitetura (1):** organização de módulos, separação de responsabilidades, acoplamento/coesão, padrões (SOLID, Clean Architecture, DDD, event-driven).
- **Performance (4):** estratégia de cache, async/concorrência, prevenção de N+1 queries, lazy/eager loading.
- **Banco de dados (5):** modelagem, índices, migrations seguras, constraints e integridade.
- **APIs (6):** padrão REST/GraphQL, versionamento, códigos HTTP, paginação, filtros, OpenAPI e tratamento de erros.
- **DevOps (8):** Docker/Compose, CI/CD, logs, métricas, tracing, backups, deploy e rollback.

### C. Vão para `/speckit.checklist` (Portão de Qualidade antes do código)
- **Código (2):** legibilidade, simplicidade, baixa complexidade ciclomática, ausência de duplicação e code smells.
- **Testes (9):** cobertura unitária, integração e E2E; prevenção de testes frágeis.
- **Dependências (10):** checagem de bibliotecas obsoletas, duplicadas ou com vulnerabilidades.
- **Manutenibilidade (11):** documentação atualizada e facilidade de onboarding.

### D. Vão para `/speckit.analyze` (Auditoria de alinhamento PRD ↔ TRD ↔ Tasks)
- Use a escala do item 1 (**Excelente, Bom, Aceitável, Precisa melhoria, Crítico**) para classificar se o `plan.md` (TRD) e o `tasks.md` realmente cobrem tudo o que foi pedido no `spec.md` (PRD).

---

## 3. Estrutura por Problema Encontrado

### O que extrair do prompt
- **Problema**, **Impacto**, **Gravidade** (`Baixa`, `Média`, `Alta`, `Crítica`), **Evidências** (arquivos/linhas), **Solução**, **Justificativa**, **Complexidade** (`Baixa`, `Média`, `Alta`) e **Prioridade** (`P0` a `P3`).

### Onde e como usar no Spec Kit
1. **`/speckit.converge` (Diagnóstico de código existente):**
   - Exija que cada gap encontrado no repositório seja emitido exatamente nesse formato de 8 campos.
2. **`tasks.md` (`/speckit.tasks`):**
   - Converta a **Prioridade (`P0`–`P3`)** na ordem de execução das tarefas:
     - `P0` / `Crítica` → bloqueadores (executar antes de qualquer feature nova).
     - `P1` / `Alta` → entram no ciclo atual.
     - `P2` / `P3` → ficam como tarefas de melhoria contínua ou débito técnico.
   - Use **Complexidade** para decidir se uma tarefa precisa ser quebrada em subtarefas menores.

---

## 4. "Também identifique" (Boas práticas e o que NÃO alterar)

### O que extrair do prompt
- Boas práticas existentes, decisões arquiteturais acertadas e partes do projeto que **não devem ser alteradas**.

### Onde e como usar no Spec Kit
1. **`constitution.md` (`/speckit.constitution`):**
   - Crie uma seção **Zonas Protegidas / Padrões Consolidados** listando módulos, convenções ou design systems que a IA é proibida de alterar sem solicitação explícita.
2. **`plan.md` (`/speckit.plan`):**
   - Toda nova feature deve declarar explicitamente como se integra às decisões acertadas sem quebrá-las.

---

## 5. Relatório Final (Notas, Riscos, Roadmap, Quick Wins e Dívida)

### O que extrair do prompt
- Resumo executivo + notas `0–10`, Principais riscos, Roadmap (Curto/Médio/Longo prazo), Quick Wins, Dívida técnica e Conclusão de prontidão.

### Onde e como usar no Spec Kit
- **Quick Wins + Curto prazo:** viram as primeiras entradas de `/speckit.specify` (PRDs curtos e objetivos para ganho rápido).
- **Médio e Longo prazo / Dívida técnica:** alimentam o roadmap de futuras specs, evitando misturar refatorações estruturais com entregas de produto.
- **Principais riscos:** entram na seção de **Riscos e Mitigações** do `plan.md` (`/speckit.plan`).
- **Conclusão (prontidão para produção):** define o critério mínimo de aprovação no `/speckit.checklist` antes de liberar um release.

---

## Guia de Configuração Detalhada para Outra Estação de Trabalho

Siga os passos abaixo para replicar esta configuração em outra máquina (Windows / PowerShell).

### Passo 1 — Instalar o `uv` e o `specify-cli`
```powershell
# 1. Instalar o gerenciador uv
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. Garantir o uv no PATH da sessão atual (ou reabrir o terminal)
$env:Path = "$env:USERPROFILE\.local\bin;$env:Path"

# 3. Instalar o Spec Kit (specify-cli) globalmente
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 4. Validar instalação
specify --version
specify check
```

### Passo 2 — Inicializar no projeto (Gemini + Claude)
Dentro da pasta raiz do projeto na nova estação:

```powershell
# Integração Gemini
specify init --here --force --non-interactive --ignore-agent-tools --integration gemini

# Integração Claude Code
specify init --here --force --non-interactive --ignore-agent-tools --integration claude
```

### Passo 3 — Aplicar a `constitution.md` universal
Substitua o conteúdo de `.specify/memory/constitution.md` pelo template universal abaixo:

```markdown
# Universal Engineering & Architecture Constitution

## Core Principles

### I. Preservação e Evolução Fundamentada
- Não reescrever sistemas do zero sem justificativa técnica sólida.
- Preservar decisões arquiteturais válidas e tudo o que já está bem implementado.
- Evitar alterações por preferência pessoal; toda mudança ou refatoração deve agregar valor real e considerar custo × benefício.
- Se uma decisão depender de contexto ausente, explicitar a incerteza em vez de assumir.

### II. Arquitetura e Qualidade de Código
- Manter separação clara de responsabilidades, baixo acoplamento, alta coesão e modularização adequada.
- Aplicar SOLID, Clean Architecture e DDD quando agregarem valor real ao domínio.
- Priorizar legibilidade, simplicidade, baixa complexidade ciclomática e nomenclatura clara; evitar duplicação, funções/classes gigantes, code smells e antipatterns.

### III. Segurança by Design
- Garantir autenticação, autorização, gestão de sessões/JWT/OAuth e controle de permissões rigorosos.
- Prevenir vulnerabilidades clássicas: SQL Injection, XSS, CSRF, SSRF, Command Injection, Path Traversal e falhas de serialização ou upload.
- Validar toda entrada externa, proteger secrets e variáveis de ambiente, aplicar criptografia adequada e respeitar requisitos de LGPD quando aplicável.

### IV. Performance, Banco de Dados e Escalabilidade
- Evitar gargalos de CPU, memória, concorrência/async, N+1 queries e algoritmos ineficientes; usar cache, lazy/eager loading de forma consciente.
- Garantir modelagem íntegra de banco de dados: índices, migrations seguras, relacionamentos, constraints e tipos adequados.
- Projetar considerando crescimento de usuários e carga (processamento paralelo, filas, cache e armazenamento).

### V. APIs, Front-end, Testes e DevOps
- **APIs:** consistência REST/GraphQL, versionamento, códigos HTTP corretos, paginação, filtros, OpenAPI e tratamento padronizado de erros.
- **Front-end (quando existir):** organização de componentes, gestão de estado, performance, acessibilidade, UX e responsividade.
- **Testes:** cobrir cenários críticos com testes unitários, de integração e E2E confiáveis (não frágeis).
- **DevOps & Observabilidade:** manter Docker/Compose, CI/CD, logs estruturados, métricas, tracing, backups e estratégia segura de deploy/rollback.

## Padrão de Diagnóstico e Priorização
Todo problema técnico ou débito identificado deve ser documentado com:
- **Problema** (descrição objetiva) e **Evidências** (arquivos, classes, funções ou trechos).
- **Impacto** e **Gravidade** (`Baixa`, `Média`, `Alta`, `Crítica`).
- **Solução** e **Justificativa** técnica.
- **Complexidade** (`Baixa`, `Média`, `Alta`) e **Prioridade** (`P0` a `P3`).

## Governance
- Esta Constitution rege todas as etapas do Spec Kit (`/speckit.specify` [PRD], `/speckit.plan` [TRD], `/speckit.tasks`, `/speckit.checklist`, `/speckit.analyze`, `/speckit.implement` e `/speckit.converge`).
- Todo plano técnico (TRD) e implementação deve respeitar estes princípios e justificar qualquer exceção.

**Version**: 1.0.0 | **Ratified**: 2026-11-22 | **Last Amended**: 2026-11-22
```

### Passo 4 — Boas práticas de `.gitignore` entre estações
- **Recomendado versionar:** `.specify/` (assim a `constitution.md` e os templates vão junto no `git pull` para qualquer estação).
- **Recomendado ignorar:** `.gemini/` e `.claude/` (pastas locais de agente, recriadas facilmente com `specify init` sem risco de vazar tokens/credenciais).
