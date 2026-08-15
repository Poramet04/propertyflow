import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../services/api";
import { formatGregorianDate } from "../../utils/dateTime";
import type { Role, User } from "../../types";
type Row = User & {
  createdAt: string;
  _count: { customerLeads: number; assignedLeads: number };
};
export default function UserManagementPage() {
  const { token, user } = useAuth(),
    [rows, setRows] = useState<Row[]>([]),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (token)
      userApi
        .list(token)
        .then(setRows)
        .catch((e) => setMessage(e.message));
  }, [token]);
  const change = async (id: string, role: Role) => {
    try {
      await userApi.role(token!, id, role);
      setRows((x) => x.map((u) => (u.id === id ? { ...u, role } : u)));
      setMessage("User role updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update role");
    }
  };
  return (
    <>
      <p className="eyebrow">Administration</p>
      <h1 className="mt-2 text-4xl font-bold">Users</h1>
      {message && (
        <p className="mt-4 rounded-xl bg-mint p-3 text-forest">{message}</p>
      )}
      <div className="mt-7 overflow-x-auto rounded-3xl bg-white shadow-soft">
        <table className="w-full min-w-[750px] text-left">
          <thead>
            <tr className="border-b text-sm text-black/45">
              {["Name", "Email", "Role", "Leads", "Joined"].map((x) => (
                <th className="p-4" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-black/5" key={row.id}>
                <td className="p-4 font-semibold">{row.name}</td>
                <td className="p-4">{row.email}</td>
                <td className="p-4">
                  <select
                    aria-label={`Role for ${row.name}`}
                    disabled={row.id === user?.id}
                    value={row.role}
                    onChange={(e) => change(row.id, e.target.value as Role)}
                  >
                    {["CUSTOMER", "AGENT", "ADMIN"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4">
                  {row._count.customerLeads + row._count.assignedLeads}
                </td>
                <td className="p-4 text-black/45">
                  {formatGregorianDate(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
