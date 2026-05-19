"import { useEffect, useState } from \"react\";
import { api, imgUrl, inr } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";
import { Plus, Pencil, Trash2 } from \"lucide-react\";
import ImageUploader from \"@/components/marketplace/ImageUploader\";

const EMPTY = { name: \"\", description: \"\", price: 0, duration_minutes: 60, category: \"Other\", images: [] };

export default function MyServices() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => { const r = await api.get(\"/seller/services\"); setItems(r.data); };
  useEffect(() => { load(); api.get(\"/categories\").then((r) => setCats(r.data.services)); }, []);

  if (user?.seller_status !== \"approved\") return <div className=\"container-lc py-16 text-center text-[#57534E]\">Awaiting admin approval.</div>;

  const ch = (k) => (e) => setEditing({ ...editing, [k]: k === \"price\" || k === \"duration_minutes\" ? Number(e.target.value) : e.target.value });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (editing.id) await api.put(`/seller/services/${editing.id}`, editing);
      else await api.post(\"/seller/services\", editing);
      toast.success(\"Saved\"); setEditing(null); load();
    } catch { toast.error(\"Save failed\"); }
    finally { setBusy(false); }
  };
  const del = async (id) => { if (!window.confirm(\"Delete?\")) return; await api.delete(`/seller/services/${id}`); load(); };

  return (
    <div className=\"container-lc py-10\" data-testid=\"seller-services-page\">
      <div className=\"flex items-center justify-between flex-wrap gap-3\">
        <h1 className=\"text-3xl font-medium\">My services</h1>
        <button onClick={() => setEditing({ ...EMPTY, category: cats[0] || \"Other\" })} className=\"btn-primary\" data-testid=\"add-service-btn\"><Plus className=\"w-4 h-4\" />Add service</button>
      </div>
      <div className=\"mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
        {items.map((s) => (
          <div key={s.id} className=\"card-soft p-4\" data-testid={`my-service-${s.id}`}>
            <div className=\"aspect-video rounded-lg bg-[#F3F4F6] overflow-hidden mb-3\">
              {s.images?.[0] && <img src={imgUrl(s.images[0])} alt=\"\" className=\"w-full h-full object-cover\" />}
            </div>
            <div className=\"flex justify-between gap-2\">
              <div>
                <div className=\"font-medium\">{s.name}</div>
                <div className=\"text-sm text-[#57534E]\">{s.category} · {inr(s.price)} · {s.duration_minutes}m</div>
              </div>
              <div className=\"flex gap-1\">
                <button onClick={() => setEditing(s)} className=\"p-2 hover:bg-[#F3F4F6] rounded-md\" data-testid={`edit-service-${s.id}`}><Pencil className=\"w-4 h-4\" /></button>
                <button onClick={() => del(s.id)} className=\"p-2 hover:bg-red-50 text-red-600 rounded-md\" data-testid={`delete-service-${s.id}`}><Trash2 className=\"w-4 h-4\" /></button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className=\"col-span-full py-12 text-center text-[#57534E]\">No services yet.</div>}
      </div>

      {editing && (
        <div className=\"fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4\" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className=\"bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4\">
            <h2 className=\"text-2xl font-medium\">{editing.id ? \"Edit service\" : \"New service\"}</h2>
            <input required placeholder=\"Name\" data-testid=\"sf-name\" value={editing.name} onChange={ch(\"name\")} className=\"w-full h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
            <textarea placeholder=\"Description\" data-testid=\"sf-desc\" value={editing.description} onChange={ch(\"description\")} className=\"w-full px-4 py-2 rounded-lg border border-[#E7E5E4] min-h-[80px]\" />
            <div className=\"grid grid-cols-3 gap-3\">
              <input required type=\"number\" min=\"0\" step=\"0.01\" placeholder=\"Price\" data-testid=\"sf-price\" value={editing.price} onChange={ch(\"price\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
              <input required type=\"number\" min=\"0\" placeholder=\"Duration min\" data-testid=\"sf-duration\" value={editing.duration_minutes} onChange={ch(\"duration_minutes\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
              <select data-testid=\"sf-cat\" value={editing.category} onChange={ch(\"category\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\">
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <ImageUploader value={editing.images} onChange={(v) => setEditing({ ...editing, images: v })} />
            <div className=\"flex justify-end gap-2 pt-2\">
              <button type=\"button\" onClick={() => setEditing(null)} className=\"btn-secondary\">Cancel</button>
              <button disabled={busy} className=\"btn-primary\" data-testid=\"sf-save\">{busy ? \"Saving…\" : \"Save\"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
"