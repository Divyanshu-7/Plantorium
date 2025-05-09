import React, { useEffect, useState } from 'react';
import { Rating } from 'react-simple-star-rating';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllProductsAsync, getProductsByCategoryAsync, searchProductsAsync } from '../productsSlice';
import { getLocalImagePath } from '../../../utils/localImageUtils';
import { 
    addToCartAsync, 
    cartDataUpdateQuantityAsync, 
    addToLocalCartAction, 
    updateLocalCartQuantityAction,
    cartDataDeleteAsync,
    removeFromLocalCartAction,
    setIsLocalCart
} from '../../cart/cartSlice';
import { message } from 'antd';

const Products = () => {
    const products = useSelector((state) => state.products.products);
    const carts = useSelector((state) => state.cart.carts);
    const localCarts = useSelector((state) => state.cart.localCarts);
    const isLocalCart = useSelector((state) => state.cart.isLocalCart);
    const isAuthenticated = useSelector((state) => state.auth.userAuthCheck);
    const [loading, setLoading] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const searchKeyword = queryParams.get('search');
    const category = queryParams.get('category');
    const categoryList = category ? category.split(',') : [];

    const noPlantsImage = "https://res.cloudinary.com/dcd6y2awx/image/upload/f_auto,q_auto/v1/Plantorium/UI%20Images/no-data-found";

    useEffect(() => {
        if (!searchKeyword && !category) {
            // Case 1: /products
            dispatch(getAllProductsAsync());
        } else if (category && !searchKeyword) {
            // Case 2: /products/?category='some category'
            if(categoryList.length === 1 && category === 'all') {
                dispatch(getAllProductsAsync());
            } else {
                dispatch(getProductsByCategoryAsync(category));
            }
        } else if (searchKeyword && !category) {
            // Case 3: /products/?search='some keyword'
            dispatch(searchProductsAsync({ search: searchKeyword, category: null }));
        } else if (searchKeyword && category) {
            // Case 4: /products/?search='some keyword'&category='some category'
            dispatch(searchProductsAsync({ search: searchKeyword, category }));
        }
    }, [location.search, dispatch, forceUpdate]);

    const handelSearchProductsByCategory = (category) => {
        if(category === 'all' && categoryList.length === 0 && category === 'all') {
            navigate(`/products`);
        } else {
            let query;
            if(category === 'all') {
                query = 'all';
            }else if (categoryList.includes(category)) {
                query = categoryList.filter((cat) => cat !== category);
            } else {
                query = [...categoryList.filter((cat) => cat !== 'all'), category];
            }
            navigate(`/products/?category=${query}`);
        }
    }
    
    // Handle adding a product to cart
    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        
        if (isAuthenticated && !isLocalCart) {
            // User is logged in, use server cart
            dispatch(addToCartAsync({
                plant: product._id,
                quantity: 1
            }))
            .unwrap()
            .then(() => {
                message.success(`${product.plantName} added to cart`);
                setLoading(false);
                // Force re-render to update UI
                setForceUpdate(prev => prev + 1);
            })
            .catch((error) => {
                message.error(error?.message || 'Failed to add product to cart');
                setLoading(false);
            });
        } else {
            // User is not logged in, use local cart
            try {
                dispatch(addToLocalCartAction({
                    product,
                    quantity: 1
                }));
                
                // Force update the cart display
                dispatch(setIsLocalCart(true));
                
                message.success(`${product.plantName} added to local cart`);
                setLoading(false);
                // Force re-render to update UI
                setForceUpdate(prev => prev + 1);
            } catch (error) {
                console.error('Error adding to local cart:', error);
                message.error('Failed to add product to local cart');
                setLoading(false);
            }
        }
    }
    
    // Handle removing item from cart
    const handleRemoveFromCart = (e, itemId) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        
        if (isAuthenticated && !isLocalCart) {
            dispatch(cartDataDeleteAsync(itemId))
                .unwrap()
                .then(() => {
                    message.success('Item removed from cart');
                    setLoading(false);
                    // Force re-render to update UI
                    setForceUpdate(prev => prev + 1);
                })
                .catch((error) => {
                    message.error(error?.message || 'Failed to remove item from cart');
                    setLoading(false);
                });
        } else {
            // Pass itemId in the correct format expected by the reducer
            try {
                dispatch(removeFromLocalCartAction({ itemId }));
                message.success('Item removed from local cart');
                setLoading(false);
                // Force re-render to update UI
                setForceUpdate(prev => prev + 1);
            } catch (error) {
                console.error('Error removing from local cart:', error);
                message.error('Failed to remove item from local cart');
                setLoading(false);
            }
        }
    }
    
    // Handle updating cart quantity
    const handleUpdateQuantity = (e, itemId, newQuantity) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        
        if (newQuantity < 1) {
            setLoading(false);
            return; // Don't allow quantities less than 1
        }
        
        if (isAuthenticated && !isLocalCart) {
            dispatch(cartDataUpdateQuantityAsync({
                cartId: itemId,
                quantity: newQuantity
            }))
                .unwrap()
                .then(() => {
                    message.success('Quantity updated');
                    setLoading(false);
                    // Force re-render to update UI
                    setForceUpdate(prev => prev + 1);
                })
                .catch((error) => {
                    message.error(error?.message || 'Failed to update quantity');
                    setLoading(false);
                });
        } else {
            // Use the correct parameter structure expected by the reducer
            try {
                dispatch(updateLocalCartQuantityAction({
                    itemId,
                    quantity: newQuantity
                }));
                message.success('Quantity updated in local cart');
                setLoading(false);
                // Force re-render to update UI
                setForceUpdate(prev => prev + 1);
            } catch (error) {
                console.error('Error updating quantity in local cart:', error);
                message.error('Failed to update quantity in local cart');
                setLoading(false);
            }
        }
    }
    
    // Render cart controls (add button or +/- controls)
    const renderCartControls = (product) => {
        // Find if product is in cart
        let cartItem;
        
        if (isAuthenticated && !isLocalCart) {
            cartItem = carts.find(item => item.plant && item.plant._id === product._id);
        } else {
            cartItem = localCarts.find(item => {
                if (item.plant && item.plant._id === product._id) {
                    return true;
                }
                if (item.product && item.product._id === product._id) {
                    return true;
                }
                return false;
            });
        }
        
        if (cartItem) {
            // Product is in cart, show quantity controls
            const quantity = cartItem.quantity;
            let itemId;
            
            if (isAuthenticated && !isLocalCart) {
                itemId = cartItem._id;
            } else {
                // Handle both possible structures
                itemId = cartItem._id;
            }
            
            return (
                <div className="quantity-controls d-flex align-items-center">
                    <button 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={(e) => handleUpdateQuantity(e, itemId, quantity - 1)}
                        disabled={quantity <= 1 || loading}
                    >
                        <i className="fa fa-minus"></i>
                    </button>
                    <span className="mx-2">{quantity}</span>
                    <button 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={(e) => handleUpdateQuantity(e, itemId, quantity + 1)}
                        disabled={loading}
                    >
                        <i className="fa fa-plus"></i>
                    </button>
                    <button 
                        className="btn btn-sm btn-outline-danger ms-2" 
                        onClick={(e) => handleRemoveFromCart(e, itemId)}
                        disabled={loading}
                    >
                        <i className="fa fa-trash"></i>
                    </button>
                </div>
            );
        } else {
            // Product not in cart, show add button
            return (
                <button 
                    className="btn btn-sm btn-success w-100" 
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={loading}
                >
                    <i className="fa fa-shopping-cart me-1"></i>
                    Add to Cart
                </button>
            );
        }
    }
    
    return (
        <div className="container-fluid product-container">
            <div className="category-filter d-flex flex-wrap gap-2 my-3">
                <button 
                    className={`btn ${categoryList.includes('all') || categoryList.length === 0 ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handelSearchProductsByCategory('all')}
                >
                    All Plants
                </button>
                <button 
                    className={`btn ${categoryList.includes('Indoor') ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handelSearchProductsByCategory('Indoor')}
                >
                    Indoor
                </button>
                <button 
                    className={`btn ${categoryList.includes('Outdoor') ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handelSearchProductsByCategory('Outdoor')}
                >
                    Outdoor
                </button>
                <button 
                    className={`btn ${categoryList.includes('Succulents') ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handelSearchProductsByCategory('Succulents')}
                >
                    Succulents
                </button>
                <button 
                    className={`btn ${categoryList.includes('Medicinal') ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handelSearchProductsByCategory('Medicinal')}
                >
                    Medicinal
                </button>
            </div>
            <div className="product-content px-2">
                {
                    products && products.length > 0 && products.map((elem) => (
                        <div key={elem._id} className="px-1">
                            <div className="card my-1" style={{ height: '100%' }}>
                                <div style={{ height: '200px', overflow: 'hidden' }}>
                                    <Link className='text-dark' style={{ textDecoration: "none" }} to={`/product/${elem._id}`}>
                                        <img 
                                            className="card-img-top" 
                                            src={getLocalImagePath(elem.plantName)} 
                                            alt={elem.plantName}
                                            style={{ height: '200px', objectFit: 'cover', width: '100%' }}
                                        />
                                    </Link>
                                </div>
                                <div className="card-body d-flex flex-column">
                                    <Link className='text-dark' style={{ textDecoration: "none" }} to={`/product/${elem._id}`}>
                                        <h5 className="card-title" style={{ height: '48px', overflow: 'hidden' }}>{elem.plantName}</h5>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="card-text mb-0">₹ {Math.round(elem.price - elem.discount / 100 * elem.price)}</p>
                                                <small className="text-muted">{elem.category}</small>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Rating
                                                    initialValue={3 + Math.random() * 2}
                                                    readonly={true}
                                                    size={15}
                                                    allowFraction={true}
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                    
                                    {/* Cart Controls */}
                                    <div className="mt-auto pt-2">
                                        {renderCartControls(elem)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
            <div className="w-100">
                {
                    products.length === 0 &&
                    <div className="d-flex justify-content-center">
                        <div className=''>
                            <div className="row">
                                <div className="img d-flex justify-content-center">
                                    <img src={noPlantsImage} style={{ maxHeight: "60vh" }} alt="no plants data found" className='img-fluid' />
                                </div>
                            </div>
                            <div className="row">
                                <div className="d-flex d-flex flex-column align-items-center">
                                    <h3 className="h3" style={{ fontFamily: "cursive" }}>No Product Found</h3>
                                    <Link onClick={() => window.location.reload()}><i className="fa fa-refresh"></i> Refresh Your Page</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};

export default Products;
