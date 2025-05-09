import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import handelDataFetch from '../../utils/handelDataFetch';
import { userLogoutAsync } from '../auth/authSlice';
import { updateOrderAfterConfirmPaymentAsync } from '../order/orderSlice';
import { 
    getLocalCart, 
    addToLocalCart, 
    updateLocalCartQuantity, 
    removeFromLocalCart, 
    calculateLocalCartPricing,
    migrateLocalCartToServer
} from '../../utils/localCartUtils';

// Initialize state with local cart data from localStorage
const localCartItems = getLocalCart() || [];

const initialState = {
    carts: [],
    localCarts: localCartItems,
    selectedCart: null,
    cartPriceDetails: {
        totalPriceWithoutDiscount: 0,
        actualPriceAfterDiscount: 0,
        discountPrice: 0,
        deliveryPrice: 0,
        totalPrice: 0
    },
    cartLength: localCartItems.length, // Initialize with local cart length
    error: null,
    isLoading: false,
    isLocalCart: true, // Always start with local cart
    forceLocalCart: true // New flag to force local cart usage
}

export const addToCartAsync = createAsyncThunk('/cart/details/add', async (data) => {
    const response = await handelDataFetch('/api/v2/user/carts', 'POST', data);
    return response.data;
});

export const cartDataFetchAsync = createAsyncThunk('/cart/details/fetch', async (_, { rejectWithValue }) => {
    try {
        console.log('Fetching cart data...');
        const response = await handelDataFetch('/api/v2/user/carts', 'GET');
        console.log('Cart fetch response:', response);
        
        if (!response.data || !response.data.result) {
            console.error('No cart data found');
            return rejectWithValue('No cart data');
        }
        
        return response.data;
    } catch (error) {
        console.error('Cart fetch error:', error);
        return rejectWithValue(error.response?.data || 'Failed to fetch cart');
    }
});

export const cartDataDeleteAsync = createAsyncThunk('/cart/details/delete', async (cartId) => {
    const response = await handelDataFetch(`/api/v2/user/carts/${cartId}`, 'DELETE');
    return response.data;
});

export const cartDataUpdateQuantityAsync = createAsyncThunk('/cart/details/update', async ({ cartId, quantity }) => {
    console.log(cartId);
    const response = await handelDataFetch(`/api/v2/user/carts/${cartId}`, 'PATCH', { quantity });
    return response.data;
});

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCartPricing: (state, action) => {
            const products = action.payload;

            const pricing = {
                totalPriceWithoutDiscount: 0,
                actualPriceAfterDiscount: 0,
                discountPrice: 0,
                deliveryPrice: 0,
                totalPrice: 0
            };

            if (products && products.length > 0) { 
                // Handle both server cart and local cart structures
                pricing.totalPriceWithoutDiscount = products.reduce((total, curObj) => {
                    // Check for different possible object structures
                    const price = curObj.plant?.pricing?.priceWithoutDiscount || 
                                   curObj.pricing?.priceWithoutDiscount || 
                                   curObj.priceWithoutDiscount || 0;
                    const quantity = curObj.quantity || 1;
                    return total + (price * quantity);
                }, 0).toFixed(2);

                pricing.actualPriceAfterDiscount = products.reduce((total, curObj) => {
                    const price = curObj.plant?.pricing?.priceAfterDiscount || 
                                   curObj.pricing?.priceAfterDiscount || 
                                   curObj.priceAfterDiscount || 0;
                    const quantity = curObj.quantity || 1;
                    return total + (price * quantity);
                }, 0).toFixed(2);

                pricing.discountPrice = products.reduce((total, curObj) => {
                    const price = curObj.plant?.pricing?.discountPrice || 
                                   curObj.pricing?.discountPrice || 
                                   curObj.discountPrice || 0;
                    const quantity = curObj.quantity || 1;
                    return total + (price * quantity);
                }, 0).toFixed(2);

                pricing.deliveryPrice = (Number(pricing.actualPriceAfterDiscount) < 500 ? 90 : 0).toFixed(2);
                pricing.totalPrice = (Number(pricing.actualPriceAfterDiscount) + Number(pricing.deliveryPrice)).toFixed(2);
            }

            state.cartPriceDetails = pricing;
        },
        setSelectedCart: (state, action) => {
            state.selectedCart = action.payload;
        },
        // Local cart actions (for non-logged in users)
        addToLocalCartAction: (state, action) => {
            const { product, quantity } = action.payload;
            const updatedCart = addToLocalCart(product, quantity);
            state.localCarts = updatedCart;
            state.cartLength = state.isLocalCart ? updatedCart.length : state.carts.length;
            state.cartPriceDetails = calculateLocalCartPricing(updatedCart);
        },
        updateLocalCartQuantityAction: (state, action) => {
            const { itemId, quantity } = action.payload;
            const updatedCart = updateLocalCartQuantity(itemId, quantity);
            state.localCarts = updatedCart;
            state.cartPriceDetails = calculateLocalCartPricing(updatedCart);
        },
        removeFromLocalCartAction: (state, action) => {
            const { itemId } = action.payload;
            const updatedCart = removeFromLocalCart(itemId);
            state.localCarts = updatedCart;
            state.cartLength = state.isLocalCart ? updatedCart.length : state.carts.length;
            state.cartPriceDetails = calculateLocalCartPricing(updatedCart);
        },
        setIsLocalCart: (state, action) => {
            state.isLocalCart = action.payload;
            // Update cart length based on which cart is active
            if (action.payload) {
                // Using local cart
                state.cartLength = state.localCarts.length;
            } else {
                // Using server cart
                state.cartLength = state.carts.length;
            }
            // Update cart pricing based on which cart is active
            state.cartPriceDetails = state.isLocalCart 
                ? calculateLocalCartPricing(state.localCarts)
                : state.cartPriceDetails;
        },
        updateCartLength: (state, action) => {
            state.cartLength = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(userLogoutAsync.fulfilled, () => {
                //* CLEANUP: TASK
                //? LOGOUT_CLEANUP_TASK:: REMOVE ALL THE CART INFORMATION AFTER LOGOUT

                return initialState;

            })
            .addCase(updateOrderAfterConfirmPaymentAsync.fulfilled, (state, action) => {
                //* CLEANUP: TASK
                //? CART_CLEANUP_TASK:: REMOVE THE CART INFORMATION AFTER SUCCEEDED PAYMENT

                action.payload.result.result.orderItems.forEach(items => {
                    const index = state.carts.findIndex(cart => cart.plant._id === items.plant);

                    state.carts.splice(index, 1);
                    state.cartLength = state.carts.length;
                })

            })
            .addCase(addToCartAsync.pending, (state) => {
                //^ FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = true;
            })
            .addCase(addToCartAsync.fulfilled, (state, action) => {
                //* FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = false;
                
                // Check if the item already exists in cart
                const existingCartItemIndex = state.carts.findIndex(
                    cart => cart.plant._id === action.payload.result.plant._id
                );
                
                if (existingCartItemIndex !== -1) {
                    // Update existing cart item
                    state.carts[existingCartItemIndex] = action.payload.result;
                } else {
                    // Add new cart item
                    state.carts.push(action.payload.result);
                }
                
                // Recalculate cart length and pricing
                state.cartLength = state.carts.length;
                
                // Recalculate cart pricing
                if (state.carts.length > 0) {
                    const pricing = {
                        totalPriceWithoutDiscount: state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.priceWithoutDiscount * curObj.quantity), 0).toFixed(2),
                        actualPriceAfterDiscount: state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.priceAfterDiscount * curObj.quantity), 0).toFixed(2),
                        discountPrice: state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.discountPrice * curObj.quantity), 0).toFixed(2),
                        deliveryPrice: (state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.priceAfterDiscount * curObj.quantity), 0) < 500 ? 90 : 0).toFixed(2)
                    };
                    pricing.totalPrice = (Number(pricing.actualPriceAfterDiscount) + Number(pricing.deliveryPrice)).toFixed(2);
                    
                    state.cartPriceDetails = pricing;
                }
            })
            .addCase(addToCartAsync.rejected, (state, action) => {
                //! FETCH_CART_DETAILS
                state.error = action.error;
                state.isLoading = false;
            })
            .addCase(cartDataFetchAsync.pending, (state) => {
                //^ FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = true;
            })
            .addCase(cartDataFetchAsync.fulfilled, (state, action) => {
                //* FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = false;
                state.carts = action.payload.result;
                state.cartLength = state.carts.length;
            })
            .addCase(cartDataFetchAsync.rejected, (state, action) => {
                //! FETCH_CART_DETAILS
                state.error = action.error;
                state.isLoading = false;
            })
            .addCase(cartDataDeleteAsync.pending, (state) => {
                //^ FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = true;
            })
            .addCase(cartDataDeleteAsync.fulfilled, (state, action) => {
                //* FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = false;

                const deleteCartIndex = state.carts.findIndex(cart => cart._id === action.payload.result._id);
                state.carts.splice(deleteCartIndex, 1);

                state.cartLength = state.carts.length;
            })
            .addCase(cartDataDeleteAsync.rejected, (state, action) => {
                //! FETCH_CART_DETAILS
                state.error = action.error;
                state.isLoading = false;
            })
            .addCase(cartDataUpdateQuantityAsync.pending, (state) => {
                //^ FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = true;
            })
            .addCase(cartDataUpdateQuantityAsync.fulfilled, (state, action) => {
                //* FETCH_CART_DETAILS
                state.error = null;
                state.isLoading = false;

                // Find the index of the cart item to update
                const cartIndex = state.carts.findIndex(cart => cart._id === action.payload.result._id);
                
                // If cart item found, replace it completely
                if (cartIndex !== -1) {
                    state.carts[cartIndex] = action.payload.result;
                }
                
                // Recalculate cart pricing
                if (state.carts.length > 0) {
                    const pricing = {
                        totalPriceWithoutDiscount: state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.priceWithoutDiscount * curObj.quantity), 0).toFixed(2),
                        actualPriceAfterDiscount: state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.priceAfterDiscount * curObj.quantity), 0).toFixed(2),
                        discountPrice: state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.discountPrice * curObj.quantity), 0).toFixed(2),
                        deliveryPrice: (state.carts.reduce((total, curObj) => 
                            total + (curObj.plant.pricing.priceAfterDiscount * curObj.quantity), 0) < 500 ? 90 : 0).toFixed(2)
                    };
                    pricing.totalPrice = (Number(pricing.actualPriceAfterDiscount) + Number(pricing.deliveryPrice)).toFixed(2);
                    
                    state.cartPriceDetails = pricing;
                }
            })
            .addCase(cartDataUpdateQuantityAsync.rejected, (state, action) => {
                //! FETCH_CART_DETAILS
                state.error = action.error;
                state.isLoading = false;
            })
    }
});

export const { 
    setCartPricing, 
    setSelectedCart, 
    addToLocalCartAction, 
    updateLocalCartQuantityAction, 
    removeFromLocalCartAction,
    setIsLocalCart,
    updateCartLength
} = cartSlice.actions;
export default cartSlice.reducer;