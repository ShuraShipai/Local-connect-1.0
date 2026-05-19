"import { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { Store, MapPin } from \"lucide-react\";

export default function Sellers() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get(\"/sellers\").then((r) => setList(r.data)); }, []);
  return (
    <div className=\"container-lc py-10\" data-testid=\"sellers-page\">
      <div className=\"label-eyebrow\">Discover</div>
      <h1 className=\"mt-2 text-3xl sm:text-4xl font-medium\">Sellers in Bhatkal</h1>
      <div className=\"mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5\">
        {list.map((s) => (
          <Link to={`/sellers/${s.id}`} key={s.id} data-testid={`seller-card-${s.id}`} className=\"card-soft p-6\">
            <div className=\"flex items-center gap-3\">
              <div className=\"w-12 h-12 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center\"><Store className=\"w-5 h-5\" /></div>
              <div>
                <div className=\"font-heading text-lg font-medium\">{s.shop_name || s.name}</div>
                <div className=\"text-xs text-[#57534E] inline-flex items-center gap-1\"><MapPin className=\"w-3 h-3\" />Bhatkal</div>
              </div>
            </div>
            <p className=\"mt-4 text-sm text-[#57534E] line-clamp-2\">{s.shop_description || \"Local marketplace seller.\"}</p>
          </Link>
        ))}
        {!list.length && <div className=\"col-span-full py-20 text-center text-[#57534E]\">No approved sellers yet.</div>}
      </div>
    </div>
  );
}
"