"import { useState } from \"react\";
import { useNavigate } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";
import { Store } from \"lucide-react\";

export default function BecomeSeller() {
  const { user, refreshMe } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ shop_name: \"\", shop_description: \"\", phone: user?.phone || \"\", address: user?.address || \"\" });
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  if (user.role === \"seller\") {
    return (
      <div className=\"container-lc py-16 text-center\" data-testid=\"already-seller\">
        <Store className=\"w-12 h-12 mx-auto text-[#2D6A4F]\" />
        <h1 className=\"text-2xl mt-4\">You're a seller!</h1>
        <p className=\"mt-2 text-[#57534E]\">Status: <strong>{user.seller_status}</strong></p>
        <button onClick={() => nav(\"/seller\")} className=\"btn-primary mt-6\">Go to dashboard</button>
      </div>
    );
  }

  const ch = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post(\"/sellers/apply\", form);
      await refreshMe();
      toast.success(\"Application submitted! Awaiting admin approval.\");
      nav(\"/seller\");
    } catch (err) { toast.error(err.response?.data?.detail || \"Could not apply\"); }
    finally { setBusy(false); }
  };

  return (
    <div className=\"container-lc py-12 max-w-2xl\" data-testid=\"become-seller-page\">
      <div className=\"label-eyebrow\">For business owners</div>
      <h1 className=\"text-3xl mt-2 font-medium\">Open your shop on Local Connect</h1>
      <p className=\"mt-2 text-[#57534E]\">Submit your details — once approved by admin, you can start listing products and services right away.</p>
      <form onSubmit={submit} className=\"card-soft p-6 mt-6 space-y-4\">
        <div><label className=\"text-sm\">Shop name</label>
          <input required data-testid=\"bs-shop-name\" value={form.shop_name} onChange={ch(\"shop_name\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4]\" /></div>
        <div><label className=\"text-sm\">Description</label>
          <textarea data-testid=\"bs-shop-desc\" value={form.shop_description} onChange={ch(\"shop_description\")} className=\"mt-1 w-full px-4 py-2 rounded-lg border border-[#E7E5E4] min-h-[100px]\" /></div>
        <div className=\"grid sm:grid-cols-2 gap-4\">
          <div><label className=\"text-sm\">Phone</label>
            <input required data-testid=\"bs-phone\" value={form.phone} onChange={ch(\"phone\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4]\" /></div>
          <div><label className=\"text-sm\">Shop address</label>
            <input required data-testid=\"bs-address\" value={form.address} onChange={ch(\"address\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4]\" /></div>
        </div>
        <button disabled={busy} data-testid=\"bs-submit\" className=\"btn-primary\">{busy ? \"Submitting…\" : \"Submit application\"}</button>
      </form>
    </div>
  );
}
"