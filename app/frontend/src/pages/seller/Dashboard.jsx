"import { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import { api, inr } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { Package, Wrench, ShoppingBag, IndianRupee, Clock } from \"lucide-react\";

function Stat({ icon: I, label, value, color = \"#2D6A4F\" }) {
  return (
    <div className=\"card-soft p-5\">
      <div className=\"flex items-center gap-2 text-xs text-[#57534E]\"><I className=\"w-4 h-4\" style={{ color }} />{label}</div>
      <div className=\"mt-2 text-2xl font-heading font-semibold\">{value}</div>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: 0, services: 0, orders: 0, pending_orders: 0, revenue: 0 });
  useEffect(() => { api.get(\"/seller/stats\").then((r) => setStats(r.data)).catch(() => {}); }, []);

  if (user?.seller_status !== \"approved\") {
    return (
      <div className=\"container-lc py-16 text-center\" data-testid=\"seller-pending\">
        <Clock className=\"w-12 h-12 mx-auto text-amber-600\" />
        <h1 className=\"text-2xl mt-4\">Application under review</h1>
        <p className=\"mt-2 text-[#57534E]\">An admin will approve your shop soon. You'll be able to add products & services once approved.</p>
        <p className=\"mt-2 text-xs text-[#57534E]\">Status: <strong>{user?.seller_status}</strong></p>
      </div>
    );
  }

  return (
    <div className=\"container-lc py-10\" data-testid=\"seller-dashboard\">
      <div className=\"flex items-end justify-between flex-wrap gap-3\">
        <div>
          <div className=\"label-eyebrow\">Seller</div>
          <h1 className=\"text-3xl mt-2 font-medium\">{user.shop_name || user.name}'s dashboard</h1>
        </div>
        <div className=\"flex gap-2\">
          <Link to=\"/seller/products\" className=\"btn-secondary text-sm\" data-testid=\"link-my-products\">Products</Link>
          <Link to=\"/seller/services\" className=\"btn-secondary text-sm\" data-testid=\"link-my-services\">Services</Link>
          <Link to=\"/seller/orders\" className=\"btn-primary text-sm\" data-testid=\"link-my-orders\">Orders</Link>
        </div>
      </div>
      <div className=\"mt-8 grid grid-cols-2 md:grid-cols-5 gap-4\">
        <Stat icon={Package} label=\"Products\" value={stats.products} />
        <Stat icon={Wrench} label=\"Services\" value={stats.services} color=\"#D08C60\" />
        <Stat icon={ShoppingBag} label=\"Orders\" value={stats.orders} />
        <Stat icon={Clock} label=\"Pending\" value={stats.pending_orders} color=\"#BC6C25\" />
        <Stat icon={IndianRupee} label=\"Revenue\" value={inr(stats.revenue)} />
      </div>
    </div>
  );
}
"