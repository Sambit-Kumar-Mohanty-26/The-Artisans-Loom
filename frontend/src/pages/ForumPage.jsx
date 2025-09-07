import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './ForumPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Artisan Sabha",
  subtitle: "A community space to share knowledge, ask questions, and grow together.",
  createPostButton: "Start a New Discussion",
  loadingForum: "Loading Community Forum...",
  noPosts: "No discussions have been started yet. Be the first!",
  postedBy: "Posted by",
  onDate: "on",
  replies: "Replies",
  viewPost: "View Post",
};

const ForumPage = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = collection(db, 'forumPosts');
    
    const q = query(
      postsRef, 
      where("isFlagged", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching forum posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
          title: translations[0],
          subtitle: translations[1],
          createPostButton: translations[2],
          loadingForum: translations[3],
          noPosts: translations[4],
          postedBy: translations[5],
          onDate: translations[6],
          replies: translations[7],
          viewPost: translations[8],
        });
      } catch (err) {
        console.error("Failed to translate ForumPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  if (loading) {
    return <div className="page-loader">{content.loadingForum}</div>;
  }

  return (
    <div className={`forum-page ${isTranslating ? 'translating' : ''}`}>
      <div className="forum-hero">
        <div className="hero-content">
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
          <button onClick={() => onNavigate('create-post')} className="new-post-btn">
            {content.createPostButton}
          </button>
        </div>
      </div>

      <div className="posts-list-container">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="post-summary-card" onClick={() => onNavigate(`forum/${post.id}`)}>
              <div className="post-card-header">
                <img 
                  src={post.authorPhotoURL || `https://ui-avatars.com/api/?name=${post.authorName.replace(' ', '+')}`} 
                  alt={post.authorName} 
                  className="author-avatar" 
                />
                <div className="post-author-info">
                  <strong>{post.authorName}</strong>
                  <span>{content.onDate} {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                </div>
              </div>
              <div className="post-card-body">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-excerpt">
                  {post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}
                </p>
              </div>
              <div className="post-card-footer">
                <span className="reply-count">
                  {post.replyCount || 0} {content.replies}
                </span>
                <span className="view-post-link">{content.viewPost} →</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-posts-card">
            <p>{content.noPosts}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPage;