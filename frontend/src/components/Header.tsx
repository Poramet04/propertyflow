import { Building2, Languages, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const { isThai, pick, toggleLanguage } = useLanguage();
  const links = [
    ["/properties", pick("Properties", "อสังหาริมทรัพย์")],
    ["/affordability", pick("Affordability", "คำนวณงบประมาณ")],
    ["/cash-purchase", pick("Cash purchase", "ซื้อด้วยเงินสด")],
    ["/buying-documents", pick("Buying documents", "เอกสารซื้อบ้าน")],
    ...(user?.role === "CUSTOMER"
      ? [
          ["/customer", pick("My dashboard", "แดชบอร์ดของฉัน")],
          ["/favorites", pick("Favorites", "รายการโปรด")],
          ["/recommendations", pick("Recommendations", "รายการแนะนำ")],
          ["/my-leads", pick("My enquiries", "รายการที่สนใจ")],
        ]
      : user
        ? [["/crm", pick("CRM dashboard", "แดชบอร์ด CRM")]]
        : []),
  ];
  const close = () => setOpen(false);
  const signOut = () => {
    logout();
    close();
  };
  const languageButton = (
    <button
      type="button"
      data-no-translate
      onClick={toggleLanguage}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 font-semibold text-forest hover:bg-mint"
      aria-label={pick("Switch to Thai", "เปลี่ยนเป็นภาษาอังกฤษ")}
    >
      <Languages size={17} />
      {isThai ? "EN" : "ไทย"}
    </button>
  );
  const account = user ? (
    <>
      <span className="text-sm text-black/60">
        {pick("Hi", "สวัสดี")}, {user.name.split(" ")[0]}
      </span>
      <button
        className="flex min-h-11 items-center gap-2 font-semibold text-forest"
        onClick={signOut}
      >
        <LogOut size={17} />
        {pick("Log out", "ออกจากระบบ")}
      </button>
    </>
  ) : loading ? (
    <span className="text-sm text-black/40">
      {pick("Loading account...", "กำลังโหลดบัญชี...")}
    </span>
  ) : (
    <>
      <Link onClick={close} className="text-black/60" to="/login">
        {pick("Log in", "เข้าสู่ระบบ")}
      </Link>
      <Link onClick={close} className="btn-primary !py-2.5" to="/register">
        {pick("Get started", "เริ่มต้นใช้งาน")}
      </Link>
    </>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-sand/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-5 sm:h-20">
        <div className="flex shrink-0 items-center gap-3">
          {languageButton}
          <Link to="/" className="mr-2 flex min-w-0 items-center gap-2 border-r border-black/10 pr-5 text-lg font-bold sm:text-xl">
            <span className="rounded-xl bg-forest p-2 text-white">
              <Building2 size={20} />
            </span>
            <span className="hidden sm:inline">PropertyFlow</span>
          </Link>
        </div>
        <nav className="hidden flex-1 items-center justify-end gap-4 text-sm xl:flex">
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
          className="rounded-lg p-2 xl:hidden"
          aria-expanded={open}
          aria-label={pick("Toggle navigation", "เปิดหรือปิดเมนู")}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-page flex max-h-[calc(100vh-4rem)] flex-col gap-3 overflow-y-auto border-t border-black/5 py-4 xl:hidden">
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
