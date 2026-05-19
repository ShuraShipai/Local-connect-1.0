"import { useState, useEffect } from \"react\";
import { Link, useNavigate, useSearchParams } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get(\"next\") || \"/\";
  const [email, setEmail] = useState(\"\");
  const [password, setPassword] = useState(\"\");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user && user.id) nav(next, { replace: true }); }, [user, nav, next]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await login(email, password);
    setBusy(false);
    if (r.ok) {
      toast.success(\"Welcome back!\");
      const role = r.user.role;
      if (role === \"admin\") nav(\"/admin\", { replace: true });
      else if (role === \"seller\") nav(\"/seller\", { replace: true });
      else nav(next, { replace: true });
    } else { toast.error(r.error); }
  };
  return (
    <div className=\"container-lc py-16 grid place-items-center\" data-testid=\"login-page\">
      <div className=\"w-full max-w-md card-soft p-8\">
        <div className=\"label-eyebrow\">Welcome back</div>
        <h1 className=\"text-2xl mt-2 font-medium\">Sign in to Local Connect</h1>
        <form onSubmit={submit} className=\"mt-6 space-y-4\">
          <div>
            <label className=\"text-sm text-[#57534E]\">Email</label>
            <input data-testid=\"login-email\" type=\"email\" required value={email} onChange={(e) => setEmail(e.target.value)} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4] bg-white outline-none focus:border-[#2D6A4F]\" />
          </div>
          <div>
            <label className=\"text-sm text-[#57534E]\">Password</label>
            <input data-testid=\"login-password\" type=\"password\" required value={password} onChange={(e) => setPassword(e.target.value)} className=\"mt-1 w-full h-11 px-4 rounded-lg border border-[#E7E5E4] bg-white outline-none focus:border-[#2D6A4F]\" />
          </div>
          <button disabled={busy} data-testid=\"login-submit\" className=\"btn-primary w-full\">{busy ? \"Signing in…\" : \"Sign in\"}</button>
        </form>
        <p className=\"mt-4 text-sm text-[#57534E]\">No account? <Link to=\"/register\" className=\"text-[#2D6A4F] hover:underline\">Create one</Link></p>
        <p className=\"mt-2 text-xs text-[#A8A29E]\">Try admin: admin@localconnect.in / admin123</p>
      </div>
    </div>
  );
}
"