import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { userSignupAsync } from '../authSlice';

function Signup() {
    const dispatch = useDispatch();
    const isLoading = useSelector(state => state.auth.isLoading);

    const [userFormData, setUserFormData] = useState({
        name: "",
        phone: "",
        email: "",
        gender: "",
        age: "",
        password: "",
        confirmPassword: "",
    });
    
    const [errors, setErrors] = useState({
        name: "",
        phone: "",
        email: "",
        gender: "",
        age: "",
        password: "",
        confirmPassword: "",
    });

    let name, value;
    const handleInputs = (e) => {
        name = e.target.name;
        value = e.target.value;

        setUserFormData({ ...userFormData, [name]: value });
    }

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            name: "",
            phone: "",
            email: "",
            gender: "",
            age: "",
            password: "",
            confirmPassword: "",
        };
        
        // Name validation
        if (!userFormData.name) {
            newErrors.name = "Name is required";
            isValid = false;
        } else if (userFormData.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters";
            isValid = false;
        }
        
        // Email validation
        if (!userFormData.email) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
            newErrors.email = "Email is invalid";
            isValid = false;
        }
        
        // Phone validation
        if (!userFormData.phone) {
            newErrors.phone = "Phone number is required";
            isValid = false;
        } else if (!/^[0-9]{10}$/.test(userFormData.phone)) {
            newErrors.phone = "Phone number must be 10 digits";
            isValid = false;
        }
        
        // Age validation
        if (!userFormData.age) {
            newErrors.age = "Age is required";
            isValid = false;
        } else if (isNaN(userFormData.age) || parseInt(userFormData.age) < 18 || parseInt(userFormData.age) > 100) {
            newErrors.age = "Age must be between 18 and 100";
            isValid = false;
        }
        
        // Gender validation
        if (!userFormData.gender) {
            newErrors.gender = "Gender is required";
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
        
        // Confirm password validation
        if (!userFormData.confirmPassword) {
            newErrors.confirmPassword = "Confirm password is required";
            isValid = false;
        } else if (userFormData.password !== userFormData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            isValid = false;
        }
        
        setErrors(newErrors);
        return isValid;
    };
    
    const handleUserSignUp = async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            dispatch(userSignupAsync(userFormData));
        }
    }

    return (
        <div className='d-flex justify-content-center py-2 px-2 mb-4 mb-md-5'>
            <div className='col-12 col-md-8 col-lg-6 col-xl-4 shadow border rounded px-2 py-2 p-md-5'>
                <div className="d-flex flex-column flex-md-row justify-content-center">
                    <div className='col-12 col-md-6 text-center p-0 mb-2 mb-md-0 me-md-2 bg-secondary rounded'>
                        <Link to={"/login"} className='btn text-light w-100'>Login</Link>
                    </div>
                    <div className='col-12 col-md-6 text-center p-0 ms-md-2 bg-primary rounded'>
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
                <form onSubmit={handleUserSignUp}>
                    <div className="d-flex justify-content-center">
                        <div className="col-12">
                            <input 
                                type="text" 
                                className={`form-control mb-1 ${errors.name ? 'is-invalid' : ''}`} 
                                onChange={handleInputs} 
                                name="name" 
                                id="name" 
                                placeholder='Enter Name' 
                                disabled={isLoading}
                            />
                            {errors.name && <div className="invalid-feedback mb-2">{errors.name}</div>}
                            
                            <input 
                                type="email" 
                                className={`form-control mb-1 ${errors.email ? 'is-invalid' : ''}`} 
                                onChange={handleInputs} 
                                name="email" 
                                id="email" 
                                placeholder='Enter Email' 
                                disabled={isLoading}
                            />
                            {errors.email && <div className="invalid-feedback mb-2">{errors.email}</div>}
                            
                            <input 
                                type="tel" 
                                className={`form-control mb-1 ${errors.phone ? 'is-invalid' : ''}`} 
                                onChange={handleInputs} 
                                name="phone" 
                                id="phone" 
                                placeholder='Enter Phone' 
                                disabled={isLoading}
                            />
                            {errors.phone && <div className="invalid-feedback mb-2">{errors.phone}</div>}
                            
                            <input 
                                type="number" 
                                className={`form-control mb-1 ${errors.age ? 'is-invalid' : ''}`} 
                                onChange={handleInputs} 
                                name="age" 
                                id="age" 
                                placeholder='Enter Age' 
                                disabled={isLoading}
                            />
                            {errors.age && <div className="invalid-feedback mb-2">{errors.age}</div>}
                            <div className={`row mb-1 ${errors.gender ? 'is-invalid' : ''}`}>
                                <div className="row ms-1 mt-1">
                                    <label className="m-1 radio-label-container text-muted" htmlFor="gender-male">Male
                                        <input 
                                            type="radio" 
                                            onChange={handleInputs} 
                                            className="m-2" 
                                            id="gender-male" 
                                            name="gender" 
                                            value="male" 
                                            disabled={isLoading}
                                        />
                                        <span className="check-mark-span"></span>
                                    </label>
                                </div>
                                <div className="row ms-1 mt-1">
                                    <label className="m-1 radio-label-container text-muted" htmlFor="gender-female">Female
                                        <input 
                                            type="radio" 
                                            onChange={handleInputs} 
                                            className="m-2" 
                                            id="gender-female" 
                                            name="gender" 
                                            value="female" 
                                            disabled={isLoading}
                                        />
                                        <span className="check-mark-span"></span>
                                    </label>
                                </div>
                                <div className="row ms-1 mt-1">
                                    <label className="m-1 radio-label-container text-muted">Other
                                        <input 
                                            type="radio" 
                                            onChange={handleInputs} 
                                            className="m-2" 
                                            id="gender-other" 
                                            name="gender" 
                                            value="other" 
                                            disabled={isLoading}
                                        />
                                        <span className="check-mark-span"></span>
                                    </label>
                                </div>
                            </div>
                            {errors.gender && <div className="invalid-feedback mb-2">{errors.gender}</div>}
                            <input 
                                type="password" 
                                className={`form-control mb-1 ${errors.password ? 'is-invalid' : ''}`} 
                                onChange={handleInputs} 
                                name="password" 
                                id="password" 
                                placeholder='Enter Password' 
                                value={userFormData.password} 
                                disabled={isLoading}
                            />
                            {errors.password && <div className="invalid-feedback mb-2">{errors.password}</div>}
                            
                            <input 
                                type="password" 
                                className={`form-control mb-1 ${errors.confirmPassword ? 'is-invalid' : ''}`} 
                                onChange={handleInputs} 
                                name="confirmPassword" 
                                id="confirmPassword" 
                                placeholder='Enter Confirm Password' 
                                value={userFormData.confirmPassword} 
                                disabled={isLoading}
                            />
                            {errors.confirmPassword && <div className="invalid-feedback mb-2">{errors.confirmPassword}</div>}

                        </div>
                    </div>
                    <div className="row justify-content-center mt-2">
                        <div className="col-12">
                            <button className='btn btn-primary w-100' type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Signing up...
                                    </>
                                ) : 'Sign Up'}
                            </button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    )
}

export default Signup