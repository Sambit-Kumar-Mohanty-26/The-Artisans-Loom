import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './OracleInsightWidget.css';

const getArtisanOracleInsights = httpsCallable(functions, 'getArtisanOracleInsights');
const TrendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l1.515 1.515a3.75 3.75 0 005.304 0L21.75 6" /></svg> );
const DesignIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a7.5 7.5 0 00-7.5 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5a6.01 6.01 0 015.82 5.253M12 3a6.01 6.01 0 00-5.82 5.253v0" /></svg> );
const MarketingIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197" /></svg> );
const RefreshIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a7.5 7.5 0 01-1.08 3.916m-1.08-3.916a7.5 7.5 0 00-1.08-3.916m0 0L16.023 9.348m0 0A7.5 7.5 0 0112 3a7.5 7.5 0 013.75 14.155m-3.75 2.115V21m-3.75-2.115a7.5 7.5 0 00-3.75-2.115m0 0L7.977 14.155m0 0a7.5 7.5 0 01-3.75-2.115m3.75 2.115L12 18.75m-3.75-2.115a7.5 7.5 0 01-3.75-2.115" /></svg> );

const useTypewriter = (text, speed = 30) => {
    const [displayText, setDisplayText] = useState('');
    useEffect(() => {
        setDisplayText(''); 
        if (!text) return;
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prev => text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, speed);
        return () => clearInterval(typingInterval);
    }, [text, speed]);
    return displayText;
};

const InsightCard = ({ icon, text, type, isLoading }) => {
    const animatedText = useTypewriter(isLoading ? '' : text);
    return (
        <div className={`insight-card ${type}`}>
            <div className="insight-icon">{icon}</div>
            <p className="insight-text">{animatedText}</p>
        </div>
    );
};

const OracleInsightWidget = () => {
    const { currentLanguage } = useLanguage();
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInsights = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getArtisanOracleInsights({ language: currentLanguage.name });
            setInsights(result.data.insights || []);
        } catch (err) {
            console.error("Error fetching Oracle insights:", err);
            setError("Could not load market insights at this time.");
        } finally {
            setLoading(false);
        }
    }, [currentLanguage]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    const icons = [<TrendIcon />, <DesignIcon />, <MarketingIcon />];
    const types = ['trend', 'design', 'marketing'];

    return (
        <div className="oracle-insight-widget">
            <div className="widget-header">
              <h2 className="widget-title">Mitra's Oracle</h2>
              <button className="refresh-btn" onClick={fetchInsights} disabled={loading} title="Get New Insights">
                <RefreshIcon />
              </button>
            </div>
            {loading ? (
                <div className="widget-loader">
                    <div className="spinner"></div>
                    <p>Analyzing market trends...</p>
                </div>
            ) : error ? (
                <p className="widget-error">{error}</p>
            ) : (
                <div className="insights-grid">
                    {insights.map((insight, index) => (
                        <InsightCard
                          key={index}
                          icon={icons[index]}
                          text={insight}
                          type={types[index]}
                          isLoading={loading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OracleInsightWidget;