import React, { useState } from 'react';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './MarketingCopyGenerator.css';

const generateMarketingCopy = httpsCallable(functions, 'generateMarketingCopy');

const MarketingCopyGenerator = ({ productId }) => {
  const [copy, setCopy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateClick = async () => {
    setIsLoading(true);
    setError('');
    setCopy(null);
    try {
      const result = await generateMarketingCopy({ productId });
      setCopy(result.data);
    } catch (err) {
      console.error("Error generating marketing copy:", err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="marketing-copy-generator">
      <button onClick={handleGenerateClick} disabled={isLoading} className="generate-button">
        {isLoading ? 'Generating...' : '✨ Generate Marketing Copy'}
      </button>

      {error && <p className="error-message">Failed to generate marketing copy.</p>}

      {copy && (
        <div className="copy-results">
          <div className="copy-section">
            <h3>Product Title</h3>
            <textarea readOnly value={copy.title || ''} />
          </div>

          <div className="copy-section">
            <h3>Product Description</h3>
            <textarea readOnly value={copy.productDescription || ''} />
          </div>
          
          <div className="copy-section">
            <h3>Social Media Post</h3>
            <textarea readOnly value={copy.socialMediaPost || ''} />
          </div>
          
          <div className="copy-section">
            <h3>Email Subject Lines</h3>
            <textarea readOnly value={Array.isArray(copy.emailSubject) ? copy.emailSubject.join('\n') : ''} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingCopyGenerator;
