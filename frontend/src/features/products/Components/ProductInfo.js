import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Rating } from 'react-simple-star-rating';
import handelShareProduct from '../../../utils/handelShareProduct';
import { message } from 'antd';
import { 
    addToCartAsync, 
    cartDataUpdateQuantityAsync, 
    addToLocalCartAction, 
    updateLocalCartQuantityAction,
    cartDataDeleteAsync,
    removeFromLocalCartAction
} from '../../cart/cartSlice';

const ProductInfo = () => {
    const product = useSelector(state => state.products.product);
    const carts = useSelector(state => state.cart.carts);
    const localCarts = useSelector(state => state.cart.localCarts);
    const isLocalCart = useSelector(state => state.cart.isLocalCart);
    const isLoading = useSelector(state => state.cart.isLoading);
    const isAuthenticated = useSelector(state => state.auth.userAuthCheck);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const data = {
        title: product ? "Share " + product.plantName + " Plants" : "Share Your Plants",
        text: product ? product.description : "Share this Plants to your Friends and Families",
        url: window.location.href
    }

    // Handle adding a product to cart
    const handleAddToCart = () => {
        if (isAuthenticated && !isLocalCart) {
            // User is logged in, use server cart
            dispatch(addToCartAsync({
                plant: product._id,
                quantity: 1
            }));
            message.success(`${product.plantName} added to cart`);
        } else {
            // User is not logged in or using local cart, use local cart
            dispatch(addToLocalCartAction({
                product,
                quantity: 1
            }));
            message.success(`${product.plantName} added to cart`);
        }
    }
    
    // Handle updating cart quantity
    const handleUpdateQuantity = (itemId, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveFromCart(itemId);
            return;
        }
        
        if (isAuthenticated && !isLocalCart) {
            // User is logged in, update server cart
            dispatch(cartDataUpdateQuantityAsync({
                cartId: itemId,
                quantity: newQuantity
            }));
        } else {
            // User is not logged in, update local cart
            dispatch(updateLocalCartQuantityAction({
                itemId,
                quantity: newQuantity
            }));
        }
    }
    
    // Handle removing item from cart
    const handleRemoveFromCart = (itemId) => {
        if (isAuthenticated && !isLocalCart) {
            // User is authenticated, remove from server cart
            dispatch(cartDataDeleteAsync(itemId))
                .unwrap()
                .then(() => {
                    message.success(`${product.plantName} removed from cart`);
                })
                .catch((error) => {
                    message.error(error?.message || 'Failed to remove product from cart');
                });
        } else {
            // User is not authenticated, remove from local cart
            dispatch(removeFromLocalCartAction({ itemId }));
            message.success(`${product.plantName} removed from local cart`);
        }
    }
    
    // Render cart controls (add button or +/- controls)
    const renderCartControls = () => {
        // Determine which cart to use based on authentication status
        const activeCart = isAuthenticated && !isLocalCart ? carts : localCarts;
        
        // Find if product is already in cart
        const cartItem = activeCart.find(item => {
            if (isAuthenticated && !isLocalCart) {
                return item.plant._id === product._id;
            } else {
                return item.plant._id === product._id;
            }
        });
        
        if (cartItem) {
            // Product is in cart, show quantity controls and remove button
            return (
                <div className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-2">
                        <button 
                            className="btn btn-outline-danger" 
                            onClick={() => handleUpdateQuantity(cartItem._id, cartItem.quantity - 1)}
                            disabled={isLoading || cartItem.quantity <= 1}
                        >
                            <i className="fas fa-minus"></i>
                        </button>
                        
                        <span className="mx-3 h4 mb-0">{cartItem.quantity}</span>
                        
                        <button 
                            className="btn btn-outline-success" 
                            onClick={() => handleUpdateQuantity(cartItem._id, cartItem.quantity + 1)}
                            disabled={isLoading}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                    <button 
                        className="btn btn-danger mt-2" 
                        onClick={() => handleRemoveFromCart(cartItem._id)}
                        disabled={isLoading}
                    >
                        <i className="fas fa-trash me-2"></i>
                        Remove from Cart
                    </button>
                </div>
            );
        } else {
            // Product not in cart, show add button
            return (
                <button 
                    className="btn btn-primary" 
                    onClick={handleAddToCart}
                    disabled={isLoading}
                >
                    <i className="fas fa-cart-plus me-2"></i>
                    Add to Cart
                </button>
            );
        }
    }
    
    return (
        <div className="col-lg-5 ps-4 mt-3">
            <div className="row">
                <div className='d-flex justify-content-between align-items-center'>
                    <h3 className='h3 mb-0'>{product.plantName}</h3>
                    <button className='btn btn-light' onClick={() => {handelShareProduct(data, message)}}><i className='fas fa-share'></i> Share</button>
                </div>
                <small style={{ position: "relative", top: "5px", left: "3px" }}><Link to={`/nursery/store/view/${product.nursery._id}`} className='small link-secondary'><i className="fas fa-store"></i> {product.nursery.nurseryName}</Link></small>
                <div className="card-text">
                    <Rating initialValue={3 + Math.random() * 2} readonly={true} size={20} allowFraction={true} />
                    <small className='ps-2 pe-2' style={{ position: "relative", top: "4px" }}>
                        <Link to={'/rating-link'}>{Math.floor(Math.random() * 200)} ratings</Link>
                    </small>
                    <span style={{ position: "relative", top: "3px" }}>|</span>
                    <small className='ps-2 pe-2' style={{ position: "relative", top: "4px" }}>
                        <Link to={'/rating-link'}>{Math.floor(Math.random() * 200)} answered questions</Link>
                    </small>
                </div>
                <div className="text-muted" style={{ fontSize: "14px", margin: "0" }}>
                    Price : <small className='text-decoration-line-through'>₹ {product.price}</small>
                </div>
                <div className="card-text h3">
                    <span className="text-success">-{product.discount}%</span> <sup>₹</sup>{Math.round(product.price - product.discount / 100 * product.price)}
                </div>
                <div className="text-muted" style={{ fontSize: "14px", margin: "0" }}>Category</div>
                <div className="card-text">{product.category}</div>
                <div className="text-muted" style={{ fontSize: "14px", margin: "0" }}>Description</div>
                <div className="card-text">{product.description}</div>
                
                {/* Cart Controls */}
                <div className="mt-4">
                    <h5>Quantity</h5>
                    <div className="d-flex align-items-center">
                        {renderCartControls()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductInfo