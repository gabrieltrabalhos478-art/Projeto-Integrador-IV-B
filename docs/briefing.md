# Hipótese de Briefing (`docs/briefing.md`)

## Extraído do código `[inferido]`
- **Oferta (`app/static/index.html`, `README.md`):** Portal público de consulta às 895 Unidades Básicas de Saúde (UBSs) ativas nos 102 municípios de Alagoas, com painel administrativo para manutenção dos dados.
- **Público:** Cidadãos de Alagoas buscando local de vacinação e gestores/administradores mantendo a base atualizada `[inferido]`.
- **Ação principal atual:** Selecionar município, filtrar por bairro/nome ou vacina e visualizar endereço, horário e vacinas da UBS.
- **Tom:** Institucional, informativo e acessível.

## Objetivo da Melhoria Atual `[confirmado pelo usuário]`
1. Adicionar **banner institucional no topo** estilo portal do Governo de Alagoas e **tema nas cores da bandeira de Alagoas** (vermelho, branco e azul) com design único no Portal (`/`).
2. Incluir **introdução curta** explicando a função do site antes dos filtros.
3. Permitir **geolocalização do usuário** e destaque do **posto mais próximo**.
4. Exibir **mapa interativo** com localização dos postos e **tempo estimado por modal** (a pé, carro, outros veículos).
5. Permitir **favoritar posto** e **compartilhar** com outras pessoas.
6. Garantir **acessibilidade WCAG 2.1 AA** em toda a experiência.

## Perguntas para confirmar (máx. 5)
1. O banner institucional deve usar o brasão/bandeira estilizada em SVG próprio da bandeira de Alagoas (vermelho, branco e azul) sem usar marca oficial protegida, ou há algum arquivo de imagem/logo que você queira enviar? `[confirmar]`
2. Para o cálculo de distância e tempo por modal (a pé, carro, bicicleta/transporte), podemos usar as coordenadas reais do CNES (`latitude`/`longitude`) no banco + mapa OpenStreetMap/Leaflet? `[confirmar]`
