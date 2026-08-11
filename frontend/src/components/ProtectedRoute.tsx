import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
export default function ProtectedRoute({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(),
    location = useLocation();
  if (loading)
    return (
      <div className="container-page py-20 text-center">
        Loading your account…
      </div>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (roles && !roles.includes(user.role))
    return (
      <Navigate to={user.role === "CUSTOMER" ? "/my-leads" : "/crm"} replace />
    );
  return children;
}
