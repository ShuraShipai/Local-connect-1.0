"import { useEffect, useState } from \"react\";
import { api, imgUrl, inr } from \"@/lib/api\";
import { Package, MapPin, Truck, CheckCircle2 } from \"lucide-react\";

const STATUS_COLORS = {
  pending: \"bg-amber-50 text-amber-700\",
  awaiting_payment: \"bg-amber-50 text-amber-700\",
  confirmed: \"bg-blue-50 text-blue-700\",
  preparing: \"bg-indigo-50 text-indigo-700\",
  out_for_delivery: \"bg-purple-50 text-purple-700\",
  delivered: \"bg-green-50 text-green-700\",
  cancelled: \"bg-red-50 text-red-700\",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get(\"/orders\").then((r) => setOrders(r.data)); }, []);
  return (
    <div className=\"container-lc py-10\" data-testid=\"customer-orders-page\">
      <h1 className=\"text-3xl font-medium\">My orders</h1>
      <div className=\"mt-6 space-y-4\">
        {orders.map((o) => (
          <div key={o.id} className=\"card-soft p-6\" data-testid={`order-${o.id}`}>
            <div className=\"flex flex-wrap items-start justify-between gap-3\">
              <div>
                <div className=\"text-xs text-[#57534E]\">Order #{o.id.slice(0, 8)} • {new Date(o.created_at).toLocaleString()}</div>
                <div className=\"mt-1 font-heading text-xl\">{inr(o.total)}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || \"bg-stone-100 text-stone-700\"}`}>{o.status.replace(/_/g, \" \")}</span>
            </div>
            <div className=\"mt-4 grid md:grid-cols-2 gap-4\">
              <div className=\"space-y-2\">
                {o.items.map((i, idx) => (
                  <div key={idx} className=\"flex items-center gap-3 text-sm\">
                    {i.image ? <img src={imgUrl(i.image)} className=\"w-10 h-10 rounded-md object-cover\" alt=\"\" /> : <div className=\"w-10 h-10 rounded-md bg-[#F3F4F6]\" />}
                    <div className=\"flex-1\">{i.name} × {i.quantity}</div>
                    <div className=\"font-medium\">{inr(i.price * i.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className=\"text-sm text-[#57534E]\">
                <div className=\"flex items-center gap-2 mb-1\"><MapPin className=\"w-3 h-3\" />{o.address.line1}, {o.address.city} {o.address.pincode}</div>
                <div className=\"flex items-center gap-2 mb-1\">{o.payment_method === \"cod\" ? <Truck className=\"w-3 h-3\" /> : <CheckCircle2 className=\"w-3 h-3\" />} {o.payment_method.toUpperCase()} — {o.payment_status}</div>
                <div className=\"flex items-center gap-2\"><Package className=\"w-3 h-3\" />{o.items.length} items</div>
              </div>
            </div>
          </div>
        ))}
        {!orders.length && <div className=\"py-20 text-center text-[#57534E]\">No orders yet.</div>}
      </div>
    </div>
  );
}
"