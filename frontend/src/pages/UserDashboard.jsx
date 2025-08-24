import { useEffect, useState } from "react";
import { updatePassword, deleteAccount, getUserDetails } from "../api/api.js";
import { useNavigate } from "react-router-dom";
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaSignOutAlt, 
  FaTrashAlt, FaLock, FaUser, FaHistory,
  FaEnvelope, FaMapMarkerAlt, FaExclamationTriangle,
  FaSyncAlt, FaTimes, FaCheck, FaUserEdit
} from "react-icons/fa";
import "../Styles/StoreOwnerDashboard.css"; // Using the same CSS

export default function UserDashboard() {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const data = await getUserDetails(token);
      setUserDetails(data);
    } catch (err) {
      setError("Failed to load user details. Please try again.");
      console.error("Error fetching user details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords don't match");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters");
      return;
    }
    
    try {
      setLoading(true);
      await updatePassword(token, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordMessage("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setPasswordMessage(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure? This will permanently delete your account and all associated data.")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteAccount(token);
      localStorage.removeItem("token");
      navigate("/register");
      alert("Your account has been permanently deleted.");
    } catch (err) {
      setError("Failed to delete account. Please try again.");
      console.error("Error deleting account:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && activeTab === "dashboard") {
    return (
      <div className="dashboard-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>StoreHub</h2>
            <p>User Portal</p>
          </div>
        </div>
        <div className="main-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>StoreHub</h2>
          <p>User Portal</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeTab === "dashboard" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("dashboard")}
          >
            <FaUser className="nav-icon" /> My Profile
          </button>
          <button 
            className={activeTab === "password" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("password")}
          >
            <FaLock className="nav-icon" /> Update Password
          </button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" /> Logout
          </button>
          <button 
            className="nav-btn delete-btn"
            onClick={() => setActiveTab("delete")}
          >
            <FaTrashAlt className="nav-icon" /> Delete Account
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <p>Need help? Contact support</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <header className="content-header">
          <h1>
            {activeTab === "dashboard" && "My Profile"}
            {activeTab === "password" && "Update Password"}
            {activeTab === "delete" && "Account Deletion"}
          </h1>
          <div className="user-info">
            <FaUser className="user-icon" />
            <span>Welcome, {userDetails?.username || "User"}</span>
          </div>
        </header>
        
        <div className="content-body">
          {error && (
            <div className="error-alert">
              <p>{error}</p>
              <button onClick={fetchUserDetails} className="retry-btn">
                <FaSyncAlt /> Retry
              </button>
            </div>
          )}
          
          {activeTab === "dashboard" && userDetails && (
            <>
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaUser />
                  </div>
                  <div className="stat-info">
                    <h3>{userDetails.username}</h3>
                    <p>Username</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaEnvelope />
                  </div>
                  <div className="stat-info">
                    <h3>{userDetails.email}</h3>
                    <p>Email Address</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaHistory />
                  </div>
                  <div className="stat-info">
                    <h3>{new Date(userDetails.created_at).toLocaleDateString()}</h3>
                    <p>Member Since</p>
                  </div>
                </div>
              </div>
              
              <div className="profile-details">
                <div className="detail-card">
                  <h3><FaUserEdit /> Profile Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{userDetails.username}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{userDetails.email}</span>
                  </div>
                  {userDetails.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{userDetails.address}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Account Type:</span>
                    <span className="detail-value">{userDetails.role}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Member Since:</span>
                    <span className="detail-value">
                      {new Date(userDetails.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Account Status:</span>
                    <span className="detail-value">
                      {userDetails.verified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === "password" && (
            <div className="form-container">
              <div className="form-card">
                <h3><FaLock /> Update Your Password</h3>
                
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  {passwordMessage && (
                    <div className={`message ${passwordMessage.includes("successfully") ? "success" : "error"}`}>
                      {passwordMessage.includes("successfully") ? <FaCheck /> : <FaTimes />}
                      {passwordMessage}
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}
          
          {activeTab === "delete" && (
            <div className="danger-zone">
              <div className="danger-card">
                <h3><FaExclamationTriangle /> Delete Your Account</h3>
                <p>
                  This action cannot be undone. This will permanently delete your 
                  account and all associated data including your ratings and reviews.
                </p>
                
                <button 
                  className="delete-account-btn"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete My Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}