import React, { useEffect, useState } from 'react';
import { db, functions } from '../firebaseConfig'; // Assuming firebaseConfig.js is in src
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './MasterpieceAuctionPage.css';

const placeBidFunction = httpsCallable(functions, 'placeBid');

const MasterpieceAuctionPage = ({ onNavigate }) => {
  const { currentUser } = useAuth(); // Get currentUser from AuthContext
  const [auctionPieces, setAuctionPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({}); // To manage bid amounts for each piece
  const [bidErrors, setBidErrors] = useState({}); // To manage bid errors for each piece
  const [bidSuccess, setBidSuccess] = useState({}); // To manage bid success messages
  const [showFullNote, setShowFullNote] = useState({}); // To manage expanded appraiser notes

  const fetchAuctionPieces = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "auctionPieces"), where("status", "in", ["appraised", "live", "sold", "unsold"]));
      const querySnapshot = await getDocs(q);
      const pieces = await Promise.all(querySnapshot.docs.map(async doc => {
        const data = { id: doc.id, ...doc.data() };
        return data;
      }));
      setAuctionPieces(pieces);
      setError(null);
    } catch (err) {
      console.error("Error fetching auction pieces:", err);
      setError("Failed to load auction pieces. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionPieces();
    const intervalId = setInterval(fetchAuctionPieces, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, []);

  const handleBidAmountChange = (pieceId, amount) => {
    setBidAmounts(prev => ({ ...prev, [pieceId]: amount }));
    setBidErrors(prev => ({ ...prev, [pieceId]: null })); // Clear error on change
    setBidSuccess(prev => ({ ...prev, [pieceId]: null })); // Clear success on change
  };

  const handlePlaceBid = async (pieceId) => {
    if (!currentUser) {
      setBidErrors(prev => ({ ...prev, [pieceId]: "You must be logged in to place a bid." }));
      return;
    }

    const bidAmount = parseFloat(bidAmounts[pieceId]);

    if (isNaN(bidAmount) || bidAmount <= 0) {
      setBidErrors(prev => ({ ...prev, [pieceId]: "Please enter a valid bid amount." }));
      return;
    }

    try {
      setBidErrors(prev => ({ ...prev, [pieceId]: null }));
      setBidSuccess(prev => ({ ...prev, [pieceId]: null }));
      const result = await placeBidFunction({ auctionPieceId: pieceId, bidAmount });
      console.log("Bid placed successfully:", result.data);
      setBidSuccess(prev => ({ ...prev, [pieceId]: "Bid placed successfully!" }));
      setBidAmounts(prev => ({ ...prev, [pieceId]: '' })); // Clear bid input
      // Optionally refetch auction pieces to update highest bid displayed
      fetchAuctionPieces();
    } catch (err) {
      console.error("Error placing bid:", err);
      setBidErrors(prev => ({ ...prev, [pieceId]: err.message || "Failed to place bid." }));
    }
  };

  // Helper to format auction end time
  const formatAuctionTimeLeft = (endTime) => {
    // Robust check to ensure endTime is a Firestore Timestamp with a toDate method
    if (!endTime || typeof endTime !== 'object' || typeof endTime.toDate !== 'function') {
      return 'N/A';
    }
    const now = new Date();
    const end = endTime.toDate(); // Convert Firebase Timestamp to JS Date
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Auction Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeLeft = '';
    if (days > 0) timeLeft += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) timeLeft += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) timeLeft += `${minutes} minute${minutes > 1 ? 's' : ''}`;

    return timeLeft.trim() || 'Less than a minute';
  };

  if (loading) {
    return <div className="masterpiece-auction-page">Loading masterpiece auctions...</div>;
  }

  if (error) {
    return <div className="masterpiece-auction-page error-message">Error: {error}</div>;
  }

  return (
    <div className="masterpiece-auction-page">
      <div className="page-title-section">
        <h1>Masterpiece Auction</h1>
        <p>Discover and bid on exquisite, one-of-a-kind crafts from India's master artisans.</p>
      </div>

      <div className="auction-controls-section">
        <div className="auction-control-group">
          <label htmlFor="sort-by">Sort By:</label>
          <select id="sort-by" name="sort-by">
            <option value="ending-soon">Ending Soon</option>
            <option value="highest-bid">Highest Bid</option>
            <option value="newly-listed">Newly Listed</option>
          </select>
        </div>
        <div className="auction-control-group">
          <label htmlFor="filter-category">Filter By:</label>
          <select id="filter-category" name="filter-category">
            <option value="all">All Categories</option>
            <option value="painting">Painting</option>
            <option value="sculpture">Sculpture</option>
            <option value="textile">Textile</option>
            <option value="pottery">Pottery</option>
            <option value="jewelry">Jewelry</option>
          </select>
        </div>
      </div>

      {auctionPieces.length === 0 ? (
        <p className="no-auction-pieces-message">No masterpiece auction pieces available at the moment. Check back soon!</p>
      ) : (
        <div className="auction-pieces-grid">
          {auctionPieces.map(piece => (
            <div key={piece.id} className="auction-card">
              <div className="auction-image-container">
                <img src={piece.imageUrl} alt={piece.name} className="artwork-image" />
                {(piece.status === 'appraised' || piece.status === 'live') && (
                  <span className="live-badge">LIVE</span>
                )}
              </div>
              <div className="card-content">
                <h2 className="artwork-title">{piece.name}</h2>
                <p className="artist-name">By <strong>{piece.artisanName || 'Unknown Artisan'}</strong></p>
                
                <div className="auction-details-block">
                  <div className="detail-row">
                    <span>Reserve Price:</span>
                    <span>₹{piece.reservePrice ? piece.reservePrice.toLocaleString() : 'N/A'}</span>
                  </div>
                  {(piece.status === 'appraised' || piece.status === 'live') && piece.currentHighestBid && (
                    <div className="detail-row">
                      <span>Current Highest Bid:</span>
                      <span className="current-bid-amount">₹{piece.currentHighestBid.toLocaleString()}</span>
                    </div>
                  )}
                  {(piece.status === 'appraised' || piece.status === 'live') && piece.endTime && (
                    <div className="detail-row">
                      <span>Time Left:</span>
                      <span className="time-left">{formatAuctionTimeLeft(piece.endTime)}</span>
                    </div>
                  )}
                </div>

                <div className="appraiser-note-snippet">
                  <p>
                    {showFullNote[piece.id] ? piece.appraiserNote : piece.appraiserNote.substring(0, 150) + '... '}
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowFullNote(prev => ({ ...prev, [piece.id]: !prev[piece.id] }));
                      }}
                      className="view-details-link"
                    >
                      {showFullNote[piece.id] ? 'Read Less' : 'View Details'}
                    </a>
                  </p>
                </div>

                {(piece.status === 'appraised' || piece.status === 'live') ? (
                  <div className="bidding-area">
                    {currentUser && currentUser.uid === piece.artisanId ? (
                      <div className="bidding-area-disabled">
                        <p>This is your masterpiece.</p>
                      </div>
                    ) : (
                      <>
                        <div className="bid-input-wrapper">
                          <span>₹</span>
                          <input 
                            type="number" 
                            placeholder="Enter your bid (₹)" 
                            value={bidAmounts[piece.id] || ''}
                            onChange={(e) => handleBidAmountChange(piece.id, e.target.value)}
                            disabled={!currentUser}
                          />
                        </div>
                        <button onClick={() => handlePlaceBid(piece.id)} className="bid-button" disabled={!currentUser || !bidAmounts[piece.id]}>
                          Place Bid
                        </button>
                      </>
                    )}
                    {bidErrors[piece.id] && <p className="bid-message error">{bidErrors[piece.id]}</p>}
                    {bidSuccess[piece.id] && <p className="bid-message success">{bidSuccess[piece.id]}</p>}
                    {!currentUser && <p className="login-to-bid-message">Log in to place a bid.</p>}
                  </div>
                ) : piece.status === 'sold' ? (
                  <div className="auction-result sold">
                    <h3>Auction Closed - Sold!</h3>
                    <p><strong>Winning Bid:</strong> ₹{piece.winningBidAmount ? piece.winningBidAmount.toLocaleString() : 'N/A'}</p>
                    <p><strong>Winner:</strong> {piece.winningBidderName || 'N/A'}</p>
                    <p>Closed on: {piece.closedAt ? new Date(piece.closedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                  </div>
                ) : piece.status === 'unsold' ? (
                  <div className="auction-result unsold">
                    <h3>Auction Closed - Unsold</h3>
                    <p>This masterpiece did not meet its reserve price.</p>
                    <p>Closed on: {piece.closedAt ? new Date(piece.closedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* The 'Go to Home' button is now assumed to be in the global header/footer */}
    </div>
  );
};

export default MasterpieceAuctionPage;
