import { useEffect, useState } from "react";
import { getStoresWithRatings, updatePassword, deleteAccount, getUserDetails } from "../api/api.js";
import { useNavigate } from "react-router-dom";
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaSignOutAlt, 
  FaTrashAlt, FaLock, FaStore, FaComment, FaUser,
  FaEnvelope, FaMapMarkerAlt, FaExclamationTriangle,
  FaSyncAlt, FaTimes, FaCheck, FaUserEdit, FaIdCard
} from "react-icons/fa";
import "../Styles/StoreOwnerDashboard.css";

export default function StoreOwnerDashboard() {
  const [stores, setStores] = useState([]);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both stores and user details in parallel
      const [storesData, userData] = await Promise.all([
        getStoresWithRatings(token),
        getUserDetails(token)
      ]);
      
      // Get user ID from token
      const userId = getUserIdFromToken();
      
      // Filter stores owned by the logged-in storeowner
      const filteredStores = storesData.filter(store => store.owner_id === userId);
      setStores(filteredStores);
      setUserDetails(userData);
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUserIdFromToken = () => {
    try {
      if (!token) return null;
      
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      return tokenPayload.id || tokenPayload.userId || tokenPayload.sub;
    } catch (err) {
      console.error("Error parsing token:", err);
      return null;
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
    if (!window.confirm("Are you absolutely sure? This will permanently delete your account, stores, and all associated data.")) {
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

  const renderStars = (rating) => {
    // Convert rating to number and handle null/undefined
    const numericRating = Number(rating) || 0;
    const stars = [];
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="star full" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star half" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star empty" />);
    }
    
    return stars;
  };

  // Calculate average rating safely
 // Calculate average rating safely - EXCLUDE stores with no ratings
const calculateAverageRating = () => {
  // Filter out stores that have no ratings (rating = 0 or null/undefined)
  const ratedStores = stores.filter(store => {
    const rating = Number(store.rating) || 0;
    return rating > 0;
  });
  
  if (ratedStores.length === 0) return "0.0";
  
  const total = ratedStores.reduce((sum, store) => {
    const rating = Number(store.rating) || 0;
    return sum + rating;
  }, 0);
  
  return (total / ratedStores.length).toFixed(1);
};
  if (loading && activeTab === "dashboard") {
    return (
      <div className="dashboard-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>StoreHub</h2>
            <p>Owner Portal</p>
          </div>
        </div>
        <div className="main-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your data...</p>
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
          <p>Owner Portal</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeTab === "dashboard" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("dashboard")}
          >
            <FaStore className="nav-icon" /> My Stores
          </button>
          <button 
            className={activeTab === "account" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("account")}
          >
            <FaIdCard className="nav-icon" /> Account
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
            {activeTab === "dashboard" && "My Stores Dashboard"}
            {activeTab === "account" && "Account Details"}
            {activeTab === "password" && "Update Password"}
            {activeTab === "delete" && "Account Deletion"}
          </h1>
          <div className="user-info">
            <FaUser className="user-icon" />
            <span>Welcome, {userDetails?.username || "Store Owner"}</span>
          </div>
        </header>
        
        <div className="content-body">
          {error && (
            <div className="error-alert">
              <p>{error}</p>
              <button onClick={fetchData} className="retry-btn">
                <FaSyncAlt /> Retry
              </button>
            </div>
          )}
          
          {activeTab === "dashboard" && (
            <>
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaStore />
                  </div>
                  <div className="stat-info">
                    <h3>{stores.length}</h3>
                    <p>Total Stores</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaStar />
                  </div>
                  <div className="stat-info">
                    <h3>{calculateAverageRating()}</h3>
                    <p>Average Rating</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaComment />
                  </div>
                  <div className="stat-info">
                    <h3>
                      {stores.reduce((total, store) => total + (store.ratings?.length || 0), 0)}
                    </h3>
                    <p>Total Reviews</p>
                  </div>
                </div>
              </div>
              
              {stores.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FaStore />
                  </div>
                  <h3>No stores found</h3>
                  <p>You haven't created any stores yet.</p>
                </div>
              ) : (
                <div className="stores-grid">
                  {stores.map(store => {
                    // Safely get the rating value
                    const storeRating = Number(store.rating) || 0;
                    const displayRating = storeRating > 0 ? storeRating.toFixed(1) : "No ratings";
                    
                    return (
                      <div key={store.id} className="store-card">
                        <div className="store-header">
                          <h3>{store.name}</h3>
                          <div className="store-rating">
                            {storeRating > 0 ? (
                              <>
                                {renderStars(storeRating)}
                                <span>({displayRating})</span>
                              </>
                            ) : (
                              <span>No ratings yet</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="store-details">
                          <p><FaEnvelope className="detail-icon" /> {store.email}</p>
                          <p><FaMapMarkerAlt className="detail-icon" /> {store.address}</p>
                        </div>
                        
                        <div className="reviews-section">
                          <h4>Ratings & Reviews</h4>
                          {store.ratings && store.ratings.length > 0 ? (
                            <div className="reviews-list">
                              {store.ratings.map((rating, index) => (
                                <div key={index} className="review-card">
                                  <div className="review-header">
                                    <div className="review-stars">
                                      {renderStars(rating.value)}
                                    </div>
                                    <span className="review-date">
                                      {new Date(rating.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {rating.comment && (
                                    <p className="review-comment">"{rating.comment}"</p>
                                  )}
                                  
                                  <div className="reviewer-info">
                                    <FaUser className="reviewer-icon" />
                                    <span>
                                      By {rating.user_name || "Anonymous"} ({rating.user_email || "Unknown"})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-reviews">No ratings yet for this store.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          
          {activeTab === "account" && userDetails && (
            <div className="profile-details">
              <div className="detail-card">
                <h3><FaUserEdit /> Account Information</h3>
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
                  account, all your stores, products, and associated data.
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