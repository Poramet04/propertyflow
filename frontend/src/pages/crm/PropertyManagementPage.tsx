import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { propertyApi } from "../../services/api";
import type { Property, PropertyType } from "../../types";
import { money } from "../../utils/finance";
const blank = {
  title: "",
  slug: "",
  description: "",
  location: "",
  province: "Chonburi",
  price: 0,
  bedrooms: 1,
  bathrooms: 1,
  areaSqm: 30,
  propertyType: "CONDO" as PropertyType,
  status: "AVAILABLE",
  featured: false,
  amenities: ["24-hour security"],
  images: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  ],
};
export default function PropertyManagementPage() {
  const { token, user } = useAuth(),
    [items, setItems] = useState<Property[]>([]),
    [form, setForm] = useState<any>(blank),
    [editing, setEditing] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [message, setMessage] = useState("");
  const load = () =>
    propertyApi
      .managed(token!)
      .then(setItems)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    load();
  }, []);
  const edit = (p: Property) => {
    setEditing(p.id);
    setForm({ ...p });
    setOpen(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await propertyApi.update(token!, editing, form);
      else await propertyApi.create(token!, form);
      setMessage(editing ? "Property updated." : "Property created.");
      setOpen(false);
      setEditing(null);
      setForm(blank);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save");
    }
  };
  const remove = async (p: Property) => {
    if (!confirm(`Delete ${p.title}? This cannot be undone.`)) return;
    try {
      await propertyApi.remove(token!, p.id);
      setMessage("Property deleted.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete");
    }
  };
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="mt-2 text-4xl font-bold">Property management</h1>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setForm(blank);
            setOpen(true);
          }}
        >
          <Plus size={18} />
          Add property
        </button>
      </div>
      {message && (
        <p className="mt-4 rounded-xl bg-mint p-3 text-forest">{message}</p>
      )}
      {open && (
        <form onSubmit={save} className="panel mt-6">
          <h2 className="text-2xl font-bold">
            {editing ? "Edit property" : "Create property"}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Slug
              <input
                required
                pattern="[a-z0-9-]+"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </label>
            <label>
              Location
              <input
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
            <label>
              Price
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Bedrooms
              <input
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={(e) =>
                  setForm({ ...form, bedrooms: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Bathrooms
              <input
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={(e) =>
                  setForm({ ...form, bathrooms: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Area m²
              <input
                type="number"
                min="1"
                value={form.areaSqm}
                onChange={(e) =>
                  setForm({ ...form, areaSqm: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Type
              <select
                value={form.propertyType}
                onChange={(e) =>
                  setForm({ ...form, propertyType: e.target.value })
                }
              >
                {["CONDO", "HOUSE", "TOWNHOME", "VILLA"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["AVAILABLE", "RESERVED", "SOLD", "INACTIVE"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 xl:col-span-3">
              Description
              <input
                required
                minLength={10}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button className="btn-primary">Save property</button>
            <button
              type="button"
              className="btn-light"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="mt-7 overflow-x-auto rounded-3xl bg-white shadow-soft">
        <table className="w-full min-w-[850px] text-left">
          <thead className="border-b border-black/5 text-sm text-black/45">
            <tr>
              {[
                "Property",
                "Location",
                "Price",
                "Type",
                "Status",
                "Created",
                "Actions",
              ].map((x) => (
                <th className="p-4" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr className="border-b border-black/5" key={p.id}>
                <td className="p-4 font-semibold">{p.title}</td>
                <td className="p-4">{p.location}</td>
                <td className="p-4">{money(p.price)}</td>
                <td className="p-4">{p.propertyType}</td>
                <td className="p-4">
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-forest">
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-black/45">
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      aria-label={`Edit ${p.title}`}
                      className="rounded-lg border p-2"
                      onClick={() => edit(p)}
                    >
                      <Pencil size={16} />
                    </button>
                    {user?.role === "ADMIN" && (
                      <button
                        aria-label={`Delete ${p.title}`}
                        className="rounded-lg border p-2 text-red-600"
                        onClick={() => remove(p)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
