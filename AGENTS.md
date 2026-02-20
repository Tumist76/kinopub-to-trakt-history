You are developing a React SPA for one-way sync of watch history from Kinopub to Trakt.

## Critical project rules

1. Sync only fully completed views:
   - Movies: sync only if fully completed.
   - TV: sync only completed episodes.
   - Partial/in-progress views must never be synced.
2. Deduplication against Trakt is mandatory before sending history.
3. Trakt `client_secret` must not be stored in SPA code. Use an Auth Broker backend/serverless for token exchange/refresh.
4. UI stack requirement: use Fluent UI as the UI library. Only Fluent UI components (or project components built on top of Fluent UI) are allowed in UI code.
5. Use responsive layouts for all new UI screens.

## Documentation split

`AGENTS.md` intentionally stays short. Detailed requirements were split into docs for maintainability.
When implementing features, you may and should reference:

- `docs/sync-algorithm.md` — full sync workflow, dedup keys, edge cases, production checklist.
- `docs/trakt-api.md` — Trakt OAuth, mapping, history read/write endpoints.
- `docs/kinopub-api.md` — KinoAPI OAuth device flow, history/watching/items endpoints.

If there is a conflict between this file and docs, this file has priority for agent behavior.
