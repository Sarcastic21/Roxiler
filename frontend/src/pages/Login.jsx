import { useState } from "react";
import { loginUser, getCurrentUser } from "../api/api.js";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope, FaSignInAlt, FaKey, FaCrown, FaStore, FaUsers, FaInfoCircle } from "react-icons/fa";
import {FaMapMarkerAlt } from "react-icons/fa";

import "../Styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

 const handleSubmit = async e => {
  e.preventDefault();
  setLoading(true);
  setMessage("");
  
  try {
    const res = await loginUser(form);

    if (res.token) {
      localStorage.setItem("token", res.token);

      const user = await getCurrentUser(res.token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userData", JSON.stringify(user));
      
      // Dispatch custom event to notify navbar about login
      window.dispatchEvent(new Event('authChange'));
      
      // Navigate based on role
      switch (user.role) {
        case "super_admin":
          navigate("/super-admin");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "storeowner":
          navigate("/store-owner");
          break;
        case "user":
          navigate("/user");
          break;
        default:
          setMessage("Unauthorized role");
      }
    } else {
      setMessage(res.message || res.errors?.[0]?.msg || "Login failed");
    }
  } catch (error) {
    setMessage("An error occurred during login");
    console.error("Login error:", error);
  } finally {
    setLoading(false);
  }
};

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

 

  return (
    <div className="login-container">
      <div className="login-features">
        <div className="features-container">
          <h3>Why Choose StoreHub?</h3>
            <div className="features-grid">
                      <div className="feature">
                        <div className="feature-icon">
                          <FaUser />
                        </div>
                        <h4>User Privileges</h4>
                        <p>Rate and review stores</p>
                      </div>
                      <div className="feature">
                        <div className="feature-icon">
                          <FaMapMarkerAlt />
                        </div>
                        <h4>Local Discovery</h4>
                        <p>Find the best stores in your area based on authentic community ratings</p>
                      </div>
                      <div className="feature">
                        <div className="feature-icon">
                          <FaLock />
                        </div>
                        <h4>Secure Account</h4>
                        <p>Your data is protected with industry-standard security measures</p>
                      </div>
                    </div>
        </div>
      </div>
      <div className="login-card">
        <div className="login-header">
          
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        {message && (
          <div className="message-box error">
            <FaInfoCircle className="message-icon" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">
              <FaEnvelope className="input-icon" />
              Email Address
            </label>
            <div className="input-container">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <FaLock className="input-icon" />
              Password
            </label>
            <div className="input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">
              <FaKey />
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <FaSignInAlt />
                Sign In
              </>
            )}
          </button>
          <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="signup-link">
              Sign up now
            </Link>
          </p>
        </div>
        </form>
 
        <div className="demo-section">
          <button 
            className="demo-toggle"
            onClick={() => setShowDemoOptions(!showDemoOptions)}
          >
            <FaUsers />
            Available Accounts
          </button>
          
          {showDemoOptions && (
            <div className="demo-options">
              <h4>You can login as</h4>
              <div className="demo-buttons">
                <button 
                  className="demo-btn user"
                >
                  <FaUser />
                  Regular User
                </button>
                <button 
                  className="demo-btn storeowner"
                >
                  <FaStore />
                  Store Owner
                </button>
                <button 
                  className="demo-btn admin"
                >
                  <FaUsers />
                  Admin
                </button>
                <button 
                  className="demo-btn super-admin"
                >
                  <FaCrown />
                  Super Admin
                </button>
              </div>
            </div>
          )}
        </div>

       
      </div>

      
    </div>
  );
}