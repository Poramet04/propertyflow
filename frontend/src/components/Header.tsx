import { Building2, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function Header() {
  const [open, setOpen] = useState(false),
    { user, loading, logout } = useAuth();
  const links = [
    ["/properties", "Properties"],
    ["/affordability", "Affordability"],
    ...(user?.role === "CUSTOMER"
      ? [
          ["/customer", "My dashboard"],
          ["/recommendations", "Recommendations"],
          ["/my-leads", "My enquiries"],
        ]
      : user
        ? [["/crm", "CRM dashboard"]]
        : []),
  ];
  const close = () => setOpen(false);
  const signOut = () => {
    logout();
    close();
  };
  const account = user ? (
    <>
      <span className="text-sm text-black/60">
        Hi, {user.name.split(" ")[0]}
      </span>
      <button
        className="flex min-h-11 items-center gap-2 font-semibold text-forest"
        onClick={signOut}
      >
        <LogOut size={17} />
        Log out
      </button>
    </>
  ) : loading ? (
    <span className="text-sm text-black/40">Loading account…</span>
  ) : (
    <>
      <Link onClick={close} className="text-black/60" to="/login">
        Log in
      </Link>
      <Link onClick={close} className="btn-primary !py-2.5" to="/register">
        Get started
      </Link>
    </>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-sand/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold sm:text-xl"
        >
          <span className="rounded-xl bg-forest p-2 text-white">
            <Building2 size={20} />
          </span>
          PropertyFlow
        </Link>
        <nav className="hidden items-center gap-5 lg:flex">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-forest"
                  : "text-black/60 hover:text-ink"
              }
            >
              {label}
            </NavLink>
          ))}
          {account}
        </nav>
        <button
          className="rounded-lg p-2 lg:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-page flex max-h-[calc(100vh-4rem)] flex-col gap-3 overflow-y-auto border-t border-black/5 py-4 lg:hidden">
          {links.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={close}
              className="rounded-xl px-3 py-2 hover:bg-white"
            >
              {label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 border-t border-black/5 pt-3">
            {account}
          </div>
        </nav>
      )}
    </header>
  );
}
