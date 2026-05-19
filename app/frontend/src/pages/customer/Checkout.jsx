"import { useEffect, useState } from \"react\";
import { useNavigate } from \"react-router-dom\";
import { api, inr } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { Truck, CreditCard } from \"lucide-react\";
import { toast } from \"sonner\";

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [method, setMethod] = useState(\"cod\");
  const [busy, setBusy] = useState(false);
  const { user, refreshCart } = useAuth();
  const nav = useNavigate();
  const [addr, setAddr] = useState({
    full_name: \"\", phone: \"\", line1: \"\", line2: \"\", city: \"Bhatkal\", pincode: \"\", notes: \"\"
  });

  useEffect(() => {
    api.get(\"/cart\").then((r) => setItems(r.data));
    if (user) setAddr((a) => ({ ...a, full_name: user.name || \"\", phone: user.phone || \"\" }));
  }, [user]);

  const total = items.reduce((s, i) => s + Number(i.product?.price || 0) * i.quantity, 0);
  const ch = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!items.length) { toast.error(\"Cart is empty\"); return; }
    setBusy(true);
    try {
      const { data: order } = await api.post(\"/orders\", { address: addr, payment_method: method });
      if (method === \"cod\") {
        toast.success(\"Order placed! Pay on delivery.\");
        refreshCart();
        nav(`/orders`, { replace: true });
      } else {
        const origin = window.location.origin;
        const { data } = await api.post(\"/payments/checkout/session\", { order_id: order.id, origin_url: origin });
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || \"Could not place order\");
    } finally { setBusy(false); }
  };

  return (
    <div className=\"container-lc py-10 grid lg:grid-cols-3 gap-6\" data-testid=\"checkout-page\">
      <form onSubmit={submit} className=\"lg:col-span-2 space-y-6\">
        <div className=\"card-soft p-6\">
          <div className=\"label-eyebrow\">Delivery</div>
          <h2 className=\"text-2xl mt-1 font-medium\">Where should we deliver?</h2>
          <div className=\"grid sm:grid-cols-2 gap-4 mt-4\">
            <input data-testid=\"ck-name\" required placeholder=\"Full name\" value={addr.full_name} onChange={ch(\"full_name\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
            <input data-testid=\"ck-phone\" required placeholder=\"Phone\" value={addr.phone} onChange={ch(\"phone\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
            <input data-testid=\"ck-line1\" required placeholder=\"Address line 1\" value={addr.line1} onChange={ch(\"line1\")} className=\"sm:col-span-2 h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
            <input data-testid=\"ck-line2\" placeholder=\"Landmark / line 2\" value={addr.line2} onChange={ch(\"line2\")} className=\"sm:col-span-2 h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
            <input value=\"Bhatkal\" disabled className=\"h-11 px-4 rounded-lg border border-[#E7E5E4] bg-[#F3F4F6] text-[#57534E]\" />
            <input data-testid=\"ck-pin\" required placeholder=\"Pincode\" value={addr.pincode} onChange={ch(\"pincode\")} className=\"h-11 px-4 rounded-lg border border-[#E7E5E4]\" />
            <textarea data-testid=\"ck-notes\" placeholder=\"Delivery notes (optional)\" value={addr.notes} onChange={ch(\"notes\")} className=\"sm:col-span-2 px-4 py-2 rounded-lg border border-[#E7E5E4] min-h-[80px]\" />
          </div>
        </div>

        <div className=\"card-soft p-6\">
          <div className=\"label-eyebrow\">Payment</div>
          <h2 className=\"text-2xl mt-1 font-medium\">How would you like to pay?</h2>
          <div className=\"mt-4 grid sm:grid-cols-2 gap-3\">
            <label data-testid=\"pm-cod\" className={`p-4 rounded-xl border cursor-pointer ${method === \"cod\" ? \"border-[#2D6A4F] bg-[#F0F7F2]\" : \"border-[#E7E5E4]\"}`}>
              <input type=\"radio\" name=\"pm\" className=\"sr-only\" checked={method === \"cod\"} onChange={() => setMethod(\"cod\")} />
              <div className=\"flex items-center gap-2 font-medium\"><Truck className=\"w-4 h-4\" /> Cash on Delivery</div>
              <p className=\"mt-1 text-sm text-[#57534E]\">Pay when your order arrives.</p>
            </label>
            <label data-testid=\"pm-stripe\" className={`p-4 rounded-xl border cursor-pointer ${method === \"stripe\" ? \"border-[#2D6A4F] bg-[#F0F7F2]\" : \"border-[#E7E5E4]\"}`}>
              <input type=\"radio\" name=\"pm\" className=\"sr-only\" checked={method === \"stripe\"} onChange={() => setMethod(\"stripe\")} />
              <div className=\"flex items-center gap-2 font-medium\"><CreditCard className=\"w-4 h-4\" /> Pay online (Stripe)</div>
              <p className=\"mt-1 text-sm text-[#57534E]\">Secure card payment.</p>
            </label>
          </div>
        </div>
        <button disabled={busy} data-testid=\"place-order-btn\" className=\"btn-primary w-full\">{busy ? \"Placing order…\" : `Place order — ${inr(total)}`}</button>
      </form>

      <div className=\"card-soft p-6 h-fit\">
        <h2 className=\"font-heading text-lg mb-4\">Your order</h2>
        {items.map((i) => (
          <div key={i.product_id} className=\"flex justify-between text-sm py-1.5\">
            <span className=\"line-clamp-1 mr-2\">{i.product.name} × {i.quantity}</span>
            <span>{inr(i.product.price * i.quantity)}</span>
          </div>
        ))}
        <hr className=\"my-3 border-[#E7E5E4]\" />
        <div className=\"flex justify-between font-heading text-lg font-semibold\"><span>Total</span><span>{inr(total)}</span></div>
      </div>
    </div>
  );
}
"