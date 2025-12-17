import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import ChatLayout from './components/ChatLayout';
import { useChat } from './hooks/useChat';
import DevConsole from './components/DevConsole';
import { Terminal } from 'lucide-react';
import DigiLockerLogin from './components/widgets/DigiLockerLogin';
import AppLoginPage from './components/AppLoginPage';

// --- Authenticated Page Component ---
const AuthenticatedChatPage = () => {
  const { sessionId } = useParams(); // Get ID from URL
  const navigate = useNavigate();

  const {
    messages,
    activeAgent,
    agentStatus,
    activeWidget,
    suggestions,
    sendMessage,
    onWidgetAction,
    createNewSession,
    sessions,
    deleteSession,
    stopGeneration // Destructure new function
  } = useChat(sessionId, navigate);

  const [showConsole, setShowConsole] = useState(false);

  return (
    <>
      <ChatLayout
        messages={messages}
        activeAgent={activeAgent}
        agentStatus={agentStatus}
        activeWidget={activeWidget}
        suggestions={suggestions}
        onSendMessage={sendMessage}
        stopGeneration={stopGeneration} // Pass to Layout
        onWidgetAction={onWidgetAction}
        onNewChat={() => createNewSession(navigate)}
        currentSessionId={sessionId}
        sessions={sessions} // Already an array from hook
        onSelectSession={(s) => navigate(`/chat/${s.sessionId}`)}
        onDeleteSession={deleteSession}
      />

      {/* Dev Console Toggle */}
      <button
        onClick={() => setShowConsole(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-slate-900 text-emerald-400 rounded-full shadow-lg hover:scale-110 transition-transform border border-slate-700"
        title="Open Neural Logs"
      >
        <Terminal size={20} />
      </button>

      {showConsole && <DevConsole onClose={() => setShowConsole(false)} />}
    </>
  );
};

function App() {
  // Simple Routing for Popup Window (Outside Router context initially or handled manually)
  if (window.location.pathname === '/digilocker-signin') {
    return (
      <DigiLockerLogin
        isPopup={true}
        onClose={() => window.close()}
        onLoginSuccess={(token) => {
          if (window.opener) {
            window.opener.postMessage({ type: 'DIGILOCKER_LOGIN_SUCCESS', token }, '*');
          }
          window.close();
        }}
      />
    );
  }

  // --- Main App Logic ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('app_authenticated') === 'true');

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('app_authenticated', 'true');
    } else {
      localStorage.removeItem('app_authenticated');
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <>
            <Route path="/" element={<AuthenticatedChatPage />} />
            <Route path="/chat/:sessionId" element={<AuthenticatedChatPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<AppLoginPage onLogin={() => setIsAuthenticated(true)} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
