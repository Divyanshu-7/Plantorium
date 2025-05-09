// localCartUtils.js - Utility functions for managing cart in localStorage
import localStorageUtil from './localStorage';

const LOCAL_CART_KEY = 'localCart';

/**
 * Get the local cart from localStorage
 * @returns {Array} Array of cart items
 */
export const getLocalCart = () => {
  try {
    const localCart = localStorageUtil.getData(LOCAL_CART_KEY);
    return localCart ? JSON.parse(localCart) : [];
  } catch (error) {
    console.error('Error getting local cart:', error);
    return [];
  }
};

/**
 * Save the local cart to localStorage
 * @param {Array} cartItems - Array of cart items
 */
export const saveLocalCart = (cartItems) => {
  try {
    localStorageUtil.setData(LOCAL_CART_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error saving local cart:', error);
  }
};

/**
 * Add an item to the local cart
 * @param {Object} product - Product to add to cart
 * @param {number} quantity - Quantity to add
 * @returns {Array} Updated cart items
 */
export const addToLocalCart = (product, quantity = 1) => {
  try {
    const cartItems = getLocalCart();
    
    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.plant._id === product._id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already in cart
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cartItems.push({
        _id: `local_${Date.now()}`, // Generate a temporary local ID
        plant: product,
        quantity: quantity,
        pricing: {
          priceWithoutDiscount: product.price,
          priceAfterDiscount: Math.round(product.price - (product.price * product.discount / 100)),
          discountPrice: Math.round(product.price * product.discount / 100)
        }
      });
    }
    
    saveLocalCart(cartItems);
    return cartItems;
  } catch (error) {
    console.error('Error adding to local cart:', error);
    return getLocalCart();
  }
};

/**
 * Update the quantity of an item in the local cart
 * @param {string} itemId - ID of the cart item to update
 * @param {number} quantity - New quantity
 * @returns {Array} Updated cart items
 */
export const updateLocalCartQuantity = (itemId, quantity) => {
  try {
    const cartItems = getLocalCart();
    
    const itemIndex = cartItems.findIndex(item => item._id === itemId);
    
    if (itemIndex >= 0 && quantity > 0) {
      cartItems[itemIndex].quantity = quantity;
      saveLocalCart(cartItems);
    }
    
    return cartItems;
  } catch (error) {
    console.error('Error updating local cart quantity:', error);
    return getLocalCart();
  }
};

/**
 * Remove an item from the local cart
 * @param {string} itemId - ID of the cart item to remove
 * @returns {Array} Updated cart items
 */
export const removeFromLocalCart = (itemId) => {
  try {
    let cartItems = getLocalCart();
    
    cartItems = cartItems.filter(item => item._id !== itemId);
    
    saveLocalCart(cartItems);
    return cartItems;
  } catch (error) {
    console.error('Error removing from local cart:', error);
    return getLocalCart();
  }
};

/**
 * Clear the local cart
 * @returns {Array} Empty array
 */
export const clearLocalCart = () => {
  try {
    saveLocalCart([]);
    return [];
  } catch (error) {
    console.error('Error clearing local cart:', error);
    return [];
  }
};

/**
 * Calculate cart pricing details
 * @param {Array} cartItems - Array of cart items
 * @returns {Object} Cart pricing details
 */
export const calculateLocalCartPricing = (cartItems) => {
  try {
    const pricing = {};
    
    if (cartItems.length > 0) {
      pricing.totalPriceWithoutDiscount = (cartItems.reduce((total, item) => 
        total + (item.pricing.priceWithoutDiscount * item.quantity), 0)).toFixed(2);
        
      pricing.actualPriceAfterDiscount = (cartItems.reduce((total, item) => 
        total + (item.pricing.priceAfterDiscount * item.quantity), 0)).toFixed(2);
        
      pricing.discountPrice = (cartItems.reduce((total, item) => 
        total + (item.pricing.discountPrice * item.quantity), 0)).toFixed(2);
        
      pricing.deliveryPrice = (pricing.actualPriceAfterDiscount < 500 ? 90 : 0).toFixed(2);
      pricing.totalPrice = (Number(pricing.actualPriceAfterDiscount) + Number(pricing.deliveryPrice)).toFixed(2);
    } else {
      pricing.totalPriceWithoutDiscount = 0;
      pricing.actualPriceAfterDiscount = 0;
      pricing.discountPrice = 0;
      pricing.deliveryPrice = 0;
      pricing.totalPrice = 0;
    }
    
    return pricing;
  } catch (error) {
    console.error('Error calculating local cart pricing:', error);
    return {
      totalPriceWithoutDiscount: 0,
      actualPriceAfterDiscount: 0,
      discountPrice: 0,
      deliveryPrice: 0,
      totalPrice: 0
    };
  }
};

/**
 * Migrate local cart to server cart after login
 * @param {Function} addToCartAsync - Redux action to add to server cart
 * @returns {Promise} Promise that resolves when migration is complete
 */
export const migrateLocalCartToServer = async (addToCartAsync) => {
  try {
    const localCart = getLocalCart();
    
    if (localCart.length === 0) {
      return;
    }
    
    // Add each local cart item to the server cart
    for (const item of localCart) {
      await addToCartAsync({
        plant: item.plant._id,
        quantity: item.quantity
      });
    }
    
    // Clear the local cart after migration
    clearLocalCart();
  } catch (error) {
    console.error('Error migrating local cart to server:', error);
  }
};
