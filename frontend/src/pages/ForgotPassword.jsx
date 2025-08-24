import { useState } from "react";
import { verifyOTP } from "../api/api.js";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import "../Styles/ForgotPassword.css"; // Assuming you have a shared Auth.css file

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    try {
      const res = await verifyOTP({ email, otp });
      setMessage(res.message);
      
      if (res.message === "Email verified successfully") {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login", { 
            state: { message: "Email verified successfully! You can now login." } 
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft />
          </button>
          <h2>Verify Email</h2>
          <p className="auth-subtitle">
            Enter the verification code sent to your email
          </p>
        </div>

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

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <div className="input-icon">
                  <FaKey />
                </div>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="form-input"
                  maxLength={6}
                />
              </div>

              {message && (
                <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                className="auth-button"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Didn't receive the code?{" "}
                <button 
                  className="link-button"
                  onClick={() => navigate("/resend-otp", { state: { email } })}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}