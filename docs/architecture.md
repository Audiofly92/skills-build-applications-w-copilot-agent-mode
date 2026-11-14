# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep page components responsible for rendering and user interaction, and use the shared API client for relative `/api` requests. Each page should expose accessible loading, empty, and error states without embedding business or persistence logic.
- Logic tier decision: Keep HTTP handling in Express routes and business behavior in explicit service functions. Validate request values and referenced records before database operations, returning deliberate 4xx responses for invalid or missing resources.
- Data tier decision: Enforce required fields and domain constraints in Mongoose schemas. Keep seed records stable and idempotent through upserts; do not clear collections or change the passing seed behavior unnecessarily.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate both IDs and ensure the referenced user and team exist. Store references as `user` and `team`, compute points, set `occurredAt`, and return deliberate 4xx responses rather than cast-related 5xx errors.
- Team management approach: Require a name and mascot, validate supplied member IDs and records, and keep team/member references consistent when creating and listing teams.
- Leaderboard approach: Aggregate activity points by team, sort by total points descending, and assign 1-based ranks while returning the team name and total.
- Workout suggestions approach: Find the user by email, select suggestions based on their fitness goal or recent activity, explain the match in each suggestion's reason, and return a deliberate 4xx response when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Baseline before implementation: `npm test --prefix octofit-tracker/backend` reported 8 failed and 1 passed (the seed idempotency test). Failures indicate missing model validation and API contract defects: invalid input returned 501, leaderboard results were empty, and a workout suggestion did not match the user's goal/activity.
- Baseline before implementation: `npm test --prefix octofit-tracker/frontend` reported 15 failed. Failures cover API data/suggestion rendering and loading, empty, and error states across the pages.
- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`. Failures indicate Mongoose schema or seed contract regressions.
- API command: `npm run test:api --prefix octofit-tracker/backend`. Failures indicate route/service behavior, validation, response status/body, or API contract regressions.
- Frontend command: `npm test --prefix octofit-tracker/frontend`. Failures indicate UI rendering, API-client integration, or accessible loading/empty/error-state regressions.
- Backend build command: `npm run build --prefix octofit-tracker/backend`. Failures indicate TypeScript compilation errors in the backend.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`. Failures indicate frontend type-check or production-build errors.
- After targeted checks pass, rerun both full test suites with `npm test --prefix octofit-tracker/backend` and `npm test --prefix octofit-tracker/frontend`.
