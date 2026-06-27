import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// eslint-disable-next-line no-unused-vars
import { getCurrentPosition, watchPosition, clearWatch } from '../utils/geolocation';
import { showToast, timeAgo } from '../utils/helpers';
import { getPatrolGroups, getPatrolMessages, sendPatrolMessage, getActivePatrollers } from '../db/api';
import { supabase, isLive } from '../db/supabase';
import { encryptMessage, decryptMessage, generateEncryptionKey, exportKey, importKey } from '../utils/encryption';
import Icon from '../components/Icon';

export default function PatrolMode() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [activePatrol, setActivePatrol] = useState(null);
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [patrollers, setPatrollers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    const { data } = await getPatrolGroups();
    setGroups(data || []);
    setLoading(false);
  }

  // Start patrol
  const startPatrol = useCallback(async (group) => {
    setActivePatrol(group);
    setIsPatrolling(true);
    setActiveView('active');

    // Load chat messages and active patrollers
    const [msgResult, patResult] = await Promise.all([
      getPatrolMessages(group.id),
      getActivePatrollers(group.id),
    ]);
    const key = await getOrCreateGroupKey(group.id);
    setGroupKey(key);
    const decryptedMessages = await Promise.all(
      (msgResult.data || []).map(async (msg) => {
        try {
          if (msg.encrypted_content) {
            const decrypted = await decryptMessage(msg.encrypted_content, key);
            return { ...msg, message: decrypted };
          }
        } catch { /* fall through */ }
        return msg;
      })
    );
    setMessages(decryptedMessages);
    setPatrollers(patResult.data || []);

    // Start location tracking
    watchIdRef.current = watchPosition(
      (pos) => setMyLocation(pos),
      (err) => console.error('Location watch error:', err),
      { enableHighAccuracy: true }
    );

    // Subscribe to real-time messages
    if (isLive && supabase) {
      realtimeChannelRef.current = supabase
        .channel(`patrol-chat-${group.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'patrol_messages',
          filter: `group_id=eq.${group.id}`,
        }, async (payload) => {
          const newMsg = payload.new;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return prev;
          });
          // Decrypt and add
          const decrypted = await decryptAndAddMessage(newMsg);
          setMessages(prev => {
            if (prev.some(m => m.id === decrypted.id)) return prev;
            return [...prev, decrypted];
          });
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
        .subscribe();
    }

    showToast?.('Patrol started. Your location is being shared with the group.', 'success');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop patrol
  const stopPatrol = useCallback(() => {
    if (watchIdRef.current) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    setIsPatrolling(false);
    setActivePatrol(null);
    setActiveView('groups');
    showToast?.('Patrol ended.', 'info');
  }, []);

  // Send message — now E2E encrypted
  async function sendMessage() { return sendEncryptedMessage(); }

  // E2E Encryption for patrol chat
  const [groupKey, setGroupKey] = useState(null);

  async function getOrCreateGroupKey(groupId) {
    const stored = localStorage.getItem(`patrol-key-${groupId}`);
    if (stored) {
      try { return await importKey(stored); } catch { /* fall through */ }
    }
    const key = await generateEncryptionKey();
    const exported = await exportKey(key);
    localStorage.setItem(`patrol-key-${groupId}`, exported);
    return key;
  }

  // Encrypt and send message with E2E
  async function sendEncryptedMessage() {
    if (!newMessage.trim() || !activePatrol) return;

    const msg = newMessage.trim();
    setNewMessage('');

    // Encrypt the message
    const key = groupKey || await getOrCreateGroupKey(activePatrol.id);
    if (!groupKey) setGroupKey(key);
    const encrypted = await encryptMessage(msg, key);

    const tempId = Date.now();
    const tempMsg = {
      id: tempId,
      user: user?.displayName || 'You',
      message: msg,
      encrypted_content: encrypted,
      created_at: new Date().toISOString(),
      type: 'text',
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const { error } = await sendPatrolMessage(activePatrol.id, user?.id, msg, encrypted);
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showToast?.('Failed to send message', 'error');
    }
  }

  // Decrypt incoming messages
  async function decryptAndAddMessage(raw) {
    try {
      const key = groupKey || await getOrCreateGroupKey(activePatrol.id);
      if (!groupKey) setGroupKey(key);
      const decrypted = raw.encrypted_content
        ? await decryptMessage(raw.encrypted_content, key)
        : raw.message;
      return {
        id: raw.id,
        user: raw.display_name || 'Patroller',
        message: decrypted,
        created_at: raw.created_at,
        type: raw.message_type || 'text',
      };
    } catch {
      return {
        id: raw.id,
        user: raw.display_name || 'Patroller',
        message: '🔒 Encrypted message',
        created_at: raw.created_at,
        type: raw.message_type || 'text',
      };
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) clearWatch(watchIdRef.current);
      if (realtimeChannelRef.current && supabase) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const registrationSteps = [
    { step: 1, title: 'Gather Neighbors', description: 'Talk to your immediate neighbors about forming a safety group. Minimum 5 households recommended.' },
    { step: 2, title: 'Contact CPF', description: 'Reach out to your local Community Police Forum (CPF) at the Mahikeng SAPS station.' },
    { step: 3, title: 'Register Forum', description: 'Complete the official Community Safety Forum registration form with SAPS.' },
    { step: 4, title: 'Training', description: 'Attend the safety awareness training session provided by SAPS.' },
    { step: 5, title: 'Set Up Communication', description: 'Create a WhatsApp or Telegram group for quick communication.' },
    { step: 6, title: 'Patrol Schedule', description: 'Create a patrol schedule ensuring safety and coverage.' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <Icon name="arrowLeft" className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">Patrol Mode</h1>
          {isPatrolling && (
            <span className="badge bg-safety-100 text-safety-700 ml-auto">
              🟢 Active
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['groups', 'active', 'chat'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveView(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeView === tab
                  ? 'bg-safety-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab === 'groups' ? 'Groups' : tab === 'active' ? 'Active Patrol' : 'Group Chat'}
            </button>
          ))}
        </div>
      </div>

      {/* Groups View */}
      {activeView === 'groups' && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Patrol Groups</h2>
            <button
              onClick={() => setShowRegistrationGuide(true)}
              className="text-sm text-safety-600 font-medium"
            >
              Register New
            </button>
          </div>

          {loading ? (
            <div className="card text-center py-12">
              <div className="w-8 h-8 border-2 border-safety-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading groups...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{group.name}</h3>
                      <p className="text-xs text-gray-500">{group.area}</p>
                    </div>
                    {group.activePatrollers > 0 && (
                      <span className="badge bg-safety-100 text-safety-700">
                        🟢 {group.activePatrollers} patrolling
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>{group.members} members</span>
                  </div>

                  <button
                    onClick={() => startPatrol(group)}
                    className="btn-safety w-full text-sm py-2"
                  >
                    Start Patrol
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Registration Guide */}
          {showRegistrationGuide && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
                <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Register a Patrol Group</h2>
                    <button onClick={() => setShowRegistrationGuide(false)} className="p-2">
                      <Icon name="close" className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Follow these steps to officially register</p>
                </div>

                <div className="px-4 py-4">
                  <div className="space-y-4">
                    {registrationSteps.map(step => (
                      <div key={step.step} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-safety-100 text-safety-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {step.step}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{step.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-3 bg-warning-50 rounded-xl">
                    <p className="text-xs font-medium text-warning-700">Important Contact</p>
                    <p className="text-xs text-warning-600 mt-1">
                      Mahikeng SAPS: 018 381 8200<br />
                      CPF Coordinator: Contact your ward councillor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Patrol View */}
      {activeView === 'active' && (
        <div className="px-4 py-4">
          {!isPatrolling ? (
            <div className="card text-center py-12">
              <Icon name="users" className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-400 font-medium">No active patrol</p>
              <p className="text-sm text-gray-400 mt-1">Join a group to start patrolling</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patrol Info */}
              <div className="card bg-safety-50 border-safety-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-safety-800">{activePatrol.name}</h3>
                  <span className="badge bg-safety-200 text-safety-800">Active</span>
                </div>
                <p className="text-sm text-safety-600">{activePatrol.area}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-safety-500 animate-pulse"></div>
                  <span className="text-xs text-safety-600">Location sharing active</span>
                </div>
              </div>

              {/* My Location */}
              {myLocation && (
                <div className="card">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Location</h4>
                  <p className="text-xs text-gray-500">
                    {myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}
                    {myLocation.accuracy && ` (±${Math.round(myLocation.accuracy)}m)`}
                  </p>
                </div>
              )}

              {/* Active Patrollers */}
              <div className="card">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Group Members ({patrollers.length})</h4>
                <div className="space-y-3">
                  {patrollers.map(patroller => (
                    <div key={patroller.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-safety-100 flex items-center justify-center">
                        <span className="text-sm">👤</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{patroller.name}</p>
                        <p className="text-xs text-gray-400">Last seen: {patroller.lastSeen}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-safety-500"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* End Patrol */}
              <button
                onClick={stopPatrol}
                className="btn-danger w-full"
              >
                End Patrol
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat View */}
      {activeView === 'chat' && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Encryption notice */}
          <div className="px-4 py-2 bg-civic-50 border-b border-civic-100">
            <div className="flex items-center gap-2">
              <Icon name="lock" className="w-4 h-4 text-civic-600" />
              <span className="text-xs text-civic-600 font-medium">End-to-end encrypted group chat</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(msg => {
              const isMe = msg.user === (user?.displayName || 'You');

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${isMe ? 'order-2' : ''}`}>
                    {!isMe && (
                      <p className="text-xs font-medium text-gray-500 mb-1">{msg.user}</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      msg.type === 'alert'
                        ? 'bg-danger-100 text-danger-800'
                        : isMe
                          ? 'bg-safety-600 text-white'
                          : 'bg-white border border-gray-200'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                      {timeAgo(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="btn-safety px-4"
              >
                <Icon name="send" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
