# Fontes de Dados (Alagoas)

## 1. Municípios (`data/cities.csv`)
- **Fonte:** API de Localidades do IBGE (`https://servicodados.ibge.gov.br/api/v1/localidades/estados/27/municipios`)
- **Escopo:** Todos os 102 municípios do estado de Alagoas (código UF `27`).
- **Data de coleta:** 2026-11-24

## 2. Pontos de Vacinação (`data/vaccination_points.csv`)
- **Fonte:** API Dados Abertos do Ministério da Saúde / CNES (`https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_uf=27&codigo_tipo_unidade=2`)
- **Critério de filtro:**
  - `codigo_uf = 27` (Alagoas)
  - `codigo_tipo_unidade = 2` (Centro de Saúde / Unidade Básica de Saúde)
  - Unidades ativas (`codigo_motivo_desabilitacao_estabelecimento IS NULL`) com atendimento ambulatorial SUS (`estabelecimento_faz_atendimento_ambulatorial_sus = "SIM"`).
- **Ligação geográfica:** Os 6 primeiros dígitos do `ibge_code` (IBGE) correspondem ao `codigo_municipio` do CNES.
- **Data de coleta:** 2026-11-24

## 3. Limitações conhecidas
- **Vacinas (`vaccines`):** A base pública do CNES não disponibiliza estoque/disponibilidade de vacinas por unidade em tempo real. Por isso, a coluna `vaccines` contém a lista padrão do calendário básico do PNI (**dado ilustrativo, baseado no calendário básico**).
- **Telefone / Horário:** Alguns estabelecimentos no CNES possuem telefone ou turno em branco (`null` na resposta da API).
