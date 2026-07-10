# 📊 Auditoria Exaustiva — ADS Representações

Análise de **4 dimensões** complementares da codebase, realizada em **2026-07-09** e **consolidada em um plano diretor executável** na mesma data.

> **Estado atual:** cada auditoria deixou de ser "diagnóstico + sugestões soltas" e passou a ser
> **diagnóstico + plano consolidado**, com um arquivo de execução por trilha (fases, checklist e
> **log do que foi feito e por quê**). Um **Plano Diretor** costura as 4 trilhas em um único roadmap
> por **ondas**, com **dono único por item** (nenhuma correção é implementada em duas trilhas).

## 📁 Estrutura de Pastas

```
AUDITORIAS/
├── README.md (este arquivo)
├── SUMARIO_CONSOLIDADO.md ⭐ PLANO DIRETOR (comece aqui)
│       • Roadmap global por Ondas 0–5 (as 4 trilhas)
│       • Matriz de Dono Único (anti-overlap)
│       • Cadeia de dependências + métricas + governança
│
├── ESTRUTURA/
│   ├── REPORTE_ESTRUTURA.md          — diagnóstico + §4 Plano Consolidado (fases F0–F4)
│   └── PLANO_EXECUCAO_ESTRUTURA.md   — checklist por fase + log de execução
│
├── SEGURANCA/
│   ├── REPORTE_SEGURANCA.md          — diagnóstico + §4 Plano Consolidado (fases S0–S3)
│   └── PLANO_EXECUCAO_SEGURANCA.md   — checklist por fase + log de execução
│
├── PERFORMANCE/
│   ├── REPORTE_PERFORMANCE.md        — diagnóstico + §4 Plano Consolidado (fases P0–P2)
│   └── PLANO_EXECUCAO_PERFORMANCE.md — checklist por fase + log de execução
│
└── UI_UX/
    ├── REPORTE_UI_UX.md              — diagnóstico + §5 Plano Consolidado (fases U0–U3)
    └── PLANO_EXECUCAO_UI_UX.md       — checklist por fase + log de execução
```

| Trilha | Achados | Fases do plano | Achado central |
|---|---|---|---|
| 🏗️ **Estrutura** | 18 (E/D/S/M/A) | F0–F4 | God Components (501/498/421 lin) + duplicação 4–6× |
| 🔐 **Segurança** | 14 (SEG-01..14) | S0–S3 | `firestore.rules` inexistente no repo (SEG-01) |
| ⚡ **Performance** | 16 (PERF-01..16) | P0–P2 | Escalabilidade O(N) latente (full-scans, re-render, I/O) |
| 🎨 **UI/UX** | 35 (UI-01..35) | U0–U3 | Zero tema/tokens, 4 paletas, 104 hex, KPI morto |

## 🚀 Como Usar

### 1️⃣ Comece pelo Plano Diretor
👉 [`SUMARIO_CONSOLIDADO.md`](SUMARIO_CONSOLIDADO.md) (5–10 min)
- Roadmap por **Ondas 0–5** cobrindo as 4 trilhas de uma vez.
- **Matriz de Dono Único** — a regra que impede dois checklists de mexerem no mesmo código.
- Cadeia de dependências, métricas de sucesso e governança da execução.

### 2️⃣ Aprofunde por dimensão
Cada trilha tem **dois** documentos: o **reporte** (diagnóstico + plano) e o **plano de execução** (checklist + log).

- **Infra/deploy:** [`SEGURANCA/`](SEGURANCA/REPORTE_SEGURANCA.md) — **SEG S0 é a Onda 0** e bloqueia deploy.
- **Arquitetura/tech lead:** [`ESTRUTURA/`](ESTRUTURA/REPORTE_ESTRUTURA.md) — desbloqueia refatorações das demais trilhas.
- **Performance:** [`PERFORMANCE/`](PERFORMANCE/REPORTE_PERFORMANCE.md) — quick wins de bundle/reads na Onda 1.
- **Frontend/design:** [`UI_UX/`](UI_UX/REPORTE_UI_UX.md) — fundação de tema na Onda 2.

### 3️⃣ Execute pelo plano de execução da trilha dona
Não copie backlog solto — siga o `PLANO_EXECUCAO_*.md`:
- Cada item tem passos por arquivo + **critério de aceite**.
- **Antes de implementar:** confira a Matriz de Dono Único (§3 do Plano Diretor).
- **Ao concluir:** marque o checklist **e registre no Log de Execução** (o quê + por quê + verificação). Itens que resolvem achados de outra trilha (ex.: EST F4.3 → SEG-12/UI-33) devem ser marcados como resolvidos **nas duas** pontas.

---

## 📈 Sumário Executivo Ultra-Rápido

| Eixo | Status | Achado Central |
|------|--------|---|
| **Segurança** | 🔴 **CRÍTICA** | `firestore.rules` não versionadas (SEG-01) — risco de vazamento total |
| **UI/UX** | 🔴 **Crítica p/ escalar** | Zero tema/tokens, 4 paletas, 104 hex, Dashboard sem gráficos (UI-09/UI-18) |
| **Estrutura** | 🟠 Média-Alta | God Components (501, 498, 421 lin) + duplicação ~350 lin + 2 bugs funcionais |
| **Performance** | 🟠 Média | O(N) escalabilidade latente (full-scans, re-renders, I/O bloqueante) |

**Recomendação:** execute a **Onda 0** (perímetro de segurança) **antes de qualquer novo deploy de produção**.

---

## 🎯 Checklist de Ação — Onda 0 (bloqueia deploy)

Dono: 🔐 Segurança → [`PLANO_EXECUCAO_SEGURANCA.md`](SEGURANCA/PLANO_EXECUCAO_SEGURANCA.md)

- [ ] **SEG S0.1:** Criar `firestore.rules` (deny-by-default + allowlist `staff`) → `firebase.json` → CI
- [ ] **SEG S0.2:** Neutralizar signup aberto (allowlist/console)
- [ ] **SEG S0.3:** Corrigir auto-logout (2h + `clearTimeout`; hoje ~30h por bug) — resolve também PERF-15
- [ ] **SEG S0.4:** Corrigir aliases invertidos do `.firebaserc`

**Onda 1** (paralelizável, logo após): EST F0 (bugs A-01/A-04, fim do `reload()`, memoizar `value`) · SEG S1 · PERF P0 (deps mortas, code-splitting, `getRecentBudgets(5)`) · UI U0 (KPI real, bug responsivo, `lang`/fonte).

👉 Roadmap completo por ondas: [`SUMARIO_CONSOLIDADO.md`](SUMARIO_CONSOLIDADO.md)

---

## 📝 Método & Evidência

**Ferramentas usadas:**
- `Graphify` — mapa de topologia (388 nós, 785 arestas, 20 comunidades)
- `ripgrep` / Glob — varredura de padrões, imports e artefatos
- Análise estática (TypeScript/React AST) + **verificação item a item contra o código-fonte** antes de consolidar cada plano

**Correções de premissa encontradas na verificação (exemplos):**
- Não existe `ThemeProvider` em `src/` → mudou o plano de tokens (centralizar antes, tokenizar depois).
- Subcomponentes de orçamento já extraídos → reduziu o escopo de EST F3.1.
- PDF legado duplicado em `RecentBudgets.tsx` → ampliou EST F4.3 para 2 call sites.
- CI usa `--project=<id>` direto → recalibrou o risco de SEG-09 (concentrado no deploy manual).

**Limitações documentadas:**
- Profiling real necessário para quantificar ganhos de performance (baseline registrada em PERF P0.0).
- Estado real das Firestore Rules e da política de signup confirmável só no console (fora do escopo estático).

---

## 💬 Questões Frequentes

**P: Por onde começar?**
R: Leia o [`SUMARIO_CONSOLIDADO.md`](SUMARIO_CONSOLIDADO.md) (Plano Diretor) e execute a **Onda 0**.

**P: Qual é o risco maior agora?**
R: SEG-01 (Firestore rules não versionadas) — se o modo for "teste" ou permissivo, qualquer um pode ler/apagar a base.

**P: Um mesmo problema aparece em várias auditorias. Quem o corrige?**
R: A **Matriz de Dono Único** (§3 do Plano Diretor) define **um** dono por item. Ex.: memoizar `DataContext.value` é EST F0.5 (PERF/UI só validam); o PDF legado é EST F4.3 (resolve SEG-12/UI-33).

**P: Posso pular a ordem das ondas?**
R: A Onda 0 (segurança) é inegociável antes de deploy. Dentro das ondas seguintes há dependências explícitas (ex.: paginação PERF P1.2 só depois do factory EST F2.1/F2.2; migração de tokens só depois do tema UI U1).

**P: Onde registro o que foi implementado?**
R: No **Log de Execução** ao final do `PLANO_EXECUCAO_*.md` da trilha dona — o quê foi feito, por quê e a verificação/medição.

**P: Os relatórios ficam desatualizados após mudanças?**
R: Sim. Re-rodar a auditoria (e o Graphify) a cada 6–8 semanas ou após refatorações maiores; atualizar o Plano Diretor ao final de cada onda.

---

## 📞 Referência de IDs

Cada achado tem **Arquivo:Linha · Diagnóstico · Proposta de Correção**, mapeado a uma fase no plano da trilha:
- **E/D/S/M/A-xx** → Estrutura (fases F0–F4)
- **SEG-01 a SEG-14** → Segurança (fases S0–S3)
- **PERF-01 a PERF-16** → Performance (fases P0–P2)
- **UI-01 a UI-35** → UI/UX (fases U0–U3)

---

**Auditoria finalizada e consolidada:** 2026-07-09
**Status:** 📋 Planejamento consolidado · Ondas 0–5 pendentes
**Próxima revisão:** ao final de cada onda (e re-auditoria a cada 6–8 semanas)
