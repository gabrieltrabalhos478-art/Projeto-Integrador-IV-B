# Ficha de Escolhas Visuais (`docs/escolhas.md`)

Status atual: **`observado`** (extraído de `app/static/styles.css`, `index.html`, `admin.html` em 2026-11-24). As decisões de alteração serão fechadas no `P-16` após o diagnóstico (`M-3`).

| Categoria | Item | Valor Atual Observado | Status |
| :--- | :--- | :--- | :--- |
| **Tipografia** | Família | System stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif`) | `observado` |
| **Tipografia** | Escala | `h1: 26px`, `h2: 20px`, `h3: 16px`, corpo `14px`, label `12px` | `observado` |
| **Cores** | Primária / Destaque | `#0f766e` / `#0d9488` / `#0284c7` | `observado` *(trocar para tema Bandeira de Alagoas)* |
| **Disposição** | Container | `max-width: 1120px`, margem centralizada | `observado` |
| **Disposição** | Filtros | Grid 3 colunas (`1.2fr 1.2fr 1fr`), breakpoint `820px` | `observado` |
| **Disposição** | Lista de UBSs | Grid de cartões (`minmax(320px, 1fr)`) | `observado` |
| **Itens** | Cartão de UBS | Título + pill bairro + endereço + telefone + horário + tags de vacinas | `observado` *(adicionar distância, favorito e compartilhar)* |
| **Itens** | Banner topo | `.topbar` simples em degradê teal | `observado` *(trocar para banner institucional Alagoas + introdução curta)* |
| **Componentes** | Mapa / Rotas | Inexistente | `ausente` *(a definir em `M-4` / `P-16` / `P-17`)* |
| **Referências** | Bibliotecas UI | Nenhuma biblioteca CSS/JS de terceiros | `observado` |
