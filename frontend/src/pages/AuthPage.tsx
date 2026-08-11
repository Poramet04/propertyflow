import { Building2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../services/api";
const demos = [
  ["Customer", "customer@propertyflow.dev", "Customer123!"],
  ["Agent", "agent@propertyflow.dev", "Agent123!"],
  ["Admin", "admin@propertyflow.dev", "Admin123!"],
] as const;
export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const nav = useNavigate(),
    location = useLocation(),
    { authenticate } = useAuth();
  const [form, setForm] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const showDemo = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== "false";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "login"
          ? await authApi.login(form)
          : await authApi.register(form);
      authenticate(result);
      const intended = (location.state as { from?: string } | null)?.from;
      nav(
        intended || (result.user.role === "CUSTOMER" ? "/properties" : "/crm"),
        { replace: true },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="container-page grid min-h-[75vh] items-center gap-8 py-8 lg:grid-cols-2 lg:gap-12 lg:py-12">
      <div className="hidden rounded-3xl bg-forest p-12 text-white lg:block">
        <Building2 size={42} />
        <h1 className="mt-16 text-5xl font-bold">
          Your property journey, organized.
        </h1>
        <p className="mt-5 text-lg leading-8 text-white/65">
          Explore homes, send verified enquiries, and follow every next step in
          one place.
        </p>
      </div>
      <div className="mx-auto w-full max-w-lg">
        <form onSubmit={submit} className="panel">
          <p className="eyebrow">
            {mode === "login" ? "Welcome back" : "Create account"}
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            {mode === "login"
              ? "Log in to PropertyFlow"
              : "Start exploring with confidence"}
          </h1>
          <div className="mt-7 grid gap-4">
            {mode === "register" && (
              <>
                <label>
                  <span className="form-label">Full name</span>
                  <input
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  <span className="form-label">Phone</span>
                  <input
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    pattern="[0-9+() \-]{6,30}"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            <label>
              <span className="form-label">Email</span>
              <input
                autoComplete="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              <span className="form-label">Password</span>
              <input
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                type="password"
                minLength={8}
                maxLength={100}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {mode === "register" && (
                <span className="mt-2 block text-xs text-black/45">
                  Use at least 8 characters with upper/lowercase letters and a
                  number.
                </span>
              )}
            </label>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button disabled={busy} className="btn-primary mt-6 w-full">
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
          <p className="mt-5 text-center text-sm text-black/50">
            {mode === "login" ? (
              <>
                New here?{" "}
                <Link
                  className="font-semibold text-forest"
                  to="/register"
                  state={location.state}
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link
                  className="font-semibold text-forest"
                  to="/login"
                  state={location.state}
                >
                  Log in
                </Link>
              </>
            )}
          </p>
        </form>
        {mode === "login" && showDemo && (
          <section className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4">
            <p className="text-sm font-bold">
              Fictional portfolio demo accounts
            </p>
            <p className="mt-1 text-xs text-black/45">
              Never use these credentials for real data.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {demos.map(([role, email, password]) => (
                <button
                  type="button"
                  key={role}
                  className="rounded-xl border bg-white px-3 py-2 text-left text-sm hover:border-forest"
                  onClick={() => setForm({ ...form, email, password })}
                >
                  <b>{role}</b>
                  <span className="block text-xs text-black/45">
                    Fill credentials
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
