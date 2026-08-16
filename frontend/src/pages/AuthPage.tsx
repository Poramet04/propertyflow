import { Building2, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { ApiError, authApi } from "../services/api";
const demos = [
  ["Customer", "customer@propertyflow.dev", "Customer123!"],
  ["Agent", "agent@propertyflow.dev", "Agent123!"],
  ["Admin", "admin@propertyflow.dev", "Admin123!"],
] as const;
export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const nav = useNavigate(),
    location = useLocation(),
    { authenticate } = useAuth(),
    { pick } = useLanguage();
  const [form, setForm] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    }),
    [error, setError] = useState(""),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [showPassword, setShowPassword] = useState(false),
    [showConfirmPassword, setShowConfirmPassword] = useState(false),
    [busy, setBusy] = useState(false);
  const showDemo = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== "false";
  const passwordRules = [
    {
      label: pick("At least 8 characters", "อย่างน้อย 8 ตัวอักษร"),
      met: form.password.length >= 8,
    },
    {
      label: pick("One lowercase letter", "ตัวพิมพ์เล็กอย่างน้อย 1 ตัว"),
      met: /[a-z]/.test(form.password),
    },
    {
      label: pick("One uppercase letter", "ตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว"),
      met: /[A-Z]/.test(form.password),
    },
    {
      label: pick("One number", "ตัวเลขอย่างน้อย 1 ตัว"),
      met: /[0-9]/.test(form.password),
    },
  ];
  const validateRegistration = () => {
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2)
      errors.name = pick(
        "Enter a full name with at least 2 characters.",
        "กรุณากรอกชื่อ–นามสกุลอย่างน้อย 2 ตัวอักษร",
      );
    if (!/^[0-9+() -]{6,30}$/.test(form.phone.trim()))
      errors.phone = pick(
        "Enter a valid phone number using 6–30 digits or phone symbols.",
        "กรุณากรอกเบอร์โทร 6–30 ตัว โดยใช้ตัวเลขหรือเครื่องหมายโทรศัพท์เท่านั้น",
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = pick(
        "Enter a valid email address.",
        "กรุณากรอกอีเมลให้ถูกต้อง",
      );
    const passwordProblems = [
      form.password.length < 8
        ? pick("at least 8 characters", "อย่างน้อย 8 ตัวอักษร")
        : "",
      !/[a-z]/.test(form.password)
        ? pick("a lowercase letter", "ตัวพิมพ์เล็ก")
        : "",
      !/[A-Z]/.test(form.password)
        ? pick("an uppercase letter", "ตัวพิมพ์ใหญ่")
        : "",
      !/[0-9]/.test(form.password) ? pick("a number", "ตัวเลข") : "",
    ].filter(Boolean);
    if (passwordProblems.length)
      errors.password = pick(
        `Password still needs: ${passwordProblems.join(", ")}.`,
        `รหัสผ่านยังขาด: ${passwordProblems.join(", ")}`,
      );
    if (!form.confirmPassword)
      errors.confirmPassword = pick(
        "Enter the password again.",
        "กรุณากรอกรหัสผ่านอีกครั้ง",
      );
    else if (form.confirmPassword !== form.password)
      errors.confirmPassword = pick(
        "Passwords do not match.",
        "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
      );
    return errors;
  };
  const translateApiFieldError = (field: string, message: string) => {
    const known: Record<string, string> = {
      "Full name must contain at least 2 characters": "กรุณากรอกชื่อ–นามสกุลอย่างน้อย 2 ตัวอักษร",
      "Full name must contain no more than 100 characters": "ชื่อ–นามสกุลต้องไม่เกิน 100 ตัวอักษร",
      "Enter a valid email address": "กรุณากรอกอีเมลให้ถูกต้อง",
      "Invalid phone number": "กรุณากรอกเบอร์โทรให้ถูกต้อง",
      "Password must contain at least 8 characters": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
      "Password must contain no more than 100 characters": "รหัสผ่านต้องไม่เกิน 100 ตัวอักษร",
      "Password must include a lowercase letter": "รหัสผ่านต้องมีตัวพิมพ์เล็ก",
      "Password must include an uppercase letter": "รหัสผ่านต้องมีตัวพิมพ์ใหญ่",
      "Password must include a number": "รหัสผ่านต้องมีตัวเลข",
    };
    return pick(message, known[message] ?? `${field}: ${message}`);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (mode === "register") {
      const validationErrors = validateRegistration();
      if (Object.keys(validationErrors).length) {
        setFieldErrors(validationErrors);
        setError(
          pick(
            "Please correct the highlighted fields.",
            "กรุณาแก้ไขข้อมูลในช่องที่ระบุ",
          ),
        );
        return;
      }
    }
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await authApi.login(form)
          : await authApi.register({
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
            });
      authenticate(result);
      const intended = (location.state as { from?: string } | null)?.from;
      nav(
        intended || (result.user.role === "CUSTOMER" ? "/properties" : "/crm"),
        { replace: true },
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.details &&
        typeof err.details === "object"
      ) {
        const details = err.details as Record<string, string[]>;
        setFieldErrors(
          Object.fromEntries(
            Object.entries(details)
              .filter(([, messages]) => messages?.length)
              .map(([field, messages]) => [
                field,
                messages
                  .map((message) => translateApiFieldError(field, message))
                  .join(" "),
              ]),
          ),
        );
        setError(
          pick(
            "Please correct the highlighted fields.",
            "กรุณาแก้ไขข้อมูลในช่องที่ระบุ",
          ),
        );
      } else if (err instanceof ApiError && err.code === "EMAIL_ALREADY_EXISTS") {
        setFieldErrors({
          email: pick(
            "An account with this email already exists.",
            "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น",
          ),
        });
        setError(
          pick(
            "This email is already registered.",
            "ไม่สามารถสร้างบัญชีด้วยอีเมลนี้ได้",
          ),
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : pick(
                "Something went wrong. Please try again.",
                "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
              ),
        );
      }
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
        <form onSubmit={submit} className="panel" noValidate={mode === "register"}>
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
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  />
                  {fieldErrors.name && <span id="name-error" className="mt-2 block text-xs text-red-700">{fieldErrors.name}</span>}
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
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                  />
                  {fieldErrors.phone && <span id="phone-error" className="mt-2 block text-xs text-red-700">{fieldErrors.phone}</span>}
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
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email && <span id="email-error" className="mt-2 block text-xs text-red-700">{fieldErrors.email}</span>}
            </label>
            <label>
              <span className="form-label">Password</span>
              <div className="relative">
                <input
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  maxLength={100}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-12"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-black/45 hover:text-forest"
                  aria-label={showPassword ? pick("Hide password", "ซ่อนรหัสผ่าน") : pick("Show password", "แสดงรหัสผ่าน")}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && <span id="password-error" className="mt-2 block text-xs text-red-700">{fieldErrors.password}</span>}
              {mode === "register" && (
                <div className="mt-3 rounded-xl bg-black/[0.035] p-3">
                  <p className="text-xs font-semibold text-black/55">
                    {pick("Password must include:", "รหัสผ่านต้องประกอบด้วย:")}
                  </p>
                  <ul className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
                    {passwordRules.map((rule) => (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-2 ${
                          rule.met ? "text-forest" : "text-black/45"
                        }`}
                      >
                        {rule.met ? (
                          <CheckCircle2 size={15} aria-hidden="true" />
                        ) : (
                          <Circle size={15} aria-hidden="true" />
                        )}
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </label>
            {mode === "register" && (
              <label>
                <span className="form-label">Confirm password</span>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8}
                    maxLength={100}
                    required
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className="pr-12"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-black/45 hover:text-forest"
                    aria-label={showConfirmPassword ? pick("Hide confirmation password", "ซ่อนรหัสผ่านยืนยัน") : pick("Show confirmation password", "แสดงรหัสผ่านยืนยัน")}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span id="confirm-password-error" className="mt-2 block text-xs text-red-700">{fieldErrors.confirmPassword}</span>}
              </label>
            )}
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
