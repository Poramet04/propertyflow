export type PropertyType = "CONDO" | "HOUSE" | "TOWNHOME" | "VILLA";
export type Role = "CUSTOMER" | "AGENT" | "ADMIN";
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "VIEWING"
  | "NEGOTIATION"
  | "BOOKING"
  | "CLOSED"
  | "LOST";
export type AppointmentStatus =
  "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "HOT";
export type LoanApplicationStatus =
  | "NOT_STARTED"
  | "DOCUMENT_PREPARATION"
  | "SUBMITTED_TO_BANK"
  | "UNDER_REVIEW"
  | "ADDITIONAL_DOCUMENT_REQUIRED"
  | "PRE_APPROVED"
  | "APPROVED"
  | "DECLINED"
  | "CANCELLED";
export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  province: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  propertyType: PropertyType;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "INACTIVE";
  featured: boolean;
  amenities: string[];
  images: string[];
  createdAt?: string;
  estimatedMonthlyPayment?: number;
}
export interface MortgageInput {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
}
export interface MortgageResult {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
}
export interface AffordabilityInput {
  monthlyIncome: number;
  additionalMonthlyIncome: number;
  existingDebt: number;
  creditCardMonthlyPayment?: number;
  carLoanMonthlyPayment?: number;
  personalLoanMonthlyPayment?: number;
  otherMonthlyDebt?: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
  maxDti: number;
  safetyMin: number;
  safetyMax: number;
}
export interface AffordabilityResult extends AffordabilityInput {
  totalMonthlyIncome: number;
  maxTotalDebt: number;
  maxMortgagePayment: number;
  maxLoanAmount: number;
  maxPropertyPrice: number;
  rangeMin: number;
  rangeMax: number;
  safeBudgetMin: number;
  safeBudgetMax: number;
  disclaimer?: string;
  saved?: boolean;
}
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
}
export interface AuthResult {
  token: string;
  user: User;
}
export interface LoanProfile {
  monthlyIncome: number;
  additionalMonthlyIncome: number;
  existingDebt: number;
  creditCardMonthlyPayment: number;
  carLoanMonthlyPayment: number;
  personalLoanMonthlyPayment: number;
  otherMonthlyDebt: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
  maxDti: number;
  safetyMin: number;
  safetyMax: number;
  estimatedLoanAmount: number;
  estimatedPropertyBudget: number;
}
export interface Appointment {
  id: string;
  leadId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  note: string;
  createdAt: string;
  lead?: {
    customer: { name: string };
    property: { title: string; location: string };
  };
}
export interface Deal {
  id: string;
  leadId: string;
  salePrice: number;
  commissionRate: number;
  commissionAmount: number;
  closedAt: string;
  customer?: { name: string };
  property?: { title: string };
}
export interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actor?: Pick<User, "id" | "name" | "role"> | null;
}
export interface LoanApplication {
  id: string;
  leadId: string;
  bankName: string;
  requestedLoanAmount: number;
  status: LoanApplicationStatus;
  submittedAt: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}
export interface PreQualificationResult {
  status: "LIKELY_WITHIN_ESTIMATE" | "BORDERLINE" | "ABOVE_ESTIMATED_BUDGET";
  totalMonthlyIncome: number;
  totalExistingMonthlyDebt: number;
  maxDti: number;
  maximumAllowedTotalMonthlyDebt: number;
  availableMortgagePayment: number;
  estimatedMaximumLoanAmount: number;
  estimatedMaximumPropertyPrice: number;
  targetPropertyPrice: number;
  requiredLoanAmount: number;
  estimatedMonthlyPayment: number;
  estimatedDti: number;
  disclaimer: string;
}
export interface Lead {
  id: string;
  customerId: string;
  propertyId: string;
  assignedAgentId: string;
  budget: number | null;
  phone: string | null;
  email: string;
  status: LeadStatus;
  priority: LeadPriority;
  nextFollowUpAt: string | null;
  followUpCompletedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  customer: User & { loanProfile?: LoanProfile | null };
  property: Property;
  assignedAgent: User;
  appointments: Appointment[];
  deal: Deal | null;
  activities: LeadActivity[];
  loanApplications: LoanApplication[];
}
export interface DashboardData {
  kpis: {
    totalProperties: number;
    newLeads: number;
    upcomingViewings: number;
    closedDeals: number;
    monthlySalesValue: number;
    estimatedCommission: number;
    totalLeads: number;
    activeLeads: number;
    lostLeads: number;
    todayFollowUps: number;
    overdueFollowUps: number;
  };
  admin: null | Record<string, number>;
  followUps: {
    today: Array<{
      id: string;
      customer: string;
      property: string;
      priority: LeadPriority;
      nextFollowUpAt: string;
      status: LeadStatus;
    }>;
    overdue: Array<{
      id: string;
      customer: string;
      property: string;
      priority: LeadPriority;
      nextFollowUpAt: string;
      status: LeadStatus;
    }>;
    upcoming: Array<{
      id: string;
      customer: string;
      property: string;
      priority: LeadPriority;
      nextFollowUpAt: string;
      status: LeadStatus;
    }>;
  };
  recentActivities: Array<
    LeadActivity & {
      lead: {
        id: string;
        customer: { name: string };
        property: { title: string };
      };
    }
  >;
  recentLeads: Array<
    Pick<Lead, "id" | "status" | "createdAt"> & {
      customer: { name: string };
      property: { title: string };
    }
  >;
  upcomingAppointments: Appointment[];
  recentDeals: Deal[];
}
export interface PropertyPreference {
  preferredLocations: string[];
  propertyTypes: PropertyType[];
  minBedrooms: number;
  minBathrooms: number;
  minArea: number | null;
  maxArea: number | null;
  maxMonthlyPayment: number | null;
  maxPropertyPrice: number | null;
}
export interface Recommendation {
  property: Property;
  score: number;
  estimatedMonthlyPayment: number;
  reasons: string[];
  mismatches: string[];
}
export interface RecommendationResponse {
  profile: LoanProfile | null;
  preference: PropertyPreference;
  recommendations: Recommendation[];
}
export interface MortgageComparison {
  propertyPrice: number;
  scenarios: Array<MortgageResult & { id: string }>;
  highlights: {
    lowestMonthlyPayment: string;
    lowestTotalInterest: string;
    lowestTotalRepayment: string;
  };
  stressTest: Array<MortgageResult>;
  disclaimer: string;
}
export interface CustomerDashboard {
  profile: LoanProfile | null;
  preference: PropertyPreference | null;
  recommendations: Recommendation[];
  favorites: Property[];
  leads: Lead[];
  upcomingAppointments: Array<Appointment & { property: string }>;
}
export interface LeadAnalytics {
  funnel: Record<LeadStatus, number>;
  conversions: {
    leadToViewing: number;
    viewingToBooking: number;
    bookingToClose: number;
    leadToClose: number;
  };
  followUps: Array<{
    leadId: string;
    customer: string;
    property: string;
    status: LeadStatus;
    message: string;
  }>;
}
export interface SalesAnalytics {
  monthlyClosedSalesValue: number;
  monthlyCommissions: number;
  averageSalePrice: number;
  closedDeals: number;
  averageDaysToClose: number;
}
export interface PropertyAnalytics {
  topInterested: Array<{
    id: string;
    title: string;
    leads: number;
    activeLeads: number;
  }>;
  highestActiveLeads: Array<{
    id: string;
    title: string;
    leads: number;
    activeLeads: number;
  }>;
  averagePriceByLocation: Array<{
    location: string;
    averageListedPrice: number;
    count: number;
  }>;
  inventoryByStatus: Record<string, number>;
}
