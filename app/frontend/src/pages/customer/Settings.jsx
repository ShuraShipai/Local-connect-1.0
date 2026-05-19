"import { useState } from \"react\";
import { api } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";

export default function Settings() {
  const { user, refreshMe } = useAuth();
  const [form, setForm] = useState({ name: user?.name || \"\", phone: user?.phone || \"\", address: user?.address || \"\" });
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const ch = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.put(\"/auth/me\", form); await refreshMe(); toast.success(\"Profile updated\"); }
    catch { toast.error(\"Update failed\"); }
    finally { setBusy(false); }
  };
  return (
    <div className=\"container-lc py-10 max-w-2xl\" data-testid=\"settings-page\">
      <h1 className=\"text-3xl font-medium\">Settings</h1>
      <form onSubmit={submit} className=\"mt-6 card-soft p-6 space-y-4\">
        <div><label className=\"text-sm text-[#57534E]\">Full name</label>
          <input data-testid=\"settings-name\" value={form.name} onChange={ch(\"name\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4]\" /></div>
        <div><label className=\"text-sm text-[#57534E]\">Phone</label>
          <input data-testid=\"settings-phone\" value={form.phone} onChange={ch(\"phone\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4]\" /></div>
        <div><label className=\"text-sm text-[#57534E]\">Address</label>
          <textarea data-testid=\"settings-address\" value={form.address} onChange={ch(\"address\")} className=\"mt-1 w-full px-4 py-2 rounded-lg border border-[#E7E5E4] min-h-[100px]\" /></div>
        <button disabled={busy} data-testid=\"settings-save\" className=\"btn-primary\">{busy ? \"Saving…\" : \"Save changes\"}</button>
        <p className=\"text-xs text-[#57534E]\">Account: {user.email} · Role: {user.role}</p>
      </form>
    </div>
  );
}
"