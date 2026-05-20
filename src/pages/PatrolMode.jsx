import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentPosition, watchPosition, clearWatch } from '../utils/geolocation';
import { showToast, timeAgo } from '../utils/helpers';

// Simulated patrol group data
const MOCK_PATROL_GROUPS = [
  {
    id: '1',
    name: 'Mahikeng Central Patrol',
    area: 'Central Business District',
    members: 12,
    activePatrollers: 3,
    is_active: true,
  },
  {
    id: '2',
    name: 'Riviera Park Watch',
    area: 'Riviera Park Extension',
    members: 8,
    activePatrollers: 0,
    is_active: true,
  },
  {
    id: '3',
    name: 'Montshiwa Safety Forum',
    area: 'Montshiwa Township',
    members: 15,
    activePatrollers: 5,
    is_active: true,
  },
];

// Simulated chat messages
const MOCK_MESSAGES = [
  { id: 1, user: 'Eagle Eye', message: 'All clear on Station Road', time: '2 min ago', type: 'text' },
  { id: 2, user: 'Swift Guardian', message: 'Suspicious vehicle near church parking', time: '5 min ago', type: 'alert' },
  { id: 3, user: 'Brave Sentinel', message: 'Heading to First Avenue now', time: '8 min ago', type: 'text' },
  { id: 4, user: 'Watchful Keeper', message: 'Streetlight out on Buffalo Road - noted for report', time: '12 min ago', type: 'text' },
  { id: 5, user: 'Eagle Eye', message: 'Meeting point at community hall at 20:00', time: '15 min ago', type: 'text' },
];

// Simulated patroller locations
const MOCK_PATROLLERS = [
  { id: 1, name: 'Eagle Eye', lat: -25.8650, lng: 25.6440, lastSeen: '1 min ago' },
  { id: 2, name: 'Swift Guardian', lat: -25.8660, lng: 25.6450, lastSeen: '2 min ago' },
  { id: 3, name: 'Brave Sentinel', lat: -25.8640, lng: 25.6430, lastSeen: 'Just now' },
];

export default function PatrolMode() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('groups'); // 'groups', 'active', 'chat'
  const [groups, setGroups] = useState(MOCK_PATROL_GROUPS);
  const [activePatrol, setActivePatrol] = useState(null);
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [patrollers, setPatrollers] = useState(MOCK_PATROLLERS);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [showRegistrationGuide, setShowRegistrationGuide] = useState(false);
  const watchIdRef = useRef(null);
  const chatEndRef = useRef(null);

  // Start patrol
  const startPatrol = useCallback((group) => {
    setActivePatrol(group);
    setIsPatrolling(true);
    setActiveView('active');

    // Start location tracking
    watchIdRef.current = watchPosition(
      (pos) => setMyLocation(pos),
      (err) => console.error('Location watch error:', err),
      { enableHighAccuracy: true }
    );

    showToast?.('Patrol started. Your location is being shared with the group.', 'success');
  }, []);

  // Stop patrol
  const stopPatrol = useCallback(() => {
    if (watchIdRef.current) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsPatrolling(false);
    setActivePatrol(null);
    setActiveView('groups');
    showToast?.('Patrol ended.', 'info');
  }, []);

  // Send message
  function sendMessage() {
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now(),
      user: user?.displayName || 'You',
      message: newMessage.trim(),
      time: 'Just now',
      type: 'text',
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage('');

    // Scroll to bottom
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        clearWatch(watchIdRef.current);
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
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
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

          {/* Registration Guide */}
          {showRegistrationGuide && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
                <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Register a Patrol Group</h2>
                    <button onClick={() => setShowRegistrationGuide(false)} className="p-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
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
              <svg className="w-4 h-4 text-civic-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
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
                      {msg.time}
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
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
