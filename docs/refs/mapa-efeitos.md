# Mapa de Efeitos (`docs/refs/mapa-efeitos.md`)

Base para o `P-18` (todo efeito novo ou alterado precisa de propósito, `prefers-reduced-motion` e referência aprovada).

| Efeito | Arquivo / Componente | Status | Propósito | Referência (`P-18`) |
| :--- | :--- | :--- | :--- | :--- |
| Transição de botão (`background`, `transform`) | `app/static/styles.css` (`.btn`) | `mantido` *(adicionar `prefers-reduced-motion`)* | Feedback tátil de clique | Existente |
| Foco em inputs/selects | `app/static/styles.css` | `ajustar` (estender `:focus-visible` WCAG) | Indicação clara de foco por teclado | WCAG 2.1 AA |
| Abertura de modal no Admin | `app/static/styles.css` (`.modal-backdrop`) | `mantido` | Exibir formulário de edição | Existente |
| Toast de feedback no Admin | `app/static/styles.css` (`.toast`) | `mantido` | Confirmar ação CRUD | Existente |
