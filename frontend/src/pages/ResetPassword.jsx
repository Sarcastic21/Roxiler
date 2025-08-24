import { useState } from "react";
import { resetPassword } from "../api/api.js";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await resetPassword({ email, otp, newPassword });
    setMessage(res.message);
    if (res.message === "Password reset successfully") navigate("/login");
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
        <input placeholder="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
        <button type="submit">Reset</button>
      </form>
    </div>
  );
}
