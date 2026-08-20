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

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

- Lorem ipsum dolor sit amet, consectetur adipiscing elit.
- Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.
- Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.

## Séries escolhidas e documentação de referência

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Curabitur blandit tempus porttitor.

| Série                       | Fonte / documentação                 |
| --------------------------- | ------------------------------------ |
| Lorem ipsum dolor sit amet  | https://example.com/docs/lorem-ipsum |
| Consectetur adipiscing elit | https://example.com/docs/consectetur |
| Sed do eiusmod tempor       | https://example.com/docs/tempor      |

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas faucibus mollis interdum. Vestibulum id ligula porta felis euismod semper.

## Regras de variação e janela de histórico por tipo de série

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam quis risus eget urna mollis ornare vel eu leo.

| Tipo de série    | Variação                      | Janela de histórico            |
| ---------------- | ----------------------------- | ------------------------------ |
| Lorem ipsum      | ± X% lorem ipsum dolor        | N períodos (lorem ipsum)       |
| Dolor sit amet   | ± Y% consectetur adipiscing   | M períodos (lorem ipsum)       |
| Consectetur elit | regra placeholder lorem ipsum | janela placeholder lorem ipsum |

Sed posuere consectetur est at lobortis. Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.

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
