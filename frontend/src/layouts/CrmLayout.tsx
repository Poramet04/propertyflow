import {
  BarChart3,
  Building2,
  KanbanSquare,
  Languages,
  LogOut,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
export default function CrmLayout() {
  const { user, logout } = useAuth();
  const { isThai, pick, toggleLanguage } = useLanguage();
  const links: Array<[string, LucideIcon, string]> = [
    ["/crm", BarChart3, pick("Dashboard", "แดชบอร์ด")],
    ["/crm/pipeline", KanbanSquare, pick("Pipeline", "ไปป์ไลน์")],
    ["/crm/properties", Building2, pick("Properties", "อสังหาริมทรัพย์")],
  ];
  if (user?.role === "ADMIN")
    links.push(["/crm/users", Users, pick("Users", "ผู้ใช้งาน")]);
  return (
    <div className="min-h-screen bg-[#f4f6f2] lg:flex">
      <aside className="bg-ink p-4 text-white lg:min-h-screen lg:w-72 lg:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-lg font-bold sm:text-xl">
            <span className="rounded-xl bg-forest p-2">
              <Building2 />
            </span>
            PropertyFlow CRM
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-white/60 lg:hidden"
            aria-label="Log out"
          >
            <LogOut size={19} />
          </button>
        </div>
        <p className="mt-4 text-sm text-white/50">
          {user?.name} · {user?.role}
        </p>
        <button
          type="button"
          onClick={toggleLanguage}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
          aria-label={pick("Switch to Thai", "เปลี่ยนเป็นภาษาอังกฤษ")}
        >
          <Languages size={17} /> {isThai ? "EN" : "ไทย"}
        </button>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:grid">
          {links.map(([to, Icon, label]) => (
            <NavLink
              end={to === "/crm"}
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 ${isActive ? "bg-white text-ink" : "text-white/65 hover:bg-white/10"}`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-8 hidden items-center gap-2 text-sm text-white/60 lg:flex"
        >
          <LogOut size={17} />
          {pick("Log out", "ออกจากระบบ")}
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-5 md:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
