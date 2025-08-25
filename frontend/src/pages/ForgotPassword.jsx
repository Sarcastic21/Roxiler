import { useState, useEffect } from "react";
import { 
  forgotPassword, 
  resetPassword, 
  resendOTP 
} from "../api/api.js";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaEnvelope, FaArrowLeft, FaInfoCircle, FaKey, 
  FaCheckCircle, FaClock, FaEye, FaEyeSlash 
} from "react-icons/fa";
import "../Styles/Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Countdown effect for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  // Handle email submission
  const handleEmailSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    try {
      const res = await forgotPassword({ email });
      setMessage(res.message);
      
      if (res.message === "OTP sent successfully") {
        setStep(2); // Move to OTP verification step
        setCountdown(60); // Start countdown for resend
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async e => {
    e.preventDefault();
    
    // Validate OTP
    if (!otp.trim()) {
      setErrors({ otp: "Verification code is required" });
      return;
    } else if (otp.length !== 6) {
      setErrors({ otp: "Verification code must be 6 digits" });
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      
      setStep(3); 
    } catch (error) {
      setMessage(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async e => {
    e.preventDefault();
    
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      const res = await resetPassword({ email, otp, newPassword });
      setMessage(res.message);
      
      if (res.message === "Password reset successfully") {
        setTimeout(() => {
          navigate("/login", { 
            state: { message: "Password reset successfully! You can now login." } 
          });
        }, 2000);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setMessage("Sending new verification code...");
    try {
      const res = await resendOTP({ email });
      setMessage(res.message || "New verification code sent!");
      setCountdown(60);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to resend verification code.");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 1) {
      navigate("/login");
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className=" forgot login-container">
      {/* Left Features Section */}
      <div className="login-features">
        <div className="features-container">
          <h3>
            {step === 1 && "Reset Your Password"}
            {step === 2 && "Verify Your Email"}
            {step === 3 && "Create New Password"}
          </h3>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <FaKey />
              </div>
              <h4>Secure Process</h4>
              <p>We'll send you a secure OTP to reset your password</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaEnvelope />
              </div>
              <h4>Email Verification</h4>
              <p>Check your inbox for the verification code</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaInfoCircle />
              </div>
              <h4>Need Help?</h4>
              <p>Contact support if you encounter any issues</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Card Section */}
      <div className="forgot login-card">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>

        <div className="login-header">
          <h2>
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h2>
          <p>
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Enter your new password below"}
          </p>
        </div>

        {message && (
          <div className={`message-box ${message.includes("successfully") ? "success" : "error"}`}>
            <FaInfoCircle className="message-icon" />
            <span>{message}</span>
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="login-form">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending OTP...
                </>
              ) : (
                <>
                  <FaKey />
                  Send Verification Code
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <>
            <div className="email-display">
              <FaEnvelope />
              <span>{email}</span>
            </div>

            <form onSubmit={handleOtpSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="otp">
                  <FaKey className="input-icon" />
                  Verification Code *
                </label>
                <div className="input-container">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(value);
                      if (errors.otp) setErrors({ ...errors, otp: "" });
                    }}
                    className={`form-input ${errors.otp ? "error" : ""}`}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                {errors.otp && <span className="error-text">{errors.otp}</span>}
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Verifying...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Verify Code
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP Section */}
            <div className="resend-section">
              <p>
                Didn't receive the code?{" "}
                <button 
                  className="resend-button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0}
                >
                  Resend {countdown > 0 && `(${countdown}s)`}
                </button>
              </p>
            </div>

            <div className="role-notice">
              <div className="notice-icon"><FaInfoCircle /></div>
              <p>
                <strong>Note:</strong> Check your spam folder if you don't see the email. 
                The code will expire after 10 minutes.
              </p>
            </div>
          </>
        )}

        {/* Step 3: Password Reset */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="login-form">
            <div className="input-group">
              <label htmlFor="newPassword">
                <FaKey className="input-icon" />
                New Password *
              </label>
              <div className="input-container password-container">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
                  }}
                  className={`form-input ${errors.newPassword ? "error" : ""}`}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">
                <FaKey className="input-icon" />
                Confirm Password *
              </label>
              <div className="input-container password-container">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                  }}
                  className={`form-input ${errors.confirmPassword ? "error" : ""}`}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Resetting...
                </>
              ) : (
                <>
                  <FaCheckCircle /> Reset Password
                </>
              )}
            </button>
          </form>
        )}

        {step === 1 && (
          <div className="login-footer">
            <p>
              Remember your password?{" "}
              <Link to="/login" className="signup-link">
                Back to Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
