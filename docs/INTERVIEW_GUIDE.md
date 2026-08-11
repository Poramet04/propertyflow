# PropertyFlow interview guide

## What is PropertyFlow?

A full-stack portfolio application connecting fictional property discovery, affordability planning and a real-estate sales CRM in one workflow.

## Why did you build it?

It demonstrates more than CRUD: multiple roles, ownership rules, financial logic, transactions, workflow history and analytics all share one relational model.

## What was the hardest technical challenge?

Keeping lead access, activity history and multi-record deal changes consistent. I enforced scope on the backend and used Prisma transactions where an action must succeed as one unit.

## How does authentication work?

Registration hashes passwords with bcrypt. Login returns a signed, seven-day JWT. Middleware verifies signature, expiry, issuer and audience before attaching the user identity.

## How does authorization work?

Routes check roles and controllers/services check ownership: customers access their own leads, agents their assigned leads and admins global data. Frontend guards are only a UX layer.

## How is affordability calculated?

The backend applies an adjustable DTI assumption to total income, subtracts current monthly debt, then reverses the amortization formula to estimate loan and property capacity.

## Why is pre-qualification not approval?

It uses user-entered assumptions and cannot assess bank policy, credit history, verified income or valuation. It returns neutral estimate statuses; bank approval is recorded manually in a separate workflow.

## How does the CRM pipeline work?

Leads move through seven stages. Kanban updates optimistically, persist through the API and roll back on failure. Backend changes generate timeline activities.

## How is commission calculated?

The frontend submits sale price and a decimal rate such as `0.03`. The backend calculates amount and stores Decimal values; it never trusts a submitted commission amount.

## Why PostgreSQL and Prisma?

PostgreSQL supplies relationships, constraints, indexes and transactions. Prisma adds typed queries, migrations and clear relation modelling for TypeScript.

## How would you scale it?

Separate stateless API instances, use pooled database connections, paginate CRM lists, cache read-heavy property queries, queue notifications and add observability. Authorization would remain server-owned.

## What would you improve next?

Isolated integration tests, refresh tokens, rate limiting, Cloudinary/object storage, accessibility automation, audit retention policies and a monitored deployed demo.
