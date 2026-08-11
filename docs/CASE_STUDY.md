# PropertyFlow — Portfolio case study

## Business problem

Property sales work is fragmented across listing pages, customer messages, spreadsheets, viewing calendars and bank follow-ups. A salesperson needs to understand what a buyer wants, whether the target price roughly fits the buyer's assumptions, what action is due next and whether the sale ultimately closed.

## Solution

PropertyFlow connects fictional Chonburi property discovery with affordability planning and a role-aware CRM. A customer can browse, calculate and submit an enquiry. The system assigns an agent, who manages stages, follow-ups, viewings, financial context, a manually recorded loan workflow and the final deal. Admins manage inventory/users and see global metrics.

## Technical challenges

- Keeping CUSTOMER, AGENT and ADMIN authorization authoritative on the backend.
- Modelling property, customer, agent, activity, appointment, loan and deal relationships without duplicating concepts.
- Preventing duplicate active enquiries and one-to-many workflow conflicts.
- Making Kanban updates responsive while rolling back failed optimistic changes.
- Keeping mortgage/pre-qualification wording and states distinct from actual bank approval.
- Recording the deal and SOLD inventory transition atomically.
- Aggregating meaningful agent-scoped versus admin-global analytics.

## Engineering decisions

- **PostgreSQL:** relational constraints and transactions match CRM workflows well.
- **Prisma:** type-safe schema relationships, migrations and Decimal support reduce boundary mistakes.
- **REST:** clear resource endpoints suit a portfolio-sized React/Express application.
- **Backend-owned authorization:** frontend guards improve UX but cannot protect data.
- **JWT + bcrypt:** demonstrates a complete authentication boundary without delegating business logic to Supabase Auth.
- **Deterministic calculations:** mortgage, affordability and matching results are testable and explainable.
- **Neutral pre-qualification states:** estimates never impersonate a lender's decision.

## What I learned / interview talking points

- Data modelling choices affect authorization and reporting as much as CRUD screens.
- Optimistic UI needs an explicit rollback path and visible saving state.
- Financial features require careful naming, precision and disclaimers—not only formulas.
- Transactions are essential when one business action updates multiple records.
- Seed quality matters in a portfolio because empty analytics cannot demonstrate the system.
- Production readiness includes error contracts, secret handling, CORS, CI and documentation, not only deployment.

## Next improvements

Automated integration tests with an isolated PostgreSQL database, rate limiting, refresh-token rotation, image upload storage, accessibility testing, observability and an actual hosted demo environment.
