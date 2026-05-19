"import { createContext, useContext, useEffect, useState, useCallback } from \"react\";
import { api, formatApiError } from \"@/lib/api\";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=unauth, obj=auth
  const [cartCount, setCartCount] = useState(0);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get(\"/auth/me\");
      setUser(data);
      return data;
    } catch (_e) {
      setUser(false);
      return null;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const { data } = await api.get(\"/cart\");
      const total = data.reduce((s, i) => s + i.quantity, 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (user && user.id) refreshCart();
    else setCartCount(0);
  }, [user, refreshCart]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post(\"/auth/login\", { email, password });
      setUser(data);
      return { ok: true, user: data };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) };
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post(\"/auth/register\", payload);
      setUser(data);
      return { ok: true, user: data };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) };
    }
  };

  const logout = async () => {
    try { await api.post(\"/auth/logout\"); } catch {}
    setUser(false);
    setCartCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, refreshMe, cartCount, refreshCart }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
"