# factory-lab

A learning lab for an autonomous coding-agent workflow.

This repo currently contains two things:

1. **A throwaway "club events" CRUD app** (`client/` + `server/`) — a
   conventional, well-layered React + Express + Postgres app that serves as
   the guinea pig the agent workflow operates on. It's disposable; don't get
   attached to it.
2. **An autonomous build pipeline** (`.factory/`, `.github/workflows/orchestrator.yml`,
   `.github/ISSUE_TEMPLATE/nlspec.md`, `.github/PULL_REQUEST_TEMPLATE/gatekeeper.md`) —
   a GitHub Actions workflow that takes a human-filed NLSpec issue and drives
   it through QA → Coder → Review → PR using Claude Code in CI, with a
   configurable merge gate. See [Agent orchestrator](#agent-orchestrator)
   below.

## App architecture

```
client/   React (Vite) frontend
server/   Express + Node API, layered as routes -> services -> data-access
tests/    tests/golden/ (hand-written harness, see below) + per-feature
          suites the QA agent adds under tests/<feature>/
```

See `server/src/` for the layering convention: routes parse HTTP and call
services; services hold validation/business logic; data-access modules hold
SQL only.

## Prerequisites

- Node.js 18+
- Docker (for local Postgres via `docker-compose.yml`)

## Quickstart

```bash
# 1. Install dependencies for both client and server
npm run install:all

# 2. Start Postgres
npm run db:up

# 3. Copy env files and adjust if needed
cp .env.example .env
cp server/.env.example server/.env

# 4. Run migrations
npm run migrate

# 5. Seed an admin user + sample events
npm run seed

# 6. Start both the API and the frontend dev server
npm run dev
```

- Frontend: http://localhost:5173 (Vite dev server, proxies `/api` to the backend)
- Backend: http://localhost:4000

The seed script creates an admin account using `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` from `server/.env` (defaults: `admin@example.com` /
`admin123`). Log in with those credentials to access `/admin`.

## Useful scripts (run from repo root)

| Script              | Description                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`        | Run client + server together                 |
| `npm run db:up`      | Start Postgres via docker-compose             |
| `npm run db:down`    | Stop Postgres                                 |
| `npm run migrate`    | Run pending database migrations               |
| `npm run migrate:down` | Roll back the most recent migration         |
| `npm run seed`       | Seed an admin user + sample events            |
| `npm test`           | Run the server test suite (Jest)              |

## Tests

`npm test` runs Jest, configured via `server/jest.config.js`, which looks for
tests under both `server/src` and the repo-level `tests/` directory
(`maxWorkers: 1`, since all suites share one Postgres database).

`tests/golden/` is a hand-written, **immutable** shared harness (`app.js`,
`db.js`, `auth.js`, `fixtures.js` — see `tests/golden/README.md` for the full
exported interface: `createTestApp()`, `resetDb()`, `seedAdmin()`/`seedUser()`,
`loginAs()`, and canonical fixtures). Every other suite under `tests/**`
imports these helpers instead of duplicating setup.

**No agent — QA, coder, or otherwise — may create, edit, or delete anything
under `tests/golden/`, for any reason.** This is enforced both by convention
(`CLAUDE.md`, `.factory/qa.nlspec.md`) and by the orchestrator's review job,
which fails the run if `tests/golden/**` appears in the diff vs `main`.

## Agent orchestrator

`.github/workflows/orchestrator.yml` drives a human-filed NLSpec issue
(`.github/ISSUE_TEMPLATE/nlspec.md`) through an autonomous pipeline:

```
issue labeled "build" (by a collaborator)
  or workflow_dispatch (issue_number, optional model override)
        │
        ▼
  guard ──▶ setup ──▶ qa ──▶ coder ──▶ review ──▶ pr
        (any failure) ──▶ report-failure (comments on the issue)
```

- **guard** — for label events, checks the label matches the configured
  trigger label and the user who applied it is a repo collaborator (so
  outside actors can't spend the API key or push code). For
  `workflow_dispatch`, always proceeds for the given `issue_number`.
- **setup** — creates (or reuses) branch `agent/issue-<n>-<slug>` and posts a
  "build started" comment on the issue.
- **qa** — Claude (per `.factory/qa.nlspec.md` + the issue body) writes
  failing tests under `tests/<feature>/`, importing the `tests/golden/`
  harness. A path-allowlist step fails the job if anything outside
  `tests/**` (excluding `tests/golden/**`) or `.github/workflows/**` was
  touched, and `npm test` must be **red** before continuing.
- **coder** — Claude (per `.factory/coder.nlspec.md`) edits `client/**` and
  `server/**`, iterating internally (`npm test` → fix → re-run) until the
  suite is **green**. A path-allowlist step fails the job if anything outside
  `client/**`/`server/**` was touched.
- **review** — Claude scores the cumulative diff vs `main` against every
  criterion in `.factory/rubric.json`, writing
  `.factory/review-result.json`; `.factory/scripts/score-rubric.js` computes
  the weighted pass/fail and posts the report as an issue comment. Also fails
  if `tests/golden/**` is in the diff.
- **pr** — opens a PR from the gatekeeper template
  (`.github/PULL_REQUEST_TEMPLATE/gatekeeper.md`) with the rubric score
  injected and linked to the issue. If `autoMerge` is `true` *and* the rubric
  passed, squash-merges immediately; otherwise leaves it for a human
  gatekeeper and comments accordingly.

### Triggering a run

- **Normal use**: as a repo collaborator, apply the configured label (default
  `build`) to an NLSpec issue.
- **Manual / one-off**: Actions tab → "Agent Orchestrator" → *Run workflow* →
  provide `issue_number` and (optionally) a `model` override for that single
  run.

### Configuration (`.factory/orchestrator.config.json`)

Human-maintained — agents are forbidden from editing `.factory/**`, so this
file is a safe place for orchestrator-only tuning:

| Key | Meaning |
| --- | --- |
| `label` | Issue label that triggers a run (default `"build"`). |
| `autoMerge` | If `true`, the `pr` job squash-merges automatically when the rubric passes. Default `false` (human-gated). |
| `qaMaxTurns` / `coderMaxTurns` / `reviewMaxTurns` | `--max-turns` passed to each stage's Claude invocation. |
| `model` | Default Claude model id for every stage (e.g. `claude-sonnet-4-6`). |
| `stageModels` | Optional per-stage overrides, e.g. `{"coder": "claude-opus-4-8"}`. Stages not listed fall back to `model`. |

**Plug-and-play models**: every stage's `--model` comes from this config (or
the `workflow_dispatch` `model` input). The workflow never hardcodes or
validates against a fixed model list — any valid Claude model id works with
no edits to the YAML.

### One-time setup

1. Add the `ANTHROPIC_API_KEY` repo secret: `gh secret set ANTHROPIC_API_KEY`.
2. Create the trigger label (default `build`): `gh label create build`.
3. Settings → Actions → General → Workflow permissions: enable "Read and
   write permissions" and "Allow GitHub Actions to create and approve pull
   requests" (the `setup`/`qa`/`coder` jobs push commits and the `pr` job
   opens PRs).
4. **Validate the spine first**: manually dispatch
   `.github/workflows/spine-test.yml` once. It spins up the same Postgres
   service container, installs/migrates, has Claude make a one-line edit, and
   runs `npm test`. Confirm it's green and pushes a commit to a scratch
   `agent/spine-test-<run id>` branch, then delete that branch and the
   workflow file. This is a `workflow_dispatch`-only check — the first real
   orchestrator run via issue label exercises a different (issue-event) code
   path in `claude-code-action`, so treat that first labeled run as a
   confirm-on-first-use step too.
5. File an NLSpec issue (`.github/ISSUE_TEMPLATE/nlspec.md`) and apply the
   `build` label as a collaborator, or use `workflow_dispatch` as above.

### Known limits

- The `review` job's prompt (including the full diff vs `main`) is passed
  through a `$GITHUB_OUTPUT` heredoc, which has a ~1 MB ceiling. Fine at this
  lab's scale; very large diffs could exceed it.
- Each stage runs against a fresh Postgres service container with migrations
  applied — no seed data persists between jobs beyond what's in the repo.

## Factory scaffolding (`.factory/`, issue & PR templates)

`.factory/qa.nlspec.md` and `.factory/coder.nlspec.md` define the QA and coder
agents' roles, allowed/forbidden paths, and workflow — these are the prompts
the orchestrator feeds Claude. `.factory/rubric.json` defines the review bar;
`.factory/ambiguity-checklist.md` is where agents record open questions
instead of guessing. See the root `CLAUDE.md` for the full authority rules.
