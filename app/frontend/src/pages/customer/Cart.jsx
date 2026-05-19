"import { useEffect, useState } from \"react\";
import { Link, useNavigate } from \"react-router-dom\";
import { api, imgUrl, inr } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { Trash2, ShoppingBag } from \"lucide-react\";
import { toast } from \"sonner\";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshCart } = useAuth();
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(\"/cart\");
    setItems(data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateQty = async (pid, q) => { await api.put(`/cart/${pid}`, { product_id: pid, quantity: q }); load(); refreshCart(); };
  const remove = async (pid) => { await api.delete(`/cart/${pid}`); toast.success(\"Removed\"); load(); refreshCart(); };

  const total = items.reduce((s, i) => s + Number(i.product?.price || 0) * i.quantity, 0);
  if (loading) return <div className=\"container-lc py-24 text-center text-[#57534E]\">Loading…</div>;

  return (
    <div className=\"container-lc py-10\" data-testid=\"cart-page\">
      <h1 className=\"text-3xl font-medium\">Your cart</h1>
      {!items.length ? (
        <div className=\"py-20 text-center\" data-testid=\"cart-empty\">
          <ShoppingBag className=\"w-12 h-12 mx-auto text-[#A8A29E]\" />
          <p className=\"mt-4 text-[#57534E]\">Your cart is empty.</p>
          <Link to=\"/products\" className=\"btn-primary mt-6 inline-flex\">Browse products</Link>
        </div>
      ) : (
        <div className=\"grid lg:grid-cols-3 gap-6 mt-6\">
          <div className=\"lg:col-span-2 space-y-3\">
            {items.map((it) => {
              const p = it.product;
              const img = (p.images && p.images[0]) ? imgUrl(p.images[0]) : null;
              return (
                <div key={it.product_id} className=\"card-soft p-4 flex gap-4 items-center\" data-testid={`cart-item-${it.product_id}`}>
                  <div className=\"w-20 h-20 rounded-lg bg-[#F3F4F6] overflow-hidden\">{img && <img src={img} alt=\"\" className=\"w-full h-full object-cover\" />}</div>
                  <div className=\"flex-1\">
                    <div className=\"font-medium\">{p.name}</div>
                    <div className=\"text-sm text-[#57534E]\">{inr(p.price)} each</div>
                    <div className=\"mt-2 flex items-center gap-2\">
                      <button data-testid={`cart-minus-${it.product_id}`} onClick={() => updateQty(it.product_id, it.quantity - 1)} className=\"w-8 h-8 rounded-full border border-[#E7E5E4]\">−</button>
                      <span className=\"w-6 text-center\">{it.quantity}</span>
                      <button data-testid={`cart-plus-${it.product_id}`} onClick={() => updateQty(it.product_id, it.quantity + 1)} className=\"w-8 h-8 rounded-full border border-[#E7E5E4]\">+</button>
                    </div>
                  </div>
                  <div className=\"text-right\">
                    <div className=\"font-heading font-semibold\">{inr(p.price * it.quantity)}</div>
                    <button data-testid={`cart-remove-${it.product_id}`} onClick={() => remove(it.product_id)} className=\"mt-2 text-xs text-red-600 inline-flex items-center gap-1\"><Trash2 className=\"w-3 h-3\" />Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className=\"card-soft p-6 h-fit\">
            <h2 className=\"font-heading text-lg mb-4\">Summary</h2>
            <div className=\"flex justify-between text-sm\"><span>Subtotal</span><span>{inr(total)}</span></div>
            <div className=\"flex justify-between text-sm mt-2\"><span>Delivery</span><span className=\"text-[#1B4332]\">Free in Bhatkal</span></div>
            <hr className=\"my-4 border-[#E7E5E4]\" />
            <div className=\"flex justify-between font-heading text-lg font-semibold\"><span>Total</span><span data-testid=\"cart-total\">{inr(total)}</span></div>
            <button data-testid=\"checkout-btn\" onClick={() => nav(\"/checkout\")} className=\"btn-primary w-full mt-5\">Proceed to checkout</button>
          </div>
        </div>
      )}
    </div>
  );
}
"