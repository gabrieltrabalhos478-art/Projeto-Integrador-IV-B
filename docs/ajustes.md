# Registro de Ajustes Visuais (`docs/ajustes.md`)

| Data | Pedido | Classe (`P-15`) | Arquivos | Resultado |
| :--- | :--- | :--- | :--- | :--- |
| 2026-11-24 | Rodada 1 (`P-15`): barra de acessibilidade (alto contraste + zoom A-/A/A+), navbar sticky, docs no rodapé em nova aba, zoom próximo no posto mais próximo, alinhamento Admin e botões com maior profundidade | Classe A (ajuste dentro da direção) | `styles.css`, `index.html`, `app.js`, `admin.html`, `admin.js` | Aplicado e verificado |
| 2026-11-24 | Rodada 2 (`P-15`): sticky apenas na faixa fina de acessibilidade, remoção do Painel Admin no rodapé, `maximumAge: 0` + localização por CEP/endereço (ViaCEP + Nominatim) | Classe A (ajuste dentro da direção) | `index.html`, `styles.css`, `app.js` | Aplicado e verificado |
| 2026-11-24 | Rodada 3 (`P-15`): correção botão Alto Contraste (`#003875` / `#FACC15`), remoção de `display: flex` no `<td>` do Admin (botões flutuantes limpos) e busca em etapas (1. Localização/CEP, 2. Manual Municipal, 3. Manual Estadual) | Classe A (ajuste dentro da direção) | `styles.css`, `index.html`, `app.js`, `admin.js` | Aplicado e verificado |
| 2026-11-24 | Rodada 4 (`P-15`): destaque visual do posto selecionado no mapa + botão "Focar no posto selecionado", filtro por Bairro, ordenação e agrupamento visual por Bairro | Classe A (ajuste dentro da direção) | `index.html`, `styles.css`, `app.js` | Aplicado e verificado |
