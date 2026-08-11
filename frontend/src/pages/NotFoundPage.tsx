import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="container-page py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="section-title mt-3">This page moved out</h1>
      <p className="mt-4 text-black/50">
        Let's get you back to the property search.
      </p>
      <Link className="btn-primary mt-8" to="/">
        Go home
      </Link>
    </div>
  );
}
