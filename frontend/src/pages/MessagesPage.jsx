import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import './MessagesPage.css';

/* ===== UTILS ===== */
function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ===== SOUS-COMPOSANTS DÉFINIS EN DEHORS ===== */
/* Le problème précédent : ConversationsList et ChatPanel définis DANS MessagesPage
   → React les recrée à chaque render → unmount/remount → perte de focus
   Solution : les définir à l'extérieur du composant parent */

function AvatarInitials({ name, size = 38 }) {
    const initials = (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>;
}

function TypingDots() {
    return (
        <div className="typing-indicator">
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
        </div>
    );
}

const IconArrowLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
);
const IconSend = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
);

/* ===== CONVERSATIONS LIST ===== */
const ConversationsList = memo(function ConversationsList({
    conversations, filteredUsers, searchQuery, activePartnerId,
    onSearch, onSelectConversation, onSelectUser, showDivider,
}) {
    return (
        <>
            <div className="conversations-header">
                <h2 className="conversations-title">Messages</h2>
            </div>
            <div className="conversations-search">
                <input
                    type="text"
                    className="input-field"
                    placeholder="Rechercher un étudiant..."
                    value={searchQuery}
                    onChange={e => onSearch(e.target.value)}
                />
            </div>
            <div className="conversations-list">
                {!searchQuery && conversations.map(conv => {
                    const unread = Number(conv.unread_count);
                    const isActive = activePartnerId === Number(conv.partner_id);
                    return (
                        <button
                            key={conv.partner_id}
                            className={`conversation-item ${isActive ? 'conversation-active' : ''}`}
                            onClick={() => onSelectConversation(conv)}
                        >
                            <AvatarInitials name={conv.partner_full_name || conv.partner_username} size={40} />
                            <div className="conversation-info">
                                <div className="conversation-name-row">
                                    <span className="conversation-name">{conv.partner_full_name || conv.partner_username}</span>
                                    {unread > 0 && <span className="unread-badge">{unread}</span>}
                                </div>
                                {conv.last_message && <span className="conversation-preview">{conv.last_message}</span>}
                            </div>
                        </button>
                    );
                })}

                {filteredUsers.length > 0 && (
                    <>
                        {showDivider && <div className="conversations-divider">Autres étudiants</div>}
                        {filteredUsers.map(user => (
                            <button
                                key={user.id}
                                className={`conversation-item ${activePartnerId === user.id ? 'conversation-active' : ''}`}
                                onClick={() => onSelectUser(user)}
                            >
                                <AvatarInitials name={user.full_name || user.username} size={40} />
                                <div className="conversation-info">
                                    <span className="conversation-name">{user.full_name || user.username}</span>
                                    <span className="conversation-preview">@{user.username}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </>
    );
});

/* ===== CHAT INPUT — isolé pour éviter les re-renders ===== */
const ChatInput = memo(function ChatInput({ value, onChange, onSend, onKeyDown, disabled }) {
    return (
        <form className="chat-input-area" onSubmit={onSend}>
            <input
                type="text"
                className="input-field chat-input"
                placeholder="Écris ton message…"
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                disabled={disabled}
                autoComplete="off"
            />
            <button type="submit" className="btn btn-primary chat-send-btn" disabled={disabled || !value.trim()}>
                <IconSend />
            </button>
        </form>
    );
});

/* ===== MESSAGES PAGE ===== */
export default function MessagesPage() {
    const { partnerId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [conversations, setConversations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activePartner, setActivePartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [partnerIsTyping, setPartnerIsTyping] = useState(false);
    const [mobileView, setMobileView] = useState('list');

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const activePartnerRef = useRef(null);

    useEffect(() => { activePartnerRef.current = activePartner; }, [activePartner]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        socketService.onNewMessage((incomingMessage) => {
            const senderId = incomingMessage.senderId || incomingMessage.sender_id;
            if (activePartnerRef.current && Number(senderId) === Number(activePartnerRef.current.id)) {
                setMessages(prev => [...prev, incomingMessage]);
            }
            loadConversations();
        });

        socketService.onUserTyping(({ senderId }) => {
            if (activePartnerRef.current && Number(senderId) === Number(activePartnerRef.current.id)) {
                setPartnerIsTyping(true);
            }
        });
        socketService.onUserStopTyping(({ senderId }) => {
            if (activePartnerRef.current && Number(senderId) === Number(activePartnerRef.current.id)) {
                setPartnerIsTyping(false);
            }
        });

        return () => {
            socketService.off('new_message');
            socketService.off('user_typing');
            socketService.off('user_stop_typing');
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, partnerIsTyping]);

    useEffect(() => {
        if (partnerId) openConversationById(Number(partnerId));
    }, [partnerId]);

    useEffect(() => {
        const startWithId = location.state?.startConversationWithId;
        if (startWithId) {
            openConversationById(startWithId);
            navigate('/messages', { replace: true });
        }
    }, [location.state]);

    const loadConversations = useCallback(async () => {
        try {
            const response = await apiService.get('/messages/conversations');
            setConversations(response.conversations);
        } catch (error) { console.error(error); }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const response = await apiService.get('/users');
            setAllUsers(response.users.filter(u => u.id !== currentUser?.id));
        } catch (error) { console.error(error); }
    }, [currentUser?.id]);

    const loadInitialData = useCallback(async () => {
        await Promise.all([loadConversations(), loadUsers()]);
    }, [loadConversations, loadUsers]);

    const openConversationById = useCallback(async (selectedPartnerId) => {
        setIsLoadingMessages(true);
        setPartnerIsTyping(false);
        try {
            const [messagesResponse, usersResponse] = await Promise.all([
                apiService.get(`/messages/conversation/${selectedPartnerId}`),
                apiService.get('/users'),
            ]);
            setMessages(messagesResponse.messages);
            const partner = usersResponse.users.find(u => u.id === Number(selectedPartnerId));
            if (partner) {
                setActivePartner({ id: partner.id, full_name: partner.full_name, username: partner.username, promotion: partner.promotion, campus: partner.campus });
            }
            await loadConversations();
            setMobileView('chat');
        } catch (error) { console.error(error); }
        finally { setIsLoadingMessages(false); }
    }, [loadConversations]);

    const handleSelectConversation = useCallback((conv) => {
        const partner = { id: Number(conv.partner_id), full_name: conv.partner_full_name, username: conv.partner_username, promotion: conv.partner_promotion, campus: conv.partner_campus };
        setActivePartner(partner);
        setPartnerIsTyping(false);
        setMobileView('chat');
        navigate(`/messages/${conv.partner_id}`);
    }, [navigate]);

    const handleSelectUser = useCallback((user) => {
        setActivePartner(user);
        setPartnerIsTyping(false);
        setMobileView('chat');
        navigate(`/messages/${user.id}`);
    }, [navigate]);

    const handleBackToList = useCallback(() => {
        setMobileView('list');
        setActivePartner(null);
        navigate('/messages');
    }, [navigate]);

    const handleInputChange = useCallback((event) => {
        setInputValue(event.target.value);

        if (!activePartnerRef.current) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socketService.emitTypingStart(activePartnerRef.current.id);
        }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            if (activePartnerRef.current) socketService.emitTypingStop(activePartnerRef.current.id);
        }, 1500);
    }, []);

    const handleSendMessage = useCallback(async (event) => {
        event.preventDefault();
        if (!inputValue.trim() || !activePartnerRef.current) return;

        clearTimeout(typingTimeoutRef.current);
        if (isTypingRef.current) {
            isTypingRef.current = false;
            socketService.emitTypingStop(activePartnerRef.current.id);
        }

        const content = inputValue.trim();
        setInputValue('');
        setIsSending(true);

        try {
            const response = await apiService.post('/messages/send', {
                receiverId: activePartnerRef.current.id,
                content,
            });
            setMessages(prev => [...prev, response.message]);
            socketService.sendMessage(activePartnerRef.current.id, response.message);
            await loadConversations();
        } catch (error) { console.error(error); }
        finally { setIsSending(false); }
    }, [inputValue, loadConversations]);

    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage(event);
        }
    }, [handleSendMessage]);

    const conversationUserIds = conversations.map(c => Number(c.partner_id));
    const filteredUsers = searchQuery
        ? allUsers.filter(u => (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase()))
        : allUsers.filter(u => !conversationUserIds.includes(u.id));

    const partnerDisplayName = activePartner?.full_name || activePartner?.username || '';
    const partnerSub = [activePartner?.promotion, activePartner?.campus].filter(Boolean).join(' · ');

    const conversationsListProps = {
        conversations,
        filteredUsers,
        searchQuery,
        activePartnerId: activePartner?.id,
        onSearch: setSearchQuery,
        onSelectConversation: handleSelectConversation,
        onSelectUser: handleSelectUser,
        showDivider: !searchQuery && conversations.length > 0,
    };

    const chatContent = !activePartner ? (
        <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>Sélectionne une conversation</h3>
            <p>Choisis un étudiant pour commencer à discuter</p>
        </div>
    ) : (
        <>
            <div className="chat-header">
                <button className="chat-back-btn" onClick={handleBackToList}><IconArrowLeft /></button>
                <AvatarInitials name={partnerDisplayName} size={36} />
                <div className="chat-header-info">
                    <h3 className="chat-header-name">{partnerDisplayName}</h3>
                    {partnerSub && <span className="chat-header-sub">{partnerSub}</span>}
                </div>
                {partnerIsTyping && <div className="chat-header-typing">écrit…</div>}
            </div>

            <div className="chat-messages">
                {isLoadingMessages ? (
                    <div className="loading-container"><div className="loading-spinner" /></div>
                ) : messages.length === 0 ? (
                    <div className="chat-start-hint">
                        <AvatarInitials name={partnerDisplayName} size={52} />
                        <p>Démarrez la conversation avec <strong>{partnerDisplayName}</strong></p>
                    </div>
                ) : (
                    messages.map(message => {
                        const isMine = (message.senderId || message.sender_id) === currentUser?.id;
                        return (
                            <div key={message.id} className={`message-bubble-wrapper ${isMine ? 'message-mine' : 'message-theirs'}`}>
                                <div className={`message-bubble ${isMine ? 'message-bubble-mine' : 'message-bubble-theirs'}`}>
                                    <p className="message-text">{message.content}</p>
                                    <span className="message-time">{formatTime(message.createdAt || message.created_at)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                {partnerIsTyping && (
                    <div className="message-bubble-wrapper message-theirs">
                        <div className="message-bubble message-bubble-theirs typing-bubble">
                            <TypingDots />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                value={inputValue}
                onChange={handleInputChange}
                onSend={handleSendMessage}
                onKeyDown={handleKeyDown}
                disabled={isSending}
            />
        </>
    );

    return (
        <div className="messages-page">
            {/* Desktop */}
            <div className="messages-layout-desktop">
                <div className="conversations-panel">
                    <ConversationsList {...conversationsListProps} />
                </div>
                <div className="chat-panel">{chatContent}</div>
            </div>

            {/* Mobile */}
            <div className="messages-layout-mobile">
                <div className={`mobile-panel ${mobileView === 'list' ? 'mobile-panel-visible' : 'mobile-panel-hidden'}`}>
                    <div className="conversations-panel" style={{ height: '100%', borderRight: 'none' }}>
                        <ConversationsList {...conversationsListProps} />
                    </div>
                </div>
                <div className={`mobile-panel ${mobileView === 'chat' ? 'mobile-panel-visible' : 'mobile-panel-hidden'}`}>
                    <div className="chat-panel" style={{ height: '100%' }}>{chatContent}</div>
                </div>
            </div>
        </div>
    );
}
