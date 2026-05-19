"import { useState, useEffect } from \"react\";
import { Link, useNavigate } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";

export default function Register() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: \"\", email: \"\", password: \"\", phone: \"\" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user && user.id) nav(\"/\", { replace: true }); }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await register(form);
    setBusy(false);
    if (r.ok) { toast.success(\"Account created!\"); nav(\"/\", { replace: true }); }
    else toast.error(r.error);
  };
  const ch = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className=\"container-lc py-16 grid place-items-center\" data-testid=\"register-page\">
      <div className=\"w-full max-w-md card-soft p-8\">
        <div className=\"label-eyebrow\">New here</div>
        <h1 className=\"text-2xl mt-2 font-medium\">Create your Local Connect account</h1>
        <form onSubmit={submit} className=\"mt-6 space-y-4\">
          <div><label className=\"text-sm text-[#57534E]\">Full name</label>
            <input data-testid=\"reg-name\" required value={form.name} onChange={ch(\"name\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4] bg-white outline-none focus:border-[#2D6A4F]\" /></div>
          <div><label className=\"text-sm text-[#57534E]\">Email</label>
            <input data-testid=\"reg-email\" type=\"email\" required value={form.email} onChange={ch(\"email\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4] bg-white outline-none focus:border-[#2D6A4F]\" /></div>
          <div><label className=\"text-sm text-[#57534E]\">Phone (optional)</label>
            <input data-testid=\"reg-phone\" value={form.phone} onChange={ch(\"phone\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4] bg-white outline-none focus:border-[#2D6A4F]\" /></div>
          <div><label className=\"text-sm text-[#57534E]\">Password</label>
            <input data-testid=\"reg-password\" type=\"password\" required minLength={6} value={form.password} onChange={ch(\"password\")} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4] bg-white outline-none focus:border-[#2D6A4F]\" /></div>
          <button disabled={busy} data-testid=\"reg-submit\" className=\"btn-primary w-full\">{busy ? \"Creating…\" : \"Create account\"}</button>
        </form>
        <p className=\"mt-4 text-sm text-[#57534E]\">Already have one? <Link to=\"/login\" className=\"text-[#2D6A4F] hover:underline\">Sign in</Link></p>
      </div>
    </div>
  );
}
"