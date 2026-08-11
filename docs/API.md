# PropertyFlow REST API

Base URL: `/api`. JSON is used for request and response bodies. Protected routes require `Authorization: Bearer <JWT>`.

## Error format

```json
{"message":"Please check the submitted information.","error":{"code":"VALIDATION_ERROR","message":"Please check the submitted information.","details":{}}}
```

Common status codes: `401` missing/expired JWT, `403` insufficient role or ownership, `404` missing resource, `409` conflict, `422` invalid input, `500` unexpected server error. The top-level `message` is retained for older clients.

## Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register a CUSTOMER. Body: `name`, `email`, `phone?`, `password`. |
| POST | `/auth/login` | Public | Return `{ user, token }`. Body: `email`, `password`. |
| GET | `/auth/me` | Any authenticated user | Return the current safe user profile; never returns `passwordHash`. |

`409 EMAIL_ALREADY_EXISTS` is returned for duplicate email. Invalid credentials return `401 INVALID_CREDENTIALS`.

## Properties

| Method | Path | Roles | Request / response |
| --- | --- | --- | --- |
| GET | `/properties` | Public | Public AVAILABLE/RESERVED properties. `?all=true` is used by management views. |
| GET | `/properties/:id` | Public | Lookup by ID or slug. |
| POST | `/properties` | AGENT, ADMIN | Create title, slug, description, location, province, price, bedrooms, bathrooms, area, type, status, amenities and image URLs. |
| PATCH | `/properties/:id` | AGENT, ADMIN | Update supplied property fields. |
| DELETE | `/properties/:id` | ADMIN | Delete only when no leads reference the property. |
| GET | `/properties/:id/financial-fit` | CUSTOMER | Compare the customer's LoanProfile with a property. |

## Leads and CRM

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/leads` | CUSTOMER | Create a verified interest lead. Body: `propertyId`, optional `budget`, `phone`. Duplicate active customer/property leads return `409`. |
| GET | `/customers/me/leads` | CUSTOMER | Own leads only. |
| GET | `/leads` | Authenticated | CUSTOMER sees own; AGENT sees assigned; ADMIN sees all. |
| GET | `/leads/:id` | Owner/assigned agent/admin | Full lead detail. |
| PATCH | `/leads/:id` | AGENT, ADMIN | Update notes/budget; only ADMIN can reassign. |
| PATCH | `/leads/:id/status` | AGENT, ADMIN | Body: `{ "status": "CONTACTED" }`. |
| PATCH | `/leads/:id/priority` | AGENT, ADMIN | Body: LOW, MEDIUM, HIGH or HOT. |
| PUT | `/leads/:id/follow-up` | AGENT, ADMIN | Set `nextFollowUpAt` as ISO date-time. |
| POST | `/leads/:id/follow-up/complete` | AGENT, ADMIN | Complete the open follow-up. |
| GET | `/leads/:id/activities` | Lead owner/assigned agent/admin | Read-only activity timeline. |
| GET | `/leads/:id/recommendations` | AGENT, ADMIN | Alternative properties using the central matching service. |

## Appointments

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/appointments` | Authenticated | Customer-owned, agent-assigned or admin-global appointments. |
| POST | `/leads/:leadId/appointments` | AGENT, ADMIN | Create `appointmentDate`, optional status and note. |
| PATCH | `/appointments/:id` | AGENT, ADMIN | Update date, status or note. |

## Mortgage and affordability

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/calculators/mortgage` | Public | Amortization estimate from property price, down payment, rate and term. |
| POST | `/calculators/mortgage/compare` | Public | Compare 2–6 scenarios and optional stress rates. |
| POST | `/calculators/affordability` | Public | Reverse affordability estimate with adjustable DTI and safety range. |
| PUT | `/affordability/me` | CUSTOMER | Save the customer's LoanProfile assumptions. |
| POST | `/calculators/pre-qualification` | Public | Indicative property fit; returns neutral estimate statuses, never bank approval. |

## Loan applications

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/leads/:id/loan-applications` | Lead owner/assigned agent/admin | View recorded applications. |
| POST | `/leads/:id/loan-applications` | AGENT, ADMIN | Create bank name, requested amount, status, submitted date and note. |
| PATCH | `/leads/:id/loan-applications/:applicationId` | AGENT, ADMIN | Manually update application status/details. Status changes create LeadActivity. |

## Deals, dashboards and administration

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/leads/:leadId/deal` | AGENT, ADMIN | Create one deal for a CLOSED lead; backend calculates commission and optionally marks property SOLD transactionally. |
| GET | `/dashboard/customer` | CUSTOMER | Saved profile, preferences, recommendations, favourites, leads and viewings. |
| GET | `/dashboard/agent` | AGENT, ADMIN | Agent-scoped or global CRM metrics. |
| GET | `/dashboard/admin` | ADMIN | Global dashboard. |
| GET | `/analytics/sales` | AGENT, ADMIN | Sales and commission metrics. |
| GET | `/analytics/leads` | AGENT, ADMIN | Funnel and conversion metrics. |
| GET | `/analytics/properties` | AGENT, ADMIN | Inventory and property interest metrics. |
| GET | `/users` | ADMIN | Safe user list. |
| PATCH | `/users/:id/role` | ADMIN | Update a user's role. |
| GET/PUT | `/preferences/me` | CUSTOMER | Read/update property preferences. |
| GET | `/recommendations` | CUSTOMER | Ranked properties from saved profile/preferences. |
| POST | `/recommendations/calculate` | CUSTOMER | Rank using submitted preferences. |
| GET | `/health` | Public | `{ "status": "ok", "service": "propertyflow-api" }`. |
