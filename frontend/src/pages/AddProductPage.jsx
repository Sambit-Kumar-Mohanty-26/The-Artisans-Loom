import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, functions } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from 'firebase/functions';
import './AddProductPage.css';

const createProduct = httpsCallable(functions, 'createProduct');

const AddProductPage = () => {
  const { currentUser } = useAuth();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'pottery',
    stock: '',
    region: 'rajasthan',
    materials: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setMessage('');
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setMessage('');
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setMessage('Please upload a product image.');
      return;
    }
    if (!currentUser) {
      setMessage("Error: User not found. Please try logging in again.");
      return;
    }

    setLoading(true);
    setMessage('Verifying authentication...');

    try {
      
    console.log("Attempting to call createProduct...");
    console.log("Current User UID:", currentUser.uid);
    console.log("Current User Email:", currentUser.email);

    
    setMessage('Getting authentication token...');
    const idToken = await currentUser.getIdToken(true); // Force refresh

    // Log the ID token
    console.log("Successfully retrieved ID Token. Length:", idToken.length);

      setMessage('Uploading image...');
      const imageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);
      
      setMessage('Image uploaded. Creating product...');
      const newProductData = {
        ...product,
        materials: product.materials.split(',').map(item => item.trim()).filter(Boolean),
        imageUrl
      };
      
      
      await createProduct(newProductData);

      setMessage('Product created successfully! Add another?');
      setProduct({ name: '', description: '', price: '', category: 'pottery', stock: '', region: 'rajasthan', materials: '' });
      setImageFile(null);
      e.target.reset();

    } catch (error) {
      console.error("Detailed error from createProduct call:", error);
      if (error.code === 'functions/unauthenticated') {
        setMessage("Authentication Error: Your session is invalid. Please log out and log back in.");
      } else {
        setMessage(`An error occurred: ${error.message}`);
      }
    }
    
    setLoading(false);
  };

  // Log the ID token
  console.log("Successfully retrieved ID Token. Length:", idToken.length);

  return (
    <div className="add-product-page">
        <h2>Add a New Product</h2>
        <p style={{textAlign: 'center', marginTop: '-1.5rem', marginBottom: '2rem'}}>This form is for artisans to list their creations on the platform.</p>
        <form className="add-product-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input id="name" type="text" name="name" value={product.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" value={product.description} onChange={handleChange} required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="price">Price (in ₹)</label>
                    <input id="price" type="number" name="price" placeholder="e.g., 2850" value={product.price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="stock">Available Stock</label>
                    <input id="stock" type="number" name="stock" placeholder="e.g., 10" value={product.stock} onChange={handleChange} required />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" value={product.category} onChange={handleChange}>
                        <option value="pottery">Pottery</option>
                        <option value="weaving">Weaving</option>
                        <option value="painting">Painting</option>
                        <option value="carving">Carving</option>
                        <option value="embroidery">Embroidery</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="region">Region / State</label>
                    <select id="region" name="region" value={product.region} onChange={handleChange}>
                        <option value="rajasthan">Rajasthan</option>
                        <option value="gujarat">Gujarat</option>
                        <option value="odisha">Odisha</option>
                        <option value="uttar_pradesh">Uttar Pradesh</option>
                        <option value="west_bengal">West Bengal</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="materials">Materials (comma separated)</label>
                <input id="materials" type="text" name="materials" placeholder="e.g., silk, zari, cotton" value={product.materials} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label htmlFor="image">Product Image</label>
                <input id="image" type="file" onChange={handleImageChange} accept="image/png, image/jpeg" required />
            </div>
            {message && <p className="status-message">{message}</p>}
            <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Add Product'}
            </button>
        </form>
    </div>
  );
};

export default AddProductPage;