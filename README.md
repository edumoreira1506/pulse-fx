# Pulse FX

Monorepo Nx com a API (`pulse-fx-api`), o frontend web (`pulse-fx-webapp`) e Postgres.

## Como subir o ambiente (Docker Compose)

O Docker Desktop precisa estar em execução antes dos comandos abaixo.

```bash
npm install
cp .env.example .env   # opcional; os valores padrão já funcionam
npm run docker:up
```

Para encerrar os containers (o volume do Postgres é mantido):

```bash
npm run docker:down
```

| Serviço  | URL                   |
| -------- | --------------------- |
| Webapp   | http://localhost:4200 |
| API      | http://localhost:3333 |
| Postgres | `localhost:5433`      |

O script `docker:up` faz o build da API e do webapp e em seguida sobe o Compose (`webapp`, `api` e `postgres`).

## Variáveis de ambiente

Copie `.env.example` para `.env` para sobrescrever os defaults do Compose.

| Variável            | Default    | Uso                       |
| ------------------- | ---------- | ------------------------- |
| `POSTGRES_USER`     | `pulse_fx` | Usuário do Postgres       |
| `POSTGRES_PASSWORD` | `pulse_fx` | Senha do Postgres         |
| `POSTGRES_DB`       | `pulse_fx` | Nome do banco             |
| `POSTGRES_PORT`     | `5433`     | Porta do Postgres no host |
| `API_PORT`          | `3333`     | Porta da API no host      |
| `WEBAPP_PORT`       | `4200`     | Porta do webapp no host   |
| `FRED_API_KEY`      | —          | Chave da API FRED (St. Louis Fed) |
| `DATABASE_URL`      | —          | Conexão Postgres da API (`localhost:5433` no host; `postgres:5432` no Compose) |

A API recebe automaticamente `DATABASE_URL` no formato:

```text
postgresql://pulse_fx:pulse_fx@postgres:5432/pulse_fx
```

Dentro da rede do Compose o Postgres continua na porta `5432`. No host a porta publicada é `5433` para não conflitar com um Postgres local.

## Decisões técnicas relevantes e trade-offs

- **Monorepo Nx** com `pulse-fx-api` (Express + TypeORM) e `pulse-fx-webapp` (React + Vite). Um único `docker compose` sobe API, web e Postgres.
- **Cache-first na observação:** cada request de card/histórico consulta a tabela `observations` antes de Olinda/FRED e faz upsert do que vier da API. Não há job agendado: a sincronização é sob demanda, com regra de “cache ainda válido” para não martelar as fontes.
- **FX em centavos truncados** na API (5,1862 → 518) para o card; o gráfico usa a cotação de venda em reais, também truncada na formatação.
- **CPI:** persistimos o índice CPIAUCSL; o card e o gráfico de detalhe mostram a inflação mês a mês derivada desse índice.
- **Favoritos** são linhas na tabela `favorites` (indicador persistido no backend). O toggle “Meus indicadores” só filtra o dashboard.

## Séries escolhidas e documentação de referência

Conjunto mínimo coerente para um MVP de câmbio BRL + macro EUA: dois pares PTAX que o usuário brasileiro acompanha no dia a dia e dois termômetros mensais (juros e preços) via FRED.

| Indicador | Identificador | Fonte | Por que está no Pulse FX | Documentação |
| --- | --- | --- | --- | --- |
| Dólar / Real | `usd-brl` | BCB Olinda `CotacaoDolarPeriodo` | Cotação PTAX de venda, referência usual de câmbio no Brasil. | https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui3/ |
| Euro / Real | `eur-brl` | BCB Olinda `CotacaoMoedaPeriodo` (`EUR`, boletim Fechamento) | Segundo par mais relevante para quem olha BRL além do dólar. | mesma PTAX / Olinda |
| Juros dos EUA | `fed-funds` | FRED `FEDFUNDS` | Taxa efetiva dos fed funds; ancora expectativas de juros globais. | https://fred.stlouisfed.org/docs/api/fred/ e https://fred.stlouisfed.org/series/FEDFUNDS |
| Índice de Preços dos EUA | `us-cpi` | FRED `CPIAUCSL` | Nível do CPI; a inflação mensal é calculada por nós. | https://fred.stlouisfed.org/series/CPIAUCSL |

BCB Dados Abertos: https://dadosabertos.bcb.gov.br/  
Chave FRED: https://fredaccount.stlouisfed.org/apikeys

## Regras de variação e janela de histórico por tipo de série

**Último valor** = observação válida mais recente já persistida (ou recém gravada após miss de cache). **Data de referência** = data dessa observação, nunca o horário da consulta.

Não interpolamos fins de semana, feriados ou buracos. Se o dia/mês não tem print, ele simplesmente não entra na série.

| Tipo | Último valor | Variação % | N | Histórico no detalhe |
| --- | --- | --- | --- | --- |
| FX diário (`usd-brl`, `eur-brl`) | Cotação de venda PTAX | `((último − valor de N dias úteis atrás) / valor de N dias úteis atrás) × 100`, usando só dias **com** cotação | **N = 5** (janela curta típica de variação cambial de uma semana útil) | `LAST_5_BUSINESS_DAY` (padrão), `LAST_30_DAYS`, `LAST_90_DAYS`, `LAST_ONE_YEAR` |
| Macro mensal (`fed-funds`, `us-cpi`) | Fed Funds = taxa do mês; CPI = inflação MoM do índice | `((mês atual − mês anterior) / mês anterior) × 100` | **N = 1 mês** (comparação com o período imediatamente anterior da série mensal; não usamos “5 dias” em série mensal) | `LAST_ONE_YEAR` (padrão), `LAST_TWO_YEARS`, `LAST_FIVE_YEARS` |

A mesma variação, último valor e data de referência do card são repetidos no painel de detalhe. O gráfico de FX é a cotação diária; o de Fed Funds é a taxa mensal; o de CPI é a inflação mensal (não o índice bruto).

### Política de sincronização (cache)

- **FX:** cache hit se existirem pelo menos 6 cotações no intervalo pedido **e** uma delas for a data de hoje no calendário de Brasília. Lookback de 14 dias corridos para cobrir fins de semana/feriados ao montar 5 dias úteis + hoje. Fora isso, chama Olinda e faz upsert.
- **FRED:** cache hit se houver observações suficientes para a janela **e** (`updated_at` de hoje **ou** o mês mais recente ≥ mês calendário anterior). Caso contrário, chama a API e faz upsert.
- Valores FRED iguais a `.` são tratados como ausentes e descartados.

Favoritos: `POST /favorites` e `DELETE /favorites/:cardIndicatorId`; `GET /cards` devolve `isFavorite`.

## Como rodar o frontend web

Com o stack Docker:

1. Suba o ambiente com `npm run docker:up`.
2. Abra http://localhost:4200.

Para desenvolvimento local com hot reload (sem Docker no webapp/API):

```bash
npm install
npx nx serve pulse-fx-webapp
```

Esse comando sobe o Vite em http://localhost:4200 e também inicia `pulse-fx-api` em http://localhost:3333. As chamadas `/api` do frontend são proxied para a API.

Para servir só a API:

```bash
npx nx serve pulse-fx-api
```

## Como rodar testes e lint

```bash
# Lint de todos os projetos
npx nx run-many -t lint

# Testes unitários (Vitest)
npx nx run-many -t test

# Typecheck
npx nx run-many -t typecheck

# Lint, testes e build em paralelo
npx nx run-many -t lint test build --parallel=3
```

Projeto específico:

```bash
npx nx lint pulse-fx-webapp
npx nx test pulse-fx-webapp
npx nx lint pulse-fx-api
```

Testes e2e (Playwright):

```bash
npx nx e2e pulse-fx-webapp-e2e
npx nx run pulse-fx-webapp-e2e:e2e-ci
```
