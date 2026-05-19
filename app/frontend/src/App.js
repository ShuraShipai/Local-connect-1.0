"import { BrowserRouter, Routes, Route } from \"react-router-dom\";
import { AuthProvider } from \"@/contexts/AuthContext\";
import { Toaster } from \"@/components/ui/sonner\";
import Navbar from \"@/components/marketplace/Navbar\";
import Footer from \"@/components/marketplace/Footer\";
import ProtectedRoute from \"@/components/marketplace/ProtectedRoute\";
import \"@/App.css\";

import Home from \"@/pages/public/Home\";
import Products from \"@/pages/public/Products\";
import ProductDetail from \"@/pages/public/ProductDetail\";
import Services from \"@/pages/public/Services\";
import ServiceDetail from \"@/pages/public/ServiceDetail\";
import Sellers from \"@/pages/public/Sellers\";
import SellerStorefront from \"@/pages/public/SellerStorefront\";

import Login from \"@/pages/auth/Login\";
import Register from \"@/pages/auth/Register\";

import Cart from \"@/pages/customer/Cart\";
import Checkout from \"@/pages/customer/Checkout\";
import CheckoutSuccess from \"@/pages/customer/CheckoutSuccess\";
import Orders from \"@/pages/customer/Orders\";
import Wishlist from \"@/pages/customer/Wishlist\";
import Settings from \"@/pages/customer/Settings\";
import BecomeSeller from \"@/pages/customer/BecomeSeller\";

import SellerDashboard from \"@/pages/seller/Dashboard\";
import SellerProducts from \"@/pages/seller/MyProducts\";
import SellerServices from \"@/pages/seller/MyServices\";
import SellerOrders from \"@/pages/seller/MyOrders\";

import AdminDashboard from \"@/pages/admin/Dashboard\";
import AdminSellers from \"@/pages/admin/Sellers\";
import AdminUsers from \"@/pages/admin/Users\";
import AdminListings from \"@/pages/admin/Listings\";

function Layout({ children }) {
  return (
    <div className=\"App\">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path=\"/\" element={<Home />} />
            <Route path=\"/products\" element={<Products />} />
            <Route path=\"/products/:id\" element={<ProductDetail />} />
            <Route path=\"/services\" element={<Services />} />
            <Route path=\"/services/:id\" element={<ServiceDetail />} />
            <Route path=\"/sellers\" element={<Sellers />} />
            <Route path=\"/sellers/:id\" element={<SellerStorefront />} />

            <Route path=\"/login\" element={<Login />} />
            <Route path=\"/register\" element={<Register />} />

            <Route path=\"/cart\" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path=\"/checkout\" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path=\"/checkout/success\" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
            <Route path=\"/orders\" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path=\"/wishlist\" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path=\"/settings\" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path=\"/become-seller\" element={<ProtectedRoute><BecomeSeller /></ProtectedRoute>} />

            <Route path=\"/seller\" element={<ProtectedRoute roles={[\"seller\"]}><SellerDashboard /></ProtectedRoute>} />
            <Route path=\"/seller/products\" element={<ProtectedRoute roles={[\"seller\"]}><SellerProducts /></ProtectedRoute>} />
            <Route path=\"/seller/services\" element={<ProtectedRoute roles={[\"seller\"]}><SellerServices /></ProtectedRoute>} />
            <Route path=\"/seller/orders\" element={<ProtectedRoute roles={[\"seller\"]}><SellerOrders /></ProtectedRoute>} />

            <Route path=\"/admin\" element={<ProtectedRoute roles={[\"admin\"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path=\"/admin/sellers\" element={<ProtectedRoute roles={[\"admin\"]}><AdminSellers /></ProtectedRoute>} />
            <Route path=\"/admin/users\" element={<ProtectedRoute roles={[\"admin\"]}><AdminUsers /></ProtectedRoute>} />
            <Route path=\"/admin/listings\" element={<ProtectedRoute roles={[\"admin\"]}><AdminListings /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position=\"top-right\" richColors />
    </AuthProvider>
  );
}
"