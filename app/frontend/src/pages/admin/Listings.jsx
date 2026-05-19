"import { useEffect, useState } from \"react\";
import { api, inr } from \"@/lib/api\";
import { toast } from \"sonner\";
import { Trash2, Eye, EyeOff } from \"lucide-react\";

export default function AdminListings() {
  const [tab, setTab] = useState(\"products\");
  const [items, setItems] = useState([]);
  const load = async () => { const r = await api.get(`/admin/${tab}`); setItems(r.data); };
  useEffect(() => { load(); }, [tab]);
  const toggle = async (it) => { await api.put(`/admin/${tab}/${it.id}`, { is_approved: !it.is_approved }); toast.success(\"Updated\"); load(); };
  const del = async (id) => { if (!window.confirm(\"Delete?\")) return; await api.delete(`/admin/${tab}/${id}`); load(); };
  return (
    <div className=\"container-lc py-10\" data-testid=\"admin-listings-page\">
      <h1 className=\"text-3xl font-medium\">Listings</h1>
      <div className=\"mt-4 flex gap-2\">
        {[\"products\", \"services\"].map((t) => (
          <button key={t} onClick={() => setTab(t)} data-testid={`listings-tab-${t}`}
            className={`px-4 py-2 rounded-full text-sm border capitalize ${tab === t ? \"bg-[#2D6A4F] text-white border-[#2D6A4F]\" : \"bg-white border-[#E7E5E4]\"}`}>{t}</button>
        ))}
      </div>
      <div className=\"mt-6 card-soft overflow-x-auto\">
        <table className=\"w-full text-sm\">
          <thead className=\"bg-[#F3F4F6] text-left\">
            <tr><th className=\"px-4 py-3\">Name</th><th className=\"px-4 py-3\">Seller</th><th className=\"px-4 py-3\">Price</th><th className=\"px-4 py-3\">Approved</th><th className=\"px-4 py-3\"></th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className=\"border-t border-[#E7E5E4]\">
                <td className=\"px-4 py-3\">{i.name}</td>
                <td className=\"px-4 py-3\">{i.seller?.shop_name || \"—\"}</td>
                <td className=\"px-4 py-3\">{inr(i.price)}</td>
                <td className=\"px-4 py-3\">{i.is_approved ? \"Yes\" : \"No\"}</td>
                <td className=\"px-4 py-3 flex gap-1\">
                  <button onClick={() => toggle(i)} className=\"p-2 hover:bg-[#F3F4F6] rounded-md\" data-testid={`toggle-${i.id}`}>{i.is_approved ? <EyeOff className=\"w-4 h-4\" /> : <Eye className=\"w-4 h-4\" />}</button>
                  <button onClick={() => del(i.id)} className=\"p-2 hover:bg-red-50 text-red-600 rounded-md\" data-testid={`del-listing-${i.id}`}><Trash2 className=\"w-4 h-4\" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"