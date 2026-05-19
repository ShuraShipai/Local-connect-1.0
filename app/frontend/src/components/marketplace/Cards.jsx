"import { Link } from \"react-router-dom\";
import { imgUrl, inr } from \"@/lib/api\";
import { Heart, ShoppingBag, Clock, Store } from \"lucide-react\";

const FALLBACK_PRODUCT = \"https://images.unsplash.com/photo-1622701893201-9bc9eb616690?crop=entropy&cs=srgb&fm=jpg&q=85&w=800\";
const FALLBACK_SERVICE = \"https://images.unsplash.com/photo-1676210134190-3f2c0d5cf58d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800\";

export function ProductCard({ p, onAdd, onWishlist }) {
  const img = (p.images && p.images[0]) ? imgUrl(p.images[0]) : FALLBACK_PRODUCT;
  return (
    <div className=\"card-soft overflow-hidden flex flex-col group\" data-testid={`product-card-${p.id}`}>
      <Link to={`/products/${p.id}`} className=\"block aspect-[4/3] overflow-hidden bg-[#F3F4F6]\">
        <img src={img} alt={p.name} className=\"w-full h-full object-cover group-hover:scale-105 transition-transform duration-500\" />
      </Link>
      <div className=\"p-4 flex flex-col gap-2 flex-1\">
        <div className=\"flex items-center justify-between text-xs text-[#57534E]\">
          <span className=\"inline-flex items-center gap-1\"><Store className=\"w-3 h-3\" />{p.seller?.shop_name || \"Local seller\"}</span>
          <span className=\"px-2 py-0.5 rounded-full bg-[#F0F7F2] text-[#1B4332]\">{p.category}</span>
        </div>
        <Link to={`/products/${p.id}`} className=\"font-heading font-medium text-base text-[#1C1917] hover:text-[#2D6A4F] line-clamp-1\">
          {p.name}
        </Link>
        <p className=\"text-sm text-[#57534E] line-clamp-2\">{p.description}</p>
        <div className=\"flex items-center justify-between mt-auto pt-2\">
          <div className=\"font-heading text-lg font-semibold\">{inr(p.price)}</div>
          <div className=\"flex items-center gap-1\">
            {onWishlist && (
              <button data-testid={`wishlist-product-${p.id}`} onClick={() => onWishlist(p)} className=\"p-2 rounded-full hover:bg-[#F3F4F6]\" title=\"Add to wishlist\">
                <Heart className=\"w-4 h-4\" />
              </button>
            )}
            {onAdd && (
              <button data-testid={`add-cart-product-${p.id}`} onClick={() => onAdd(p)} className=\"btn-primary !px-4 !py-2 text-xs\">
                <ShoppingBag className=\"w-4 h-4\" /> Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceCard({ s, onWishlist }) {
  const img = (s.images && s.images[0]) ? imgUrl(s.images[0]) : FALLBACK_SERVICE;
  return (
    <div className=\"card-soft overflow-hidden flex flex-col group\" data-testid={`service-card-${s.id}`}>
      <Link to={`/services/${s.id}`} className=\"block aspect-[4/3] overflow-hidden bg-[#F3F4F6]\">
        <img src={img} alt={s.name} className=\"w-full h-full object-cover group-hover:scale-105 transition-transform duration-500\" />
      </Link>
      <div className=\"p-4 flex flex-col gap-2 flex-1\">
        <div className=\"flex items-center justify-between text-xs text-[#57534E]\">
          <span className=\"inline-flex items-center gap-1\"><Store className=\"w-3 h-3\" />{s.seller?.shop_name || \"Local provider\"}</span>
          <span className=\"px-2 py-0.5 rounded-full bg-[#FBE7D8] text-[#7A3E00]\">{s.category}</span>
        </div>
        <Link to={`/services/${s.id}`} className=\"font-heading font-medium text-base hover:text-[#2D6A4F] line-clamp-1\">{s.name}</Link>
        <p className=\"text-sm text-[#57534E] line-clamp-2\">{s.description}</p>
        <div className=\"flex items-center justify-between mt-auto pt-2\">
          <div className=\"font-heading text-lg font-semibold\">{inr(s.price)}</div>
          <div className=\"flex items-center gap-2\">
            <span className=\"inline-flex items-center gap-1 text-xs text-[#57534E]\"><Clock className=\"w-3 h-3\" />{s.duration_minutes}m</span>
            {onWishlist && (
              <button data-testid={`wishlist-service-${s.id}`} onClick={() => onWishlist(s)} className=\"p-2 rounded-full hover:bg-[#F3F4F6]\">
                <Heart className=\"w-4 h-4\" />
              </button>
            )}
            <Link to={`/services/${s.id}`} className=\"btn-secondary !px-4 !py-2 text-xs\">View</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
"