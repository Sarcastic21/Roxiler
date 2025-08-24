import { useState } from "react";
import { registerUser } from "../api/api.js";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaMapMarkerAlt, FaSignInAlt, FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import "../Styles/Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    address: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async e => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setMessage("");
  
  try {
    const res = await registerUser(form);
    
    if (res.requiresVerification) {
      // ✅ Navigate to verify-otp with email
      navigate("/verify-otp", { state: { email: res.email || form.email } });
    } else if (res.userId) {
      setMessage(res.message);
      // Handle other success cases if needed
    } else {
      setMessage(res.message || res.errors?.[0]?.msg || "Registration failed");
    }
  } catch (error) {
    setMessage("An error occurred during registration");
    console.error("Registration error:", error);
  } finally {
    setLoading(false);
  }
};

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-container">
      <div className="register-features">
        <div className="features-container">
          <h3>Why Join StoreHub?</h3>
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
      <div className="register-card">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <div className="register-header">
          
          <h2>Create Account</h2>
          <p>Join our community as a valued user</p>
        </div>

        {message && (
          <div className="message-box error">
            <FaInfoCircle className="message-icon" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <label htmlFor="username">
              <FaUser className="input-icon" />
              Username *
            </label>
            <div className="input-container">
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                className={`form-input ${errors.username ? 'error' : ''}`}
              />
            </div>
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="email">
              <FaEnvelope className="input-icon" />
              Email Address *
            </label>
            <div className="input-container">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <FaLock className="input-icon" />
              Password *
            </label>
            <div className="input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">
              <FaLock className="input-icon" />
              Confirm Password *
            </label>
            <div className="input-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="address">
              <FaMapMarkerAlt className="input-icon" />
              Address *
            </label>
            <div className="input-container">
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Enter your address"
                value={form.address}
                onChange={handleChange}
                className={`form-input ${errors.address ? 'error' : ''}`}
              />
            </div>
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>

          <div className="terms-agreement">
            <label className="terms-checkbox">
              <input type="checkbox" required />
              <span>
                I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                <FaSignInAlt />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="role-notice">
          <div className="notice-icon">
            <FaInfoCircle />
          </div>
          <p>
            <strong>Note:</strong> Registration is only available for regular users. 
            Store owner, admin, and super admin accounts require special permissions.
          </p>
        </div>
      </div>

      
    </div>
  );
}