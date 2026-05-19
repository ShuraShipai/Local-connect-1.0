"import { useEffect, useState } from \"react\";
import { api, imgUrl, inr } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";
import { Plus, Pencil, Trash2 } from \"lucide-react\";
import ImageUploader from \"@/components/marketplace/ImageUploader\";

const EMPTY = { name: \"\", description: \"\", price: 0, stock: 0, category: \"Other\", images: [] };

export default function MyProducts() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => { const r = await api.get(\"/seller/products\"); setItems(r.data); };
  useEffect(() => { load(); api.get(\"/categories\").then((r) => setCats(r.data.products)); }, []);

  if (user?.seller_status !== \"approved\") return <div className=\"container-lc py-16 text-center text-[#57534E]\" data-testid=\"seller-products-pending\">Awaiting admin approval to add products.</div>;

  const ch = (k) => (e) => setEditing({ ...editing, [k]: k === \"price\" || k === \"stock\" ? Number(e.target.value) : e.target.value });

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (editing.id) await api.put(`/seller/products/${editing.id}`, editing);
      else await api.post(\"/seller/products\", editing);
      toast.success(\"Saved\"); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.detail || \"Save failed\"); }
    finally { setBusy(false); }
  };
  const del = async (id) => { if (!window.confirm(\"Delete?\")) return; await api.delete(`/seller/products/${id}`); toast.success(\"Deleted\"); load(); };

  return (
    <div className=\"container-lc py-10\" data-testid=\"seller-products-page\">
      <div className=\"flex items-center justify-between flex-wrap gap-3\">
        <h1 className=\"text-3xl font-medium\">My products</h1>
        <button onClick={() => setEditing({ ...EMPTY, category: cats[0] || \"Other\" })} className=\"btn-primary\" data-testid=\"add-product-btn\"><Plus className=\"w-4 h-4\" />Add product</button>
      </div>

      <div className=\"mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
        {items.map((p) => (
          <div key={p.id} className=\"card-soft p-4\" data-testid={`my-product-${p.id}`}>
            <div className=\"aspect-video rounded-lg bg-[#F3F4F6] overflow-hidden mb-3\">
              {p.images?.[0] && <img src={imgUrl(p.images[0])} alt=\"\" className=\"w-full h-full object-cover\" />}
            </div>
            <div className=\"flex justify-between items-start gap-2\">
              <div>
                <div className=\"font-medium\">{p.name}</div>
                <div className=\"text-sm text-[#57534E]\">{p.category} · {inr(p.price)} · stock {p.stock}</div>
              </div>
              <div className=\"flex gap-1\">
                <button onClick={() => setEditing(p)} className=\"p-2 hover:bg-[#F3F4F6] rounded-md\" data-testid={`edit-product-${p.id}`}><Pencil className=\"w-4 h-4\" /></button>
                <button onClick={() => del(p.id)} className=\"p-2 hover:bg-red-50 text-red-600 rounded-md\" data-testid={`delete-product-${p.id}`}><Trash2 className=\"w-4 h-4\" /></button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className=\"col-span-full py-12 text-center text-[#57534E]\">No products yet.</div>}
      </div>

      {editing && (
        <div className=\"fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4\" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className=\"bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4\" data-testid=\"product-form\">
            <h2 className=\"text-2xl font-medium\">{editing.id ? \"Edit product\" : \"New product\"}</h2>
            <input required placeholder=\"Name\" data-testid=\"pf-name\" value={editing.name} onChange={ch(\"name\")} className=\"w-full h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
            <textarea placeholder=\"Description\" data-testid=\"pf-desc\" value={editing.description} onChange={ch(\"description\")} className=\"w-full px-4 py-2 rounded-lg border border-[#E7E5E4] min-h-[80px]\" />
            <div className=\"grid grid-cols-3 gap-3\">
              <input required type=\"number\" min=\"0\" step=\"0.01\" placeholder=\"Price\" data-testid=\"pf-price\" value={editing.price} onChange={ch(\"price\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
              <input required type=\"number\" min=\"0\" placeholder=\"Stock\" data-testid=\"pf-stock\" value={editing.stock} onChange={ch(\"stock\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
              <select data-testid=\"pf-cat\" value={editing.category} onChange={ch(\"category\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\">
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <ImageUploader value={editing.images} onChange={(v) => setEditing({ ...editing, images: v })} />
            <div className=\"flex justify-end gap-2 pt-2\">
              <button type=\"button\" onClick={() => setEditing(null)} className=\"btn-secondary\">Cancel</button>
              <button disabled={busy} className=\"btn-primary\" data-testid=\"pf-save\">{busy ? \"Saving…\" : \"Save\"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
"