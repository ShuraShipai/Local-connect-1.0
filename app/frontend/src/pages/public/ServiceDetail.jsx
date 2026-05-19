"import { useEffect, useState } from \"react\";
import { useParams, Link } from \"react-router-dom\";
import { api, imgUrl, inr } from \"@/lib/api\";
import { Store, Clock, Phone } from \"lucide-react\";

const FALLBACK = \"https://images.unsplash.com/photo-1676210134190-3f2c0d5cf58d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200\";

export default function ServiceDetail() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  useEffect(() => { api.get(`/services/${id}`).then((r) => setS(r.data)).catch(() => setS(false)); }, [id]);

  if (s === null) return <div className=\"container-lc py-24 text-center text-[#57534E]\">Loading…</div>;
  if (s === false) return <div className=\"container-lc py-24 text-center\">Service not found.</div>;
  const img = (s.images && s.images[0]) ? imgUrl(s.images[0]) : FALLBACK;
  return (
    <div className=\"container-lc py-10 grid lg:grid-cols-2 gap-10\" data-testid={`service-detail-${s.id}`}>
      <div className=\"aspect-square rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E7E5E4]\">
        <img src={img} alt={s.name} className=\"w-full h-full object-cover\" />
      </div>
      <div>
        <div className=\"label-eyebrow\">{s.category}</div>
        <h1 className=\"mt-2 text-3xl sm:text-4xl font-medium\">{s.name}</h1>
        <Link to={`/sellers/${s.seller?.id}`} className=\"mt-2 inline-flex items-center gap-2 text-sm text-[#57534E] hover:text-[#2D6A4F]\">
          <Store className=\"w-4 h-4\" /> {s.seller?.shop_name || \"Local provider\"}
        </Link>
        <div className=\"mt-6 text-3xl font-heading font-semibold\">{inr(s.price)}</div>
        <div className=\"mt-2 inline-flex items-center gap-2 text-sm text-[#57534E]\"><Clock className=\"w-4 h-4\" /> {s.duration_minutes} minutes</div>
        <p className=\"mt-4 text-[#57534E] leading-relaxed whitespace-pre-line\">{s.description}</p>
        <div className=\"mt-6 p-4 rounded-xl bg-[#F0F7F2] border border-[#DAE9DE] text-sm text-[#1B4332] inline-flex items-center gap-2\">
          <Phone className=\"w-4 h-4\" /> Contact the provider directly to book.
        </div>
      </div>
    </div>
  );
}
"