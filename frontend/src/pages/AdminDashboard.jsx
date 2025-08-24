import { useEffect, useState } from "react";
import { 
  superAdminCreateUser as adminCreateUser,
  superAdminGetUsers as adminGetUsers,
  superAdminDeleteUser as adminDeleteUser,
  createStore,
  getStores,
  deleteStore
} from "../api/api.js";



import { useNavigate } from "react-router-dom";
import { 
  FaTrash, 
  FaPlus, 
  FaSignOutAlt, 
  FaUsers, 
  FaStore, 
  FaUserCog, 
  FaChartLine,
  FaEye,
  FaSearch,
  FaTimes,
  FaUser,
  FaUserTie,
  FaUserShield,
  FaBan,
  FaExclamationTriangle
} from "react-icons/fa";
import "../Styles/SuperAdminDashboard.css";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    role: "user",
    storeName: "",
    storeEmail: "",
    storeAddress: "",
    ownerId: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchStores();
  }, []);

const fetchUsers = async () => {
  try {
    console.log("Fetching users with token...");
    const data = await adminGetUsers(token);
    console.log("API Response:", data);

    if (data.error || data.message) {
      setMessage(data.message || "Error fetching users");
      return;
    }

    setUsers(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error.response?.status === 401) {
      setMessage("Authentication failed. Please login again.");
      handleLogout();
    } else {
      setMessage("Error fetching users: " + (error.message || "Unknown error"));
    }
  }
};


  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUserSubmit = async e => {
    e.preventDefault();
    
    // Admin cannot create other admins or super_admins
    if (form.role === 'admin' || form.role === 'super_admin') {
      setMessage("Admins cannot create other admin accounts");
      return;
    }
    
    setLoading(true);
    try {
      const data = await adminCreateUser(form, token);
      setMessage(data.message);
      setForm({ ...form, username: "", email: "", password: "" });
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error creating user");
      console.error("Create user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: form.storeName,
        email: form.storeEmail,
        address: form.storeAddress,
        owner_id: form.ownerId
      };
      await createStore(data, token);
      setMessage("Store created successfully");
      setForm({ ...form, storeName: "", storeEmail: "", storeAddress: "", ownerId: "" });
      fetchStores();
    } catch (error) {
      setMessage("Error creating store");
      console.error("Create store error:", error);
    } finally {
      setLoading(false);
    }
  };

 const handleDeleteUser = async id => {
  const userToDelete = users.find(user => user.id === id);
  
  // Admin cannot delete other admins or super_admins
  if (userToDelete.role === 'admin' || userToDelete.role === 'super_admin') {
    setMessage("Admins cannot delete other admin accounts");
    return;
  }
  
  if (window.confirm("Are you sure you want to delete this user?")) {
    try {
      await adminDeleteUser(id, token);
      setMessage("User deleted successfully");
      fetchUsers();
    } catch (error) {
      setMessage("Error deleting user");
      console.error("Delete user error:", error);
    }
  }
};

  const handleDeleteStore = async id => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      try {
        await deleteStore(id, token);
        setMessage("Store deleted successfully");
        fetchStores();
      } catch (error) {
        setMessage("Error deleting store");
        console.error("Delete store error:", error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return <FaUserShield />;
      case "storeowner": return <FaUserTie />;
      default: return <FaUser />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "#FF6B6B";
      case "storeowner": return "#4ECDC4";
      default: return "#51CF66";
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    totalStores: stores.length,
    storeOwners: users.filter(u => u.role === "storeowner").length,
    regularUsers: users.filter(u => u.role === "user").length
  };

  return (
    <div className="super-admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-text">Store</span>
            <span className="logo-accent">Hub</span>
          </div>
          <p className="admin-role">Admin Dashboard</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FaChartLine />
            Overview
          </button>
          <button 
            className={`nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <FaUsers />
            Users
          </button>
          <button 
            className={`nav-item ${activeTab === "stores" ? "active" : ""}`}
            onClick={() => setActiveTab("stores")}
          >
            <FaStore />
            Stores
          </button>
          <button 
            className={`nav-item ${activeTab === "createUser" ? "active" : ""}`}
            onClick={() => setActiveTab("createUser")}
          >
            <FaUserCog />
            Create User
          </button>
          <button 
            className={`nav-item ${activeTab === "createStore" ? "active" : ""}`}
            onClick={() => setActiveTab("createStore")}
          >
            <FaPlus />
            Create Store
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h1>Admin Dashboard</h1>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users or stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="message-box">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="close-message">
              <FaTimes />
            </button>
          </div>
        )}

        {/* Admin Restrictions Notice */}
        <div className="admin-restrictions">
          <FaExclamationTriangle className="restriction-icon" />
          <span>
            Admin Access: You can manage users and stores, but cannot create or delete other admin accounts.
          </span>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <FaUsers />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stores">
                  <FaStore />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalStores}</h3>
                  <p>Total Stores</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon store-owners">
                  <FaUserTie />
                </div>
                <div className="stat-info">
                  <h3>{stats.storeOwners}</h3>
                  <p>Store Owners</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon regular-users">
                  <FaUser />
                </div>
                <div className="stat-info">
                  <h3>{stats.regularUsers}</h3>
                  <p>Regular Users</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-grid">
                <div className="activity-section">
                  <h3>Latest Users</h3>
                  <div className="activity-list">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="activity-item">
                        <div className="activity-icon" style={{ color: getRoleColor(user.role) }}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="activity-details">
                          <p className="activity-title">{user.username}</p>
                          <p className="activity-subtitle">{user.email}</p>
                        </div>
                        <span className="activity-role">{user.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="activity-section">
                  <h3>Latest Stores</h3>
                  <div className="activity-list">
                    {stores.slice(0, 5).map(store => (
                      <div key={store.id} className="activity-item">
                        <div className="activity-icon">
                          <FaStore />
                        </div>
                        <div className="activity-details">
                          <p className="activity-title">{store.name}</p>
                          <p className="activity-subtitle">{store.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>User Management</h2>
              <button 
                className="add-btn"
                onClick={() => setActiveTab("createUser")}
              >
                <FaPlus /> Add User
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <div className="user-info">
                          <span className="user-icon" style={{ color: getRoleColor(user.role) }}>
                            {getRoleIcon(user.role)}
                          </span>
                          {user.username}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => setSelectedUser(user)}
                          >
                            <FaEye />
                          </button>
                          {user.role !== 'admin' && user.role !== 'super_admin' && (
                            <button 
                              className="action-btn delete"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <FaTrash />
                            </button>
                          )}
                          {(user.role === 'admin' || user.role === 'super_admin') && (
                            <button 
                              className="action-btn disabled"
                              disabled
                              title="Cannot delete admin accounts"
                            >
                              <FaBan />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stores Tab */}
        {activeTab === "stores" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Store Management</h2>
              <button 
                className="add-btn"
                onClick={() => setActiveTab("createStore")}
              >
                <FaPlus /> Add Store
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Owner ID</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map(store => (
                    <tr key={store.id}>
                      <td>{store.id}</td>
                      <td>{store.name}</td>
                      <td>{store.email}</td>
                      <td>{store.address}</td>
                      <td>{store.owner_id}</td>
                      <td>{store.rating || "No ratings"}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => setSelectedStore(store)}
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteStore(store.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create User Tab */}
        {activeTab === "createUser" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Create New User</h2>
              <button 
                className="back-btn"
                onClick={() => setActiveTab("users")}
              >
                ← Back to Users
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="create-form">
              <div className="form-grid">
                <div className="input-group">
                  <label>Username *</label>
                  <input
                    name="username"
                    placeholder="Enter username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Email *</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Password *</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="user">User</option>
                    <option value="storeowner">Store Owner</option>
                    <option value="admin" disabled>Admin (Restricted)</option>
                  </select>
                </div>
              </div>
              <div className="form-note">
                <FaExclamationTriangle />
                <span>Note: Admins cannot create other admin accounts.</span>
              </div>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        )}

        {/* Create Store Tab */}
        {activeTab === "createStore" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Create New Store</h2>
              <button 
                className="back-btn"
                onClick={() => setActiveTab("stores")}
              >
                ← Back to Stores
              </button>
            </div>
            <form onSubmit={handleStoreSubmit} className="create-form">
              <div className="form-grid">
                <div className="input-group">
                  <label>Store Name *</label>
                  <input
                    name="storeName"
                    placeholder="Enter store name"
                    value={form.storeName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Store Email *</label>
                  <input
                    name="storeEmail"
                    type="email"
                    placeholder="Enter store email"
                    value={form.storeEmail}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Address *</label>
                  <input
                    name="storeAddress"
                    placeholder="Enter address"
                    value={form.storeAddress}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Owner ID *</label>
                  <input
                    name="ownerId"
                    placeholder="Enter owner ID"
                    value={form.ownerId}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Store"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="close-modal">
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="user-detail">
                <div className="detail-item">
                  <label>ID:</label>
                  <span>{selectedUser.id}</span>
                </div>
                <div className="detail-item">
                  <label>Username:</label>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <label>Role:</label>
                  <span className="role-badge" style={{ backgroundColor: getRoleColor(selectedUser.role) }}>
                    {selectedUser.role}
                  </span>
                </div>
                {(selectedUser.role === 'admin' || selectedUser.role === 'super_admin') && (
                  <div className="admin-note">
                    <FaExclamationTriangle />
                    <span>This is an admin account. Limited actions available.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Detail Modal */}
      {selectedStore && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Store Details</h3>
              <button onClick={() => setSelectedStore(null)} className="close-modal">
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="store-detail">
                <div className="detail-item">
                  <label>ID:</label>
                  <span>{selectedStore.id}</span>
                </div>
                <div className="detail-item">
                  <label>Name:</label>
                  <span>{selectedStore.name}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{selectedStore.email}</span>
                </div>
                <div className="detail-item">
                  <label>Address:</label>
                  <span>{selectedStore.address}</span>
                </div>
                <div className="detail-item">
                  <label>Owner ID:</label>
                  <span>{selectedStore.owner_id}</span>
                </div>
                <div className="detail-item">
                  <label>Rating:</label>
                  <span>{selectedStore.rating || "No ratings"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
