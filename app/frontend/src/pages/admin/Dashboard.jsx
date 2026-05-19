"import { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { Users, Store, Package, Wrench, ShoppingBag, Clock } from \"lucide-react\";

function Stat({ icon: I, label, value, to }) {
  return (
    <Link to={to || \"#\"} className=\"card-soft p-5 block\" data-testid={`admin-stat-${label.toLowerCase()}`}>
      <div className=\"flex items-center gap-2 text-xs text-[#57534E]\"><I className=\"w-4 h-4 text-[#2D6A4F]\" />{label}</div>
      <div className=\"mt-2 text-2xl font-heading font-semibold\">{value}</div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  useEffect(() => { api.get(\"/admin/stats\").then((r) => setStats(r.data)); }, []);
  return (
    <div className=\"container-lc py-10\" data-testid=\"admin-dashboard\">
      <div className=\"label-eyebrow\">Admin</div>
      <h1 className=\"mt-2 text-3xl font-medium\">Control room</h1>
      <div className=\"mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4\">
        <Stat icon={Users} label=\"Users\" value={stats.users || 0} to=\"/admin/users\" />
        <Stat icon={Store} label=\"Sellers\" value={stats.sellers || 0} to=\"/admin/sellers\" />
        <Stat icon={Clock} label=\"Pending\" value={stats.pending_sellers || 0} to=\"/admin/sellers\" />
        <Stat icon={Package} label=\"Products\" value={stats.products || 0} to=\"/admin/listings\" />
        <Stat icon={Wrench} label=\"Services\" value={stats.services || 0} to=\"/admin/listings\" />
        <Stat icon={ShoppingBag} label=\"Orders\" value={stats.orders || 0} />
      </div>
    </div>
  );
}
"