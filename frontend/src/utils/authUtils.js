// authUtils.js - Utility functions for authentication

import localStorageUtil from './localStorage';
import { message } from 'antd';

/**
 * Safely stores authentication tokens in local storage
 * @param {Object} tokenData - The token data from the server
 * @returns {boolean} - Whether the tokens were successfully stored
 */
export const safelyStoreTokens = (tokenData) => {
  try {
    // Validate token data structure
    if (!tokenData) {
      console.error('Token data is null or undefined');
      return false;
    }
    
    if (typeof tokenData !== 'object') {
      console.error('Invalid token data type:', typeof tokenData);
      return false;
    }

    // Check if token has the required properties
    if (!tokenData.accessToken) {
      console.error('Token data missing accessToken property');
      return false;
    }
    
    if (!tokenData.refreshToken) {
      console.error('Token data missing refreshToken property');
      return false;
    }
    
    // Validate token values are strings
    if (typeof tokenData.accessToken !== 'string' || tokenData.accessToken.trim() === '') {
      console.error('Invalid accessToken format');
      return false;
    }
    
    if (typeof tokenData.refreshToken !== 'string' || tokenData.refreshToken.trim() === '') {
      console.error('Invalid refreshToken format');
      return false;
    }

    // Store tokens in local storage
    localStorageUtil.setData("accessToken", tokenData.accessToken);
    localStorageUtil.setData("refreshToken", tokenData.refreshToken);
    console.log('Tokens successfully stored');
    return true;
  } catch (error) {
    console.error('Error storing tokens:', error);
    return false;
  }
};

/**
 * Safely retrieves authentication tokens from local storage
 * @returns {Object|null} - The token data or null if not available
 */
export const safelyGetTokens = () => {
  try {
    const accessToken = localStorageUtil.getData("accessToken");
    const refreshToken = localStorageUtil.getData("refreshToken");
    
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return null;
  }
};

/**
 * Safely clears authentication tokens from local storage
 */
export const safelyClearTokens = () => {
  try {
    localStorageUtil.removeData("accessToken");
    localStorageUtil.removeData("refreshToken");
    localStorageUtil.removeData("orderToken");
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Handles authentication response data safely
 * @param {Object} responseData - The response data from the server
 * @returns {boolean} - Whether the authentication was successful
 */
export const handleAuthResponse = (responseData) => {
  try {
    console.log('Auth response received:', JSON.stringify(responseData, null, 2));
    
    // Check if response exists
    if (!responseData) {
      console.error('Authentication failed: responseData is null or undefined');
      message.error('Authentication failed: No response received from server');
      return false;
    }
    
    // Check response status
    if (!responseData.status) {
      console.error('Authentication failed: Response status is not true', responseData);
      message.error('Authentication failed: Invalid response status');
      return false;
    }
    
    // Check if token exists
    if (!responseData.token) {
      console.error('Authentication failed: No token in response', responseData);
      message.error('Authentication failed: No token data in server response');
      return false;
    }
    
    // Log token structure for debugging
    console.log('Token structure:', typeof responseData.token, responseData.token ? Object.keys(responseData.token) : 'null');
    
    // Validate token structure before storing
    if (typeof responseData.token !== 'object') {
      console.error('Invalid token format:', typeof responseData.token);
      message.error('Authentication failed: Invalid token format');
      return false;
    }
    
    // Create a safe copy of the token data to ensure we have the right structure
    const tokenData = {
      accessToken: responseData.token?.accessToken || responseData.token?.token?.accessToken || '',
      refreshToken: responseData.token?.refreshToken || responseData.token?.token?.refreshToken || ''
    };
    
    // Validate token data
    if (!tokenData.accessToken) {
      console.error('Token data missing access token:', tokenData);
      message.error('Authentication failed: Missing access token');
      return false;
    }
    
    // Refresh token might be optional in some cases
    if (!tokenData.refreshToken) {
      console.warn('Refresh token is missing or encrypted:', tokenData);
    }
    
    // Store tokens
    localStorageUtil.setData("accessToken", tokenData.accessToken);
    localStorageUtil.setData("refreshToken", tokenData.refreshToken);
    console.log('Tokens successfully stored in localStorage');
    
    // Show success message
    message.success(responseData.message || 'Authentication successful');
    return true;
  } catch (error) {
    console.error('Error handling auth response:', error);
    message.error('Authentication failed: ' + (error.message || 'Unknown error'));
    return false;
  }
};
