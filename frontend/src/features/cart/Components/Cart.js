import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddressList from '../../common/AddressList';
import { useDispatch, useSelector } from 'react-redux';
import { 
  cartDataDeleteAsync, 
  cartDataFetchAsync, 
  cartDataUpdateQuantityAsync, 
  setCartPricing, 
  updateLocalCartQuantityAction, 
  removeFromLocalCartAction,
  setIsLocalCart
} from '../cartSlice';
import { addressListDataFetchAsync, setSelectedAddress } from '../../address/addressSlice';
import { clearIsSessionError, initCheckoutProcessAsync } from '../../checkout/checkoutSlice';
import handelShareProduct from '../../../utils/handelShareProduct';
import { message } from 'antd';
import { calculateLocalCartPricing } from '../../../utils/localCartUtils';
import { getLocalImagePath } from '../../../utils/localImageUtils';

function Cart() {
  const user = useSelector(state => state.user.user);
  const cart = useSelector(state => state.cart.carts);
  const localCart = useSelector(state => state.cart.localCarts);
  const isLocalCart = useSelector(state => state.cart.isLocalCart);
  const isAuthenticated = useSelector(state => state.auth.userAuthCheck);
  const addressList = useSelector(state => state.address.addressList);
  const selectedAddress = useSelector(state => state.address.selectedAddress);
  const cartPriceDetails = useSelector(state => state.cart.cartPriceDetails);

  // ALWAYS use local cart
  const activeCart = localCart;
  
  // Force local cart mode
  useEffect(() => {
    dispatch(setIsLocalCart(true));
  }, [dispatch]);
  
  // Log the cart state for debugging
  console.log('Local Cart:', localCart);
  console.log('Cart Price Details:', cartPriceDetails);

  const dispatch = useDispatch();

  const [viewAddressList, setViewAddressList] = useState(false);

  const noDataFound = "https://res.cloudinary.com/dcd6y2awx/image/upload/f_auto,q_auto/v1/PlantSeller/UI%20Images/no-data-found";

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(clearIsSessionError());
    
    // Always try to fetch cart data
    if (isAuthenticated) {
      dispatch(cartDataFetchAsync())
        .then(() => {
          dispatch(setIsLocalCart(false));
          dispatch(setCartPricing(cart));
        })
        .catch(error => {
          console.error('Failed to fetch cart:', error);
          dispatch(setIsLocalCart(true));
        });
    } else {
      // Ensure local cart is set
      dispatch(setIsLocalCart(true));
      dispatch(setCartPricing(localCart));
    }
    
    // Log cart state for debugging
    console.log('Cart state:', { localCart, cart, isLocalCart, isAuthenticated });
  }, [isAuthenticated, dispatch])

  useEffect(() => {
    user && (addressList ?? dispatch(addressListDataFetchAsync()))
  }, [dispatch, user]);

  useEffect(() => {
    // Update cart pricing whenever cart or local cart changes
    if (isAuthenticated && !isLocalCart) {
      dispatch(setCartPricing(cart));
    } else {
      dispatch(setCartPricing(localCart));
    }
    
    // Update cart length in state
    if (isAuthenticated && !isLocalCart) {
      // Using server cart
      dispatch({ type: 'cart/updateCartLength', payload: cart.length });
    } else {
      // Using local cart
      dispatch({ type: 'cart/updateCartLength', payload: localCart.length });
    }
  }, [dispatch, cart, localCart, isAuthenticated, isLocalCart]);

  useEffect(() => {
    addressList?.length && dispatch(setSelectedAddress(addressList[0]));
  }, [dispatch, addressList])

  const handelSelectedAddress = (_id) => {
    let address = addressList.filter((elem) => {
      return elem._id === _id;
    });
    dispatch(setSelectedAddress(address[0]));
    setViewAddressList(!viewAddressList);
  }

  const handleDeleteFromCart = async (cartId) => {
    if (isAuthenticated && !isLocalCart) {
      dispatch(cartDataDeleteAsync(cartId));
    } else {
      dispatch(removeFromLocalCartAction({ itemId: cartId }));
      message.success('Product removed from local cart');
    }
  }

  const handleUpdateCart = async (cartId, quantity) => {
    if (quantity < 1) return;
    
    if (isAuthenticated && !isLocalCart) {
      dispatch(cartDataUpdateQuantityAsync({ cartId, quantity }));
    } else {
      dispatch(updateLocalCartQuantityAction({ itemId: cartId, quantity }));
    }
  }

  const handelBuyProduct = async () => {
    if(!activeCart || activeCart.length === 0) {
      message.error("Your Cart is Empty!");
      return;
    }
    
    if (isLocalCart && !isAuthenticated) {
      message.warning("Please login to checkout");
      navigate('/login');
      return;
    }

    const data = {
      data: {
        cartOrProducts: activeCart,
        pricing: cartPriceDetails,
        shippingInfo: selectedAddress
      },
      navigate
    }

    dispatch(initCheckoutProcessAsync(data));
  }

  return (
    <section className='cart bg-section'>
      <div className='container py-5'>
        <div className="s-cart border rounded-3 bg-light p-3">
          <div className="border-bottom p-2 pb-0">
            <h3 className="h3 mb-0">Shopping Cart</h3>
            <p className='text-muted small'><i>{(activeCart ?? 0) && Number(activeCart.length)} items in cart.</i></p>
            {isLocalCart && !isAuthenticated && (
              <p className='text-muted small'><i>You are using a local cart. <Link to="/login">Login</Link> to sync with your account.</i></p>
            )}
          </div>
          <div className="s-cart-items row m-0 p-0">
            <div className="m-0 p-0 col-md-8">
              {
                activeCart && activeCart.length !== 0 ?
                  activeCart.map((elem) => {
                    const plant = elem.plant;
                    const plantName = plant.plantName;
                    const plantId = plant._id;
                    const plantDescription = plant.description || '';
                    
                    const productData = {
                      title: "Share " + plantName + " Plants",
                      text: plantDescription,
                      url: window.location.origin + `/product/${plantId}`,
                    }

                    return (
                      <div key={elem._id} className="item mt-3 mb-3 p-3 border rounded bg-white shadow-sm">
                        <div className="d-flex flex-row align-items-center">
                          {/* Product Image */}
                          <div className="cart-item-img me-3" style={{ width: '120px', height: '120px', overflow: 'hidden' }}>
                            <img 
                              src={isAuthenticated && !isLocalCart && plant.images ? plant.images[0].url : getLocalImagePath(plant.plantName)} 
                              alt={plant.plantName} 
                              className="img-fluid rounded"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          
                          {/* Product Details */}
                          <div className="cart-item-details flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <Link to={`/product/${plant._id}`} className='link-dark text-decoration-none'>
                                  <h5 className="mb-1">{plant.plantName}</h5>
                                </Link>
                                
                                {isAuthenticated && !isLocalCart && elem.nursery && (
                                  <p className='mb-1 text-muted'>
                                    <small>
                                      <Link to={`/nursery/store/view/${elem.nursery._id}`} className='text-secondary text-decoration-none'>
                                        <i className="fas fa-store me-1"></i>{elem.nursery.nurseryName}
                                      </Link>
                                    </small>
                                  </p>
                                )}
                                
                                <div className="price-section mb-2">
                                  <span className="text-muted me-2">
                                    <small className='text-decoration-line-through'>₹{plant.price}</small>
                                  </span>
                                  <span className="text-success fw-bold">-{plant.discount}%</span>
                                  <span className="ms-2 fw-bold">₹{((plant.price - plant.discount / 100 * plant.price) * elem.quantity).toFixed(2)}</span>
                                </div>
                                
                                <p className="text-success mb-0"><small>In Stock</small></p>
                              </div>
                              
                              {/* Quantity Controls */}
                              <div className="quantity-controls">
                                <div className="d-flex align-items-center border rounded p-1">
                                  <button 
                                    className="btn btn-sm btn-outline-secondary border-0" 
                                    onClick={() => handleUpdateCart(elem._id, Math.max(1, elem.quantity - 1))}
                                  >
                                    <i className="fas fa-minus"></i>
                                  </button>
                                  
                                  <span className="mx-2">{elem.quantity}</span>
                                  
                                  <button 
                                    className="btn btn-sm btn-outline-secondary border-0" 
                                    onClick={() => handleUpdateCart(elem._id, elem.quantity + 1)}
                                  >
                                    <i className="fas fa-plus"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="action-buttons mt-2 d-flex">
                              <button 
                                className="btn btn-sm btn-outline-danger me-2" 
                                onClick={() => handleDeleteFromCart(elem._id)}
                              >
                                <i className="fas fa-trash-alt me-1"></i>
                                Remove
                              </button>
                              
                              <button 
                                className="btn btn-sm btn-outline-secondary me-2"
                              >
                                <i className="fas fa-bookmark me-1"></i>
                                Save for later
                              </button>
                              
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handelShareProduct(productData, message)}
                              >
                                <i className="fas fa-share-alt me-1"></i>
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })

                  :

                  <div className='w-100'>
                    <img src={noDataFound} alt="Empty Cart" className='img-fluid' />
                  </div>

              }
              <div className="d-flex flex-row-reverse p-3">
                <p className='h5'>Subtotal ({(activeCart ?? 0) && Number(activeCart.length)} item): <small className='small'>₹</small><b>{cartPriceDetails && cartPriceDetails.actualPriceAfterDiscount}</b></p>
              </div>
            </div>
            <div className="m-0 p-0 col-md-4 summary">
              <div className="p-3">
                <div className="row">
                  <h4 className="h4 border-bottom p-3">Summary</h4>
                </div>
                <div className="row">
                  <p className="d-flex justify-content-between">
                    <small>ITEMS {(activeCart ?? 0) && Number(activeCart.length)}</small>
                    <span><small className='small'>Subtotal ₹</small><b>{cartPriceDetails && cartPriceDetails.actualPriceAfterDiscount}</b></span>
                  </p>
                  <p className="text-muted small link-underline-hover" onClick={() => { setViewAddressList(!viewAddressList) }}>
                    <small><i className="fas fa-map-marker-alt"></i> {selectedAddress ? `Deliver to ${selectedAddress.name.substring(0, selectedAddress.name.indexOf(" "))} - ${selectedAddress.city} ${selectedAddress.pinCode}` : "Select delivery location"}</small>
                  </p>
                  <p className="text-muted mb-0">
                    <small className='small'>Have Coupon?</small>
                  </p>
                  <p className="text-muted mt-1 input-group">
                    <input style={{ width: "70%" }} type="text" className='form-control' name="coupon" id="coupon" />
                    <button style={{ width: "30%" }} className='form-control btn btn-info'>Apply</button>
                  </p>
                  <p className="text-muted border-bottom pb-3">
                    <i className='fas fa-info-circle'></i>
                    {
                      cartPriceDetails && cartPriceDetails.actualPriceAfterDiscount > 500 ?
                        <span className="m-0">
                          <small className='small'> Eligible for FREE Delivery. <Link>Detail</Link></small>
                        </span>
                        :
                        <span className="m-0">
                          <small className='small'> Add items of </small><small>₹</small><b>{cartPriceDetails && (500 - Number(cartPriceDetails.actualPriceAfterDiscount)).toFixed(2)}</b><small> to get the for FREE Delivery <Link>Detail</Link></small>
                        </span>
                    }

                  </p>
                  <div className="row border-bottom pb-2">
                    <p className="text-muted d-flex justify-content-between">
                      <small>Total : </small>
                      <span>₹<b>{cartPriceDetails && cartPriceDetails.totalPriceWithoutDiscount}</b></span>
                    </p>
                    <p className="text-muted d-flex justify-content-between">
                      <small>Discount : </small>
                      <span>- ₹<b>{cartPriceDetails && cartPriceDetails.discountPrice}</b></span>
                    </p>
                    <p className="text-muted d-flex justify-content-between">
                      <small>Delivery : </small>
                      <span>₹<b>{cartPriceDetails && cartPriceDetails.deliveryPrice}</b></span>
                    </p>
                    <p className="text-muted d-flex justify-content-between">
                      <small>Subtotal : </small>
                      <span>₹<b>{cartPriceDetails && cartPriceDetails.actualPriceAfterDiscount}</b></span>
                    </p>
                  </div>
                  <div className="d-flex flex-row-reverse p-3">
                    <p className="h5">Total: <sup>₹</sup>{cartPriceDetails && cartPriceDetails.totalPrice}</p>
                  </div>
                  <div className="row m-0">
                    <button onClick={handelBuyProduct} className="btn btn-success">Checkout</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {viewAddressList && <AddressList addressList={addressList} handelSelectedAddress={handelSelectedAddress} setViewAddressList={setViewAddressList} viewAddressList={viewAddressList} redirect={"/?redirect=/cart"} />}
    </section>
  )
}

export default Cart