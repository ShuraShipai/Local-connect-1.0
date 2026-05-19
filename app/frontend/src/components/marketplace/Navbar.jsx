"import { Link, useNavigate, useLocation } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";
import { ShoppingBag, Heart, User, LogOut, Store, ShieldCheck, MapPin, Search, Menu, X } from \"lucide-react\";
import { useState } from \"react\";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from \"@/components/ui/dropdown-menu\";

export default function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(\"\");

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      data-testid={`nav-${to.replace(/\//g, \"\") || \"home\"}-link`}
      className={`text-sm font-medium transition-colors ${loc.pathname === to ? \"text-[#2D6A4F]\" : \"text-[#1C1917] hover:text-[#2D6A4F]\"}`}
    >
      {children}
    </Link>
  );

  return (
    <header className=\"sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E7E5E4]\" data-testid=\"site-navbar\">
      <div className=\"container-lc h-16 flex items-center gap-6\">
        <Link to=\"/\" className=\"flex items-center gap-2 font-heading font-semibold text-lg\" data-testid=\"brand-logo\">
          <span className=\"w-8 h-8 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center\"><Store className=\"w-4 h-4\" /></span>
          Local Connect
          <span className=\"hidden md:inline-flex items-center gap-1 text-xs text-[#57534E] ml-1\"><MapPin className=\"w-3 h-3\" />Bhatkal</span>
        </Link>

        <nav className=\"hidden md:flex items-center gap-6 ml-2\">
          <NavLink to=\"/products\">Products</NavLink>
          <NavLink to=\"/services\">Services</NavLink>
          <NavLink to=\"/sellers\">Sellers</NavLink>
        </nav>

        <form onSubmit={submit} className=\"hidden md:flex flex-1 max-w-md ml-auto\" data-testid=\"search-form\">
          <div className=\"relative w-full\">
            <Search className=\"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]\" />
            <input
              data-testid=\"search-input\"
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder=\"Search products in Bhatkal…\"
              className=\"w-full h-10 pl-10 pr-4 rounded-full bg-[#F3F4F6] focus:bg-white border border-transparent focus:border-[#E7E5E4] outline-none text-sm\"
            />
          </div>
        </form>

        <div className=\"flex items-center gap-2 md:gap-3 ml-auto md:ml-0\">
          <Link to=\"/wishlist\" className=\"hidden md:inline-flex p-2 rounded-full hover:bg-[#F3F4F6]\" data-testid=\"wishlist-link\">
            <Heart className=\"w-5 h-5 text-[#1C1917]\" />
          </Link>
          <Link to=\"/cart\" className=\"relative p-2 rounded-full hover:bg-[#F3F4F6]\" data-testid=\"cart-link\">
            <ShoppingBag className=\"w-5 h-5 text-[#1C1917]\" />
            {cartCount > 0 && (
              <span data-testid=\"cart-count-badge\" className=\"absolute -top-1 -right-1 bg-[#D08C60] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold\">
                {cartCount}
              </span>
            )}
          </Link>

          {user && user.id ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid=\"user-menu-trigger\" className=\"flex items-center gap-2 px-3 py-2 rounded-full hover:bg-[#F3F4F6]\">
                  <div className=\"w-7 h-7 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs font-semibold\">
                    {(user.name || \"U\").slice(0, 1).toUpperCase()}
                  </div>
                  <span className=\"hidden md:inline text-sm\">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align=\"end\" className=\"w-56\">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to=\"/orders\" data-testid=\"menu-orders\"><ShoppingBag className=\"w-4 h-4 mr-2\" />My Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to=\"/wishlist\" data-testid=\"menu-wishlist\"><Heart className=\"w-4 h-4 mr-2\" />Wishlist</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to=\"/settings\" data-testid=\"menu-settings\"><User className=\"w-4 h-4 mr-2\" />Settings</Link></DropdownMenuItem>
                {user.role === \"customer\" && (
                  <DropdownMenuItem asChild><Link to=\"/become-seller\" data-testid=\"menu-become-seller\"><Store className=\"w-4 h-4 mr-2\" />Become a seller</Link></DropdownMenuItem>
                )}
                {user.role === \"seller\" && (
                  <DropdownMenuItem asChild><Link to=\"/seller\" data-testid=\"menu-seller\"><Store className=\"w-4 h-4 mr-2\" />Seller dashboard</Link></DropdownMenuItem>
                )}
                {user.role === \"admin\" && (
                  <DropdownMenuItem asChild><Link to=\"/admin\" data-testid=\"menu-admin\"><ShieldCheck className=\"w-4 h-4 mr-2\" />Admin panel</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid=\"menu-logout\"><LogOut className=\"w-4 h-4 mr-2\" />Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className=\"flex items-center gap-2\">
              <Link to=\"/login\" className=\"hidden md:inline text-sm font-medium text-[#1C1917] hover:text-[#2D6A4F]\" data-testid=\"nav-login-link\">Sign in</Link>
              <Link to=\"/register\" className=\"btn-primary !px-4 !py-2 text-sm\" data-testid=\"nav-register-link\">Join</Link>
            </div>
          )}

          <button className=\"md:hidden p-2\" onClick={() => setOpen(!open)} data-testid=\"mobile-menu-toggle\">
            {open ? <X className=\"w-5 h-5\" /> : <Menu className=\"w-5 h-5\" />}
          </button>
        </div>
      </div>

      {open && (
        <div className=\"md:hidden border-t border-[#E7E5E4] bg-white px-6 py-4 space-y-2\" data-testid=\"mobile-menu\">
          <Link to=\"/products\" onClick={() => setOpen(false)} className=\"block py-2\">Products</Link>
          <Link to=\"/services\" onClick={() => setOpen(false)} className=\"block py-2\">Services</Link>
          <Link to=\"/sellers\" onClick={() => setOpen(false)} className=\"block py-2\">Sellers</Link>
          <form onSubmit={(e) => { submit(e); setOpen(false); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder=\"Search…\" className=\"w-full h-10 px-4 rounded-full bg-[#F3F4F6] text-sm\" />
          </form>
        </div>
      )}
    </header>
  );
}
"