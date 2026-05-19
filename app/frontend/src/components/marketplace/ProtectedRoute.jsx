"import { Navigate, useLocation } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === null) {
    return <div className=\"container-lc py-24 text-center text-[#57534E]\" data-testid=\"auth-loading\">Loading…</div>;
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to=\"/\" replace />;
  }
  return children;
}
"