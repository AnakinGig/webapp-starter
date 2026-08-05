# SingleStore Database Setup

This app uses [SingleStore](https://www.singlestore.com/) (MySQL wire-compatible) as its database, via the `mysql2` driver and Drizzle's MySQL dialect. Better Auth talks to it through Drizzle's MySQL adapter.

## Prerequisites

One of:

- **SingleStore Helios (cloud)** — create a free workspace at https://portal.singlestore.com. Create a database (`Create Database` in the workspace UI) and a user with access to it.
- **Local SingleStore** — run the SingleStore Docker container:
  ```bash
  docker run -d --name singlestore -p 3306:3306 \
    -e ROOT_PASSWORD=password -e SINGLESTORE_LICENSE= \
    -e SINGLESTORE_HOST=127.0.0.1 ghcr.io/singlestore-labs/singlestore:latest
  ```

## Environment variables

Copy `.env.example` to `.env` and fill in the `SINGLESTORE_*` values (validated in `src/env.js`):

| Variable | Example | Notes |
| --- | --- | --- |
| `SINGLESTORE_HOST` | `svc-xxxx-xxxxxxxx.svc.singlestore.com` | Helios: the endpoint shown under *Connect* in the workspace UI. Local: `localhost` |
| `SINGLESTORE_PORT` | `3306` | Defaults to `3306` if unset |
| `SINGLESTORE_USER` | `admin` | |
| `SINGLESTORE_PASSWORD` | — | Optional; empty passwords are treated as unset |
| `SINGLESTORE_DATABASE` | `webapp_starter` | Must already exist |
| `SINGLESTORE_SSL` | `true` | TLS is **required** by Helios. Set `"false"` for local deployments without TLS |

All `SINGLESTORE_*` variables must be non-empty strings (except password) or the app fails at startup. `SKIP_ENV_VALIDATION=1` bypasses validation entirely.

## Create the schema

All tables live in `src/server/db/schema.ts` — the example `post` table plus the Better Auth core tables (`user`, `account`, `session`, `verification`). Apply the generated migrations (`drizzle/` folder) to your empty database with:

```bash
pnpm db:migrate
```

The migrator creates a `__drizzle_migrations` log table and runs the pending `drizzle/*.sql` files in order. It does **not** introspect the database, so it works fine on SingleStore.

> **`db:push` and `db:studio` do not work with SingleStore.** drizzle-kit's push/studio commands introspect the live database through MySQL `information_schema` views that SingleStore does not implement (notably `information_schema.check_constraints`), and abort with `Table 'information_schema.check_constraints' doesn't exist`. Use the migration workflow instead:
> 1. `pnpm db:generate` — writes a new `drizzle/*.sql` from schema changes (does not need a DB connection)
> 2. `pnpm db:migrate` — applies pending migrations
>
> If you prefer to apply migrations by hand, run the `drizzle/*.sql` files through any MySQL-compatible client (e.g. `mysql --ssl-mode=REQUIRED ...` or the SingleStore CLI).

## SingleStore DDL quirks (important!)

SingleStore Helios (including the free **shared tier**) runs DDL in **columnstore mode**, which has hard constraints that the generated migrations must respect. `db:migrate` fails otherwise:

1. **Columnstore only**: `CREATE ROWSTORE TABLE` is rejected on shared tier (`This operation is not allowed in a shared tier deployment`). Plain `CREATE TABLE` (→ columnstore) is used, which is why `db:generate` output needs **no edits** for table type. Do not add `ROWSTORE` unless you are on a paid/self-managed tier with `default_table_type = 'rowstore'`.
2. **One key per table**: a columnstore table can have a primary key **or** a unique key — not both, and unique keys must cover the shard key columns. That is why `user.email` and `session.token` are **non-unique indexes** (no `.unique()` in the schema); DB-level uniqueness is not possible, so better-auth's own duplicate checks are the only guard.
3. **No foreign keys**: SingleStore does not enforce `FOREIGN KEY` constraints and rejects the DDL. `src/server/db/schema.ts` deliberately uses **no `.references()`** on columns (drizzle only emits FK clauses from those), so migrations generate FK-free. Do not add `.references()` back — plain column definitions and `relations()` are enough.
4. **Timestamp defaults**: write `sql\`CURRENT_TIMESTAMP\`` (no parentheses) in the schema — SingleStore rejects the MySQL 8 parenthesized `DEFAULT (CURRENT_TIMESTAMP)` form.
5. **AUTO_INCREMENT** on the primary key (`post.id`) is fine on columnstore.

`drizzle.config.ts` uses `tablesFilter: ["webapp-starter_*", "post", "user", "account", "session", "verification"]`, so generate covers both app tables and auth tables. New app tables must either use the `webapp-starter_` prefix or be added to the filter explicitly.

## How the connection works

- `src/server/db/index.ts` creates a `mysql2/promise` connection pool from `SINGLESTORE_*` and exports the Drizzle instance; the pool is cached on `globalThis` outside production to survive HMR.
- `drizzle.config.ts` (used by drizzle-kit CLI) builds the same credentials from `src/env.js` — keep the two in sync.
- Better Auth's `drizzleAdapter` in `src/server/better-auth/config.ts` uses `provider: "mysql"`.

## Notes and gotchas

- **TLS**: Helios endpoints require TLS; `ssl: {}` is passed to `mysql2` when `SINGLESTORE_SSL="true"` (standard CA validation). If your workspace uses a private/self-signed CA, add a CA path in `src/server/db/index.ts` instead of disabling verification.
- **Timestamps**: the previous SQLite schema stored epoch integers; MySQL uses native `TIMESTAMP` columns (`d.timestamp()`), so any code assuming numeric timestamps must use `Date` objects. Defaults must be written `sql\`CURRENT_TIMESTAMP\`` (no parens).
- **Timezone**: `TIMESTAMP` values are converted to the server session timezone on read/write. Use UTC timezones on the server or switch columns to `datetime` if this causes issues.
- **MySQL vs SingleStore**: SingleStore is MySQL-compatible, so Drizzle runs in `mysql` dialect mode — not `singlestore`. The dialect, the driver and the Better Auth provider must all stay `mysql`.
- Migrations run against the live database and require the `SINGLESTORE_*` env vars to be set (no `SKIP_ENV_VALIDATION`).
