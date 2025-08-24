import { useState, useEffect } from "react";
import { verifyOTP, resendOTP } from "../api/api.js";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  FaKey, FaArrowLeft, FaCheckCircle, FaEnvelope, FaInfoCircle, FaClock 
} from "react-icons/fa";
import "../Styles/verifyotp.css";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(60);

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = "Verification code is required";
    } else if (otp.length !== 6) {
      newErrors.otp = "Verification code must be 6 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  setMessage("");
  
  try {
    const res = await verifyOTP({ email, otp });
    setMessage(res.message);

    if (res.message === "Email verified successfully. Registration completed!") {
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Email verified successfully! You can now login.",
            email: email // Pass email to pre-fill login form
          } 
        });
      }, 2000);
    }
  } catch (error) {
    setMessage(error.response?.data?.message || "Verification failed. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const handleBack = () => {
    navigate("/register");
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return; // prevent spamming resend
    setMessage("Sending new verification code...");

    try {
      const res = await resendOTP({ email });
      setMessage(res.message || "New verification code sent!");
      setCountdown(60);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to resend verification code.");
    }
  };

  return (
    <div className="register-container">
      {/* Left Features Section */}
      <div className="register-features">
        <div className="features-container">
          <h3>Email Verification</h3>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon"><FaCheckCircle /></div>
              <h4>Secure Account</h4>
              <p>Verify your email to ensure your account security</p>
            </div>
            <div className="feature">
              <div className="feature-icon"><FaEnvelope /></div>
              <h4>Check Your Inbox</h4>
              <p>We've sent a 6-digit code to your email address</p>
            </div>
            <div className="feature">
              <div className="feature-icon"><FaClock /></div>
              <h4>Time Sensitive</h4>
              <p>The verification code expires after 10 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card Section */}
      <div className="register-card">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft /> Back to Register
        </button>

        <div className="register-header">
          <h2>Verify Your Email</h2>
          <p>Enter the 6-digit code sent to your email</p>
        </div>

        {message && (
          <div className={`message-box ${message.includes("successfully") ? "success" : "error"}`}>
            <FaInfoCircle className="message-icon" />
            <span>{message}</span>
          </div>
        )}

        {success ? (
          <div className="success-state">
            <FaCheckCircle className="success-icon" />
            <h3>Email Verified Successfully!</h3>
            <p>Redirecting to login page...</p>
          </div>
        ) : (
          <>
            <div className="email-display">
              <FaEnvelope />
              <span>{email}</span>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
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
                    onChange={handleChange}
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
                className="register-button"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Verifying...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Verify Email
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP Section */}
            <div className="resend-section">
              <p>
                Didn’t receive the code?{" "}
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
      </div>
    </div>
  );
}
