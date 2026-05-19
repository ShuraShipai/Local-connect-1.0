"import { useEffect, useState } from \"react\";
import { api } from \"@/lib/api\";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get(\"/admin/users\").then((r) => setUsers(r.data)); }, []);
  return (
    <div className=\"container-lc py-10\" data-testid=\"admin-users-page\">
      <h1 className=\"text-3xl font-medium\">Users</h1>
      <div className=\"mt-6 card-soft overflow-x-auto\">
        <table className=\"w-full text-sm\">
          <thead className=\"bg-[#F3F4F6] text-left\">
            <tr><th className=\"px-4 py-3\">Name</th><th className=\"px-4 py-3\">Email</th><th className=\"px-4 py-3\">Role</th><th className=\"px-4 py-3\">Status</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className=\"border-t border-[#E7E5E4]\" data-testid={`admin-user-${u.id}`}>
                <td className=\"px-4 py-3\">{u.name}</td>
                <td className=\"px-4 py-3\">{u.email}</td>
                <td className=\"px-4 py-3 capitalize\">{u.role}</td>
                <td className=\"px-4 py-3\">{u.seller_status || \"—\"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"