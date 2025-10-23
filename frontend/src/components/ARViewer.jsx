import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './ARViewer.css';

const ARViewer = ({ modelUrl, onClose }) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const arSceneRef = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);
  const [arEnabled, setArEnabled] = useState(false); // New state to control when AR.js attributes are applied
  const [arjsAttributes, setArjsAttributes] = useState(''); // State to hold the arjs attribute string
  const [arLoaded, setArLoaded] = useState(false); // New state for AR.js and A-Frame readiness

  // Render the a-scene as soon as instructions are dismissed and camera is granted.
  // AR.js will be activated once the A-Frame scene 'loaded' event fires.
  const shouldRenderScene = !showInstructions && hasCameraPermission;

  useEffect(() => {
    let stream = null; // Declare stream here to make it accessible in cleanup

    const requestCameraPermission = async () => {
      setCameraPermissionError(null); // Clear previous errors
      try {
        // Attempt to get user media to trigger permission prompt
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the track immediately
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Camera permission denied or error:", err);
        setHasCameraPermission(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraPermissionError("Camera access denied. Please enable it in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setCameraPermissionError("No camera found on this device.");
        } else {
          setCameraPermissionError("Could not access camera: " + err.message);
        }
      } finally {
        // setIsLoadingCamera(false); // Camera request finished - REMOVED
      }
    };

    // Removed checkIfARReady function and its setTimeout logic.
    // const checkIfARReady = () => {
    //   if (window.AFRAME && window.THREEx) {
    //     console.log("A-Frame and AR.js are ready.");
    //     setArLoaded(true);
    //   } else {
    //     console.log("A-Frame or AR.js not yet ready, retrying...");
    //     setTimeout(checkIfARReady, 100); // Retry after 100ms
    //   }
    // };

    requestCameraPermission();

    const sceneEl = arSceneRef.current;

    const handleSceneLoaded = () => {
      console.log("A-Frame scene is loaded. Enabling AR.js components.");
      setArjsAttributes('sourceType: webcam; detectionMode: mono_and_matrix; matrixCodeType: 3x3; debugUIEnabled: true;');
      setArEnabled(true);
    };

    if (sceneEl) {
      // If the scene is already loaded (e.g., on re-render), call handleSceneLoaded immediately
      if (sceneEl.hasLoaded) {
        handleSceneLoaded();
      } else {
        sceneEl.addEventListener('loaded', handleSceneLoaded);
      }
    }

    // Cleanup function for the effect
    return () => {
      // If a stream was active, ensure it's stopped on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setHasCameraPermission(false);
      setCameraPermissionError(null);
      if (sceneEl) {
        sceneEl.removeEventListener('loaded', handleSceneLoaded);
      }
    };
  }, [showInstructions, hasCameraPermission]); // Re-run effect when showInstructions or hasCameraPermission changes

  const backButtonPortal = document.getElementById('back-button-portal');

  return (
    <div className="ar-viewer-container">
      {showInstructions ? ( // Conditional rendering for instructions panel
        <div className="ar-instructions-panel">
          <h2>Welcome to AR/VR View!</h2>
          <p>Please point your camera at a Hiro marker to see the product in augmented reality.</p>
          <p>You can print one from <a href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/aframe/examples/image-tracking/resources/pattern-hiro.png" target="_blank" rel="noopener noreferrer" className="ar-link">here</a>.</p>

          {/* Removed isLoadingCamera && (
            <p className="ar-permission-info-message">Requesting camera access...</p>
          ) */}
          {cameraPermissionError && (
            <p className="ar-permission-error-message">
              {cameraPermissionError}
              <br/>
              To try again, please exit AR/VR and re-enter.
            </p>
          )}
          {(!arEnabled || !hasCameraPermission) && !cameraPermissionError && (
             <p className="ar-permission-info-message">
                Initializing AR components and requesting camera access...
             </p>
          )}

          <div className="ar-instruction-buttons">
            <button
              onClick={() => setShowInstructions(false)}
              className="ar-button primary"
              disabled={!arEnabled || !hasCameraPermission} // Disable until camera is ready and AR is enabled
            >
              Got It!
            </button>
            <button
              onClick={onClose}
              className="ar-button secondary"
            >
              Exit AR/VR
            </button>
          </div>
        </div>
      ) : null} {/* If showInstructions is false, render nothing here */}

      {/* Render a-scene only if instructions are dismissed and camera is ready */}
      {shouldRenderScene && (
        <a-scene
          ref={arSceneRef}
          embedded
          arjs={arjsAttributes} // Conditionally apply arjs attribute
          renderer={'antialias: true; alpha: true; logarithmicDepthBuffer: true;'}
          vr-mode-ui={'enabled: true'} // Enable VR button
          style={{ width: '100%', height: '100%', display: 'block' }} // Crucial styles
        >
          <a-entity light={'type: ambient; color: #BBB; intensity: 0.8'}></a-entity>
          <a-entity light={'type: directional; color: #FFF; intensity: 0.6'} position={'-0.5 1 1'}></a-entity>

          <a-marker preset={'hiro'}>
            {modelUrl ? (
              <a-entity
                gltf-model={`url(${modelUrl})`}
                scale={'0.5 0.5 0.5'}
                position={'0 0 0'}
                rotation={'0 0 0'}
                events={{
                  'model-loaded': () => console.log('GLTF Model loaded successfully!'),
                  'model-error': (e) => console.error('Error loading GLTF Model:', e.detail),
                }}
              ></a-entity>
            ) : (
              <a-box position={'0 0.05 0'} scale={'0.1 0.1 0.1'} material={'color: orange;'}></a-box>
            )}
          </a-marker>
          <a-entity camera></a-entity>
        </a-scene>
      )}

      {/* Render the permanent close button after instructions are dismissed */}
      {!showInstructions && backButtonPortal && ReactDOM.createPortal(
        <button onClick={onClose} className="ar-exit-button">
          Exit AR/VR
        </button>,
        backButtonPortal
      )}
    </div>
  );
};

export default ARViewer;
