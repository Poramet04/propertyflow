import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
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
  images: [],
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
  const changeImage = (index: number, value: string) => {
    const images = [...(form.images || [])];
    images[index] = value;
    setForm({ ...form, images });
  };
  const removeImage = (index: number) =>
    setForm({
      ...form,
      images: (form.images || []).filter((_: string, i: number) => i !== index),
    });
  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const images = [...(form.images || [])];
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    setForm({ ...form, images });
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
          <section className="mt-6 rounded-2xl border border-black/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Property images</h3>
                <p className="mt-1 text-sm text-black/50">
                  Add HTTPS image URLs or PropertyFlow gallery paths. The first image is the cover.
                </p>
              </div>
              <button
                type="button"
                className="btn-light"
                onClick={() =>
                  setForm({ ...form, images: [...(form.images || []), ""] })
                }
              >
                <ImagePlus size={18} /> Add image
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {(form.images || []).map((image: string, index: number) => (
                <div className="grid gap-3 rounded-2xl bg-black/[.025] p-3 md:grid-cols-[80px_minmax(0,1fr)_auto] md:items-center" key={index}>
                  <div className="h-16 overflow-hidden rounded-xl bg-black/5">
                    {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <label className="text-sm font-semibold">
                    {index === 0 ? "Cover image URL" : `Image ${index + 1} URL`}
                    <input
                      className="mt-1"
                      type="text"
                      required
                      placeholder="https://..."
                      value={image}
                      onChange={(e) => changeImage(index, e.target.value)}
                    />
                  </label>
                  <div className="flex gap-1 md:pt-5">
                    <button type="button" className="rounded-lg border p-2" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Move image up"><ArrowUp size={16} /></button>
                    <button type="button" className="rounded-lg border p-2" disabled={index === form.images.length - 1} onClick={() => moveImage(index, 1)} aria-label="Move image down"><ArrowDown size={16} /></button>
                    <button type="button" className="rounded-lg border p-2 text-red-600" onClick={() => removeImage(index)} aria-label="Remove image"><X size={16} /></button>
                  </div>
                </div>
              ))}
              {!form.images?.length && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  No images yet. The public site will use its fallback image until you add one.
                </p>
              )}
            </div>
          </section>
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
