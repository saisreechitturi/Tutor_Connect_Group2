import apiClient from './apiClient';

class AuthService {
    // User registration
    async register(userData) {
        try {
            // Prepare registration data, only including optional fields if they have values
            const registrationData = {
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role || 'student',
            };

            // Only include optional fields if they have values
            if (userData.phone && userData.phone.trim()) {
                registrationData.phone = userData.phone;
            }
            if (userData.dateOfBirth && userData.dateOfBirth.trim()) {
                registrationData.dateOfBirth = userData.dateOfBirth;
            }
            if (userData.address && userData.address.trim()) {
                registrationData.address = userData.address;
            }
            if (userData.pincode && userData.pincode.trim()) {
                registrationData.pincode = userData.pincode;
            }

            const response = await apiClient.post('/auth/register', registrationData);

            // Store token if registration includes login
            if (response.token) {
                apiClient.setAuthToken(response.token);
            }

            return response;
        } catch (error) {
            console.error('[AuthService] Registration failed:', error);
            throw error;
        }
    }

    // User login
    async login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });

            // Store the JWT token
            if (response.token) {
                apiClient.setAuthToken(response.token);
            }

            return response;
        } catch (error) {
            console.error('[AuthService] Login failed:', error);
            throw error;
        }
    }

    // User logout
    async logout() {
        try {
            // Call backend logout endpoint
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('[AuthService] Logout API call failed:', error);
            // Continue with local logout even if API fails
        } finally {
            // Always clear local token
            apiClient.setAuthToken(null);
        }
    }

    // Verify token and get current user
    async verifyToken() {
        try {
            const response = await apiClient.get('/auth/verify');
            return response;
        } catch (error) {
            console.error('[AuthService] Token verification failed:', error);
            // Clear invalid token
            apiClient.setAuthToken(null);
            throw error;
        }
    }

    // Get current user profile
    async getCurrentUser() {
        try {
            const response = await apiClient.get('/auth/profile');
            return response.user;
        } catch (error) {
            console.error('[AuthService] Get current user failed:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(userData) {
        try {
            const response = await apiClient.put('/users/profile', userData);
            return response;
        } catch (error) {
            console.error('[AuthService] Profile update failed:', error);
            throw error;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!apiClient.getAuthToken();
    }

    // Get stored token
    getToken() {
        return apiClient.getAuthToken();
    }

    // Password reset request
    async requestPasswordReset(email) {
        try {
            const response = await apiClient.post('/auth/forgot-password', { email });
            return response;
        } catch (error) {
            console.error('[AuthService] Password reset request failed:', error);
            throw error;
        }
    }

    // Password reset confirmation
    async resetPassword(token, newPassword) {
        try {
            const response = await apiClient.post('/auth/reset-password', {
                token,
                password: newPassword,
            });
            return response;
        } catch (error) {
            console.error('[AuthService] Password reset failed:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;