import React from 'react';
import './ReelScriptModal.css'; 

const CopyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H9.375" /></svg> );

const ReelScriptModal = ({ isOpen, onClose, script, isLoading, productName }) => {

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reel-script-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Reel Script for "{productName}"</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <div className="script-loader">
              <div className="spinner"></div>
              <p>Mitra is writing your script...</p>
            </div>
          ) : (
            <div className="script-storyboard">
              {script?.scenes?.map((scene, index) => (
                <div key={index} className="scene-card">
                  <h3 className="scene-title">Scene {index + 1}</h3>
                  <div className="scene-content">
                    <div className="script-section">
                      <h4>Visual</h4>
                      <p>{scene.visual}</p>
                      <button className="copy-btn" onClick={() => handleCopy(scene.visual)}><CopyIcon /></button>
                    </div>
                    <div className="script-section">
                      <h4>Voiceover</h4>
                      <p>{scene.voiceover}</p>
                      <button className="copy-btn" onClick={() => handleCopy(scene.voiceover)}><CopyIcon /></button>
                    </div>
                    <div className="script-section">
                      <h4>On-Screen Text</h4>
                      <p>"{scene.onScreenText}"</p>
                      <button className="copy-btn" onClick={() => handleCopy(scene.onScreenText)}><CopyIcon /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelScriptModal;