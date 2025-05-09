import localStorageUtil from "./localStorage";

let isRefreshing = false; // Lock to prevent multiple refresh requests
export let refreshSubscribers = []; // Queue to store API calls waiting for new token

export const getIsRefreshing = () => isRefreshing;
export const setIsRefreshing = (value) => { isRefreshing = value; };

// Function to notify all subscribers waiting for the new token
export const onTokenRefresh = (newAccessToken) => {
    refreshSubscribers.forEach((callback) => callback(newAccessToken));
    refreshSubscribers = []; // Clear the queue after notifying
};

// Function to add a subscriber to the queue
export const addRefreshSubscriber = (callback) => {
    refreshSubscribers.push(callback);
};

// Function to refresh tokens
export const handelRefreshToken = async () => {
    try {
        console.log('Starting token refresh process');
        // Get refresh token from local storage
        const refreshToken = localStorageUtil.getData("refreshToken");
        
        // Validate refresh token
        if (!refreshToken) {
            console.error('Refresh token missing in localStorage');
            throw new Error("Refresh token missing. Please log in again.");
        }
        
        console.log('Refresh token found, making refresh request');
        
        // Make refresh token request
        const response = await fetch(
            process.env.REACT_APP_API_URL_BACKEND + "/api/v2/auth/refresh-token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            }
        );

        // Parse response
        const data = await response.json();
        console.log('Refresh token response:', data);

        // Handle authentication failure
        if (response.status === 403 || !data.status) {
            console.error('Authentication failed during token refresh');
            // Clear all tokens
            localStorageUtil.removeData("accessToken");
            localStorageUtil.removeData("refreshToken");
            localStorageUtil.removeData("orderToken");

            throw new Error(data.message || "Authentication Failed!");
        }

        // Validate successful response
        if (!response.ok) {
            console.error('Server error during token refresh:', data);
            throw new Error(data.message || "Server error during token refresh");
        }
        
        // Validate token data exists
        if (!data.token) {
            console.error('Token data missing from server response');
            throw new Error("Token data missing from server response");
        }
        
        // Validate token structure
        if (typeof data.token !== 'object') {
            console.error('Invalid token structure:', typeof data.token);
            throw new Error("Invalid token type received from server");
        }
        
        // Validate token properties
        if (!data.token.accessToken) {
            console.error('Access token missing in response');
            throw new Error("Access token missing in server response");
        }
        
        if (!data.token.refreshToken) {
            console.error('Refresh token missing in response');
            throw new Error("Refresh token missing in server response");
        }
        
        // Create safe token object
        const tokenData = {
            accessToken: data.token.accessToken,
            refreshToken: data.token.refreshToken
        };
        
        console.log('New tokens received, storing in localStorage');
        
        // Save new tokens
        localStorageUtil.setData("accessToken", tokenData.accessToken);
        localStorageUtil.setData("refreshToken", tokenData.refreshToken);
        
        console.log('Token refresh completed successfully');
        
        // Return new tokens
        return tokenData;
    } catch (error) {
        console.error("Error refreshing token:", error);
        // Clear any existing tokens on error
        localStorageUtil.removeData("accessToken");
        localStorageUtil.removeData("refreshToken");
        localStorageUtil.removeData("orderToken");
        throw error;
    }
};

// Function to retry the original request with the new token
const handelRetryRequest = async (url, method, body, token) => {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();

    if (response.ok && data.status) {
        return data;
    } else {
        throw new Error(data.message || "Retry request failed.");
    }
};

const handelDataFetch = async (path, method, body) => {
    return new Promise(
        async (resolve, rejected) => {
            try {
                // attaching the backend api url to frontend
                const apiUrl = process.env.REACT_APP_API_URL_BACKEND + path;

                const accessToken = localStorageUtil.getData("accessToken");
                const orderToken = localStorageUtil.getData("orderToken");

                let bearer = `Bearer ${accessToken}`;

                if (path.startsWith("/api/v2/checkout") || orderToken) {
                    bearer = `Bearer ${accessToken} orderToken ${orderToken}`;
                }

                const res = await fetch(apiUrl, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: bearer,
                        Accept: "application/json",
                    },
                    credentials: 'include',
                    body: body ? JSON.stringify(body) : null
                });

                const data = await res.json();

                // Handle Token Expiry
                if (data.code === 'TOKEN_EXPIRED' || res.status === 401) {
                    console.warn("Access token expired. Attempting to refresh...");

                    // If a refresh is already in progress, queue this request
                    if (isRefreshing) {
                        const retryRequest = await new Promise((resolve) => {
                            addRefreshSubscriber((newToken) => {
                                resolve(handelRetryRequest(apiUrl, method, body, newToken));
                            });
                        });

                        if (retryRequest.status) {
                            return resolve({ data: retryRequest });
                        } else {
                            const error = new Error(retryRequest.message);
                            return rejected(error);
                        }
                    }

                    isRefreshing = true;

                    try {
                        console.log('Attempting to refresh token');
                        const newTokens = await handelRefreshToken();
                        isRefreshing = false;

                        // Validate the tokens returned from refresh
                        if (!newTokens) {
                            console.error('No tokens returned from refresh');
                            throw new Error("Failed to refresh authentication token - no tokens returned");
                        }

                        if (!newTokens.accessToken) {
                            console.error('No access token in refresh response', newTokens);
                            throw new Error("Failed to refresh authentication token - missing access token");
                        }

                        console.log('Token refresh successful, notifying subscribers');
                        // Notify all queued requests about the new access token
                        onTokenRefresh(newTokens.accessToken);

                        console.log('Retrying original request with new token');
                        // Retry the original request with the new access token
                        const resRetry = await handelRetryRequest(apiUrl, method, body, newTokens.accessToken);

                        if (resRetry.status) {
                            console.log('Retry request successful');
                            return resolve({ data: resRetry });
                        } else {
                            console.error('Retry request failed:', resRetry.message);
                            const error = new Error(resRetry.message || 'Retry request failed');
                            return rejected(error);
                        }
                    } catch (error) {
                        console.error('Token refresh process failed:', error);
                        isRefreshing = false;
                        return rejected(error); // Handle token refresh failure
                    }
                }

                if (data.code) {
                    return resolve({ data });
                }

                if (data.status) {
                    resolve({ data });
                } else {
                    const error = new Error(data.message);
                    rejected(error);
                }
            } catch (error) {
                console.error("Error during API request:", error);
                rejected(error);
            }
        }
    );
};

export default handelDataFetch;
