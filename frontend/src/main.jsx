import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* By wrapping <App /> here, every component inside App can access the authentication context */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);