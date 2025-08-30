import React, { useState } from 'react';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './MarketingCopyGenerator.css';

const generateMarketingCopy = httpsCallable(functions, 'generateMarketingCopy');

const MarketingCopyGenerator = ({ product }) => {
  const [copy, setCopy] = useState(product.marketingCopy || null);
  const [isShowingCopy, setIsShowingCopy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const handleGenerateClick = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await generateMarketingCopy({ productId: product.id });
      setCopy(result.data);
      setIsShowingCopy(true);
    } catch (err) {
      console.error("Error generating marketing copy:", err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="marketing-copy-generator">
      {copy ? (
        <div className="button-group">
          <button onClick={() => setIsShowingCopy(!isShowingCopy)} className="view-button">
            {isShowingCopy ? 'Hide Copy' : 'View Saved Copy'}
          </button>
          <button onClick={handleGenerateClick} disabled={isLoading} className="generate-button">
            {isLoading ? 'Generating...' : '✨ Re-generate'}
          </button>
        </div>
      ) : (
        <button onClick={handleGenerateClick} disabled={isLoading} className="generate-button">
          {isLoading ? 'Generating...' : '✨ Generate Marketing Copy'}
        </button>
      )}

      {error && <p className="error-message">Failed to generate marketing copy.</p>}
      {copySuccess && <p className="copy-success-message">{copySuccess}</p>}
      {copy && isShowingCopy && (
        <div className="copy-results">
          <div className="copy-section">
            <div className="copy-header">
              <h3>Product Title</h3>
              <button className="copy-btn" onClick={() => handleCopyToClipboard(copy.title || '')}>Copy</button>
            </div>
            <textarea readOnly value={copy.title || ''} />
          </div>

          <div className="copy-section">
             <div className="copy-header">
              <h3>Product Description</h3>
              <button className="copy-btn" onClick={() => handleCopyToClipboard(copy.productDescription || '')}>Copy</button>
            </div>
            <textarea readOnly value={copy.productDescription || ''} />
          </div>
          
          <div className="copy-section">
            <div className="copy-header">
              <h3>Social Media Post</h3>
              <button className="copy-btn" onClick={() => handleCopyToClipboard(copy.socialMediaPost || '')}>Copy</button>
            </div>
            <textarea readOnly value={copy.socialMediaPost || ''} />
          </div>
          
          <div className="copy-section">
            <div className="copy-header">
              <h3>Email Subject Lines</h3>
               <button className="copy-btn" onClick={() => handleCopyToClipboard(Array.isArray(copy.emailSubject) ? copy.emailSubject.join('\n') : '')}>Copy</button>
            </div>
            <textarea readOnly value={Array.isArray(copy.emailSubject) ? copy.emailSubject.join('\n') : ''} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingCopyGenerator;
