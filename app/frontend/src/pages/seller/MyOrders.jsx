"import { useEffect, useState } from \"react\";
import { api, inr } from \"@/lib/api\";
import { toast } from \"sonner\";

const STATUSES = [\"pending\", \"confirmed\", \"preparing\", \"out_for_delivery\", \"delivered\", \"cancelled\"];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const load = async () => { const r = await api.get(\"/seller/orders\"); setOrders(r.data); };
  useEffect(() => { load(); }, []);
  const update = async (oid, status) => { await api.put(`/seller/orders/${oid}/status`, { status }); toast.success(\"Updated\"); load(); };
  return (
    <div className=\"container-lc py-10\" data-testid=\"seller-orders-page\">
      <h1 className=\"text-3xl font-medium\">Orders</h1>
      <div className=\"mt-6 space-y-4\">
        {orders.map((o) => (
          <div key={o.id} className=\"card-soft p-6\" data-testid={`seller-order-${o.id}`}>
            <div className=\"flex justify-between items-start flex-wrap gap-2\">
              <div>
                <div className=\"text-xs text-[#57534E]\">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                <div className=\"font-medium mt-1\">{o.address.full_name} · {o.address.phone}</div>
                <div className=\"text-sm text-[#57534E]\">{o.address.line1}, Bhatkal</div>
              </div>
              <div className=\"text-right\">
                <div className=\"font-heading text-xl\">{inr(o.total)}</div>
                <div className=\"text-xs text-[#57534E] uppercase\">{o.payment_method} · {o.payment_status}</div>
              </div>
            </div>
            <div className=\"mt-3 text-sm text-[#57534E]\">
              {o.items.map((i, idx) => <span key={idx} className=\"mr-3\">{i.name} ×{i.quantity}</span>)}
            </div>
            <div className=\"mt-3 flex items-center gap-2\">
              <span className=\"text-xs\">Status:</span>
              <select data-testid={`order-status-${o.id}`} value={o.status} onChange={(e) => update(o.id, e.target.value)} className=\"h-9 px-3 rounded-lg border border-[#E7E5E4] text-sm\">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, \" \")}</option>)}
              </select>
            </div>
          </div>
        ))}
        {!orders.length && <div className=\"py-20 text-center text-[#57534E]\">No orders yet.</div>}
      </div>
    </div>
  );
}
"