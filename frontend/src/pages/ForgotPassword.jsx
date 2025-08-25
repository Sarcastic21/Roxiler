import { useState } from "react";
import { forgotPassword } from "../api/api.js"; // API call to request OTP
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaPaperPlane, FaInfoCircle } from "react-icons/fa";
import "../Styles/Auth.css"; // using same theme as Login/Register

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await forgotPassword({ email, type: "reset" });  // Just request the OTP

      if (res.message === "OTP sent successfully") { //Checking message instead of success
        setMessage(res.message || "OTP sent successfully! Please check your email.");
        // Navigate to VerifyOTP page with email
        navigate("/verify-otp", { state: { email, type: "reset" } });  // Pass the email to the VerifyOTP page
      } else {
        setMessage(res.message || "Failed to send OTP. Please try again.");
      }

    } catch (error) {
      console.error("Error requesting OTP:", error);
      setMessage(error.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/login");
  };

  return (
    <div className="login-container">
      {/* Left Info / Features */}
      <div className="login-features">
        <div className="features-container">
          <h3>Password Recovery</h3>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon"><FaEnvelope /></div>
              <h4>Email Verification</h4>
              <p>A verification code will be sent to your email.</p>
            </div>
            <div className="feature">
              <div className="feature-icon"><FaInfoCircle /></div>
              <h4>Check Inbox/Spam</h4>
              <p>The verification code may take a few minutes to arrive.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card Section */}
      <div className="login-card">
        <div className="login-header">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft />
          </button>
          <h2>Forgot Password?</h2>
          <p>Enter your email to receive a verification code.</p>
        </div>

        {message && (
          <div className={`message-box ${message.includes("successfully") ? "success" : "error"}`}>
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
                placeholder="Enter your registered email"
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
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Sending OTP...
              </>
            ) : (
              <>
                <FaPaperPlane /> Send OTP
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
