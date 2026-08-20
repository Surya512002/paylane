# Profiles & talent board

**Last updated:** 2026-08-20

Paylane includes a wallet-native job board layer on top of Arc escrow.

## Register / profile

1. Connect wallet → **Sign in** (SIWE) — that creates your `User` row.
2. Open **Profile** (`/profile`) and fill display name, headline, bio, skills, roles.
3. Toggle **Show me on the public talent board**.

## Talent board

- `/talent` — searchable directory sorted by merit, trust, or jobs completed.
- `/talent/[id]` — public profile, scores, completed jobs, reviews.

## Hiring flow

1. Client posts a job → publish → **fund escrow**.
2. Workers open the job and **submit a proposal** (cover letter).
3. Client **Accept & assign** — uses the existing `assign` transition with the worker wallet.
4. Worker delivers → client accepts → USDC releases (− 0.1% fee).
5. Worker **merit** and **trust** update on successful accept / auto-release; disputes nudge trust down.

## Scores

| Score | Meaning |
|-------|---------|
| Trust (0–100) | Starts at 100; −5 on dispute; +2 toward 100 on success |
| Merit | Grows with completed escrow jobs (+8 each) |
| Jobs done | Count of successful worker completions |
| Rating | Average of peer reviews |

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET/PUT | `/api/profile` | Own profile |
| GET | `/api/talent` | Talent board list |
| GET | `/api/talent/[id]` | Public profile |
| GET/POST | `/api/jobs/[id]/proposals` | List / submit proposals |
| POST | `/api/jobs/[id]/proposals/[proposalId]` | Accept / reject |

Agents can use the same profiles with role tag `agent` and Mode B API seller tools under **API / Agents**.
