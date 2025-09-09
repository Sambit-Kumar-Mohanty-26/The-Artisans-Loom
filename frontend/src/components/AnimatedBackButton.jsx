import React from 'react';
import './AnimatedBackButton.css';

const AnimatedBackButton = ({ text, onClick }) => {
  return (
    <button className="animated-back-btn" onClick={onClick}>
      <span className="back-btn-icon">←</span>
      <span className="back-btn-text">{text}</span>
    </button>
  );
};

export default AnimatedBackButton;