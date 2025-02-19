import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import messaging from '@react-native-firebase/messaging';



// url local
//const BASE_URL = 'http://localhost:8080/api/v1';

//url prod
const BASE_URL = 'http://3.25.111.31:8080/api/v1';
export const googleLoginApi = async (authCode) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login/google?code=${authCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      await AsyncStorage.setItem('token', result.data.token); // Save the token
      await AsyncStorage.setItem('refreshToken', result.data.refreshToken);
      await AsyncStorage.setItem('userId', String(result.data.userId));
      console.log('Login successful, token saved:', result.data.token);
      return result.data;
    } else {
      console.log('Login failed:', result.message);
      alert('Login failed, please try again.');
      return null;
    }
  } catch (error) {
    console.error('Error during login:', error);
    alert('An error occurred. Please try again later.');
    return null;
  }
};

export const googleSignOut = async () => {
  try {
    await GoogleSignin.signOut(); // Đăng xuất
  } catch (error) {
    console.error('Lỗi đăng xuất Google: ', error);
    throw error;
  }
};

export const loginApi = async (username, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      // Xóa tất cả dữ liệu cũ trong AsyncStorage
      await AsyncStorage.clear();

      // Lưu token mới vào AsyncStorage
      await AsyncStorage.setItem('token', result.data.token);
      registerFCMToken(result.data.userId);

      console.log('Login successful, token saved:', result.data.token);
      return result.data;
    } else {
      console.log('Login failed', result.message);
      alert('Failed to login, please try again later.');
      return null;
    }
  } catch (error) {
    console.error('Error during login:', error);
    alert('Failed to login, please try again later.');
    return null;
  }
};

/**
 * Refresh Token API to get a new token using the refresh token.
 * @param {string} refreshToken - The refresh token stored on the client.
 * @returns {Promise<object>} - The new token data if successful.
 */
export const refreshTokenApi = async (refreshToken) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: refreshToken }),
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK' && result.data && result.data.token) {
      // Save the new token
      await AsyncStorage.setItem('token', result.data.token);
      console.log('Token refreshed successfully:', result.data.token);
      return result.data.token; // Return the new token
    } else {
      console.warn('Refresh token failed:', result.message || 'Unexpected error');
      alert(result.message || 'Unable to refresh token. Please log in again.');
      return null;
    }
  } catch (error) {
    console.error('Error during token refresh:', error);
    alert('Failed to refresh token, please check your network or try again later.');
    return null;
  }
};

/**
 * Logout API to invalidate the current token and clear it from storage.
 * @param {string} token - The JWT token stored on the client.
 * @returns {Promise<boolean>} - Returns true if logout is successful, false otherwise.
 */
export const logout = async () => {
  try {
    // Lấy token từ AsyncStorage
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      console.log('No token found for logout');
      alert('No active session found. You are already logged out.');
      return false; // Không có token, người dùng có thể đã đăng xuất
    }

    // Gọi API logout mà không cần Bearer token
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
      }),
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      console.log('Logout successful:', result.message);

      // Xóa token khỏi AsyncStorage
      await AsyncStorage.removeItem('token');
      return true; // Logout thành công
    } else {
      console.log('Logout failed:', result.message);
      alert('Failed to log out: ' + result.message);
      return false; // Logout thất bại
    }
  } catch (error) {
    console.error('Error during logout:', error);
    alert('Failed to log out, please check your connection and try again.');
    return false; // Xử lý lỗi trong quá trình logout
  }
};

/**
 * Verify Token API to check if the current token is valid.
 * @param {string} token - The JWT token stored on the client.
 * @returns {Promise<boolean>} - Returns true if the token is valid, false otherwise.
 */
export const verifyTokenApi = async token => {
  try {
    const response = await fetch(`${BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
      }),
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      console.log('Token verification successful:', result.data.valid);
      return result.data.valid; // true nếu token còn hợp lệ
    } else {
      console.log('Token verification failed:', result.message);
      return false; // Token không hợp lệ
    }
  } catch (error) {
    console.error('Error during token verification:', error);
    return false;
  }
};

export const otpRequest = async userData =>{
  try {
    const response = await fetch(`${BASE_URL}/users/request-otp`,{
      method: 'POST',
      headers:{
        'Content-Type': ' application/json',
      },
      body: JSON.stringify(userData),
    })
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.error('Failed to create otp:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error create otp:', error);
    return null;
  }
}

export const signUpApi = async userData => {
  try {
    const response = await fetch(`${BASE_URL}/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error;
  }
};
export const verifyOtpApi = async data => {
  try {
    const response = await fetch(`${BASE_URL}/users/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      return true;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'OTP verification failed');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

export const updateUserApi = async (userId, userData) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.log('No token found for getting avatar');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.error('Failed to update user:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};
export const setDeviceId = async ( userData) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.log('No token found for getting avatar');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/users/device`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorData = await response.json();
      console.error('Failed to update user:', errorData.message || response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

export const removeDeviceId = async (userId, userData) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.log('No token found for getting avatar');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.error('Failed to update user:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};
/**
 * API to get user avatar.
 * @param {string} userId - The ID of the user whose avatar is being retrieved.
 * @returns {Promise<string|null>} - The base64 string of the avatar image or null if not found.
 */
export const getAvatarApi = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.log('No token found for getting avatar');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/users/avatar`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      return result.data.avatar;
    } else {
      console.log('Failed to fetch avatar:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return null;
  }
};
/**
 * Upload user avatar using FormData (without base64 encoding in React Native).
 * @param {string} userId - The user's ID.
 * @param {object} file - The selected image file.
 */
export const uploadAvatarApi = async (userId, formData) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.log('No token found for upload avatar');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      console.log('Avatar uploaded successfully:', result.message);
      return result;
    } else {
      console.log('Failed to upload avatar:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error during avatar upload:', error);
    return null;
  }
};

export const getMyInfo = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    try {
      const response = await fetch(`${BASE_URL}/users/myInfo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && result.status === 'OK') {
        console.log('User Info: ', result.data);
        return result.data;
      } else {
        console.log('Failed to fetch list user ', result.message);
        return null;
      }
    } catch (error) {
      console.log('Error during fetch list user ', error);
      return null;
    }
  } else {
    console.log('no token found');
    return null;
  }
};
export const  getById = async (id) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.log('Token not found');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${id}`, { // URL sử dụng id
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    console.log('Full response result:', result);

    if (response.ok && result.status === 'OK') {
      return result.data; // Trả về dữ liệu của closeFriend
    } else {
      console.log('Failed to fetch user by ID:', result.message || `Status ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('Error during fetch user by ID:', error.message);
    return null;
  }
};


export const getAllUser = async () => {
  const token = await AsyncStorage.getItem('token');
  
  if (!token) {
    console.log('No token found');
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    console.log('Full response result:', result); 

    // Kiểm tra phản hồi và lấy dữ liệu từ "data" nếu có
    if (response.ok && result.status === "OK" && Array.isArray(result.data)) {
      console.log('List User:', result.data); // Log danh sách user để kiểm tra
      return result.data; // Trả về mảng users từ result.data
    } else {
      console.log('Failed to fetch list user:', result.message || `Status ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log('Error during fetch list user:', error.message);
    return [];
  }
};


export const getAllFollowers = async () => {
  const token = await AsyncStorage.getItem('token');
  
  if (!token) {
    console.log('No token found');
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/users/followers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    console.log('Full response result:', result); 

    if (response.ok && Array.isArray(result)) {
      console.log('List User:', result); // Log danh sách user để kiểm tra
      return result; // Trả về mảng followers
    } else {
      console.log('Failed to fetch followers:', result.message || `Status ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log('Error during fetch list followers:', error.message);
    return [];
  }
};

export const setCloseFriend = async (username) => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('No token found');
    return false;
  }

  const payload = { username: username }; // Payload được gửi đến API
  console.log('Payload for setCloseFriend:', payload); // In payload ra log

  try {
    const response = await fetch(`${BASE_URL}/users/setCloseFriend`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload), // Gửi payload
    });

    const result = await response.json();
    console.log('API Response:', result); // Log response từ API

    if (response.ok && result.status === 'OK') {
      console.log('Set close friend successfully');
      return true;
    } else {
      console.log('Failed to set close friend:', result.message);
      return false;
    }
  } catch (error) {
    console.log('Error when setting close friend:', error);
    return false;
  }
};



export const addFollowersToFollow = async (username) => {
  const token = await AsyncStorage.getItem('token');
  
  if (!token) {
    console.log('No token found');
    return { success: false, message: 'No token found' };
  }

  try {
    const response = await fetch(`${BASE_URL}/users/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ usernameToFollow: username }),
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      console.log('Yeah, added follower successfully');
      return { success: true, message: 'Send Adding Request successfully' };
    } else if (result.message === 'Invalid request: Follow request already exists') {
      console.log('Follow request already sent.');
      return { success: false, message: 'You have already sent a follow request.' }; // Thay đổi thông báo
    } else {
      console.log('Failed to add follower:', result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.log('Error when adding follower:', error);
    return { success: false, message: 'Error occurred while adding follower' };
  }
};

export const deleteFollow = async(username) =>{
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.log('No token found');
    return [];
  }
  try{
    const response = await fetch(`${BASE_URL}/users/unfollow?usernameToUnfollow=${username}`,
 {
        method: 'DELETE', // Phương thức DELETE
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Gửi token trong header
        },
      }
    );

    const result = await response.json(); // Parse response JSON
    if (response.ok) {
      console.log('Unfollow successful:', result.message);
      return { success: true, message: result.message };
    } else {
      console.error('Failed to unfollow:', result.message || response.statusText);
      return { success: false, message: result.message || 'Failed to unfollow' };
    }
  } catch (error) {
    console.error('Error while unfollowing user:', error.message);
    return { success: false, message: error.message };
  }
}
export const getUserYouFollow = async () => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('No token found');
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/users/all-followed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    console.log('Full response result:', result); // Log toàn bộ phản hồi

    if (response.ok && result?.data) {
      console.log('List of Followed Users:', result.data); // Log danh sách người bạn đang theo dõi
      return result.data; // Trả về danh sách trong trường `data`
    } else {
      console.log(
        'Failed to fetch followed users:',
        result.message || `Status ${response.status}`
      );
      return [];
    }
  } catch (error) {
    console.log('Error during fetch followed users:', error.message);
    return [];
  }
};
export const getAllUserRoleDeviceActive = async () => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('No token found');
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/users/device-active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    console.log('Full response result:', result);

    if (response.ok && Array.isArray(result.data)) {
      console.log('List of users with DEVICE_ACTIVE role:', result.data);
      return result.data;
    } else {
      console.log('Failed to fetch users:', result.message || `Status ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log('Error during fetch DEVICE_ACTIVE users:', error.message);
    return [];
  }
};
export const getPendingRequest = async() => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('No token found');
    return [];
  }
  try {
    const response = await fetch(`${BASE_URL}/users/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    console.log('Full response result:', result);

    if (response.ok && Array.isArray(result.data)) {
      console.log('List of users with status pending:', result.data);
      return result.data;
    } else {
      console.log('Failed to fetch status pending:', result.message || `Status ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log('Error during fetch status pending:', error.message);
    return [];
  }
}

export const acceptRequest = async(username)=> {
  const token = await AsyncStorage.getItem('token');
  
  if (!token) {
    console.log('No token found');
    return { success: false, message: 'No token found' };
  }

  try {
    const response = await fetch(`${BASE_URL}/users/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ usernameFollower: username }),
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      console.log('Yeah, accepted follower successfully');
      return { success: true, message: 'Follower added successfully' };
    } else {
      console.log('Failed to accept follower:', result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.log('Error when accept follower:', error);
    return { success: false, message: 'Error occurred while adding follower' };
  }
}

export const denyRequest = async(username)=> {
  const token = await AsyncStorage.getItem('token');
  
  if (!token) {
    console.log('No token found');
    return { success: false, message: 'No token found' };
  }

  try {
    const response = await fetch(`${BASE_URL}/users/deny`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ usernameFollower: username }),
    });

    const result = await response.json();

    if (response.ok && result.status === 'OK') {
      console.log('Yeah, accepted follower successfully');
      return { success: true, message: 'Follower added successfully' };
    } else {
      console.log('Failed to accept follower:', result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.log('Error when accept follower:', error);
    return { success: false, message: 'Error occurred while adding follower' };
  }
}
export const registerFCMToken = async (userId) => {
  const token = await AsyncStorage.getItem('token');
  
  if (!token) {
    console.log('No token found');
    return { success: false, message: 'No token found' };
  }

  try {
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);

    // Gửi token này lên backend
    const response = await fetch(`${BASE_URL}/health/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: userId, // ID của user
        fcmToken: fcmToken, // Token FCM
      }),
    });

    if (response.ok) {
      console.log('FCM Token registered successfully.');
    } else {
      console.error('Failed to register FCM Token:', response.statusText);
    }
  } catch (error) {
    console.error('Error registering FCM Token:', error);
  }
};

export const getFCMToken = async (userId) => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('No token found');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/health/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.text(); // Lấy token dưới dạng plain text
      console.log('FCM Token fetched from server:', result);
      return result; // Trả về giá trị của fcmToken (chuỗi)
    } else {
      console.log(`Failed to fetch FCM Token. Status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log('Error during fetch FCM Token:', error.message);
    return null;
  }
};

export const sendHealthRequest = async (userId) => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('No token found');
    return { success: false, message: 'No token found' };
  }

  try {
    const response = await fetch(`${BASE_URL}/health/request/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log('Health request sent successfully');
      return { success: true, message: 'Health request sent successfully' };
    } else {
      console.log('Failed to send health request:', response.statusText);
      return { success: false, message: response.statusText };
    }
  } catch (error) {
    console.error('Error sending health request:', error);
    return { success: false, message: 'Error occurred while sending health request' };
  }
};

export const stopHealthRequest = async (userId) => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('No token found');
    return { success: false, message: 'No token found' };
  }

  try {
    const response = await fetch(`${BASE_URL}/health/stop/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log('Health stop request sent successfully');
      return { success: true, message: 'Health stop request sent successfully' };
    } else {
      console.log('Failed to send health stop request:', response.statusText);
      return { success: false, message: response.statusText };
    }
  } catch (error) {
    console.error('Error sending health stop request:', error);
    return { success: false, message: 'Error occurred while sending health stop request' };
  }
};