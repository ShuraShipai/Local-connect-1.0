
"import { useEffect, useState } from \"react\";
import { useParams } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { ProductCard, ServiceCard } from \"@/components/marketplace/Cards\";
import { Store, MapPin, Phone } from \"lucide-react\";

export default function SellerStorefront() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get(`/sellers/${id}`).then((r) => setSeller(r.data)).catch(() => setSeller(false));
    api.get(`/products?seller_id=${id}`).then((r) => setProducts(r.data));
    api.get(`/services?seller_id=${id}`).then((r) => setServices(r.data));
  }, [id]);

  if (seller === null) return <div className=\"container-lc py-24 text-center text-[#57534E]\">Loading…</div>;
  if (seller === false) return <div className=\"container-lc py-24 text-center\">Seller not found.</div>;

  return (
    <div data-testid={`seller-storefront-${id}`}>
      <div className=\"container-lc py-10\">
        <div className=\"card-soft p-8 flex items-center gap-5\">
          <div className=\"w-16 h-16 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center\"><Store className=\"w-7 h-7\" /></div>
          <div className=\"flex-1\">
            <h1 className=\"text-2xl sm:text-3xl font-medium font-heading\">{seller.shop_name || seller.name}</h1>
            <p className=\"text-sm text-[#57534E] mt-1\">{seller.shop_description}</p>
            <div className=\"flex flex-wrap gap-4 mt-2 text-xs text-[#57534E]\">
              <span className=\"inline-flex items-center gap-1\"><MapPin className=\"w-3 h-3\" />{seller.address || \"Bhatkal\"}</span>
              {seller.phone && <span className=\"inline-flex items-center gap-1\"><Phone className=\"w-3 h-3\" />{seller.phone}</span>}
            </div>
          </div>
        </div>

        {!!products.length && (
          <section className=\"mt-10\">
            <h2 className=\"text-xl font-medium mb-4\">Products</h2>
            <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5\">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        )}
        {!!services.length && (
          <section className=\"mt-10\">
            <h2 className=\"text-xl font-medium mb-4\">Services</h2>
            <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5\">
              {services.map((s) => <ServiceCard key={s.id} s={s} />)}
            </div>
          </section>
        )}
        {!products.length && !services.length && <div className=\"py-20 text-center text-[#57534E]\">This seller hasn't added listings yet.</div>}
      </div>
    </div>
  );
}
"