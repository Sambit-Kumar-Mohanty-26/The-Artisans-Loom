import React from 'react';
import ProductCard from '../components/ProductCard';
import './FeaturedProducts.css';
import Button from '../components/Button';

import scarfImg from '../assets/images/product-scarf.jpg';
import vaseImg from '../assets/images/product-vase.jpg';
import runnerImg from '../assets/images/product-table-runner.jpg';

const productsData = [
  {
    id: 'prod1',
    name: 'Handwoven Banarasi Silk Scarf',
    artisan: 'Rajesh Kumar', 
    rating: 4.9,            
    reviews: 23,            
    price: 2850,
    originalPrice: 3202,
    discount: 11,
    tag: 'Best Seller',
    image: scarfImg,
  },
  {
    id: 'prod2',
    name: 'Traditional Terracotta Vase Set',
    artisan: 'Kamala Devi',  
    rating: 4.8,             
    reviews: 18,             
    price: 1200,
    originalPrice: 1500,
    discount: 20,
    tag: 'Eco-Friendly',
    image: vaseImg,
  },
  {
    id: 'prod3',
    name: 'Block Printed Cotton Table Runner',
    artisan: 'Arjun Patel',  
    rating: 4.7,             
    reviews: 31,             
    price: 850,
    originalPrice: 1103,
    discount: 23,
    tag: 'Limited Edition',
    image: runnerImg,
  },
];

const FeaturedProducts = ({ onNavigate }) => {
  return (
    <section className="featured-products-section">
      <div className="products-grid">
        {productsData.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="section-footer">
        <Button 
          text="Browse All Products" 
          type="dark" 
          onClick={() => onNavigate('shop')} 
        />
      </div>
    </section>
  );
};

export default FeaturedProducts;