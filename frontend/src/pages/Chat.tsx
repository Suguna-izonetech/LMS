import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Phone, Video, CheckCheck } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import {
  PageHeader,
  Breadcrumb,
  Button,
  Input
} from '../components/ui';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  contactName: string;
  contactAvatar: string;
  online: boolean;
  messages: ChatMessage[];
}

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { users, messages, sendMessage } = useMockDb();

  const [searchContact, setSearchContact] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute conversations dynamically from users & messages
  const chatPartners = users.filter(u => u.role !== 'Admin');
  
  const conversations: ChatConversation[] = chatPartners.map(user => {
    const userMessages: ChatMessage[] = messages
      .filter(m => (m.senderId === 'u1' && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === 'u1'))
      .map(m => ({
        id: m.id,
        text: m.text,
        sender: m.senderId === 'u1' ? 'me' : 'them',
        timestamp: m.timestamp
      }));

    return {
      id: user.id,
      contactName: user.name,
      contactAvatar: user.role === 'Teacher'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      online: user.status === 'Active',
      messages: userMessages
    };
  });

  // Filter conversations based on search
  const filteredConversations = conversations.filter((c: ChatConversation) =>
    c.contactName.toLowerCase().includes(searchContact.toLowerCase())
  );

  // Active conversation pointer
  const activeId = conversationId || (conversations[0]?.id ?? '');
  const activeConversation = conversations.find((c: ChatConversation) => c.id === activeId);

  // Auto scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeId) return;

    sendMessage(activeId, typedMessage);
    setTypedMessage('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="1:1 Direct Chat Messaging"
        description="Exchange direct messages with students and staff members in real-time."
        breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Direct Chat' }]} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[580px]">
        
        {/* Left Column: Chat Contacts list */}
        <div className="lg:col-span-1 bg-slate-950 border border-slate-850 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-850">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search active users..."
                value={searchContact}
                onChange={e => setSearchContact(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-550 italic font-semibold">No active contacts found.</div>
            ) : (
              filteredConversations.map((c: ChatConversation) => {
                const isActive = c.id === activeId;
                const lastMsg = c.messages[c.messages.length - 1];
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/social-connect/chat/${c.id}`)}
                    className={`w-full text-left p-3.5 flex items-start gap-3.5 transition-colors cursor-pointer ${isActive ? 'bg-indigo-600/10 border-r-2 border-indigo-500' : 'hover:bg-slate-900/60'}`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={c.contactAvatar}
                        alt={c.contactName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-800"
                      />
                      {c.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 leading-tight space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-200 truncate">{c.contactName}</span>
                        <span className="text-[9px] text-slate-550 font-bold shrink-0">
                          {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-medium">
                        {lastMsg ? lastMsg.text : 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Message History and Input bar */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-850 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
          {activeConversation ? (
            <>
              {/* Chat Window Header */}
              <div className="p-3.5 border-b border-slate-850 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeConversation.contactAvatar}
                    alt={activeConversation.contactName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-800"
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-slate-200">{activeConversation.contactName}</span>
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeConversation.online ? 'bg-emerald-500' : 'bg-slate-600'} inline-block`} />
                      {activeConversation.online ? 'Active Now' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="h-8 w-8 !p-0 flex items-center justify-center" title="Call User">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button variant="secondary" size="sm" className="h-8 w-8 !p-0 flex items-center justify-center" title="Video Call">
                    <Video className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </div>
              </div>

              {/* Message History list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-955">
                {activeConversation.messages.map((msg: ChatMessage) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${isMe ? 'bg-indigo-600 text-slate-100 rounded-br-none' : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-850'}`}
                      >
                        <p>{msg.text}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] text-slate-400 font-bold">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck className="h-3 w-3 text-indigo-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-850 bg-slate-950 flex gap-2">
                <Input
                  value={typedMessage}
                  onChange={e => setTypedMessage(e.target.value)}
                  placeholder={`Send direct message to ${activeConversation.contactName}...`}
                  className="flex-1 text-xs"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!typedMessage.trim()}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-600">
                <MessageCircle className="h-8 w-8" />
              </div>
              <span className="text-xs font-bold text-slate-300">Select a Conversation</span>
              <p className="text-[11px] text-slate-500 max-w-[240px]">Pick an active contact from the list on the left to start a discussion thread.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
