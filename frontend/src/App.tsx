import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import CrmLayout from "./layouts/CrmLayout";
import AffordabilityPage from "./pages/AffordabilityPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MyLeadsPage from "./pages/MyLeadsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import BuyingDocumentsPage from "./pages/BuyingDocumentsPage";
import DashboardPage from "./pages/crm/DashboardPage";
import LeadDetailPage from "./pages/crm/LeadDetailPage";
import PipelinePage from "./pages/crm/PipelinePage";
import PropertyManagementPage from "./pages/crm/PropertyManagementPage";
import UserManagementPage from "./pages/crm/UserManagementPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:slug" element={<PropertyDetailPage />} />
          <Route path="affordability" element={<AffordabilityPage />} />
          <Route path="buying-documents" element={<BuyingDocumentsPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route
            path="customer"
            element={
              <ProtectedRoute roles={["CUSTOMER"]}>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="recommendations"
            element={
              <ProtectedRoute roles={["CUSTOMER"]}>
                <RecommendationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-leads"
            element={
              <ProtectedRoute roles={["CUSTOMER"]}>
                <MyLeadsPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="crm"
          element={
            <ProtectedRoute roles={["AGENT", "ADMIN"]}>
              <CrmLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="properties" element={<PropertyManagementPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
