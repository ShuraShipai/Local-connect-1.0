"import { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import { api, imgUrl, inr } from \"@/lib/api\";
import { Trash2 } from \"lucide-react\";
import { toast } from \"sonner\";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const load = async () => { const r = await api.get(\"/wishlist\"); setItems(r.data); };
  useEffect(() => { load(); }, []);
  const remove = async (id) => { await api.delete(`/wishlist/${id}`); toast.success(\"Removed\"); load(); };
  return (
    <div className=\"container-lc py-10\" data-testid=\"wishlist-page\">
      <h1 className=\"text-3xl font-medium\">Wishlist</h1>
      <div className=\"mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
        {items.map((i) => {
          const it = i.product || i.service;
          if (!it) return null;
          const img = (it.images && it.images[0]) ? imgUrl(it.images[0]) : null;
          const link = i.item_type === \"product\" ? `/products/${it.id}` : `/services/${it.id}`;
          return (
            <div key={i.item_id} className=\"card-soft p-4 flex gap-3\" data-testid={`wishlist-item-${i.item_id}`}>
              <div className=\"w-20 h-20 rounded-lg bg-[#F3F4F6] overflow-hidden\">{img && <img src={img} className=\"w-full h-full object-cover\" alt=\"\" />}</div>
              <div className=\"flex-1\">
                <Link to={link} className=\"font-medium hover:text-[#2D6A4F]\">{it.name}</Link>
                <div className=\"text-sm text-[#57534E]\">{inr(it.price)}</div>
              </div>
              <button onClick={() => remove(i.item_id)} className=\"text-red-500\" data-testid={`wishlist-remove-${i.item_id}`}><Trash2 className=\"w-4 h-4\" /></button>
            </div>
          );
        })}
        {!items.length && <div className=\"col-span-full py-20 text-center text-[#57534E]\">Your wishlist is empty.</div>}
      </div>
    </div>
  );
}
"