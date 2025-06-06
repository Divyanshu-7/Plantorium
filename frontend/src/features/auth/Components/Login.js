import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userLoginAsync } from '../authSlice';
import { message } from 'antd';
// import { setCart } from '../../cart/cartSlice'; // TODO: IMPLEMENTATION: CART FUNCTIONALITY


function Login() {
    const dispatch = useDispatch();
    const isLoading = useSelector(state => state.auth.isLoading);
    
    const [userFormData, setUserFormData] = useState({
        email: "",
        password: ""
    });
    
    const [errors, setErrors] = useState({
        email: "",
        password: ""
    });

    let name, value;
    const handleInputs = (e) => {
        name = e.target.name;
        value = e.target.value;

        setUserFormData({ ...userFormData, [name]: value });
    }

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: "", password: "" };
        
        // Email validation
        if (!userFormData.email) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
            newErrors.email = "Email is invalid";
            isValid = false;
        }
        
        // Password validation
        if (!userFormData.password) {
            newErrors.password = "Password is required";
            isValid = false;
        } else if (userFormData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
            isValid = false;
        }
        
        setErrors(newErrors);
        return isValid;
    };
    
    const handleUserLogin = async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            dispatch(userLoginAsync(userFormData));
        }
    }

    return (
        <div className='d-flex justify-content-center py-2 px-2 mb-4 mb-md-5'>
            <div className='col-12 col-md-8 col-lg-6 col-xl-4 shadow border rounded px-2 py-2 p-md-5'>
                <div className="d-flex flex-column flex-md-row justify-content-center">
                    <div className='col-12 col-md-6 text-center p-0 mb-2 mb-md-0 me-md-2 bg-primary rounded'>
                        <Link to={"/login"} className='btn text-light w-100'>Login</Link>
                    </div>
                    <div className='col-12 col-md-6 text-center p-0 ms-md-2 bg-secondary rounded'>
                        <Link to={"/signup"} className='btn text-light w-100'>Signup</Link>
                    </div>
                </div>
                <div className="row p-3">
                    <p className="text-center m-0 ">Connect With Social Account: </p>
                </div>
                <div className="row p-3">
                    <p className="text-center login-social-link m-0">
                        <i className="fab fa-facebook-f ms-4 cursor-pointer"></i>
                        <i className="fab fa-google ms-4"></i>
                        <i className="fab fa-twitter ms-4"></i>
                        <i className="fab fa-github ms-4"></i>
                    </p>
                </div>
                <div className="row">
                    <p className="text-center">Or:</p>
                </div>

                <form onSubmit={handleUserLogin}>
                    <div className="d-flex justify-content-center">
                        <div className="col-12">
                            <input 
                                type="email" 
                                onChange={handleInputs} 
                                className={`form-control mb-1 ${errors.email ? 'is-invalid' : ''}`} 
                                name="email" 
                                id="email" 
                                placeholder='Enter Email' 
                                disabled={isLoading}
                            />
                            {errors.email && <div className="invalid-feedback mb-2">{errors.email}</div>}
                            
                            <input 
                                type="password" 
                                onChange={handleInputs} 
                                className={`form-control mb-1 ${errors.password ? 'is-invalid' : ''}`} 
                                name="password" 
                                id="password" 
                                placeholder='Enter Password' 
                                value={userFormData.password}
                                disabled={isLoading}
                            />
                            {errors.password && <div className="invalid-feedback mb-2">{errors.password}</div>}
                        </div>
                    </div>
                    <div className="d-flex justify-content-end p-2">
                        <p className="m-0">
                            <Link to={"/forgot-password"}>Forgot Password?</Link>
                        </p>
                    </div>
                    <div className="justify-content-center mt-2">
                        <div className="col-12">
                            <button className='btn btn-primary w-100' type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Logging in...
                                    </>
                                ) : 'Login'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login