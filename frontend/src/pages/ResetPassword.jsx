import { useState } from "react";
import { resetPassword } from "../api/api.js";
import { useLocation, useNavigate } from "react-router-dom";
import { FaLock, FaInfoCircle, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa"; // Import icons
import "../Styles/Auth.css"; // Import shared styles

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await resetPassword({ email, newPassword }); // Remove OTP
      setMessage(res.message);
      if (res.message === "Password reset successfully") {
        navigate("/login", { state: { message: "Password reset successfully. You can now login." } });
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/forgot-password");
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="login-container">
      <div className="login-features">
        <div className="features-container">
          <h3>Reset Password</h3>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon"><FaLock /></div>
              <h4>Secure</h4>
              <p>Set a new secure password for your account.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft />
          </button>
          <h2>Reset Password</h2>
          <p>Enter your new password.</p>
        </div>

        {message && (
          <div className={`message-box ${message.includes("successfully") ? "success" : "error"}`}>
            <FaInfoCircle className="message-icon" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="newPassword">
              New Password
            </label>
            <div className="password-input-container">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="form-input"
              />
              <span className="password-toggle-icon" onClick={toggleNewPasswordVisibility}>
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-input"
              />
              <span className="password-toggle-icon" onClick={toggleConfirmPasswordVisibility}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
