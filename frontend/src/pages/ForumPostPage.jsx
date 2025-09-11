import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import EditPostModal from '../components/EditPostModal';
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
  replyingToLabel: "Replying to",
  replyPlaceholder: "Write your reply here...",
  askMitraPlaceholder: "Ask @Mitra for help or insights...",
  submitReplyButton: "Post Reply",
  submittingReplyButton: "Posting...",
  loginToReply: "Please log in to reply.",
  translateButton: "Translate",
  editLabel: "Edit",
  deleteLabel: "Delete",
  replyLabel: "Reply",
  cancelLabel: "Cancel",
  saveLabel: "Save Changes",
  savingButton: "Saving...",
  confirmDelete: "Are you sure you want to delete this?",
  editPostTitle: "Edit Post",
  editReplyTitle: "Edit Reply",
};

const MoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

const PostOptions = ({ authorId, onEdit, onDelete, content }) => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.right + window.scrollX - 120,
      });
      setIsOpen(prev => !prev);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (userProfile?.uid !== authorId) {
    return null;
  }

  return (
    <div className="options-dropdown-container">
      <button className="options-btn action-icon-btn" onClick={handleToggle} ref={buttonRef} data-tooltip="Options">
        <MoreIcon />
      </button>
      {isOpen && ReactDOM.createPortal(
        <div 
          className="options-dropdown-menu" 
          ref={dropdownRef} 
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <button onClick={() => { onEdit(); setIsOpen(false); }}>{content.editLabel}</button>
          <button onClick={() => { onDelete(); setIsOpen(false); }} className="delete">{content.deleteLabel}</button>
        </div>,
        document.body
      )}
    </div>
  );
};

const ReplyCard = ({ reply, onEdit, onDelete, onReply, onTranslate, translatedText, content, currentLanguage }) => {
  const { userProfile } = useAuth();
  const replyContent = translatedText || reply.content;

  return (
    <div className={`reply-card ${reply.isAiResponse ? 'ai-reply' : ''} ${reply.content.toLowerCase().includes('@mitra') ? 'user-ask-mitra' : ''}`}>
      <img src={reply.authorPhotoURL || `https://ui-avatars.com/api/?name=${reply.authorName.replace(' ', '+')}`} alt={reply.authorName} className="reply-avatar" />
      <div className="reply-content-wrapper">
        <div className="reply-content">
          <p className="reply-author">
            <strong>{reply.authorName}</strong>
            <span>{reply.createdAt ? new Date(reply.createdAt.seconds * 1000).toLocaleString() : ''}</span>
          </p>
          <p className="reply-text">{replyContent}</p>
        </div>
        <div className="reply-actions">
          {userProfile && <button className="action-icon-btn" onClick={() => onReply(reply)} data-tooltip={content.replyLabel}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg></button>}
          {currentLanguage.code !== 'en' && !translatedText && !reply.isAiResponse && (
            <button className="action-icon-btn" onClick={onTranslate} data-tooltip={content.translateButton}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg></button>
          )}
          <PostOptions authorId={reply.authorId} onEdit={onEdit} onDelete={onDelete} content={content} />
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, content }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
                <p>{content.confirmDelete}</p>
                <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">{content.cancelLabel}</button>
                    <button onClick={onConfirm} className="confirm-delete-btn">{content.deleteLabel}</button>
                </div>
            </div>
        </div>
    );
};

const ForumPostPage = ({ postId, onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [content, setContent] = useState(englishContent);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [translatedContent, setTranslatedContent] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, id: null });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!postId) {
      setError(content.postNotFound);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const postRef = doc(db, 'forumPosts', postId);
    const unsubscribePost = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError(content.postNotFound);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching post:", err);
      setError(content.postLoadError);
      setLoading(false);
    });

    const repliesRef = collection(db, `forumPosts/${postId}/replies`);
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const unsubscribeReplies = onSnapshot(q, (snapshot) => {
      const repliesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReplies(repliesData);
    });

    return () => {
      unsubscribePost();
      unsubscribeReplies();
    };
  }, [postId, content.postNotFound, content.postLoadError]);

  useEffect(() => {
    const translateUiContent = async () => {
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
          repliesTitle: translations[6], yourReplyLabel: translations[7], replyingToLabel: translations[8],
          replyPlaceholder: translations[9], askMitraPlaceholder: translations[10], submitReplyButton: translations[11],
          submittingReplyButton: translations[12], loginToReply: translations[13], translateButton: translations[14],
          editLabel: translations[15], deleteLabel: translations[16], replyLabel: translations[17],
          cancelLabel: translations[18], saveLabel: translations[19], savingButton: translations[20],
          confirmDelete: translations[21], editPostTitle: translations[22], editReplyTitle: translations[23],
        });
      } catch (err) {
        console.error("Failed to translate page content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateUiContent();
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
        parentId: replyingTo ? replyingTo.id : null,
      });
      setNewReply('');
      setReplyingTo(null);
    } catch (err) { 
      console.error("Error posting reply:", err);
    } finally { 
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (type, id) => {
    setDeleteConfirmation({ isOpen: true, type, id });
  };
  
  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirmation;
    if (!id) return;
    try {
      const docRef = type === 'post' 
        ? doc(db, 'forumPosts', id) 
        : doc(db, `forumPosts/${postId}/replies`, id);
      await deleteDoc(docRef);
      if (type === 'post') {
        onNavigate('forum');
      }
    } catch (err) { 
      console.error("Error deleting:", err);
    } finally {
      setDeleteConfirmation({ isOpen: false, type: null, id: null });
    }
  };
  
  const handleEditSave = async (newText) => {
    if (!editingContent || !newText.trim()) return;
    try {
        const docRef = editingContent.type === 'post' 
            ? doc(db, 'forumPosts', editingContent.id)
            : doc(db, `forumPosts/${postId}/replies`, editingContent.id);
        await updateDoc(docRef, { content: newText });
    } catch (err) { 
      console.error("Error updating:", err);
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
  
  const renderReplies = (parentId = null) => {
    return replies
      .filter(reply => reply.parentId === parentId)
      .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds)
      .map(reply => (
        <div key={reply.id} className="reply-thread">
            <ReplyCard 
              reply={reply} 
              onEdit={() => setEditingContent({ id: reply.id, text: reply.content, type: 'reply' })}
              onDelete={() => handleDeleteRequest('reply', reply.id)}
              onReply={setReplyingTo}
              onTranslate={() => handleTranslateClick(reply.id, reply.content)}
              translatedText={translatedContent[reply.id]}
              content={content}
              currentLanguage={currentLanguage}
            />
            <div className="nested-replies">
                {renderReplies(reply.id)}
            </div>
        </div>
      ));
  };

  if (loading) return <div className="page-loader">{content.loadingPost}</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!post) return <div className="page-error">{content.postNotFound}</div>;

  const mainPostContent = post.content;
  const isAskingMitra = newReply.toLowerCase().includes('@mitra');

  return (
    <>
      <EditPostModal 
        isOpen={!!editingContent}
        onClose={() => setEditingContent(null)}
        onSave={handleEditSave}
        initialContent={editingContent ? editingContent.text : ''}
        title={editingContent?.type === 'post' ? content.editPostTitle : content.editReplyTitle}
        content={{
          saveLabel: content.saveLabel,
          savingButton: content.submittingReplyButton,
          cancelLabel: content.cancelLabel
        }}
      />
      
      <ConfirmationModal 
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, id: null })}
        onConfirm={handleConfirmDelete}
        content={content}
      />

      <div className={`forum-post-page ${isTranslating ? 'translating' : ''}`}>
        <div className="post-container">
          <button onClick={() => onNavigate('forum')} className="back-to-forum-btn">← {content.backToForum}</button>
          <div className="post-main-content">
            <div className="post-header-with-options">
                <h1 className="post-title-main">{post.title}</h1>
                <PostOptions 
                    authorId={post.authorId}
                    onEdit={() => setEditingContent({ id: post.id, text: post.content, type: 'post' })}
                    onDelete={() => handleDeleteRequest('post', post.id)}
                    content={content}
                />
            </div>
            <div className="post-author-details">
                <img src={post.authorPhotoURL || `https://ui-avatars.com/api/?name=${post.authorName.replace(' ', '+')}`} alt={post.authorName} />
                <span>{content.postedBy} <strong>{post.authorName}</strong> {content.onDate} {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : ''}</span>
            </div>
            <p className="post-body">{translatedContent[post.id] || mainPostContent}</p>
            {currentLanguage.code !== 'en' && !translatedContent[post.id] && (
              <button className="translate-btn" onClick={() => handleTranslateClick(post.id, post.content)}>
                {content.translateButton}
              </button>
            )}
          </div>

          <div className="replies-section">
            <h2>{content.repliesTitle} ({post.replyCount || replies.length})</h2>
            <div className="replies-list">
                {renderReplies()}
            </div>
          </div>

          <div className="reply-form-container">
            {userProfile ? (
              <form onSubmit={handleReplySubmit} className="reply-form">
                <label htmlFor="newReply">
                  {replyingTo ? `${content.replyingToLabel} ${replyingTo.authorName}` : content.yourReplyLabel}
                  {replyingTo && <button type="button" className="cancel-reply-btn" onClick={() => setReplyingTo(null)}> ({content.cancelLabel})</button>}
                </label>
                <textarea
                  id="newReply"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder={isAskingMitra ? content.askMitraPlaceholder : content.replyPlaceholder}
                  rows="5"
                  required
                ></textarea>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newReply.trim()}
                  className={isAskingMitra ? 'ask-mitra-btn' : ''}
                >
                  {isSubmitting ? content.submittingReplyButton : content.submitReplyButton}
                </button>
              </form>
            ) : (
              <p className="login-prompt">{content.loginToReply}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForumPostPage;