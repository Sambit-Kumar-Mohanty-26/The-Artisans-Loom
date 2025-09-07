import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './ForumPostPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  loadingPost: "Loading Discussion...",
  postNotFound: "Post not found.",
  postLoadError: "Failed to load post. Please try again.",
  backToForum: "Back to Forum",
  postedBy: "Posted by",
  onDate: "on",
  repliesTitle: "Replies",
  yourReplyLabel: "Your Reply",
  replyPlaceholder: "Write your reply here. Mention '@Mitra' to ask our AI assistant a question.",
  submitReplyButton: "Post Reply",
  submittingReplyButton: "Posting...",
  loginToReply: "Please log in to reply.",
  translateButton: "Translate",
};

const ForumPostPage = ({ postId, onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [content, setContent] = useState(englishContent);
  const [newReply, setNewReply] = useState('');
  const [translatedContent, setTranslatedContent] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'forumPosts', postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError(content.postNotFound);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(content.postLoadError);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, content.postNotFound, content.postLoadError]);

  useEffect(() => {
    if (!postId) return;
    const repliesRef = collection(db, `forumPosts/${postId}/replies`);
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repliesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReplies(repliesData);
    });
    return () => unsubscribe();
  }, [postId]);

  useEffect(() => {
    const translateContent = async () => {
      setTranslatedContent({}); 
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        return;
      }
      setIsTranslating(true);
      try {
        const textsToTranslate = Object.values(englishContent);
        const result = await getTranslations({ texts: textsToTranslate, targetLanguageCode: currentLanguage.code });
        const translations = result.data.translations;
        setContent({
          loadingPost: translations[0], postNotFound: translations[1], postLoadError: translations[2],
          backToForum: translations[3], postedBy: translations[4], onDate: translations[5], 
          repliesTitle: translations[6], yourReplyLabel: translations[7], replyPlaceholder: translations[8], 
          submitReplyButton: translations[9], submittingReplyButton: translations[10], 
          loginToReply: translations[11], translateButton: translations[12],
        });
      } catch (err) {
        console.error("Failed to translate page content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || !userProfile) return;
    setIsSubmitting(true);
    try {
      const repliesRef = collection(db, `forumPosts/${postId}/replies`);
      await addDoc(repliesRef, {
        content: newReply,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorPhotoURL: userProfile.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewReply('');
    } catch (err) {
      console.error("Error posting reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranslateClick = async (id, textToTranslate) => {
    setTranslatedContent(prev => ({ ...prev, [id]: "Translating..." }));
    try {
      const result = await getTranslations({
        texts: [textToTranslate],
        targetLanguageCode: currentLanguage.code,
      });
      const translatedText = result.data.translations[0];
      setTranslatedContent(prev => ({ ...prev, [id]: translatedText }));
    } catch (err) {
      console.error("On-demand translation failed:", err);
      setTranslatedContent(prev => ({ ...prev, [id]: "Translation failed." }));
    }
  };

  if (loading) return <div className="page-loader">{content.loadingPost}</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!post) return <div className="page-error">{content.postNotFound}</div>;

  const mainPostContent = translatedContent[post.id] || post.content;

  return (
    <div className={`forum-post-page ${isTranslating ? 'translating' : ''}`}>
      <div className="post-container">
        <button onClick={() => onNavigate('forum')} className="back-to-forum-btn">← {content.backToForum}</button>
        <div className="post-main-content">
          <h1 className="post-title-main">{post.title}</h1>
          <div className="post-author-details">
            <img src={post.authorPhotoURL || `https://ui-avatars.com/api/?name=${post.authorName.replace(' ', '+')}`} alt={post.authorName} />
            <span>{content.postedBy} <strong>{post.authorName}</strong> {content.onDate} {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : ''}</span>
          </div>
          <p className="post-body">{mainPostContent}</p>
          {currentLanguage.code !== 'en' && !translatedContent[post.id] && (
            <button className="translate-btn" onClick={() => handleTranslateClick(post.id, post.content)}>
              {content.translateButton}
            </button>
          )}
        </div>

        <div className="replies-section">
          <h2>{content.repliesTitle} ({replies.length})</h2>
          <div className="replies-list">
            {replies.map(reply => {
              const replyContent = translatedContent[reply.id] || reply.content;
              return (
                <div key={reply.id} className={`reply-card ${reply.isAiResponse ? 'ai-reply' : ''}`}>
                  <img src={reply.authorPhotoURL || `https://ui-avatars.com/api/?name=${reply.authorName.replace(' ', '+')}`} alt={reply.authorName} className="reply-avatar" />
                  <div className="reply-content">
                    <p className="reply-author">
                      <strong>{reply.authorName}</strong>
                      <span>{reply.createdAt ? new Date(reply.createdAt.seconds * 1000).toLocaleString() : ''}</span>
                    </p>
                    <p className="reply-text">{replyContent}</p>
                    {currentLanguage.code !== 'en' && !translatedContent[reply.id] && !reply.isAiResponse && (
                      <button className="translate-btn" onClick={() => handleTranslateClick(reply.id, reply.content)}>
                        {content.translateButton}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="reply-form-container">
          {userProfile ? (
            <form onSubmit={handleReplySubmit} className="reply-form">
              <label htmlFor="newReply">{content.yourReplyLabel}</label>
              <textarea
                id="newReply"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder={content.replyPlaceholder}
                rows="5"
                required
              ></textarea>
              <button type="submit" disabled={isSubmitting || !newReply.trim()}>
                {isSubmitting ? content.submittingReplyButton : content.submitReplyButton}
              </button>
            </form>
          ) : (
            <p className="login-prompt">{content.loginToReply}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPostPage;