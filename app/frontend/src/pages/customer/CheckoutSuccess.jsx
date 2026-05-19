"import { useEffect, useRef, useState } from \"react\";
import { Link, useSearchParams } from \"react-router-dom\";
import { api } from \"@/lib/api\";
import { useAuth } from \"@/contexts/AuthContext\";
import { CheckCircle2, AlertCircle, Loader2 } from \"lucide-react\";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get(\"session_id\");
  const orderId = params.get(\"order_id\");
  const [state, setState] = useState({ status: \"polling\", payment: null });
  const attempts = useRef(0);
  const { refreshCart } = useAuth();

  useEffect(() => {
    if (!sessionId) { setState({ status: \"error\", payment: null }); return; }
    let cancel = false;
    const poll = async () => {
      if (cancel) return;
      attempts.current += 1;
      try {
        const { data } = await api.get(`/payments/checkout/status/${sessionId}`);
        if (data.payment_status === \"paid\") { setState({ status: \"paid\", payment: data }); refreshCart(); return; }
        if (data.status === \"expired\") { setState({ status: \"expired\", payment: data }); return; }
        if (attempts.current > 8) { setState({ status: \"timeout\", payment: data }); return; }
        setTimeout(poll, 2000);
      } catch {
        if (attempts.current > 4) { setState({ status: \"error\", payment: null }); return; }
        setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { cancel = true; };
  }, [sessionId, refreshCart]);

  return (
    <div className=\"container-lc py-24 text-center\" data-testid=\"checkout-success-page\">
      {state.status === \"polling\" && <><Loader2 className=\"w-10 h-10 mx-auto animate-spin text-[#2D6A4F]\" /><p className=\"mt-4 text-[#57534E]\">Confirming your payment…</p></>}
      {state.status === \"paid\" && (
        <>
          <CheckCircle2 className=\"w-16 h-16 mx-auto text-[#2D6A4F]\" />
          <h1 className=\"mt-4 text-3xl font-medium\">Payment successful</h1>
          <p className=\"mt-2 text-[#57534E]\">Order #{orderId?.slice(0, 8)} confirmed. We'll get it ready right away.</p>
          <Link to=\"/orders\" className=\"btn-primary mt-6 inline-flex\" data-testid=\"view-orders-link\">View my orders</Link>
        </>
      )}
      {(state.status === \"expired\" || state.status === \"timeout\" || state.status === \"error\") && (
        <>
          <AlertCircle className=\"w-16 h-16 mx-auto text-red-500\" />
          <h1 className=\"mt-4 text-3xl font-medium\">Payment not confirmed</h1>
          <p className=\"mt-2 text-[#57534E]\">If amount was deducted it will be refunded automatically.</p>
          <Link to=\"/cart\" className=\"btn-secondary mt-6 inline-flex\">Try again</Link>
        </>
      )}
    </div>
  );
}
"