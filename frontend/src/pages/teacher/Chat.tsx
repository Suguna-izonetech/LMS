import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, User, Search, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { teacherApi } from '../../api/teacher';

export const Chat: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // New Chat Creator States
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = async () => {
    try {
      const res = await teacherApi.getConversations();
      setConversations(res);
      if (res.length > 0 && activeConvId === null) {
        handleSelectConversation(res[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (convId: number) => {
    try {
      setActiveConvId(convId);
      const history = await teacherApi.getMessages(convId);
      setMessages(history);
    } catch (err) {
      toast.error('Failed to load message thread.');
    }
  };

  useEffect(() => {
    loadConversations();
    // Poll messages every 4 seconds for live update emulation
    const interval = setInterval(() => {
      if (activeConvId) {
        teacherApi.getMessages(activeConvId).then(setMessages).catch(console.error);
      }
      teacherApi.getConversations().then(setConversations).catch(console.error);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;

    try {
      await teacherApi.sendMessage(activeConvId, newMessage.trim());
      // Instantly load new messages
      const updated = await teacherApi.getMessages(activeConvId);
      setMessages(updated);
      setNewMessage('');
      loadConversations();
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  const handleOpenNewChat = async () => {
    try {
      setShowNewChatModal(true);
      const res = await teacherApi.getChatContacts();
      setContacts(res);
    } catch (err) {
      toast.error('Failed to load contacts list.');
    }
  };

  const handleCreateChat = async (participantId: number) => {
    try {
      const res = await teacherApi.initConversation(participantId);
      toast.success('Chat conversation created!');
      setShowNewChatModal(false);
      loadConversations();
      handleSelectConversation(res.conversation_id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to initiate conversation.');
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading secure inbox...</p>
      </div>
    );
  }

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex border border-slate-900 rounded-xl overflow-hidden bg-slate-950 relative">
      {/* Contact List */}
      <div className="w-80 border-r border-slate-900 flex flex-col bg-slate-950/40">
        <div className="p-4 border-b border-slate-900 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-100">Messages</h2>
            <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Direct Inbox</p>
          </div>
          <Button 
            onClick={handleOpenNewChat}
            size="sm"
            className="p-2 bg-violet-650 hover:bg-violet-550 shrink-0 rounded-lg cursor-pointer"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => {
            const isUnread = conv.unread_count > 0;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer
                  ${activeConvId === conv.id ? 'bg-violet-950/30 border border-violet-900/50' : 'hover:bg-slate-900/40 border border-transparent'}
                `}
              >
                <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-350 font-bold shrink-0">
                  {conv.partner_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">{conv.partner_name}</span>
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-violet-500 shadow-sm shadow-violet-500 shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-450 truncate mt-1">
                    {conv.latest_message || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-900 flex items-center gap-3 bg-slate-950/40">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold">
                {activeConv.partner_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">{activeConv.partner_name}</h3>
                <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Active Chat</p>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-650 text-xs py-8">No messages recorded. Send a greeting to start chatting.</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%] space-y-1">
                        <div
                          className={`
                            p-3 rounded-2xl text-xs font-medium leading-relaxed
                            ${isMe ? 'bg-violet-650 text-slate-100 rounded-tr-none' : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none'}
                          `}
                        >
                          {msg.message_text}
                        </div>
                        <p className={`text-[9px] text-slate-600 font-bold uppercase tracking-wider ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-900 flex gap-2">
              <input
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 font-medium"
                placeholder="Type a message to send..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button type="submit" className="bg-violet-650 hover:bg-violet-550 cursor-pointer p-2.5 rounded-xl shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare className="h-10 w-10 text-slate-650 mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Select a message conversation</p>
          </div>
        )}
      </div>

      {/* NEW CHAT MODAL OVERLAY */}
      {showNewChatModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full border border-slate-850">
            <div className="p-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-200">Start New Chat</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNewChatModal(false)} className="p-1 hover:bg-slate-800">
                <Plus className="h-4 w-4 rotate-45" />
              </Button>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredContacts.map(c => (
                  <button
                    key={`${c.role}-${c.id}`}
                    onClick={() => handleCreateChat(c.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900/60 text-left transition-colors cursor-pointer border border-transparent"
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-350">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default Chat;
