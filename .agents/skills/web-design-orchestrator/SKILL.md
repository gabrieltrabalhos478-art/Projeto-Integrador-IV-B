---
name: web-design-orchestrator
description: >-
  Orchestrates web and app design, creation (scenarios S1-S14), redesign (S13),
  and safe improvements on existing projects (M1-M12) using the four playbooks
  in docs/. Enforces safe installation (P-00), anti-"AI-slop" quality gate
  (P-13), video reference checks (P-14), visual route control (P-15), exact
  design choices (P-16), per-element references (P-17), and curated effect
  libraries (P-18). Use when creating, redesigning, auditing, or improving a
  website or web app UI, or conducting a client design briefing.
---

# Web Design & Editing Orchestrator

Esta skill conecta o agente aos 5 arquivos de referência em `docs/`, aplicando **progressive disclosure**: abra apenas o guia e a trilha correspondentes ao cenário atual.

## Mapa dos Guias em `docs/`

| Guia | Arquivo | Quando ler |
| :--- | :--- | :--- |
| **Guia 1 — Mapa e Caminhos** | [01-mapa-e-caminhos.md](../../../docs/01-mapa-e-caminhos.md) | Sempre **primeiro** para decidir cenário (`S1`–`S14`), tier, escopo global vs. projeto, incompatibilidades, modelo (`TS1`–`TS8`) e nível de efeito (`E0`–`E5`). |
| **Guia 2A — Prompts de Criação** | [02-prompts-criacao.md](../../../docs/02-prompts-criacao.md) | Projetos **novos** (Parte 0, universais `P-00`–`P-18`, cenários `S1`–`S12`/`S14`, situações `SIT-*` e mídia `E-0`–`E-11`). |
| **Guia 2B — Prompts de Edição** | [02-prompts-edicao.md](../../../docs/02-prompts-edicao.md) | Projetos **existentes** (Parte 0 de melhoria, adoção `M-A`, trilha `M-0`–`M-18` e redesign `S13`). |
| **Guia 3 — Perguntas para Clientes** | [03-perguntas-para-clientes.md](../../../docs/03-perguntas-para-clientes.md) | Levantamento de briefing com cliente (uma pergunta por vez, sem jargão). |
| **Guia 4 — Melhorar e Editar** | [04-melhorar-e-editar.md](../../../docs/04-melhorar-e-editar.md) | Classificação de intervenção (`M1`–`M12`), baseline, matriz de risco e checklist de regressão em sites/apps no ar. |

---

## Roteamento Rápido

1. **Projeto novo:**
   - Ler a seção de roteamento em `docs/01-mapa-e-caminhos.md` e seguir a **Parte 0** de `docs/02-prompts-criacao.md`.
2. **Projeto existente / melhoria visual ou funcional:**
   - Classificar em `M1`–`M12` (ou `S13` para redesign completo) em `docs/04-melhorar-e-editar.md` e executar a **Parte 0** de `docs/02-prompts-edicao.md`.
   - Se o projeto ainda não tiver `CLAUDE.md`/`DESIGN.md`, usar o prompt `M-A` (`02-prompts-edicao.md`).
3. **Levantamento de requisitos com cliente:**
   - Seguir o roteiro de `docs/03-perguntas-para-clientes.md` e registrar em `docs/briefing.md`.

---

## Regras Obrigatórias (de `02-prompts-criacao.md` e `02-prompts-edicao.md`)

- **`P-00` (Instalação segura):** ler `README`/`SKILL.md` antes de instalar, usar `--dry-run` quando existir, nunca rodar `curl | bash` sem inspecionar, e parar/perguntar se o comando não estiver confirmado (`⚠ confirmar`).
- **`P-13` (Gate anti-"cara de IA"):** aplicar no diagnóstico, após cada camada visual e antes da entrega final; veredito "não passa" bloqueia a entrega.
- **`P-14` (Referência em vídeo):** sempre que houver referência visual/movimento, oferecer análise via vídeo/gravação de tela (`watch`) antes de concluir só por print.
- **`P-15` (Ajuste dentro da rota):** separar ajuste fino de mudança de direção, agrupar pedidos em lote e registrar em `docs/ajustes.md`.
- **`P-16` / `P-17` / `P-18`:** exigir escolhas exatas (tipografia, disposição, componentes), referência concreta por elemento (nada genérico) e escolha explícita de efeitos/bibliotecas antes de implementar animações.
