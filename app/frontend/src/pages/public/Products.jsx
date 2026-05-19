"import { useEffect, useState } from \"react\";
import { useSearchParams } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { ProductCard } from \"@/components/marketplace/Cards\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, refreshCart } = useAuth();

  const q = params.get(\"q\") || \"\";
  const category = params.get(\"category\") || \"All\";

  useEffect(() => {
    api.get(\"/categories\").then((r) => setCats([\"All\", ...r.data.products])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set(\"q\", q);
    if (category !== \"All\") qs.set(\"category\", category);
    api.get(`/products?${qs.toString()}`).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [q, category]);

  const setCat = (c) => {
    const np = new URLSearchParams(params);
    if (c === \"All\") np.delete(\"category\"); else np.set(\"category\", c);
    setParams(np);
  };

  const onAdd = async (p) => {
    if (!user) { toast.error(\"Please sign in to add to cart\"); return; }
    try {
      await api.post(\"/cart\", { product_id: p.id, quantity: 1 });
      toast.success(`Added ${p.name} to cart`);
      refreshCart();
    } catch { toast.error(\"Could not add to cart\"); }
  };
  const onWishlist = async (p) => {
    if (!user) { toast.error(\"Please sign in\"); return; }
    try { await api.post(\"/wishlist\", { item_id: p.id, item_type: \"product\" }); toast.success(\"Added to wishlist\"); }
    catch { toast.error(\"Could not add\"); }
  };

  return (
    <div className=\"container-lc py-10\" data-testid=\"products-page\">
      <div className=\"flex items-end justify-between mb-6\">
        <div>
          <div className=\"label-eyebrow\">Catalog</div>
          <h1 className=\"mt-2 text-3xl sm:text-4xl font-medium\">{q ? `Results for \"${q}\"` : \"All products\"}</h1>
        </div>
      </div>
      <div className=\"flex flex-wrap gap-2 mb-6\">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} data-testid={`product-cat-${c}`}
            className={`px-4 py-2 rounded-full text-sm border transition ${category === c ? \"bg-[#2D6A4F] text-white border-[#2D6A4F]\" : \"bg-white text-[#1C1917] border-[#E7E5E4] hover:border-[#2D6A4F]\"}`}>
            {c}
          </button>
        ))}
      </div>
      {loading ? <div className=\"py-20 text-center text-[#57534E]\">Loading…</div> :
        items.length ? (
          <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5\">
            {items.map((p) => <ProductCard key={p.id} p={p} onAdd={onAdd} onWishlist={onWishlist} />)}
          </div>
        ) : <div className=\"py-20 text-center text-[#57534E]\" data-testid=\"products-empty\">No products match your search.</div>}
    </div>
  );
}
"