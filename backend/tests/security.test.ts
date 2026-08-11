import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../src/config/env.js";
import { allowRoles, requireAuth } from "../src/middleware/auth.js";
import { canAccessLead, managementFilter } from "../src/utils/access.js";

function response() {
  const state = { status: 200, body: null as any };
  return {
    state,
    res: {
      status(code: number) {
        state.status = code;
        return this;
      },
      json(body: any) {
        state.body = body;
        return this;
      },
    } as any,
  };
}
function invoke(handler: any, req: any) {
  const { state, res } = response();
  let next = false;
  handler(req, res, () => {
    next = true;
  });
  return { state, next };
}
const token = (overrides: Record<string, unknown> = {}) =>
  jwt.sign(
    { email: "agent@propertyflow.dev", role: Role.AGENT, ...overrides },
    env.JWT_SECRET,
    {
      subject: "agent-1",
      issuer: "propertyflow-api",
      audience: "propertyflow-web",
      expiresIn: "5m",
    },
  );

test("authentication rejects missing and malformed bearer tokens", () => {
  const missing = invoke(requireAuth, { headers: {} });
  assert.equal(missing.state.status, 401);
  assert.equal(missing.state.body.error.code, "AUTH_REQUIRED");
  const invalid = invoke(requireAuth, {
    headers: { authorization: "Bearer invalid" },
  });
  assert.equal(invalid.state.status, 401);
  assert.equal(invalid.state.body.error.code, "INVALID_TOKEN");
});
test("authentication accepts a scoped, unexpired JWT", () => {
  const req: any = { headers: { authorization: `Bearer ${token()}` } };
  const result = invoke(requireAuth, req);
  assert.equal(result.next, true);
  assert.deepEqual(req.user, {
    id: "agent-1",
    email: "agent@propertyflow.dev",
    role: Role.AGENT,
  });
});
test("role middleware enforces backend authorization", () => {
  const forbidden = invoke(allowRoles(Role.ADMIN), {
    user: { id: "agent-1", email: "agent@propertyflow.dev", role: Role.AGENT },
  });
  assert.equal(forbidden.state.status, 403);
  assert.equal(forbidden.state.body.error.code, "FORBIDDEN");
  assert.equal(
    invoke(allowRoles(Role.AGENT), {
      user: {
        id: "agent-1",
        email: "agent@propertyflow.dev",
        role: Role.AGENT,
      },
    }).next,
    true,
  );
});
test("lead ownership rules separate customer, assigned agent and admin access", () => {
  const lead = { customerId: "customer-1", assignedAgentId: "agent-1" };
  assert.equal(
    canAccessLead(
      { user: { id: "customer-1", role: Role.CUSTOMER } } as any,
      lead,
    ),
    true,
  );
  assert.equal(
    canAccessLead(
      { user: { id: "customer-2", role: Role.CUSTOMER } } as any,
      lead,
    ),
    false,
  );
  assert.equal(
    canAccessLead({ user: { id: "agent-1", role: Role.AGENT } } as any, lead),
    true,
  );
  assert.equal(
    canAccessLead({ user: { id: "agent-2", role: Role.AGENT } } as any, lead),
    false,
  );
  assert.equal(
    canAccessLead({ user: { id: "admin-1", role: Role.ADMIN } } as any, lead),
    true,
  );
});
test("management filters scope agents but not admins", () => {
  assert.deepEqual(
    managementFilter({ user: { id: "agent-1", role: Role.AGENT } } as any),
    { assignedAgentId: "agent-1" },
  );
  assert.deepEqual(
    managementFilter({ user: { id: "admin-1", role: Role.ADMIN } } as any),
    {},
  );
});
