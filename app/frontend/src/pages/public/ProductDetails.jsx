"import { useEffect, useState } from \"react\";
import { useParams, Link } from \"react-router-dom\";
import { api, imgUrl, inr } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { ShoppingBag, Heart, Store, Tag } from \"lucide-react\";
import { toast } from \"sonner\";

const FALLBACK = \"https://images.unsplash.com/photo-1622701893201-9bc9eb616690?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200\";

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const { user, refreshCart } = useAuth();

  useEffect(() => { api.get(`/products/${id}`).then((r) => setP(r.data)).catch(() => setP(false)); }, [id]);

  if (p === null) return <div className=\"container-lc py-24 text-center text-[#57534E]\">Loading…</div>;
  if (p === false) return <div className=\"container-lc py-24 text-center\" data-testid=\"product-not-found\">Product not found.</div>;

  const img = (p.images && p.images[0]) ? imgUrl(p.images[0]) : FALLBACK;
  const onAdd = async () => {
    if (!user) { toast.error(\"Please sign in\"); return; }
    await api.post(\"/cart\", { product_id: p.id, quantity: qty });
    toast.success(\"Added to cart\");
    refreshCart();
  };
  const onWishlist = async () => {
    if (!user) { toast.error(\"Please sign in\"); return; }
    await api.post(\"/wishlist\", { item_id: p.id, item_type: \"product\" });
    toast.success(\"Added to wishlist\");
  };

  return (
    <div className=\"container-lc py-10 grid lg:grid-cols-2 gap-10\" data-testid={`product-detail-${p.id}`}>
      <div>
        <div className=\"aspect-square rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E7E5E4]\">
          <img src={img} alt={p.name} className=\"w-full h-full object-cover\" />
        </div>
        {p.images && p.images.length > 1 && (
          <div className=\"grid grid-cols-4 gap-3 mt-4\">
            {p.images.map((u) => <div key={u} className=\"aspect-square rounded-lg overflow-hidden border border-[#E7E5E4]\"><img src={imgUrl(u)} className=\"w-full h-full object-cover\" alt=\"\" /></div>)}
          </div>
        )}
      </div>
      <div>
        <div className=\"label-eyebrow flex items-center gap-2\"><Tag className=\"w-3 h-3\" /> {p.category}</div>
        <h1 className=\"mt-3 text-3xl sm:text-4xl font-medium\">{p.name}</h1>
        <Link to={`/sellers/${p.seller?.id}`} className=\"mt-2 inline-flex items-center gap-2 text-sm text-[#57534E] hover:text-[#2D6A4F]\">
          <Store className=\"w-4 h-4\" /> {p.seller?.shop_name || \"Local seller\"}
        </Link>
        <div className=\"mt-6 text-3xl font-heading font-semibold\">{inr(p.price)}</div>
        <p className=\"mt-4 text-[#57534E] leading-relaxed whitespace-pre-line\">{p.description || \"No description provided.\"}</p>
        <div className=\"mt-3 text-sm\">{p.stock > 0 ? <span className=\"text-[#1B4332]\">In stock ({p.stock})</span> : <span className=\"text-red-600\">Out of stock</span>}</div>

        <div className=\"mt-6 flex items-center gap-3\">
          <div className=\"flex items-center border border-[#E7E5E4] rounded-full overflow-hidden\">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className=\"px-4 py-2 text-lg\" data-testid=\"qty-minus\">−</button>
            <span className=\"px-4 py-2 min-w-[2.5rem] text-center\" data-testid=\"qty-value\">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className=\"px-4 py-2 text-lg\" data-testid=\"qty-plus\">+</button>
          </div>
          <button onClick={onAdd} disabled={!p.stock} data-testid=\"add-to-cart-btn\" className=\"btn-primary disabled:opacity-50\"><ShoppingBag className=\"w-4 h-4\" /> Add to cart</button>
          <button onClick={onWishlist} data-testid=\"add-to-wishlist-btn\" className=\"btn-secondary\"><Heart className=\"w-4 h-4\" /></button>
        </div>
      </div>
    </div>
  );
}
"