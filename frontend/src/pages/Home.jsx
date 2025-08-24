import { useEffect, useState } from "react";
import { getStores, rateStore, rateStoreAnonymous } from "../api/api.js";
import { FaEnvelope, FaMapMarkerAlt, FaUserTie, FaSpinner, FaStar } from "react-icons/fa";
import "../Styles/Home.css";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [ratingComments, setRatingComments] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [showAnonymousForm, setShowAnonymousForm] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState("stores");
  const [visibleCount, setVisibleCount] = useState(12); // pagination counter
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStores();
    const timer = setTimeout(() => setShowWelcome(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchStores = async () => {
    const data = await getStores();
    setStores(data);
  };

  const handleSelectRating = (storeId, rating) => {
    setSelectedRatings(prev => ({ ...prev, [storeId]: rating }));
    if (!token && rating) {
      setShowAnonymousForm(prev => ({ ...prev, [storeId]: true }));
    }
  };

  const handleCommentChange = (storeId, comment) => {
    setRatingComments(prev => ({ ...prev, [storeId]: comment }));
  };

  const handleUserDetailChange = (storeId, field, value) => {
    setUserDetails(prev => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        [field]: value,
      },
    }));
  };

  const handleSubmitRating = async (id) => {
    setLoading(prev => ({ ...prev, [id]: true }));

    const rating = selectedRatings[id];
    if (!rating) {
      alert("Please select a rating first");
      setLoading(prev => ({ ...prev, [id]: false }));
      return;
    }

    const comment = ratingComments[id] || "";

    try {
      if (token) {
        await rateStore(id, rating, comment, token);
      } else {
        const userInfo = userDetails[id] || {};
        await rateStoreAnonymous(
          id,
          rating,
          comment,
          userInfo.name || "",
          userInfo.email || ""
        );
      }

      // Reset
      setSelectedRatings(prev => ({ ...prev, [id]: null }));
      setRatingComments(prev => ({ ...prev, [id]: "" }));
      setUserDetails(prev => ({ ...prev, [id]: {} }));
      setShowAnonymousForm(prev => ({ ...prev, [id]: false }));

      fetchStores();
      alert("Rating submitted successfully!");
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Filter + sort
  const filteredStores = stores
    .filter(
      store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  // Stats
  const ratedStores = stores.filter(store => store.rating > 0);
  const ratedStoresCount = ratedStores.length;
  const averageRating =
    ratedStoresCount > 0
      ? (
          ratedStores.reduce((acc, store) => acc + Number(store.rating), 0) /
          ratedStoresCount
        ).toFixed(1)
      : 0;

  return (
    <div className="landing-container">
      {/* Welcome Overlay */}
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <h1>Welcome to StoreRatings</h1>
            <p>Discover and rate your favorite stores</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>
            Store<span>Ratings</span>
          </h1>
          <p>Find the best stores based on community ratings</p>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search stores by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        <div className="container">
          {/* Stats */}
          <section className="stats-section">
            <div className="stat-item">
              <h3>{stores.length}</h3>
              <p>Total Stores</p>
            </div>
            <div className="stat-item">
              <h3>{ratedStoresCount}</h3>
              <p>Rated Stores</p>
            </div>
            <div className="stat-item">
              <h3>{averageRating}</h3>
              <p>Average Rating</p>
            </div>
          </section>

          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab ${activeTab === "stores" ? "active" : ""}`}
              onClick={() => setActiveTab("stores")}
            >
              Stores
            </button>
            <button
              className={`tab ${activeTab === "top-rated" ? "active" : ""}`}
              onClick={() => setActiveTab("top-rated")}
            >
              Top Rated
            </button>
          </div>

          {/* Sort */}
          <div className="controls-row">
            <div className="sort-container">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {/* Stores */}
          <section className="stores-section">
            {filteredStores.length === 0 ? (
              <div className="no-results">
                <h3>No stores found</h3>
                <p>Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="stores-grid">
                {filteredStores.slice(0, visibleCount).map((s) => (
                  <div key={s.id} className="store-card">
                    <div className="store-header">
                      <h3>{s.name}</h3>
                      <div className="rating-badge">
                        {s.rating
                          ? `${Number(s.rating).toFixed(1)} ⭐`
                          : "No ratings"}
                      </div>
                    </div>

                    <div className="store-details">
                      <p>
                        <FaEnvelope /> {s.email}
                      </p>
                      <p>
                        <FaMapMarkerAlt /> {s.address}
                      </p>
                      <p>
                        <FaUserTie /> {s.owner_name}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="rating-section">
                      <h4>Rate this store</h4>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            className={`star-btn ${
                              selectedRatings[s.id] === r ? "selected" : ""
                            }`}
                            onClick={() => handleSelectRating(s.id, r)}
                            disabled={loading[s.id]}
                          >
                            <FaStar />
                          </button>
                        ))}
                      </div>

                      {selectedRatings[s.id] && (
                        <div className="rating-form">
                          <textarea
                            value={ratingComments[s.id] || ""}
                            onChange={(e) =>
                              handleCommentChange(s.id, e.target.value)
                            }
                            placeholder="Share your experience (optional)"
                            disabled={loading[s.id]}
                            className="comment-textarea"
                          />

                          {/* Anonymous user form */}
                          {!token && showAnonymousForm[s.id] && (
                            <div className="anonymous-form">
                              <div className="input-group">
                                <input
                                  type="text"
                                  placeholder="Your Name (optional)"
                                  value={userDetails[s.id]?.name || ""}
                                  onChange={(e) =>
                                    handleUserDetailChange(
                                      s.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  disabled={loading[s.id]}
                                  className="form-input"
                                />
                                <input
                                  type="email"
                                  placeholder="Your Email (optional)"
                                  value={userDetails[s.id]?.email || ""}
                                  onChange={(e) =>
                                    handleUserDetailChange(
                                      s.id,
                                      "email",
                                      e.target.value
                                    )
                                  }
                                  disabled={loading[s.id]}
                                  className="form-input"
                                />
                              </div>
                              <p className="form-note">
                                If not provided, your rating will be shown as
                                "Anonymous"
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() => handleSubmitRating(s.id)}
                            disabled={loading[s.id]}
                            className="submit-rating-btn"
                          >
                            {loading[s.id] ? (
                              <>
                                <FaSpinner className="spin" /> Submitting...
                              </>
                            ) : (
                              "Submit Rating"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {visibleCount < filteredStores.length && (
              <div className="load-more-container">
                <button
                  className="load-more-btn"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                >
                  Load More
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
