# PLANO_EXECUCAO_SEGURANCA.md — Execução por Fases

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase Auth/Firestore)
**Origem:** consolida o §4 de [`REPORTE_SEGURANCA.md`](./REPORTE_SEGURANCA.md)
**Sequenciamento global:** [Plano Diretor](../SUMARIO_CONSOLIDADO.md)
**Criado em:** 2026-07-09 · **Última atualização:** 2026-07-11

---

## Como usar este documento

- Cada fase tem **checklist de execução** com passos concretos e **critério de aceite**. Marque `[x]` ao concluir.
- **S0 vem antes de qualquer novo deploy de produção.** Não pule a ordem.
- Itens marcados **[REF]** são de **dono de outra trilha** — aqui só se **verifica** o resultado; não há implementação duplicada (regra de dono único do Plano Diretor).
- Ao concluir qualquer item, **registre no §Log de Execução**: o quê foi feito e **por quê**.
- Especificações técnicas (antes/depois de código): §3 do reporte.

### Portões de qualidade
- [x] `npm run build` (tsc + vite) **verde** após S0/S1 (2026-07-10).
- [~] `npm run lint --max-warnings 0`: os 4 arquivos alterados **não introduzem nenhum problema novo** (`Login.tsx`/`firebase.ts` limpos; os 4 avisos em `ContextAuth.tsx`/`budgetServices.ts` são **pré-existentes**). O gate global segue vermelho por **código morto pré-existente** de outras trilhas (unused imports em ~15 arquivos) — dono: **EST F0**.
- [x] `npm run test` verde (EST F1, 2026-07-11) + `npm run test:rules` verde (S3.1, 12/12 no emulador).
- [x] Nenhum segredo committed: `.env*` permanecem gitignored.

---

## Painel de progresso

| Fase | Objetivo | Itens | Status |
|---|---|---|---|
| **S0** | Perímetro crítico (bloqueia deploy) | 4 | ✅ Publicado em dev + prod · S0.2 encerrado (risco residual aceito) |
| **S1** | Endurecimento do app | 4 | ✅ Concluído (código) |
| **S2** | Integridade de dados | 2 | ✅ Concluído (2026-07-11) |
| **S3** | Governança e testes de regras | 1 | ✅ Código + CI aditivo (2026-07-11) · ⚠️ gate no deploy pendente de decisão do usuário |

---

## Fase S0 — Perímetro crítico (fazer JÁ, antes de qualquer deploy)

### S0.1 — Versionar e publicar `firestore.rules` (SEG-01, SEG-02, SEG-04) ✅
Verificado: não existia nenhum `*.rules` no repo e [firebase.json](../../firebase.json) só tinha `hosting`.
- [x] Criar `firestore.rules` na raiz: `isStaff()` via `staff/{uid}`, `meta/{doc}` só staff, integridade em `budgets` (`totalValue is number && >= 0`, `selectedProducts is list`), e **deny-by-default** (`match /{document=**} { allow read, write: if false; }`). **Desvio deliberado:** validação de campo aplicada só a `budgets` (schema confirmado em `IBudget`); `clients`/`products`/`representatives` ficam `isStaff()`-only por ora — asserções de campo (ex.: `name is string`) só entram com os testes de emulador de S3.1, para não arriscar rejeitar gravações legítimas.
- [x] Criar `firestore.indexes.json` (vazio: `{"indexes":[],"fieldOverrides":[]}`).
- [x] Adicionar ao `firebase.json`: `"firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }`.
- [x] Confirmado que `.github/workflows/deploy.yaml` executa `firebase deploy` sem `--only hosting` → passa a publicar as regras automaticamente no próximo push (ver achado crítico SEG-09-rev abaixo sobre a direção real das branches).
- [x] **Provisionado `staff/{uid}`** (via API REST do Firestore, `gcloud auth print-access-token` + token OAuth do owner do projeto — sem uso do Console manual): 2 UIDs em dev real (`ads-representacoes`), 2 UIDs em prod real (`ads-representacoes-dev`). Lista completa em [`STAFF_UUIDS.md`](../../STAFF_UUIDS.md).
- [x] **Rules publicadas** em dev real (2026-07-11) e prod real (2026-07-11), nessa ordem, via `firebase deploy --only firestore:rules --project=<id>`.
- [x] **Validado deny-by-default** em ambos os projetos: requisição sem `Authorization` header contra `clients` retornou `403 Forbidden` em dev e em prod.
- [x] **Validado bloqueio de autenticado-sem-staff**: usuário logado (Firebase Auth OK) sem doc `staff/{uid}` recebeu tela vazia/erro ao carregar dados (confirmado manualmente pelo usuário em dev).
- [ ] Pendente: teste positivo (staff logado lê/escreve normalmente) — smoke test manual, não bloqueia o restante.
- **Aceite:** SDK não autenticado e autenticado fora da allowlist recebem `permission-denied` em `read`/`write` de `clients`, `budgets`, `products`, `representatives`, `meta`; app segue funcional para staff. ✔ (exceto teste positivo formal, que é apenas confirmação visual pendente)

### S0.2 — Neutralizar signup aberto (SEG-02) ✅ resolvido pela allowlist · criação de conta vazia aceita como risco residual
Verificado: **não há** `createUserWithEmailAndPassword` em `src/` — não existe fluxo de signup no código. O risco é o provedor Email/Senha do Firebase Auth aceitar cadastro direto via API key pública (chamada possível de fora do app, ex. `curl`/Postman), sem nenhuma tela no app expor isso.

**Estado atual — o que a allowlist cobre e o que não cobre:**
```
1. Alguém chama signup (fora do app, direto na API do Firebase Auth)
   → Auth ACEITA e cria a conta          ← NÃO bloqueado ainda (é o que falta em Console)
2. Essa conta faz login
   → Auth AUTENTICA normalmente           ← login sempre funciona, regras não tocam Auth
3. App tenta carregar clients/budgets/products/representatives
   → Firestore NEGA (permission-denied)   ← bloqueado pela allowlist staff/{uid} (S0.1) ✔
```
Ou seja: **dados continuam protegidos** mesmo com signup aberto (é o que os testes de deny-by-default de S0.1 comprovam). O que falta é só impedir a **criação da conta vazia** em si — hoje isso é possível e gera contas "fantasma" (sem acesso a nada, mas existentes no Auth), o que é mais um problema de higiene/UX do que de segurança de dados.

**Decisão de escopo (2026-07-11):** avaliadas 3 opções para bloquear a criação de conta em si:
1. Deixar como está (dados já protegidos pela allowlist) — **escolhida**.
2. Blocking Function (`beforeUserCreated` via Cloud Functions v2) rejeitando todo signup — tecnicamente correta (bloqueia só *criação*, preserva login de quem já existe), mas exige plano **Blaze** ativo + nova pasta `functions/` no repo — dependência nova só para resolver um risco de higiene, não de dados.
3. Desabilitar o provedor Email/Senha inteiro no Console — descartada: bloquearia login de quem **já é staff**, não só o cadastro novo (o Console não separa "permitir login" de "permitir cadastro" para este provedor).
- [x] `staff/{uid}` provisionado para os usuários legítimos (mesmo trabalho de S0.1) — allowlist já é consumida pelas regras publicadas em dev e prod.
- [x] **Decisão registrada:** contas fantasma (sem acesso a dado nenhum) são um risco residual aceito — não é uma brecha de segurança, é ruído no Auth. Reavaliar apenas se o volume de contas fantasma virar problema operacional real (nesse caso, opção 2 acima é o caminho).
- **Aceite:** conta nova criada via `createUserWithEmailAndPassword` (não-staff) não consegue ler nenhuma coleção. ✔ Garantido pela allowlist (S0.1), validado com testes de deny-by-default em dev e prod. Item encerrado.

### S0.3 — Timer de auto-logout: 2h de verdade + `clearTimeout` (SEG-03 = PERF-15) ✅
Verificado: [ContextAuth.tsx:70](../../src/context/ContextAuth.tsx#L70) usava `6 * 60 * 60 * 5000` (≈30 h) e não havia `clearTimeout`; `scheduleAutoLogout` roda no `login` **e** em cada `onAuthStateChanged` → timers empilhavam.
- [x] Extraída constante de módulo `SESSION_TTL_MS = 2 * 60 * 60 * 1000`.
- [x] Id do timer guardado em `useRef`; `clearTimeout` antes de reagendar, no `logout` e no cleanup do `useEffect`.
- [x] Removidos imports mortos de `ContextAuth.tsx` (`updateProfile`, `UserCredential`).
- **Aceite:** sessão expira em ~2 h; múltiplas transições de auth não acumulam timers. ✔ (build verde; validação em runtime — timer de 2h — depende de teste com fake timers em EST F1).

### S0.4 — Aliases do `.firebaserc` (SEG-09) ✅ — ⚠️ retrabalho: o fix de 2026-07-10 estava errado
**Correção de rumo (2026-07-11):** o fix original desta entrada (2026-07-10) assumiu, sem verificar, que o Project ID **sem** sufixo `-dev` seria produção — premissa falsa. A checagem cruzada de 3 fontes independentes (display name no Console, confirmação do usuário, e principalmente `VITE_FIREBASE_PROJECT_ID` em `.env.production`/`.env.development`, que é o que o app **realmente usa em runtime**) mostrou o mapeamento **oposto**:
- DEV real = Project ID **`ads-representacoes`** (display name "ads-representacoes-new-dev")
- PROD real = Project ID **`ads-representacoes-dev`** (display name "ads-representacoes-prod")
- [x] `.firebaserc` corrigido (2026-07-11) para o mapeamento **real**: `default`/`development` → `ads-representacoes`, `production` → `ads-representacoes-dev`.
- [x] Nota do `CLAUDE.md` reescrita para documentar o mapeamento real + alertar que o sufixo `-dev` **não** é confiável como indicador (sempre conferir `.env.production`).
- **🚨 Achado novo (SEG-09-rev): `deploy.yaml` tem as branches cruzadas com os ambientes reais.** `.github/workflows/deploy.yaml` roda `firebase deploy` (sem `--only`, então inclui `firestore` desde que S0.1 existe) com `--project=ads-representacoes-dev` no push para `development` (= **PROD real**) e `--project=ads-representacoes` no push para `main` (= **DEV real**). Ou seja, hoje um push para `development` publica na produção real, e um push para `main` publica no dev real. Isso é **anterior a esta sessão** e não foi corrigido — decisão de não mexer unilateralmente, pois afeta Hosting/domínios já em uso; precisa de confirmação do usuário antes de alterar `deploy.yaml`. Registrado aqui para não pushar `development` sem antes garantir `staff/{uid}` no projeto de prod real.
- **Aceite:** `firebase use production` seleciona o projeto de produção real (Project ID `ads-representacoes-dev`); docs coerentes com o comportamento real do app. ✔ (mas ver achado SEG-09-rev acima — o `deploy.yaml` ainda não foi alinhado)

---

## Fase S1 — Endurecimento do app

### S1.1 — `validateBudget` em `updateBudget` (SEG-06) ✅
- [x] Em [budgetServices.ts](../../src/services/budgetServices.ts): `updateBudget` agora chama `validateBudget(budget)` após a checagem de `budgetId`. Confirmado que o fluxo de edição ([BudgetFormPage.tsx:127](../../src/pages/BudgetFormPage/BudgetFormPage.tsx#L127)) envia `form.budget` completo — o mesmo objeto que `addBudget` já validava — então não quebra em update parcial.
- [ ] Nota de coesão: **EST F2.1 (factory) deve preservar** esta validação ao migrar os services.
- **Aceite:** update sem representante/produtos/prazo é rejeitado com mensagem clara. ✔

### S1.2 — Sanitizar IDs de URL (`^\d+$`) (SEG-07) ✅
- [x] Em `getBudgetById`: substituída a checagem `typeof` por whitelist `if (!/^\d+$/.test(budgetId)) { console.warn(...); return null; }`. Cobre também `undefined`/`null` (coerção falha o teste). É o único `get*ById` alimentado por parâmetro de URL (`Orcamentos/Editar/:id`); os demais recebem IDs de dados já em cache.
- **Aceite:** id não-numérico na URL não chega ao Firestore; UI mostra "não encontrado". ✔

### S1.3 — Feedback e endurecimento do Login (SEG-10) ✅
Verificado: [Login.tsx:23-31](../../src/components/Login/Login.tsx#L23) engolia o erro; handlers sem tipo; sem loading/disabled.
- [x] `getLoginErrorMessage(code)` mapeia `error.code` → mensagens pt-BR (`auth/invalid-credential`, `auth/too-many-requests`, `auth/network-request-failed`, etc.) e exibe via `<Alert severity="error">` (estado `error`).
- [x] Estado `submitting` desabilita o botão durante o login (guarda `if (submitting) return`) e reseta no `finally`; label vira "Entrando...".
- [x] Handlers tipados (`React.ChangeEvent<HTMLInputElement>` / `React.FormEvent`).
- [ ] **[REF UI]** Re-estilização visual (paleta/tokens) fica com a trilha UI/UX (U2) — aqui foi só o comportamento.
- **Aceite:** credencial errada mostra mensagem visível; duplo clique não dispara 2 logins. ✔ (build verde; smoke-test em runtime pende de credenciais Firebase.)

### S1.4 — Persistência de sessão única + imports mortos (SEG-13) ✅
Verificado: [firebase.ts:4](../../src/firebase.ts#L4) importava `browserLocalPersistence`/`setPersistence` sem usar.
- [x] Removidos os imports mortos de `firebase.ts` (restou só `getAuth`).
- [x] Comentário documentando a decisão: persistência é `browserSessionPersistence`, definida no login (`ContextAuth.tsx`).
- **Aceite:** uma única estratégia declarada; `firebase.ts` sem lint. ✔

---

## Fase S2 — Integridade de dados

### S2.1 — Criação atômica de documentos (SEG-05) ✅ (2026-07-11, via EST F2.1)
**Dono da implementação: EST F2.1 (factory de services).** SEG especificou e validou.
- [x] `createCrudService.add` faz o incremento do contador (`meta/{metaIdDoc}`) + o `set` do doc **na mesma** `runTransaction`.
- [x] Validado por teste de regressão (`createCrudService.test.ts`): ambos os `tx.set` passam pelo mesmo objeto de transação; simulação de falha no `set` do doc faz a transação inteira rejeitar (`.rejects.toThrow`) — sem buraco no contador. (Um reverter para `getNextId()`+`setDoc` separados quebra este teste.)
- **Aceite:** ✔ falha no `set` não deixa buraco no contador; teste de regressão verde.

### S2.2 — Validação real de CNPJ/CPF (SEG-08) ✅ (2026-07-11)
- [x] Criado `src/utils/validators.ts` com `isValidCnpj`/`isValidCpf` (módulo-11; rejeita comprimento errado, vazio/nulo e sequências repetidas). Aceitam string com ou sem máscara.
- [x] Integrado em `validateClient` (server-side guard no service): CNPJ é opcional, mas se informado precisa passar no `isValidCnpj`. **Representante não se aplica** — `IRepresentative` não tem campo de documento próprio (embute um `IClient` já validado na criação).
- [x] Erro exibido no formulário: check client-side em `CreateClientModal` e `EditClientModal` (mensagem pt-BR "CNPJ inválido. Verifique os dígitos." antes de chamar o service) + o guard do service como defesa em profundidade.
- **Aceite:** ✔ CNPJ com dígito verificador inválido é rejeitado no submit com mensagem clara; **8 testes** dos validadores verdes.
- ⚠️ **Nota de risco:** o guard também roda no `update` — editar um cliente cujo CNPJ salvo seja inválido exige corrigir o CNPJ. Comportamento intencional (força consertar dado inválido); reavaliar só se houver muito dado legado ruim.

---

## Fase S3 — Governança e testes de regras

### S3.1 — Testes de `firestore.rules` no emulador + CI ✅ código + CI aditivo (2026-07-11) · ⚠️ gate no deploy pendente
- [x] Adicionado `@firebase/rules-unit-testing@^3` + script `test:rules` (`firebase emulators:exec --only firestore --project demo-ads-rules "vitest run --config vitest.rules.config.ts"`). Config dedicada (`vitest.rules.config.ts`, env `node`, fora de `src/`) e bloco `emulators` no `firebase.json` (porta 8080, UI off, singleProjectMode). Java 21 + firebase-tools 14 já disponíveis.
- [x] **12 casos** (`test/rules/firestore.rules.test.ts`), espelhando o `firestore.rules` **versionado** (não o baseline do reporte — clients/products/representatives são staff-only **sem** validação de campo, desvio de S0.1): anônimo negado (read+write, todas as coleções); autenticado não-staff negado; staff CRUD ok em clients/products/representatives + `meta` (read/incremento); `budgets` — válido aceito, `totalValue` string/negativo e `selectedProducts` não-lista **negados**; coleção `staff` não escrevível nem pelo staff + leitura direta negada; coleção não mapeada cai no deny-by-default. **Rodam verdes localmente.**
- [x] **CI (aditivo):** criado `.github/workflows/ci.yaml` — em todo push/PR roda `lint` + `test:run` (unit) + `test:rules` (com `setup-java` + emulador). **Não** faz deploy e **não** toca `deploy.yaml`.
- [ ] ⚠️ **Gate real no `deploy.yaml` (bloquear deploy se o CI falhar):** requer editar o `deploy.yaml` (arquivo sensível — branches cruzadas, SEG-09-rev) OU habilitar branch protection exigindo o check `ci`. **Deixado como decisão do usuário** (mexe no pipeline que publica em PROD real). Sugestão pronta: adicionar um job `ci` e `needs: ci` ao job de deploy, ou marcar o workflow `ci` como required em Settings → Branches.
- **Aceite:** suíte de regras **verde** (12/12) local e no workflow `ci`; alteração de regra que quebre uma asserção falha o CI. ✔ (o bloqueio literal do deploy fica condicionado à decisão acima)

---

## Itens referenciados (dono em outra trilha — NÃO implementar aqui)

| Achado SEG | Dono | Onde |
|---|---|---|
| SEG-11 (`console.*` vaza info) | EST F4.5 (logger) + PERF P0.2 (`esbuild.drop`) | `PLANO_EXECUCAO_ESTRUTURA.md` / `PLANO_EXECUCAO_PERFORMANCE.md` |
| SEG-12 (PDF `document.write`/`ReactDOM.render`) | EST F4.3 — ✅ **Resolvido (2026-07-10)** via `openBudgetPdf()` (Blob), removendo `document.write`/`ReactDOM.render` dos 2 call sites (`Budgets.tsx` + `RecentBudgets.tsx`). Não era XSS; agora nem API legada há. | `PLANO_EXECUCAO_ESTRUTURA.md` |
| SEG-14 (config no bundle) | — informativo, sem ação | — |

---

## Log de Execução

> Formato: **data · fase/item · O QUE foi feito · POR QUÊ · verificação**.

### 2026-07-09 · Planejamento (S-plan) · Consolidação do diagnóstico em plano executável
- **O que foi feito:**
  - Verificação dos achados-chave contra o código-fonte (não confiar cegamente no relatório): SEG-01 confirmado (0 arquivos `*.rules`; `firebase.json` só `hosting`); SEG-03 confirmado (`6*60*60*5000` ≈ 30 h em `ContextAuth.tsx:70`, sem `clearTimeout`, agendamento duplicado em `login` + `onAuthStateChanged`); SEG-09 confirmado no estado atual do `.firebaserc` (com a nuance de que o CI usa `--project=<id>` direto → risco concentrado no deploy manual); SEG-13 confirmado (+ imports mortos extras em `ContextAuth.tsx`); SEG-10 e SEG-05/06/07 confirmados.
  - Reescrito o §4 do reporte (backlog → **Plano de Implementação Consolidado**, fases S0–S3 com aceites) e criado este arquivo de execução.
  - **Decisões de coesão entre trilhas** (evitar overlap): SEG-05 implementado **dentro** do factory EST F2.1 (não reescrever services 2×); SEG-11 e SEG-12 delegados aos donos EST/PERF; S1.3 (Login) fica com SEG no comportamento e com UI/UX só na re-estilização; S0.3 é o mesmo código de PERF-15 (dono: SEG).
- **Por que foi feito:** o pedido era transformar o backlog em plano real, sequenciado e sem duplicação com as demais auditorias; segurança tem prioridade máxima, por isso S0 bloqueia deploy e não depende de nenhuma outra trilha.
- **Verificação:** documentos revisados; **nenhuma** alteração em código de produção nesta etapa. Fases S0–S3 seguem `⬜ Pendente`.

### 2026-07-10 · S0 + S1 · Execução da Onda 0 (perímetro) + Onda 1 (endurecimento) — lado código
- **O que foi feito:**
  - **S0.1** — Criados `firestore.rules` (deny-by-default + allowlist `staff/{uid}` via `isStaff()`; `meta` só staff; integridade em `budgets`: `totalValue is number && >= 0`, `selectedProducts is list`) e `firestore.indexes.json`; `firebase.json` passou a referenciar `firestore.rules`/`firestore.indexes.json`. **Desvio deliberado:** asserções de campo só em `budgets` (schema confirmado em `IBudget`); `clients`/`products`/`representatives` ficam `isStaff()`-only até os testes de emulador de S3.1, para não arriscar bloquear gravações legítimas.
  - **S0.3** — `ContextAuth.tsx`: `SESSION_TTL_MS = 2*60*60*1000`, timer guardado em `useRef`, `clearTimeout` antes de reagendar + no `logout` + no cleanup do `useEffect`; removidos imports mortos `updateProfile`/`UserCredential`. Corrige o cálculo de ~30 h e o empilhamento de timers.
  - **S0.4** — `.firebaserc` corrigido (`production` → `ads-representacoes`; `default`/`development` → `-dev`); nota do `CLAUDE.md` reescrita (deixou de afirmar inversão).
  - **S1.1** — `updateBudget` agora chama `validateBudget(budget)` (paridade com `addBudget`). Confirmado que a edição envia `form.budget` completo.
  - **S1.2** — `getBudgetById` passou a exigir `^\d+$` (whitelist numérico), impedindo IDs de URL com `/`/encoding malicioso de alterarem o path do Firestore.
  - **S1.3** — `Login.tsx`: `getLoginErrorMessage(code)` + `<Alert>` para feedback pt-BR, estado `submitting` (anti-duplo-submit, label "Entrando..."), handlers tipados.
  - **S1.4** — `firebase.ts`: removidos `browserLocalPersistence`/`setPersistence` não usados; comentário fixando a decisão (persistência de sessão no login).
- **Por que foi feito:** a Onda 0 é o perímetro que bloqueia deploy de produção; a Onda 1 endurece o app sem depender de outras trilhas. Segurança tem prioridade e nenhum destes itens depende de EST/PERF/UI.
- **Arquivos:** `firestore.rules` (novo), `firestore.indexes.json` (novo), `firebase.json`, `.firebaserc`, `CLAUDE.md`, `src/context/ContextAuth.tsx`, `src/services/budgetServices.ts`, `src/components/Login/Login.tsx`, `src/firebase.ts`.
- **Verificação:** `npm run build` (tsc + vite) **verde**. Lint: **zero problemas novos** nos arquivos alterados; gate global permanece vermelho por código morto pré-existente (dono EST F0). Cross-ref: **PERF-15 resolvido por S0.3** (anotado em `PLANO_EXECUCAO_PERFORMANCE.md`).
- **⚠️ Pendências de Console/deploy (você):** provisionar `staff/{uid}` dos usuários reais **antes** de publicar as regras (evita lockout); publicar regras (dev → prod); desabilitar/restringir signup Email/Senha. Enquanto isso o **deploy de produção segue congelado** (o CI agora publica regras no push — não faça push para `main` antes dos docs `staff`).

### 2026-07-11 · S0.1 + S0.2 + S0.4 (retrabalho) · Publicação do perímetro em dev e prod reais + correção de naming
- **O que foi feito:**
  - **Achado crítico:** verificação cruzada (`Project Display Name` no Console + confirmação do usuário + `VITE_FIREBASE_PROJECT_ID` em `.env.production`/`.env.development`) revelou que o mapeamento dev/prod dos Project IDs é **contra-intuitivo**: `ads-representacoes` (sem sufixo) é o **DEV real**; `ads-representacoes-dev` (com sufixo) é o **PROD real**. O fix de S0.4 do dia anterior (2026-07-10) tinha assumido o oposto e ficou **errado** — corrigido agora.
  - **`.firebaserc`** revertido/corrigido para o mapeamento real; **`CLAUDE.md`** reescrito com alerta explícito sobre o naming enganoso.
  - **Achado novo (SEG-09-rev):** `deploy.yaml` publica no push de `development` para o Project ID que é **PROD real**, e no push de `main` para o Project ID que é **DEV real** — branches cruzadas com os ambientes. Não corrigido nesta rodada (precisa decisão do usuário; afeta Hosting/domínios já em produção); registrado como risco ativo — **não fazer push para `development` sem `staff/{uid}` provisionado no projeto de prod real**.
  - **Provisionamento `staff/{uid}`** via API REST do Firestore (token OAuth do owner via `gcloud auth print-access-token`, sem Console manual): 2 UIDs no dev real (`ads-representacoes`), 2 UIDs no prod real (`ads-representacoes-dev`). Detalhe e histórico em `STAFF_UUIDS.md` (novo arquivo, raiz do repo).
  - **`firestore.rules` publicadas** em ambos os projetos reais, dev primeiro, depois prod, respeitando a ordem obrigatória (staff antes de rules).
  - **Validação**: requisição sem autenticação contra `clients` retornou `403 Forbidden` em dev **e** em prod; usuário autenticado sem doc `staff` confirmou (manualmente) tela vazia/erro ao carregar dados em dev.
- **Por que foi feito:** o usuário pediu para prosseguir com o deploy do perímetro de segurança (S0) em produção; a verificação de naming era pré-requisito para não publicar as regras no projeto errado (risco de lockout real ou de deixar o prod real sem proteção).
- **Arquivos:** `.firebaserc`, `CLAUDE.md`, `firestore.rules` (publicado, sem mudança de conteúdo), `STAFF_UUIDS.md` (novo).
- **Verificação:** deploys de rules confirmados via output do `firebase deploy --only firestore:rules --project=<id>` (compilação + release OK) em dev e prod; teste de deny-by-default (403 sem auth) repetido nos dois projetos.
- **Pendências:** desabilitar signup Email/Senha no Console (S0.2); decidir e corrigir o cruzamento de branches do `deploy.yaml` (SEG-09-rev) antes de qualquer novo push para `development` ou `main`.

### 2026-07-11 · S3.1 · Testes de firestore.rules no emulador + CI aditivo (Onda 2)
- **O que foi feito:**
  - `@firebase/rules-unit-testing@^3` + `test:rules` rodando o Firestore Emulator (`firebase emulators:exec`, Java 21 + firebase-tools 14 locais). Config isolada `vitest.rules.config.ts` (env `node`, `include: test/rules/**`) para não colidir com os characterization tests jsdom de EST F1. Bloco `emulators` no `firebase.json` (porta 8080, UI off).
  - **12 testes** em `test/rules/firestore.rules.test.ts` cobrindo o perímetro **publicado** (deny-by-default, allowlist `staff/{uid}`, integridade de `budgets`, proteção da coleção `staff`, coleções não mapeadas). Espelham o `firestore.rules` versionado — importante: clients/products/representatives são staff-only **sem** validação de campo (o desvio deliberado de S0.1), então os testes **não** assertam `name is string` nelas; só `budgets` tem asserção de tipo. **12/12 verdes** no emulador.
  - **CI aditivo:** `.github/workflows/ci.yaml` roda `lint + test:run + test:rules` em push/PR, com `setup-java` para o emulador. Escolhido **não** modificar o `deploy.yaml` (arquivo sensível, branches cruzadas SEG-09-rev): o novo workflow é só de verificação, não deploya.
- **Por que foi feito:** fechar a governança contínua do perímetro (S3) — uma alteração de regra que quebre uma asserção agora falha o CI. Mantém a rede de segurança das regras junto da rede de testes de código (EST F1), sem tocar o pipeline de deploy real.
- **Arquivos (novos):** `test/rules/firestore.rules.test.ts`, `vitest.rules.config.ts`, `.github/workflows/ci.yaml`. **(alterados):** `firebase.json` (bloco emulators), `package.json` (dep + script `test:rules`), `.eslintrc.cjs` (globals do Vitest também em `test/**`).
- **Verificação:** `npm run test:rules` → **12/12 verdes** (emulador sobe e desce limpo, exit 0); `npm run lint` nos **mesmos 10 pré-existentes**; `npm run build` verde.
- **⚠️ Pendência (decisão do usuário):** para o CI **bloquear** o deploy de fato, é preciso ou adicionar `needs: ci` ao job de deploy no `deploy.yaml` (edição do arquivo sensível), ou marcar o check `ci` como *required* em branch protection (Console/Settings). Não feito unilateralmente por afetar o pipeline que publica em PROD real.

### 2026-07-11 · S2 completo (S2.1 + S2.2) · Integridade de dados (Onda 3)
- **O que foi feito:**
  - **S2.1 (via EST F2.1):** a criação atômica ficou embutida no `createCrudService.add` (contador + doc na mesma `runTransaction`). SEG validou com teste de regressão em `createCrudService.test.ts` (dois `tx.set` no mesmo objeto de transação; falha no set do doc aborta tudo).
  - **S2.2:** `src/utils/validators.ts` (`isValidCnpj`/`isValidCpf`, módulo-11, rejeita sequências repetidas) + integração em `validateClient` (guard no service) + check client-side com mensagem pt-BR nos modais Create/Edit de Cliente.
- **Por que foi feito:** fechar a Fase S2 (integridade de dados) junto com a desduplicação de services da Onda 3 — a criação atômica é dono único da EST (evita reescrever services 2×) e os validadores usam a infra de testes de EST F1.
- **Arquivos:** `src/services/createCrudService.ts` (add atômico) + `createCrudService.test.ts`; `src/utils/validators.ts` + `validators.test.ts`; `src/services/clientServices.ts` (validateClient); `src/components/Modal/{Create/CreateClientModal,Edit/EditClientModal}/*` (check + mensagem).
- **Verificação:** `npm run build` verde; `npm run test:run` **49 verdes** (incl. 7 do factory + 8 dos validadores); `npm run test:rules` **12 verdes** (regras inalteradas); lint nos mesmos 10 pré-existentes.

<!--
### AAAA-MM-DD · Sx.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Arquivos:** …
- **Verificação:** aceites atendidos; build/lint/test verdes.
-->
