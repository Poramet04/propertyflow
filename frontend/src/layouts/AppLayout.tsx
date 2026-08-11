import { Outlet, Link } from "react-router-dom";
import Header from "../components/Header";
export default function AppLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="mt-20 bg-ink py-12 text-white">
        <div className="container-page flex flex-col justify-between gap-6 md:flex-row">
          <div>
            <p className="text-xl font-bold">PropertyFlow</p>
            <p className="mt-2 max-w-md text-white/60">
              A fictional portfolio platform for exploring Chonburi homes and
              planning a responsible property budget.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-white/70">
            <Link to="/properties">Properties</Link>
            <Link to="/affordability">Calculator</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
