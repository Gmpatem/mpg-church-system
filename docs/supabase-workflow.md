# Supabase Workflow

This repository uses a local Supabase target profile so Codex, MCP, and CLI work do not get stuck on a hardcoded project.

## Project Targets

Project refs are not secrets, but local active-target state should not be committed.

```bash
npm run supabase:target:list
npm run supabase:target:set -- mpg-church
npm run supabase:mcp:write
```

The active profile is stored in `config/supabase.projects.local.json`. The committed example is `config/supabase.projects.example.json`.

Generated files:

- `.mcp.json`
- `.codex/config.toml`

Both are ignored because they represent local account/project state.

## Adding Another Project

```bash
npm run supabase:target:add -- staging abcdefghijklmnopqrst "Church staging"
npm run supabase:target:set -- staging
```

After switching, reload Codex or reconnect the Supabase MCP session if tools still point at the previous project.

## Running Migrations

Preferred Codex path:

1. Confirm the active target with `npm run supabase:target`.
2. Read the SQL migration file.
3. Use the Supabase connector `apply_migration` against the active `projectRef`.
4. Re-check the schema through a read-only probe.

CLI path:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Supabase tracks remote migration history in `supabase_migrations.schema_migrations`; repeated pushes skip migrations that are already applied.

## Account Safety

- Keep Supabase access tokens out of the repo.
- Keep `.mcp.json`, `.codex/`, and CLI temp/link state ignored.
- Use one profile per project/account combination.
- Before applying production DDL, confirm the active profile and project ref.
