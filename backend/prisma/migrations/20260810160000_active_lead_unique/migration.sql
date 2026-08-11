-- PostgreSQL partial unique index: one active enquiry per customer/property.
-- CLOSED and LOST records remain historical and do not block a future enquiry.
CREATE UNIQUE INDEX "Lead_customer_property_active_key"
ON "Lead" ("customerId", "propertyId")
WHERE "status" IN ('NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'BOOKING');
