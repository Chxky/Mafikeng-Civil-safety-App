import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { processSMSReport, getSMSReports } from '../db/api';
import { showToast, timeAgo } from '../utils/helpers';
import Icon from '../components/Icon';

// USSD Menu Structure
const USSD_MENUS = {
  main: {
    text: 'Welcome to Mahikeng Civic Safety\n\n1. Report an Issue\n2. Check Report Status\n3. Emergency SOS\n4. Safety Alerts\n5. Help\n\nReply with number:',
    options: {
      '1': 'report',
      '2': 'status',
      '3': 'sos',
      '4': 'alerts',
      '5': 'help',
    },
  },
  report: {
    text: 'Report an Issue\n\n1. Pothole\n2. Water Leak\n3. Sewage\n4. Streetlight\n5. Electricity\n6. Illegal Dumping\n7. Other\n\n0. Back\n\nReply with number:',
    options: {
      '1': 'report_pothole',
      '2': 'report_water',
      '3': 'report_sewage',
      '4': 'report_light',
      '5': 'report_electricity',
      '6': 'report_dumping',
      '7': 'report_other',
      '0': 'main',
    },
  },
  report_pothole: {
    text: 'POTHOLE REPORT\n\nPlease describe the location:\n(Example: "Big pothole on Station Road near Shoprite")\n\nType your description and send:',
    isInput: true,
    category: 'pothole',
    next: 'report_confirm',
  },
  report_water: {
    text: 'WATER LEAK REPORT\n\nPlease describe the location:\n(Example: "Water pipe burst at 45 Church Street")\n\nType your description and send:',
    isInput: true,
    category: 'water_leak',
    next: 'report_confirm',
  },
  report_sewage: {
    text: 'SEWAGE REPORT\n\nPlease describe the location:\n(Example: "Sewage overflow near school on Buffalo Road")\n\nType your description and send:',
    isInput: true,
    category: 'sewage',
    next: 'report_confirm',
  },
  report_light: {
    text: 'STREETLIGHT REPORT\n\nPlease describe the location:\n(Example: "Streetlight not working on First Avenue")\n\nType your description and send:',
    isInput: true,
    category: 'streetlight',
    next: 'report_confirm',
  },
  report_electricity: {
    text: 'ELECTRICITY REPORT\n\nPlease describe the issue:\n(Example: "Power outage in Riviera Park for 2 days")\n\nType your description and send:',
    isInput: true,
    category: 'electricity',
    next: 'report_confirm',
  },
  report_dumping: {
    text: 'ILLEGAL DUMPING REPORT\n\nPlease describe the location:\n(Example: "Construction waste dumped on vacant lot on Temba Road")\n\nType your description and send:',
    isInput: true,
    category: 'illegal_dumping',
    next: 'report_confirm',
  },
  report_other: {
    text: 'OTHER ISSUE REPORT\n\nPlease describe the issue and location:\n(Example: "Housing project stalled in Montshiwa")\n\nType your description and send:',
    isInput: true,
    category: 'other',
    next: 'report_confirm',
  },
  report_confirm: {
    text: 'Report submitted successfully!\n\nYour report ID is: {reportId}\n\nYou will receive SMS updates on progress.\n\n0. Back to main menu',
    options: { '0': 'main' },
  },
  status: {
    text: 'Check Report Status\n\nEnter your Report ID:\n(Example: "abc123")\n\n0. Back',
    isInput: true,
    next: 'status_result',
  },
  status_result: {
    text: 'Report Status:\n\nID: {reportId}\nStatus: {status}\nCategory: {category}\n\n0. Back to main menu',
    options: { '0': 'main' },
  },
  sos: {
    text: 'EMERGENCY SOS\n\nYour location has been shared.\nEmergency contacts are being notified.\n\nIf in immediate danger, call:\n- Police: 10111\n- Ambulance: 10177\n- Fire: 10177\n\n0. Back to main menu',
    options: { '0': 'main' },
  },
  alerts: {
    text: 'Recent Safety Alerts in Mahikeng:\n\n• Suspicious activity reported near CBD\n• Break-in attempt on Church Street\n• Streetlight outage on Buffalo Road\n\nFor details, use the smartphone app.\n\n0. Back to main menu',
    options: { '0': 'main' },
  },
  help: {
    text: 'Mahikeng Civic Safety USSD\n\nThis service works without data or smartphone.\n\nTo report via SMS:\nSend: #REPORT [description] at [address]\nExample: #REPORT water leak at 45 Church St\n\nFor emergency:\nSend: #SOS\n\n0. Back to main menu',
    options: { '0': 'main' },
  },
};

export default function USSDBot() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('ussd'); // 'ussd' or 'sms'
  const [currentMenu, setCurrentMenu] = useState('main');
  const [ussdHistory, setUssdHistory] = useState([]);
  const [ussdInput, setUssdInput] = useState('');
  const [smsInput, setSmsInput] = useState('');
  const [smsHistory, setSmsHistory] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [pendingCategory, setPendingCategory] = useState(null);
  const [smsReports, setSmsReports] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadSMSReports();
    // Show initial menu
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUssdHistory([{ type: 'system', text: USSD_MENUS.main.text }]);
  }, []);

  async function loadSMSReports() {
    const { data } = await getSMSReports();
    setSmsReports(data || []);
  }

  function handleUSSDInput() {
    if (!ussdInput.trim()) return;

    const menu = USSD_MENUS[currentMenu];

    // Add user input to history
    setUssdHistory(prev => [...prev, { type: 'user', text: ussdInput }]);

    if (menu.isInput) {
      // This is a text input stage
      if (menu.category) {
        // This is a report description
        processReport(menu.category, ussdInput.trim());
      } else if (currentMenu === 'status') {
        // Show mock status
        setUssdHistory(prev => [...prev, {
          type: 'system',
          text: USSD_MENUS.status_result.text
            .replace('{reportId}', ussdInput.trim())
            .replace('{status}', 'In Progress')
            .replace('{category}', 'Infrastructure'),
        }]);
        setCurrentMenu('status_result');
      }
    } else if (menu.options && menu.options[ussdInput.trim()]) {
      const nextMenu = menu.options[ussdInput.trim()];
      setCurrentMenu(nextMenu);

      if (nextMenu === 'sos') {
        handleSOS();
      }

      setUssdHistory(prev => [...prev, {
        type: 'system',
        text: USSD_MENUS[nextMenu].text,
      }]);
    } else {
      setUssdHistory(prev => [...prev, {
        type: 'system',
        text: 'Invalid option. Please try again.\n\n' + menu.text,
      }]);
    }

    setUssdInput('');
    scrollToBottom();
  }

  async function processReport(category, description) {
    const result = await processSMSReport('demo-hash', `#REPORT ${description}`);

    const reportId = result.data?.civic_report_id?.substring(0, 8) || Date.now().toString(36);

    setUssdHistory(prev => [...prev, {
      type: 'system',
      text: USSD_MENUS.report_confirm.text.replace('{reportId}', reportId),
    }]);
    setCurrentMenu('report_confirm');
    loadSMSReports();
  }

  function handleSOS() {
    console.log('[USSD] SOS triggered');
    showToast?.('SOS alert sent via USSD', 'success');
  }

  async function handleSMSSubmit() {
    if (!smsInput.trim()) return;

    setSmsHistory(prev => [...prev, { type: 'user', text: smsInput }]);

    const result = await processSMSReport('demo-hash', smsInput.trim());

    if (result.data?.processed) {
      if (smsInput.trim().toUpperCase().startsWith('#SOS')) {
        setSmsHistory(prev => [...prev, {
          type: 'system',
          text: 'SOS received! Emergency contacts and local security have been notified with your location. If in immediate danger, call 10111.',
        }]);
      } else {
        setSmsHistory(prev => [...prev, {
          type: 'system',
          text: `Report received! Category: ${result.data.parsed_category || 'General'}\nReport ID: ${result.data.civic_report_id?.substring(0, 8) || 'N/A'}\nYou will receive SMS updates.`,
        }]);
      }
    } else {
      setSmsHistory(prev => [...prev, {
        type: 'system',
        text: 'Invalid format. Use:\n#REPORT [description] at [address]\nor #SOS for emergency',
      }]);
    }

    setSmsInput('');
    loadSMSReports();
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <Icon name="arrowLeft" className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold">USSD/SMS Bot</h1>
            <p className="text-xs text-gray-500">For feature phones without data</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setMode('ussd')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'ussd' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            USSD Simulator
          </button>
          <button
            onClick={() => setMode('sms')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'sms' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            SMS Bot
          </button>
        </div>
      </div>

      {/* USSD Mode */}
      {mode === 'ussd' && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
          {/* USSD Screen */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="bg-gray-900 rounded-2xl p-4 min-h-[300px]">
              {/* USSD Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
                <span className="text-xs text-gray-400">*123#</span>
                <span className="text-xs text-gray-400">Mahikeng Civic</span>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                {ussdHistory.map((msg, i) => (
                  <div key={i} className={`${msg.type === 'user' ? 'text-right' : ''}`}>
                    <pre className={`text-sm whitespace-pre-wrap font-sans ${
                      msg.type === 'user' ? 'text-civic-400' : 'text-green-400'
                    }`}>
                      {msg.text}
                    </pre>
                  </div>
                ))}
              </div>
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* USSD Input */}
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1 text-center text-lg tracking-widest"
                placeholder="Enter number"
                value={ussdInput}
                onChange={(e) => setUssdInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleUSSDInput()}
                maxLength={2}
              />
              <button onClick={handleUSSDInput} className="btn-primary px-6">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Mode */}
      {mode === 'sms' && (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
          {/* Instructions */}
          <div className="px-4 py-3 bg-civic-50 border-b border-civic-100">
            <p className="text-xs font-medium text-civic-700">SMS Format:</p>
            <p className="text-xs text-civic-600 mt-0.5">
              #REPORT [description] at [address] or #SOS for emergency
            </p>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {/* System message */}
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-full px-3 py-1">
                <span className="text-xs text-gray-500">Simulated SMS Bot</span>
              </div>
            </div>

            {smsHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.type === 'user'
                    ? 'bg-civic-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  <pre className="text-sm whitespace-pre-wrap font-sans">{msg.text}</pre>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* SMS Input */}
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="#REPORT pothole at Station Rd"
                value={smsInput}
                onChange={(e) => setSmsInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSMSSubmit()}
              />
              <button onClick={handleSMSSubmit} className="btn-primary px-4">
                Send
              </button>
            </div>
          </div>

          {/* Recent SMS Reports */}
          {smsReports.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 max-h-[150px] overflow-y-auto">
              <p className="text-xs font-medium text-gray-500 mb-2">RECENT SMS REPORTS</p>
              {smsReports.slice(0, 5).map(report => (
                <div key={report.id} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-600 truncate">{report.raw_message}</span>
                  <span className="text-xs text-gray-400 ml-2">{timeAgo(report.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
