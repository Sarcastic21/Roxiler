const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// ---------- Auth APIs ----------
export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  const responseData = await res.json();
  
  // Check if the response indicates OTP verification is required
  if (res.ok && responseData.requiresVerification) {
    return {
      success: true,
      requiresVerification: true,
      email: responseData.email,
      message: responseData.message
    };
  }
  
  return responseData;
}

export async function verifyOTP(data) {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Add this resendOTP function
export async function resendOTP(data) {
  const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function forgotPassword(data) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function resetPassword(data) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ---------- User APIs ----------
export async function getCurrentUser(token) {
  const res = await fetch(`${BASE_URL}/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ---------- Super Admin APIs ----------
export async function superAdminCreateUser(data, token) {
  const res = await fetch(`${BASE_URL}/super-admin/create-user`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function superAdminGetUsers(token) {
  const res = await fetch(`${BASE_URL}/super-admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function superAdminDeleteUser(userId, token) {
  const res = await fetch(`${BASE_URL}/super-admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ---------- Store APIs ----------
export async function getStores(token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE_URL}/stores`, { headers });
  return res.json();
}

export async function rateStore(id, rating, comment = "", token) {
  const res = await fetch(`${BASE_URL}/stores/${id}/rate`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ rating, comment }),
  });
  return res.json();
}

export async function createStore(data, token) {
  const res = await fetch(`${BASE_URL}/stores/create`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateStore(id, data, token) {
  const res = await fetch(`${BASE_URL}/stores/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteStore(id, token) {
  const res = await fetch(`${BASE_URL}/stores/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// New function to get stores with detailed ratings
export async function getStoresWithRatings(token) {
  const res = await fetch(`${BASE_URL}/stores/with-ratings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function rateStoreAnonymous(id, rating, comment = "", userName = "", userEmail = "") {
  const res = await fetch(`${BASE_URL}/stores/${id}/rate-anonymous`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      rating, 
      comment, 
      user_name: userName, 
      user_email: userEmail 
    }),
  });
  
  if (!res.ok) {
    throw new Error("Failed to submit rating");
  }
  
  return res.json();
}

// Update password
export const updatePassword = async (token, passwordData) => {
  const response = await fetch(`${BASE_URL}/auth/update-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(passwordData)
  });

  if (!response.ok) {
    throw new Error('Failed to update password');
  }

  return response.json();
};

// Delete account
export const deleteAccount = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/delete-account`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete account');
  }

  return response.json();
};

// Get user details
export const getUserDetails = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/user-details`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }

  return response.json();
};