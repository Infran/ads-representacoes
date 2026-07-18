# Backlog / Rascunhos — ADS Representações

Pasta leve para **ideias e trabalho planejado, mas ainda não iniciado**. É onde
uma ideia nasce, é refinada e fica pronta para ser executada — sem poluir o
código nem virar decisão formal antes da hora.

## Onde isto se encaixa

| Pasta | Papel |
| --- | --- |
| `docs/backlog/` (aqui) | **Ideias/rascunhos** ainda não iniciados. Um arquivo por ideia. |
| `AUDITORIAS/` | Trilhas de auditoria com **planos de execução** e itens já em andamento/feitos. |
| `docs/adr/` | **Decisões aceitas** (Architecture Decision Records) — o "porquê" já resolvido. |

Fluxo típico de um item:

```
Rascunho → Refinado → Em andamento → Concluído
                                   ↘ (se virar decisão) vira um ADR em docs/adr/
                                   ↘ (se não for tocar) Descartado
```

Ao concluir, feche o item: mude o status, e — se ele gerou uma decisão de
arquitetura — registre o "porquê" num ADR e aponte para ele daqui.

## Convenções

- **Um arquivo por ideia**, nomeado `NNNN-slug.md` (ex.: `0001-orcamento-rapido.md`),
  seguindo a mesma numeração de 4 dígitos dos ADRs.
- Cada item começa com um bloco de metadados: **Status**, **Prioridade**, **Esforço**,
  **Origem**, **Relacionado**.
- **Status:** `Rascunho` · `Refinado` · `Em andamento` · `Concluído` · `Descartado`.
- **Prioridade:** `Alta` · `Média` · `Baixa`.
- **Esforço** (estimativa grossa): `P` (horas) · `M` (dias) · `G` (semana+).
- Use `docs/backlog/_template.md` como ponto de partida.
- Escreva em **português (Brasil)**, como o resto de `docs/` e das AUDITORIAS.

> **Nota de versionamento:** o `.gitignore` ignora `*.md` e `*.json` em geral,
> **exceto** `!docs/**/*.md`. Por isso os itens do backlog **precisam** ser `.md`
> **dentro de `docs/`** para serem versionados. Um `.json` aqui seria ignorado
> silenciosamente — se precisar anexar dados, incorpore-os no próprio `.md`.

## Índice

| ID | Item | Status | Prioridade | Esforço |
| --- | --- | --- | --- | --- |
| [0001](0001-orcamento-rapido.md) | Orçamento rápido a partir do contexto (produto/cliente/representante) | Rascunho | Média | M |
