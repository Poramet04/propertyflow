import type {
  AffordabilityInput,
  AffordabilityResult,
  Appointment,
  AuthResult,
  CustomerDashboard,
  DashboardData,
  Lead,
  LeadActivity,
  LeadAnalytics,
  LeadPriority,
  LeadStatus,
  LoanApplication,
  LoanApplicationStatus,
  MortgageComparison,
  MortgageInput,
  MortgageResult,
  PreQualificationResult,
  Property,
  PropertyAnalytics,
  PropertyPreference,
  RecommendationResponse,
  SalesAnalytics,
  User,
} from "../types";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
const fallbackMessage: Record<number, string> = {
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested information could not be found.",
  409: "This action conflicts with an existing record.",
  422: "Please check the information you entered.",
  500: "The service encountered an error. Please try again.",
};
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new ApiError(
      "Unable to reach PropertyFlow. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      fallbackMessage[res.status] ||
      "Request failed.";
    const error = new ApiError(
      message,
      res.status,
      data?.error?.code || `HTTP_${res.status}`,
      data?.error?.details,
    );
    if (res.status === 401 && path !== "/auth/login")
      window.dispatchEvent(new Event("propertyflow:unauthorized"));
    throw error;
  }
  return data as T;
}
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
export const propertyApi = {
  list: (): Promise<Property[]> => request<Property[]>("/properties"),
  managed: (token: string): Promise<Property[]> => request<Property[]>("/properties/manage", { headers: auth(token) }),
  get: (id: string) => request<Property>(`/properties/${id}`),
  create: (token: string, body: unknown) =>
    request<Property>("/properties", {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  update: (token: string, id: string, body: unknown) =>
    request<Property>(`/properties/${id}`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  remove: (token: string, id: string) =>
    request<void>(`/properties/${id}`, {
      method: "DELETE",
      headers: auth(token),
    }),
};
export const authApi = {
  register: (body: unknown) =>
    request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: unknown) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: (token: string) => request<User>("/auth/me", { headers: auth(token) }),
};
export const leadApi = {
  list: (token: string) => request<Lead[]>("/leads", { headers: auth(token) }),
  mine: (token: string) =>
    request<Lead[]>("/customers/me/leads", { headers: auth(token) }),
  get: (token: string, id: string) =>
    request<Lead>(`/leads/${id}`, { headers: auth(token) }),
  create: (token: string, body: unknown) =>
    request<Lead>("/leads", {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  status: (token: string, id: string, status: LeadStatus) =>
    request<Lead>(`/leads/${id}/status`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify({ status }),
    }),
  update: (token: string, id: string, body: unknown) =>
    request<Lead>(`/leads/${id}`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  priority: (token: string, id: string, priority: LeadPriority) =>
    request<Lead>(`/leads/${id}/priority`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify({ priority }),
    }),
  followUp: (token: string, id: string, nextFollowUpAt: string) =>
    request<Lead>(`/leads/${id}/follow-up`, {
      method: "PUT",
      headers: auth(token),
      body: JSON.stringify({ nextFollowUpAt }),
    }),
  completeFollowUp: (token: string, id: string) =>
    request<Lead>(`/leads/${id}/follow-up/complete`, {
      method: "POST",
      headers: auth(token),
    }),
  activities: (token: string, id: string) =>
    request<LeadActivity[]>(`/leads/${id}/activities`, {
      headers: auth(token),
    }),
};
export const appointmentApi = {
  list: (token: string) =>
    request<Appointment[]>("/appointments", { headers: auth(token) }),
  create: (token: string, leadId: string, body: unknown) =>
    request<Appointment>(`/leads/${leadId}/appointments`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  update: (token: string, id: string, body: unknown) =>
    request<Appointment>(`/appointments/${id}`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
};
export const dealApi = {
  create: (token: string, leadId: string, body: unknown) =>
    request(`/leads/${leadId}/deal`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
};
export const dashboardApi = {
  get: (token: string) =>
    request<DashboardData>("/dashboard/agent", { headers: auth(token) }),
};
export const userApi = {
  list: (token: string) =>
    request<
      Array<
        User & {
          createdAt: string;
          _count: { customerLeads: number; assignedLeads: number };
        }
      >
    >("/users", { headers: auth(token) }),
  role: (token: string, id: string, role: User["role"]) =>
    request<User>(`/users/${id}/role`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify({ role }),
    }),
};
export const calculatorApi = {
  affordability: (body: AffordabilityInput) =>
    request<AffordabilityResult>("/calculators/affordability", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  saveAffordability: (token: string, body: AffordabilityInput) =>
    request<AffordabilityResult>("/affordability/me", {
      method: "PUT",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  mortgage: (body: MortgageInput) =>
    request<MortgageResult>("/calculators/mortgage", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  compare: (body: unknown) =>
    request<MortgageComparison>("/calculators/mortgage/compare", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  preQualification: (body: unknown) =>
    request<PreQualificationResult>("/calculators/pre-qualification", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  financialFit: (token: string, id: string) =>
    request<PreQualificationResult>(`/properties/${id}/financial-fit`, {
      headers: auth(token),
    }),
};
export const preferenceApi = {
  get: (token: string) =>
    request<PropertyPreference | null>("/preferences/me", {
      headers: auth(token),
    }),
  put: (token: string, body: PropertyPreference) =>
    request<PropertyPreference>("/preferences/me", {
      method: "PUT",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
};
export const recommendationApi = {
  get: (token: string) =>
    request<RecommendationResponse>("/recommendations", {
      headers: auth(token),
    }),
  calculate: (token: string, body: PropertyPreference) =>
    request<RecommendationResponse>("/recommendations/calculate", {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  forLead: (token: string, id: string) =>
    request<RecommendationResponse>(`/leads/${id}/recommendations`, {
      headers: auth(token),
    }),
};
export const customerDashboardApi = {
  get: (token: string) =>
    request<CustomerDashboard>("/dashboard/customer", { headers: auth(token) }),
};
export const analyticsApi = {
  leads: (token: string) =>
    request<LeadAnalytics>("/analytics/leads", { headers: auth(token) }),
  sales: (token: string) =>
    request<SalesAnalytics>("/analytics/sales", { headers: auth(token) }),
  properties: (token: string) =>
    request<PropertyAnalytics>("/analytics/properties", {
      headers: auth(token),
    }),
};
export const loanApi = {
  list: (token: string, leadId: string) =>
    request<LoanApplication[]>(`/leads/${leadId}/loan-applications`, {
      headers: auth(token),
    }),
  create: (token: string, leadId: string, body: unknown) =>
    request<LoanApplication>(`/leads/${leadId}/loan-applications`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
  update: (
    token: string,
    leadId: string,
    id: string,
    body: {
      status?: LoanApplicationStatus;
      bankName?: string;
      requestedLoanAmount?: number;
      note?: string;
      submittedAt?: string | null;
    },
  ) =>
    request<LoanApplication>(`/leads/${leadId}/loan-applications/${id}`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify(body),
    }),
};
