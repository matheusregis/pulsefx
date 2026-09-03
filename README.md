# Pulse FX

MVP para acompanhar câmbio (USD/BRL) e indicadores macro relevantes a partir de fontes públicas (**BCB** e **FRED**), com dados persistidos em PostgreSQL, API própria em Node.js/TypeScript e cliente web em React/TypeScript.

> ⚠️ **Disclaimer**: Pulse FX tem finalidade exclusivamente educacional. Nada aqui é recomendação de investimento.

---

## Sumário

- [Como subir o ambiente](#como-subir-o-ambiente-docker-compose)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como rodar o frontend web (fora do Docker)](#como-rodar-o-frontend-web)
- [Como rodar testes e lint](#como-rodar-testes-e-lint)
- [Séries escolhidas](#séries-escolhidas)
- [Regra de variação percentual](#regra-de-variação-percentual)
- [Sincronização (TTL / job / endpoint admin)](#sincronização)
- [Meus indicadores (favoritos)](#meus-indicadores-favoritos)
- [Arquitetura e decisões técnicas](#arquitetura-e-decisões-técnicas)
- [Estrutura do repositório](#estrutura-do-repositório)

---

## Como subir o ambiente (Docker Compose)

Pré-requisitos: Docker + Docker Compose. Tempo esperado: < 15 min.

```bash
git clone <repo-url> pulsefx && cd pulsefx
cp .env.example .env
# edite .env e preencha FRED_API_KEY (grátis: https://fredaccount.stlouisfed.org/apikeys)
# ADMIN_SYNC_TOKEN já vem com um placeholder — troque por qualquer string de 8+ caracteres

docker compose up -d --build
```

Isso sobe 3 serviços:

| Serviço    | Porta host | Descrição                                             |
| ---------- | ---------- | ------------------------------------------------------ |
| `postgres` | `5433`     | PostgreSQL 16 (5433, não 5432 — ver nota abaixo)        |
| `api`      | `4000`     | API Node/Express; roda `prisma migrate deploy` no boot |
| `web`      | `5173`     | React build servido por Nginx                          |

Acesse **http://localhost:5173**.

> Porta do Postgres exposta em `5433` (não a padrão `5432`) só para evitar conflito com um Postgres local já rodando na máquina do desenvolvedor. Isso não afeta a comunicação `api` → `postgres` dentro da rede do compose (sempre `5432` internamente); ajuste `POSTGRES_HOST_PORT` no `.env` se preferir outra porta.

### Popular o catálogo de indicadores (seed)

As migrations criam as tabelas, mas o catálogo de indicadores (os 4 registros descritos abaixo) é populado por um seed idempotente, rodado **do host** contra o Postgres exposto pelo compose:

```bash
DATABASE_URL="postgresql://pulsefx:pulsefx@localhost:5433/pulsefx?schema=public" \
  npm run prisma:seed --workspace apps/api
```

Depois, dispare uma sincronização manual (endpoint admin — ver [Sincronização](#sincronização)) ou aguarde o job agendado:

```bash
curl -X POST http://localhost:4000/api/admin/sync -H "X-Admin-Token: <seu ADMIN_SYNC_TOKEN>"
```

### Subir só o Postgres (para rodar API/web direto no host, sem Docker)

```bash
docker compose up -d postgres
npm install
npm run prisma:migrate --workspace apps/api   # aplica migrations
npm run prisma:seed --workspace apps/api
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173 (outro terminal)
```

---

## Variáveis de ambiente

Ver [`.env.example`](.env.example) (documentado inline). Resumo:

| Variável                 | Obrigatória | Descrição                                                              |
| ------------------------ | :---------: | ------------------------------------------------------------------------ |
| `DATABASE_URL`           | sim         | Connection string do Postgres.                                          |
| `FRED_API_KEY`           | sim         | Chave da API do FRED ([obter aqui](https://fredaccount.stlouisfed.org/apikeys)). |
| `ADMIN_SYNC_TOKEN`       | sim         | Token (`X-Admin-Token`) para o endpoint de sync manual. Min. 8 chars.    |
| `SYNC_INTERVAL_MINUTES`  | não (180)   | Intervalo do job de sincronização em background.                        |
| `CORS_ORIGIN`            | não         | Origem liberada para chamar a API.                                      |
| `PORT`                   | não (4000)  | Porta da API.                                                            |
| `VITE_API_URL`           | não         | URL da API usada pelo build do frontend (build-time, Vite).             |
| `POSTGRES_USER/PASSWORD/DB` | não     | Credenciais do container Postgres.                                      |

---

## Como rodar o frontend web

Fora do Docker (com a API já rodando em `localhost:4000`):

```bash
npm run dev:web --workspace apps/web   # ou: npm run dev:web
```

Abre em `http://localhost:5173` com hot reload (Vite).

---

## Como rodar testes e lint

```bash
# unit tests (API + web) — não tocam rede nem Postgres
npm test

# só a API / só o web
npm run test:api
npm run test:web

# teste de integração (API + Postgres real) — precisa de Postgres rodando
docker compose up -d postgres
npm run prisma:migrate --workspace apps/api
DATABASE_URL="postgresql://pulsefx:pulsefx@localhost:5433/pulsefx?schema=public" \
  npm run test:integration --workspace apps/api

# lint
npm run lint
```

### Cobertura de testes (mínimo de 5 exigido)

| Arquivo                                                                                     | Camada                    |
| --------------------------------------------------------------------------------------------- | -------------------------- |
| `apps/api/src/domain/indicators/variation.test.ts`                                            | Regra de domínio (variação) |
| `apps/api/src/modules/indicators/indicator.repository.test.ts`                                | Persistência/repositório   |
| `apps/api/src/modules/indicators/indicator.routes.test.ts`                                    | HTTP (rotas)                |
| `apps/api/src/modules/sync/sync.integration.test.ts`                                          | Integração (API + Postgres) |
| `apps/web/src/lib/format.test.ts`                                                              | Frontend (lógica pura)     |
| `apps/web/src/lib/chartRange.test.ts`                                                          | Frontend (lógica pura — filtros de período) |
| `apps/web/src/components/IndicatorCard.test.tsx`                                              | Frontend (componente)       |

---

## Séries escolhidas

Duas fontes obrigatórias (BCB + FRED), quatro indicadores — um par diário (câmbio/juros BR) e um par mensal (juros/inflação EUA), para exercitar as duas regras de variação distintas exigidas pelo enunciado.

| Código           | Fonte | Série                                                  | Frequência | Por que interessa ao usuário do Pulse FX                                                                                                   |
| ----------------- | ----- | ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `USD-BRL-PTAX`    | BCB   | [Olinda/PTAX — CotacaoDolarPeriodo](https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui3/) | Diária     | Taxa de câmbio de referência do mercado brasileiro (dólar comercial, compra **e** venda); é o benchmark mais usado para conversão BRL/USD, o indicador central do produto. **"Dólar turismo" não é incluído** — o BCB não publica série pública para ele, cada banco/casa de câmbio define o próprio valor.       |
| `BR-SELIC-META`   | BCB   | [SGS série 432](https://www3.bcb.gov.br/sgspub/) — Meta Selic | Diária*    | Taxa básica de juros do Brasil; âncora do custo de capital e um dos principais fatores que movem o apetite por BRL.                         |
| `US-FEDFUNDS`     | FRED  | [FEDFUNDS](https://fred.stlouisfed.org/series/FEDFUNDS)  | Mensal     | Taxa de juros efetiva dos EUA; o diferencial de juros Brasil–EUA é um dos drivers mais citados do USD/BRL.                                  |
| `US-CPI`          | FRED  | [CPIAUCSL](https://fred.stlouisfed.org/series/CPIAUCSL)  | Mensal     | Inflação ao consumidor dos EUA; influencia a política do Fed e, por consequência, o diferencial de juros que move capital para/fora do Brasil. |

\* A série SGS 432 é publicada diariamente, mas só muda de valor nas datas de decisão do Copom — ver [Regra de variação](#regra-de-variação-percentual).

Descrições completas (incluindo limitações) também ficam na própria API — ver `GET /api/indicators/:code` e `apps/api/prisma/seed.ts` (fonte da verdade do catálogo).

---

## Regra de variação percentual

Definida em **`apps/api/src/domain/indicators/variation.ts`** (com testes em `variation.test.ts`) e usada pela API tanto no dashboard quanto no detalhe — **mesma função, mesmo resultado nos dois lugares**.

- **Último valor** = a observação mais recente já persistida no Postgres (nunca uma chamada ao vivo à fonte — ver [Sincronização](#sincronização)).
- **Data de referência** = a data da própria observação (`date`), nunca "agora"/hora da consulta.
- **Denominador**: cada indicador define um `variationWindow` (N) e um `variationLabel` (rótulo humano). O denominador é a observação **N posições atrás na lista de observações disponíveis** — não N dias de calendário. Como a lista só contém dias/meses com dado real (fins de semana, feriados e meses sem publicação simplesmente não entram), isso implementa "N dias úteis/meses anteriores **com dado disponível**" de forma automática, sem qualquer interpolação.
- **Por indicador**:
  - `USD-BRL-PTAX` (diário): N=1 → compara o fechamento mais recente com o do **último dia útil anterior com cotação**.
  - `BR-SELIC-META` (diário, mas evento-driven): N=1 → mesmo raciocínio; como o valor só muda em dia de reunião do Copom, a variação D/D-1 é 0% na maior parte dos dias e não-zero apenas quando há decisão — isso é o comportamento correto, não um bug.
  - `US-FEDFUNDS` (mensal): N=1 → mês contra mês anterior (M/M-1).
  - `US-CPI` (mensal): N=12 → variação **YoY** (ano contra ano), a convenção padrão para leitura de inflação; evita ruído de comparações mês a mês.
- **Calendário / lacunas**: nenhuma interpolação. Um dia/mês sem dado é tratado como "não existe" na série armazenada — a comparação avança para o próximo ponto real disponível. Isso é deliberado: interpolar preço de mercado financeiro é enganoso; a regra aqui é simples e honesta, ao custo de, ocasionalmente, comparar contra um ponto um pouco mais distante no tempo do que N dias de calendário sugeriria.
- **Casos degenerados**: histórico insuficiente (`insufficient-history`) ou denominador zero (`zero-denominator`) retornam `variationPercent: null` explicitamente — nunca `NaN`/`Infinity` silenciosos.

### Janela de histórico (detalhe/gráfico)

Cada indicador também define `historyWindow` — quantas observações mais recentes aparecem no gráfico/tabela da tela de detalhe:

- `USD-BRL-PTAX`: 90 (≈ 4 meses de pregões).
- `BR-SELIC-META`: 180 (≈ 6 meses).
- `US-FEDFUNDS`: 24 (2 anos de meses).
- `US-CPI`: 36 (3 anos — suficiente para comparações YoY em qualquer ponto do período exibido).

---

## Sincronização

Política de atualização (evita chamadas descontroladas às APIs externas):

1. **Job agendado** (`node-cron`, `apps/api/src/modules/sync/sync.scheduler.ts`): roda a cada `SYNC_INTERVAL_MINUTES` (padrão 180min) e faz upsert das observações mais recentes de todos os indicadores.
2. **Endpoint admin protegido**: `POST /api/admin/sync` com header `X-Admin-Token: <ADMIN_SYNC_TOKEN>` — dispara sync sob demanda (útil para o primeiro boot ou debugging).
3. **Leituras nunca chamam a fonte externa diretamente**: `GET /api/indicators` e `GET /api/indicators/:code` só leem do Postgres. Isso limita as chamadas a BCB/FRED a uma cadência fixa, independente de quantos usuários acessam o dashboard.
4. **Upsert idempotente**: cada observação é chaveada por `(indicatorId, date)` — reprocessar o mesmo período nunca duplica linhas.

---

## Meus indicadores (favoritos)

Sem sistema de contas (fora de escopo, §8 do briefing). Estratégia adotada:

- O frontend gera um **id anônimo por dispositivo** (`crypto.randomUUID()`), persiste em `localStorage` (`apps/web/src/lib/clientId.ts`) e o envia em todo request de favoritos via header `X-Client-Id`.
- O backend persiste de verdade em Postgres (tabela `Favorite`, chave única `(clientId, indicatorId)`) — **não** é um favorito só no `localStorage`; ele sobrevive a limpar cache do navegador só se for o mesmo id (que também será perdido se o `localStorage` for limpo — trade-off aceito para um MVP sem login).

---

## Arquitetura e decisões técnicas

- **Monorepo** (`apps/api`, `apps/web`) via npm workspaces — um único repo, um único README raiz, conforme preferência do enunciado.
- **Backend**: Express + TypeScript (não NestJS) — optei por um framework mais leve porque o volume de features do MVP não justificava o overhead de DI/decorators do Nest neste prazo; a separação em camadas (`domain/` → `infra/` → `modules/{controller,service,repository,routes}`) segue os mesmos princípios (SRP, inversão de dependência via injeção por construtor) que o Nest daria de graça. Repositórios e serviços recebem dependências no construtor (com defaults), o que already permite injeção de fakes nos testes sem um container de DI.
- **ORM**: Prisma — migrations versionadas em `apps/api/prisma/migrations/`, schema como fonte única de verdade, `Decimal` para valores monetários/percentuais (evita erro de ponto flutuante).
- **Sem tabela de "shared types" entre API e web**: os DTOs são duplicados (`apps/web/src/types.ts` espelha `apps/api/src/modules/indicators/indicator.dto.ts`) em vez de um pacote `packages/shared`. Para 2 tipos de payload isso reduz complexidade de build (sem publicar/linkar um pacote interno) às custas de precisar manter os dois em sincronia manualmente — trade-off razoável neste tamanho de projeto; um pacote compartilhado seria o próximo passo natural se o produto crescesse.
- **Gráfico do detalhe** (`apps/web/src/components/PriceChart.tsx`): SVG desenhado à mão (sem lib de charting) — área com gradiente colorida por tendência (verde/vermelho, estilo CoinMarketCap), crosshair com tooltip no hover (mouse) e no toque (touch, sem travar o scroll da página). Para uma série de dezenas/poucas centenas de pontos isso evita uma dependência pesada e mantém o componente trivial de testar; se o produto precisasse de zoom/brush mais sofisticado, trocaria por uma lib (ex. Recharts/visx).
- **Filtros de período** (`apps/web/src/lib/chartRange.ts`, requisito §4): janelas oferecidas dependem da frequência do indicador e de quanto histórico existe — 7D/30D/90D/180D para séries diárias, 12M/24M/36M para mensais, sempre com "Tudo". A opção padrão é a mais curta disponível (foco no dado recente), igual à maioria dos apps de cotação.
- **Compra e venda**: quando o indicador tem `secondaryValueLabel` (hoje só `USD-BRL-PTAX`), card e detalhe mostram os dois valores lado a lado. A regra de variação (§ acima) continua usando só o valor primário (venda) — não há uma segunda variação para o valor de compra.
- **Mobile-first**: grid de 1 coluna e barra de navegação fixa no rodapé abaixo de 760px; nav no topo e grid multi-coluna acima disso. Fonte `Inter` (texto) + `JetBrains Mono` (valores numéricos, alinhamento tabular) via Google Fonts.
- **Erros HTTP**: `express-async-errors` + um único error handler central em `app.ts`, para não espalhar `try/catch` em cada controller (favoritos usam `try/catch` local apenas para diferenciar 404 de erro genérico).
- **Logs**: `pino`/`pino-http`, JSON estruturado.

---

## Estrutura do repositório

```
pulsefx/
├── docker-compose.yml
├── .env.example
├── package.json                 # workspaces raiz
└── apps/
    ├── api/
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   ├── seed.ts          # catálogo de indicadores (fonte da verdade)
    │   │   └── migrations/
    │   └── src/
    │       ├── domain/          # regras de negócio puras (variação, erros)
    │       ├── infra/           # Prisma client, clientes HTTP (BCB, FRED)
    │       ├── modules/
    │       │   ├── indicators/  # controller/service/repository/routes/dto
    │       │   ├── favorites/
    │       │   └── sync/        # sync service + scheduler + endpoint admin
    │       ├── middleware/      # requireClientId, requireAdminToken
    │       └── app.ts / index.ts
    └── web/
        └── src/
            ├── components/      # IndicatorCard, LineChart, VariationBadge, Layout, Disclaimer
            ├── pages/           # Dashboard, IndicatorDetail
            ├── hooks/           # useIndicators, useIndicatorDetail, useFavorites
            └── lib/             # apiClient, format, clientId
```
