import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, Clock, User, Check, CheckCheck } from 'lucide-react';
import api from '../api/client';
import {
  PageHeader,
  Breadcrumb,
  Card,
  Input,
  Button,
  LoadingState,
  ErrorState,
  Badge
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ChatUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'error'>('loading');
  const [messageInput, setMessageInput] = useState('');
  
  const [userSearch, setUserSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchInitialData = async () => {
      setUiState('loading');
      try {
          const [convRes, userRes] = await Promise.all([
              api.get('/institute-admin/social/chat/conversations'),
              api.get('/institute-admin/social/chat/users')
          ]);
          setConversations(convRes.data);
          setUsers(userRes.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load chat data");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchInitialData();
  }, []);
  
  const loadMessages = async (convId: number) => {
      try {
          const res = await api.get(`/institute-admin/social/chat/conversations/${convId}/messages`);
          setMessages(res.data);
          // Mark as read
          await api.put(`/institute-admin/social/chat/messages/${convId}/read`);
          
          // Update local unread count
          setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
          
          setTimeout(() => {
             messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      } catch (e) {
          console.error("Failed to load messages", e);
          showError("Failed to load messages");
      }
  };

  const selectConversation = (conv: Conversation) => {
      setActiveConvId(conv.id);
      const u = users.find(x => x.id === conv.other_user_id);
      if (u) setSelectedUser(u);
      else setSelectedUser({ id: conv.other_user_id, name: conv.other_user_name, email: '', role: 'User' });
      
      loadMessages(conv.id);
  };
  
  const selectUserToChat = (u: ChatUser) => {
      // Check if conversation exists
      const existing = conversations.find(c => c.other_user_id === u.id);
      if (existing) {
          selectConversation(existing);
      } else {
          setActiveConvId(null);
          setSelectedUser(u);
          setMessages([]);
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim() || !selectedUser) return;
      
      try {
          const res = await api.post('/institute-admin/social/chat/messages', {
              content: messageInput,
              receiver_id: selectedUser.id
          });
          
          setMessageInput('');
          setMessages(prev => [...prev, res.data]);
          
          if (!activeConvId) {
              setActiveConvId(res.data.conversation_id);
              // Refresh conversations list to show new conversation
              const convRes = await api.get('/institute-admin/social/chat/conversations');
              setConversations(convRes.data);
          } else {
              // Update last message locally
              setConversations(prev => prev.map(c => c.id === activeConvId ? { 
                  ...c, 
                  last_message: res.data.content,
                  last_message_at: res.data.created_at
              } : c));
          }
          
          setTimeout(() => {
             messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      } catch (e) {
          console.error("Failed to send message", e);
          showError("Failed to send message");
      }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Chat" description="Direct messaging." breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Chat' }]} />} />
        <LoadingState message="Loading messages..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Chat" description="Direct messaging." breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Chat' }]} />} />
        <ErrorState title="Failed to load chat" message="Could not fetch data from the server." onRetry={fetchInitialData} />
      </div>
    );
  }
  
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <PageHeader
          title="Direct Messaging"
          description="Communicate privately with teachers, admins, and students."
          breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Chat' }]} />}
        />
      </div>

      <Card className="flex-1 flex overflow-hidden">
          {/* LEFT SIDEBAR - CONVERSATIONS & USERS */}
          <div className="w-1/3 border-r border-slate-800 bg-slate-900/50 flex flex-col h-full">
              <div className="p-4 border-b border-slate-800">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 bg-slate-950" />
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                  {userSearch ? (
                      <div className="p-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">Users Directory</p>
                          {filteredUsers.length === 0 && <p className="text-sm text-slate-500 px-2">No users found.</p>}
                          {filteredUsers.map(u => (
                              <button key={`user-${u.id}`} onClick={() => selectUserToChat(u)} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedUser?.id === u.id ? 'bg-indigo-500/20' : 'hover:bg-slate-800'}`}>
                                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold uppercase shrink-0">
                                      {u.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-200 truncate">{u.name}</p>
                                      <p className="text-xs text-slate-500 truncate">{u.role}</p>
                                  </div>
                              </button>
                          ))}
                      </div>
                  ) : (
                      <div className="p-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">Recent Conversations</p>
                          {conversations.length === 0 && <p className="text-sm text-slate-500 px-2">No active conversations.</p>}
                          {conversations.map(c => (
                              <button key={`conv-${c.id}`} onClick={() => selectConversation(c)} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${activeConvId === c.id ? 'bg-indigo-500/20' : 'hover:bg-slate-800'}`}>
                                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase shrink-0">
                                      {c.other_user_name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-baseline mb-1">
                                          <p className="text-sm font-semibold text-slate-200 truncate">{c.other_user_name}</p>
                                          {c.last_message_at && (
                                              <span className="text-[10px] text-slate-500 shrink-0">
                                                  {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                          )}
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <p className="text-xs text-slate-400 truncate pr-2">{c.last_message || 'Start chatting...'}</p>
                                          {c.unread_count > 0 && (
                                              <Badge variant="info" className="h-5 min-w-[20px] flex items-center justify-center p-0 px-1.5 text-[10px]">
                                                  {c.unread_count}
                                              </Badge>
                                          )}
                                      </div>
                                  </div>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          </div>
          
          {/* RIGHT CHAT WINDOW */}
          <div className="flex-1 flex flex-col h-full bg-slate-900">
              {selectedUser ? (
                  <>
                      {/* CHAT HEADER */}
                      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase">
                              {selectedUser.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="text-sm font-bold text-slate-200">{selectedUser.name}</h3>
                              <p className="text-xs text-slate-500">{selectedUser.role}</p>
                          </div>
                      </div>
                      
                      {/* MESSAGES AREA */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {messages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                  <MessageSquare className="w-12 h-12 mb-4 text-slate-700" />
                                  <p className="text-sm">Say hello to {selectedUser.name}</p>
                              </div>
                          ) : (
                              messages.map((m, idx) => {
                                  const isMe = m.sender_id === user?.id;
                                  return (
                                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                                              <p className="text-sm break-words whitespace-pre-wrap">{m.content}</p>
                                              <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                  <span className="text-[9px]">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                  {isMe && (
                                                      m.is_read ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Check className="w-3 h-3 text-indigo-300" />
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })
                          )}
                          <div ref={messagesEndRef} />
                      </div>
                      
                      {/* COMPOSER */}
                      <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                              <Input 
                                  value={messageInput} 
                                  onChange={e => setMessageInput(e.target.value)} 
                                  placeholder="Type your message..." 
                                  className="flex-1 bg-slate-950"
                                  autoFocus
                              />
                              <Button variant="primary" type="submit" disabled={!messageInput.trim()} className="shrink-0 px-4">
                                  <Send className="w-4 h-4" />
                              </Button>
                          </form>
                      </div>
                  </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                      <MessageSquare className="w-16 h-16 mb-4 text-slate-700" />
                      <h3 className="text-lg font-semibold text-slate-400 mb-1">Your Messages</h3>
                      <p className="text-sm">Select a user or conversation to start chatting.</p>
                  </div>
              )}
          </div>
      </Card>

    </div>
  );
};

export default ChatList;
