"import { useEffect, useState } from \"react\";
import { useSearchParams } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { ServiceCard } from \"@/components/marketplace/Cards\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";

export default function Services() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const { user } = useAuth();
  const q = params.get(\"q\") || \"\";
  const category = params.get(\"category\") || \"All\";

  useEffect(() => { api.get(\"/categories\").then((r) => setCats([\"All\", ...r.data.services])); }, []);
  useEffect(() => {
    const qs = new URLSearchParams();
    if (q) qs.set(\"q\", q);
    if (category !== \"All\") qs.set(\"category\", category);
    api.get(`/services?${qs.toString()}`).then((r) => setItems(r.data));
  }, [q, category]);

  const setCat = (c) => {
    const np = new URLSearchParams(params);
    if (c === \"All\") np.delete(\"category\"); else np.set(\"category\", c);
    setParams(np);
  };
  const onWishlist = async (s) => {
    if (!user) { toast.error(\"Please sign in\"); return; }
    await api.post(\"/wishlist\", { item_id: s.id, item_type: \"service\" });
    toast.success(\"Added to wishlist\");
  };

  return (
    <div className=\"container-lc py-10\" data-testid=\"services-page\">
      <div className=\"label-eyebrow\">Services</div>
      <h1 className=\"mt-2 text-3xl sm:text-4xl font-medium\">Local skill on demand</h1>
      <div className=\"flex flex-wrap gap-2 mt-6 mb-6\">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} data-testid={`service-cat-${c}`}
            className={`px-4 py-2 rounded-full text-sm border transition ${category === c ? \"bg-[#D08C60] text-white border-[#D08C60]\" : \"bg-white text-[#1C1917] border-[#E7E5E4] hover:border-[#D08C60]\"}`}>
            {c}
          </button>
        ))}
      </div>
      {items.length ? (
        <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5\">
          {items.map((s) => <ServiceCard key={s.id} s={s} onWishlist={onWishlist} />)}
        </div>
      ) : <div className=\"py-20 text-center text-[#57534E]\">No services available.</div>}
    </div>
  );
}
"