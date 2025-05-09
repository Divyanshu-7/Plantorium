import React, { useState } from 'react'
import { useSelector } from 'react-redux';
import FullScreenImageView from '../../common/FullScreenImageView';
import { getLocalImagePath } from '../../../utils/localImageUtils';

const ProductImages = () => {
    const productImages = useSelector((state) => state.products.product.images);
    const plantName = useSelector(state => state.products.product.plantName);
    const [viewImgByIndex, setViewImgByIndex] = useState(0);
    
    // Get the local image path once for the current plant
    const localImagePath = getLocalImagePath(plantName);

    return (
        <div className="col-lg-4 p-2 p-lg-0 d-flex flex-column flex-column-reverse align-items-center align-items-md-start flex-md-row p-0">
            <div className="plant-side-img d-flex flex-md-column col-md-2">
                {
                    productImages.map((elem, index) => {
                        return (
                            <div key={elem.public_id} onClick={() => setViewImgByIndex(index)} className="img border p-1 mt-1 mb-1">
                                <img className='img-fluid' src={localImagePath} alt="Plants" />
                            </div>
                        );
                    })
                }
            </div>
            <div className="col-md-10 plant-slide-img p-1">
                <div className="img border">
                    <img className='img-fluid' src={localImagePath} alt="product" width="100%" height="350px" data-toggle="modal" data-target="#plant-img-full-size" />
                </div>

                <FullScreenImageView img={localImagePath} id="plant-img-full-size" />
            </div>
        </div>
    )
}

export default ProductImages