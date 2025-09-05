import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './MarketingCopyGenerator.css';

const generateMarketingCopy = httpsCallable(functions, 'generateMarketingCopy');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  hideCopy: "Hide Copy",
  viewCopy: "View Saved Copy",
  generating: "Generating...",
  regenerate: "✨ Re-generate",
  generate: "✨ Generate Marketing Copy",
  error: "Failed to generate marketing copy.",
  copied: "Copied!",
  titleHeader: "Product Title",
  copyButton: "Copy",
  descriptionHeader: "Product Description",
  socialHeader: "Social Media Post",
  emailHeader: "Email Subject Lines",
};

const MarketingCopyGenerator = ({ product }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copy, setCopy] = useState(product.marketingCopy || null);
  const [isShowingCopy, setIsShowingCopy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        return;
      }
      setIsTranslating(true);
      try {
        const textsToTranslate = Object.values(englishContent);
        const result = await getTranslations({
          texts: textsToTranslate,
          targetLanguageCode: currentLanguage.code,
        });
        const translations = result.data.translations;
        setContent({
          hideCopy: translations[0], viewCopy: translations[1], generating: translations[2],
          regenerate: translations[3], generate: translations[4], error: translations[5],
          copied: translations[6], titleHeader: translations[7], copyButton: translations[8],
          descriptionHeader: translations[9], socialHeader: translations[10], emailHeader: translations[11],
        });
      } catch (err) {
        console.error("Failed to translate MarketingCopyGenerator content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleGenerateClick = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await generateMarketingCopy({ 
        productId: product.id,
        targetLanguage: currentLanguage.name 
      });
      setCopy(result.data);
      setIsShowingCopy(true);
    } catch (err) {
      console.error("Error generating marketing copy:", err);
      setError(err.message || content.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(content.copied);
      setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className={`marketing-copy-generator ${isTranslating ? 'translating' : ''}`}>
      {copy ? (
        <div className="button-group">
          <button onClick={() => setIsShowingCopy(!isShowingCopy)} className="view-button">
            {isShowingCopy ? content.hideCopy : content.viewCopy}
          </button>
          <button onClick={handleGenerateClick} disabled={isLoading} className="generate-button">
            {isLoading ? content.generating : content.regenerate}
          </button>
        </div>
      ) : (
        <button onClick={handleGenerateClick} disabled={isLoading} className="generate-button">
          {isLoading ? content.generating : content.generate}
        </button>
      )}

      {error && <p className="error-message">{error}</p>}
      {copySuccess && <p className="copy-success-message">{copySuccess}</p>}
      {copy && isShowingCopy && (
        <div className="copy-results">
          <div className="copy-section">
            <div className="copy-header">
              <h3>{content.titleHeader}</h3>
              <button className="copy-btn" onClick={() => handleCopyToClipboard(copy.title || '')}>{content.copyButton}</button>
            </div>
            <textarea readOnly value={copy.title || ''} />
          </div>

          <div className="copy-section">
             <div className="copy-header">
              <h3>{content.descriptionHeader}</h3>
              <button className="copy-btn" onClick={() => handleCopyToClipboard(copy.productDescription || '')}>{content.copyButton}</button>
            </div>
            <textarea readOnly value={copy.productDescription || ''} />
          </div>
          
          <div className="copy-section">
            <div className="copy-header">
              <h3>{content.socialHeader}</h3>
              <button className="copy-btn" onClick={() => handleCopyToClipboard(copy.socialMediaPost || '')}>{content.copyButton}</button>
            </div>
            <textarea readOnly value={copy.socialMediaPost || ''} />
          </div>
          
          <div className="copy-section">
            <div className="copy-header">
              <h3>{content.emailHeader}</h3>
               <button className="copy-btn" onClick={() => handleCopyToClipboard(Array.isArray(copy.emailSubject) ? copy.emailSubject.join('\n') : '')}>{content.copyButton}</button>
            </div>
            <textarea readOnly value={Array.isArray(copy.emailSubject) ? copy.emailSubject.join('\n') : ''} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingCopyGenerator;
