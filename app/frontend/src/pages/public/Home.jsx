"import { useEffect, useState } from \"react\";
import { Link } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { ProductCard, ServiceCard } from \"@/components/marketplace/Cards\";
import { ArrowRight, MapPin, ShieldCheck, Truck, Sparkles, Store } from \"lucide-react\";

const HERO_IMG = \"https://images.unsplash.com/photo-1751857214820-26825c327dd3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600\";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    api.get(\"/products?limit=8\").then((r) => setProducts(r.data)).catch(() => {});
    api.get(\"/services?limit=4\").then((r) => setServices(r.data)).catch(() => {});
    api.get(\"/sellers?limit=6\").then((r) => setSellers(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid=\"home-page\">
      {/* HERO */}
      <section className=\"container-lc pt-12 lg:pt-20 pb-12\">
        <div className=\"grid lg:grid-cols-12 gap-8 items-center\">
          <div className=\"lg:col-span-7 animate-fade-up\">
            <div className=\"label-eyebrow inline-flex items-center gap-2\"><MapPin className=\"w-3.5 h-3.5\" />A marketplace for Bhatkal</div>
            <h1 className=\"mt-4 text-4xl sm:text-5xl lg:text-6xl tracking-tight font-semibold leading-[1.05]\">
              Buy, sell, and book — <span className=\"text-[#2D6A4F]\">straight from your neighbourhood.</span>
            </h1>
            <p className=\"mt-5 text-lg text-[#57534E] max-w-xl leading-relaxed\">
              Local Connect brings nearby shops, makers, and service providers into one trusted, organised marketplace. No WhatsApp chaos, no random pages — just real local commerce.
            </p>
            <div className=\"mt-8 flex flex-wrap gap-3\">
              <Link to=\"/products\" className=\"btn-primary\" data-testid=\"hero-shop-btn\">Shop products <ArrowRight className=\"w-4 h-4\" /></Link>
              <Link to=\"/services\" className=\"btn-secondary\" data-testid=\"hero-services-btn\">Find a service</Link>
              <Link to=\"/become-seller\" className=\"text-sm font-medium text-[#1B4332] hover:underline ml-2\" data-testid=\"hero-sell-btn\">Sell on Local Connect →</Link>
            </div>
            <div className=\"mt-10 grid grid-cols-3 gap-4 max-w-lg\">
              {[
                { icon: ShieldCheck, label: \"Verified sellers\" },
                { icon: Truck, label: \"Cash on Delivery\" },
                { icon: Sparkles, label: \"Real reviews\" },
              ].map(({ icon: I, label }) => (
                <div key={label} className=\"flex items-center gap-2 text-sm text-[#1C1917]\">
                  <I className=\"w-4 h-4 text-[#2D6A4F]\" />{label}
                </div>
              ))}
            </div>
          </div>
          <div className=\"lg:col-span-5\">
            <div className=\"relative aspect-[4/5] rounded-3xl overflow-hidden border border-[#E7E5E4]\">
              <img src={HERO_IMG} alt=\"Local market\" className=\"w-full h-full object-cover\" />
              <div className=\"absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 shadow-lg\">
                <div className=\"w-10 h-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center\"><Store className=\"w-5 h-5\" /></div>
                <div>
                  <div className=\"text-sm font-semibold\">{sellers.length}+ local sellers</div>
                  <div className=\"text-xs text-[#57534E]\">Onboarded across Bhatkal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className=\"container-lc py-10\">
        <div className=\"flex items-end justify-between mb-6\">
          <div>
            <div className=\"label-eyebrow\">Featured products</div>
            <h2 className=\"mt-2 text-2xl sm:text-3xl font-medium\">Fresh from Bhatkal</h2>
          </div>
          <Link to=\"/products\" className=\"text-sm font-medium text-[#1B4332] hover:underline\" data-testid=\"see-all-products\">See all →</Link>
        </div>
        <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5\">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
          {!products.length && <div className=\"col-span-full text-center text-[#57534E] py-12\">No products yet — be the first to list!</div>}
        </div>
      </section>

      <section className=\"container-lc py-10\">
        <div className=\"flex items-end justify-between mb-6\">
          <div>
            <div className=\"label-eyebrow\">Local services</div>
            <h2 className=\"mt-2 text-2xl sm:text-3xl font-medium\">Skilled neighbours, on demand</h2>
          </div>
          <Link to=\"/services\" className=\"text-sm font-medium text-[#1B4332] hover:underline\" data-testid=\"see-all-services\">See all →</Link>
        </div>
        <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5\">
          {services.map((s) => <ServiceCard key={s.id} s={s} />)}
          {!services.length && <div className=\"col-span-full text-center text-[#57534E] py-12\">No services yet.</div>}
        </div>
      </section>

      <section className=\"container-lc py-12\">
        <div className=\"rounded-3xl bg-[#1B4332] text-white p-10 lg:p-16 grid lg:grid-cols-2 gap-8 items-center\">
          <div>
            <div className=\"label-eyebrow text-white/70\">For local businesses</div>
            <h2 className=\"mt-3 text-3xl lg:text-4xl tracking-tight font-medium text-white\">Your shop, online — without the hassle.</h2>
            <p className=\"mt-4 text-white/80 max-w-md\">List products and services, manage orders, and serve more customers across Bhatkal. Approved sellers go live the same day.</p>
            <Link to=\"/become-seller\" className=\"mt-6 inline-flex btn-terracotta\" data-testid=\"cta-become-seller\">Open my shop <ArrowRight className=\"w-4 h-4\" /></Link>
          </div>
          <div className=\"grid grid-cols-2 gap-4 text-sm\">
            {[\"Approve once, sell forever\", \"Real cash-on-delivery orders\", \"Manage products & services\", \"Owner dashboard with analytics\"].map((t) => (
              <div key={t} className=\"bg-white/10 rounded-xl p-4 border border-white/15\">{t}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
"