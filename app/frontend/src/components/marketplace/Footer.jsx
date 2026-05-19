"import { Store, MapPin } from \"lucide-react\";

export default function Footer() {
  return (
    <footer className=\"border-t border-[#E7E5E4] mt-24 bg-white\" data-testid=\"site-footer\">
      <div className=\"container-lc py-12 grid grid-cols-1 md:grid-cols-4 gap-8\">
        <div>
          <div className=\"flex items-center gap-2 font-heading font-semibold text-lg\">
            <span className=\"w-8 h-8 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center\"><Store className=\"w-4 h-4\" /></span>
            Local Connect
          </div>
          <p className=\"mt-3 text-sm text-[#57534E] max-w-xs\">A trusted local marketplace bringing Bhatkal's shops, makers and service-providers online.</p>
          <div className=\"mt-3 flex items-center gap-1 text-xs text-[#57534E]\"><MapPin className=\"w-3 h-3\" /> Bhatkal, Karnataka</div>
        </div>
        <div>
          <div className=\"label-eyebrow mb-3\">Marketplace</div>
          <ul className=\"space-y-2 text-sm\">
            <li><a href=\"/products\" className=\"hover:text-[#2D6A4F]\">Products</a></li>
            <li><a href=\"/services\" className=\"hover:text-[#2D6A4F]\">Services</a></li>
            <li><a href=\"/sellers\" className=\"hover:text-[#2D6A4F]\">Sellers</a></li>
          </ul>
        </div>
        <div>
          <div className=\"label-eyebrow mb-3\">Account</div>
          <ul className=\"space-y-2 text-sm\">
            <li><a href=\"/login\" className=\"hover:text-[#2D6A4F]\">Sign in</a></li>
            <li><a href=\"/register\" className=\"hover:text-[#2D6A4F]\">Create account</a></li>
            <li><a href=\"/become-seller\" className=\"hover:text-[#2D6A4F]\">Become a seller</a></li>
          </ul>
        </div>
        <div>
          <div className=\"label-eyebrow mb-3\">Trust</div>
          <ul className=\"space-y-2 text-sm text-[#57534E]\">
            <li>Verified local sellers</li>
            <li>Cash on Delivery</li>
            <li>Real reviews only</li>
          </ul>
        </div>
      </div>
      <div className=\"border-t border-[#E7E5E4] py-5 text-center text-xs text-[#57534E]\">© {new Date().getFullYear()} Local Connect. Made for Bhatkal.</div>
    </footer>
  );
}
"