// API Configuration and Base Client
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('token');
    }

    // Set auth token in localStorage
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    // Get default headers with auth token
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = this.getAuthToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }

    // Base request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            console.log(`[API] ${options.method || 'GET'} ${url}`);

            const response = await fetch(url, config);

            // Check for auto-refreshed token in response headers
            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                console.log('[API] Auto-refreshing token');
                this.setAuthToken(newToken);
                // Update the Authorization header for any subsequent requests in the same session
                config.headers.Authorization = `Bearer ${newToken}`;
            }

            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `HTTP Error: ${response.status}`;

                // Create an error object that preserves the full error data
                const error = new Error(errorMessage);
                error.statusCode = response.status;
                error.errors = errorData.errors; // Preserve validation errors array
                error.errorData = errorData; // Preserve full error response

                // Handle authentication errors (401) specifically
                if (response.status === 401) {
                    // For login/auth endpoints, preserve the original error message
                    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
                        throw error;
                    } else {
                        // For other endpoints, clear token and trigger auth error
                        this.setAuthToken(null);
                        window.dispatchEvent(new CustomEvent('auth-error'));
                        throw new Error('Authentication failed');
                    }
                }

                throw error;
            }

            // Return JSON response
            const data = await response.json();
            console.log(`[API] Response:`, data);
            return data;

        } catch (error) {
            console.error(`[API] Error ${options.method || 'GET'} ${url}:`, error);

            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }

            throw error;
        }
    }

    // HTTP Methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Upload file (multipart/form-data)
    async upload(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;

        const headers = {};
        const token = this.getAuthToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Upload failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[API] Upload error:`, error);
            throw error;
        }
    }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;