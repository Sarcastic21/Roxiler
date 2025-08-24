import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Navbar.css';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Function to update login state from localStorage
  const updateLoginState = () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    const userDataStr = localStorage.getItem('userData');
    
    setIsLoggedIn(!!token);
    setRole(userRole || '');
    
    if (userDataStr) {
      try {
        setUserData(JSON.parse(userDataStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  };

  useEffect(() => {
    // Initial check
    updateLoginState();

    // Listen for storage changes (e.g., login in another tab)
    window.addEventListener('storage', updateLoginState);
    
    // Listen for custom auth change events (same tab)
    window.addEventListener('authChange', updateLoginState);

    return () => {
      window.removeEventListener('storage', updateLoginState);
      window.removeEventListener('authChange', updateLoginState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setRole('');
    setUserData(null);
    navigate('/');
    setIsMenuOpen(false);
    
    // Dispatch event to notify other components about logout
    window.dispatchEvent(new Event('authChange'));
  };

  const handleMyAccount = () => {
    switch (role) {
      case 'user':
        navigate('/user');
        break;
      case 'super_admin':
        navigate('/super-admin');
        break;
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'storeowner':
        navigate('/store-owner');
        break;
      default:
        navigate('/profile');
    }
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleSignup = () => {
    navigate('/register');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => navigate('/')}>
          <span className="logo-text">Store</span>
          <span className="logo-accent">Hub</span>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
           
          </div>

          <div className="nav-auth">
            {isLoggedIn ? (
              <div className="auth-buttons">
              
                <button className="nav-btn account-btn" onClick={handleMyAccount}>
                  My Account
                </button>
                <button className="nav-btn logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="nav-btn login-btn" onClick={handleLogin}>
                  Login
                </button>
                <button className="nav-btn signup-btn" onClick={handleSignup}>
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        <div 
          className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;