"import { useEffect, useState } from \"react\";
import { api } from \"@/lib/api\";
import { toast } from \"sonner\";
import { Check, X } from \"lucide-react\";

export default function AdminSellers() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState(\"pending\");
  const load = async () => { const r = await api.get(`/admin/sellers${filter ? `?status=${filter}` : \"\"}`); setList(r.data); };
  useEffect(() => { load(); }, [filter]);
  const act = async (id, seller_status) => { await api.put(`/admin/sellers/${id}`, { seller_status }); toast.success(`Seller ${seller_status}`); load(); };
  return (
    <div className=\"container-lc py-10\" data-testid=\"admin-sellers-page\">
      <h1 className=\"text-3xl font-medium\">Sellers</h1>
      <div className=\"mt-4 flex gap-2\">
        {[\"pending\", \"approved\", \"rejected\"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} data-testid={`filter-${s}`}
            className={`px-4 py-2 rounded-full text-sm border ${filter === s ? \"bg-[#2D6A4F] text-white border-[#2D6A4F]\" : \"bg-white border-[#E7E5E4]\"}`}>{s}</button>
        ))}
      </div>
      <div className=\"mt-6 grid grid-cols-1 md:grid-cols-2 gap-4\">
        {list.map((s) => (
          <div key={s.id} className=\"card-soft p-5\" data-testid={`admin-seller-${s.id}`}>
            <div className=\"font-medium\">{s.shop_name || s.name}</div>
            <div className=\"text-sm text-[#57534E]\">{s.email} · {s.phone}</div>
            <div className=\"text-sm text-[#57534E] mt-1\">{s.shop_description}</div>
            <div className=\"mt-3 flex gap-2\">
              {filter !== \"approved\" && <button onClick={() => act(s.id, \"approved\")} className=\"btn-primary text-xs !py-2 !px-4\" data-testid={`approve-${s.id}`}><Check className=\"w-3 h-3\" />Approve</button>}
              {filter !== \"rejected\" && <button onClick={() => act(s.id, \"rejected\")} className=\"btn-secondary text-xs !py-2 !px-4\" data-testid={`reject-${s.id}`}><X className=\"w-3 h-3\" />Reject</button>}
            </div>
          </div>
        ))}
        {!list.length && <div className=\"col-span-full py-12 text-center text-[#57534E]\">No sellers in this filter.</div>}
      </div>
    </div>
  );
}
"