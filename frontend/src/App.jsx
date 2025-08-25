import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import VerifyOTP from "./pages/VerifyOTP.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import StoreOwnerDashboard from "./pages/StoreOwnerDashboard.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Home from "./pages/Home.jsx";
import Navbar from "./pages/Navbar.jsx";
import Footer from "./pages/Footer.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ minHeight: "80vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Private Routes */}
          <Route
            path="/user"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/store-owner"
            element={
              <PrivateRoute>
                <StoreOwnerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <PrivateRoute>
                <SuperAdminDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}
