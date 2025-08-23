import React from 'react';
import './Button.css';

const Button = ({ text, type = 'primary', onClick, block = false }) => {
  const className = `btn btn-${type} ${block ? 'btn-block' : ''}`;
  return (
    <button className={className} onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;