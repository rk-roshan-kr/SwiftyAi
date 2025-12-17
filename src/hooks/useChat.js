import { useState, useEffect, useCallback, useRef } from 'react';

const INITIAL_MESSAGES = [
    {
        id: 'welcome',
        text: "Hello! I'm Swifty, your AI Banking Assistant. I can help you with Loans, Accounts, and Payments.",
        sender: 'bot',
        agentType: 'MASTER_AGENT',
        timestamp: new Date().toISOString()
    }
];

export const useChat = (sessionId, navigate) => {
    // Sessions List (Array from Backend)
    const [sessions, setSessions] = useState([]);

    // Current Chat State
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [activeAgent, setActiveAgent] = useState('MASTER_AGENT');
    const [agentStatus, setAgentStatus] = useState('idle');
    const [activeWidget, setActiveWidget] = useState(null);
    const [widgetData, setWidgetData] = useState(null);
    const [suggestions, setSuggestions] = useState(["I need a personal loan", "Check my balance", "Make a payment"]);

    const userMobile = localStorage.getItem('user_mobile') || 'anonymous';

    // 1. Fetch History List for Sidebar
    const fetchHistory = useCallback(async () => {
        if (!userMobile || userMobile === 'anonymous') return;
        try {
            const res = await fetch(`http://localhost:5000/api/chat/history/${encodeURIComponent(userMobile)}`);
            const data = await res.json();
            if (data.success) {
                setSessions(data.history || []);
            }
        } catch (e) {
            console.error("Failed to fetch history", e);
            setSessions([]);
        }
    }, [userMobile]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory, sessionId]);

    // 2. Load Current Session Data
    useEffect(() => {
        console.log(`[useChat] Session ID changed to: ${sessionId}`);
        const loadSession = async () => {
            if (!sessionId) {
                console.log("[useChat] No session ID. Resetting to new.");
                setMessages(INITIAL_MESSAGES);
                setActiveAgent('MASTER_AGENT');
                setActiveWidget(null);
                return;
            }

            try {
                const res = await fetch(`http://localhost:5000/api/chat/session/${sessionId}`);
                const data = await res.json();

                if (data.success && data.chat) {
                    // Extract Active Agent from the last message or DB state
                    const dbActiveAgent = data.chat.activeAgent || 'MASTER_AGENT';
                    setActiveAgent(dbActiveAgent);

                    // Process Messages
                    const validMessages = (data.chat.messages || []).filter(m => m.text && m.text.trim() !== "").map(msg => {
                        let text = msg.text || "";
                        let agentType = msg.agentType || 'MASTER_AGENT';
                        let widget = msg.widget;
                        let filterType = msg.filterType;

                        // Parse Tags if they exist in DB text
                        const agentMatch = text.match(/\|\|AGENT:(.*?)\|\|/);
                        if (agentMatch) agentType = agentMatch[1];

                        const widgetMatch = text.match(/\|\|WIDGET:(.*?)\|\|/);
                        if (widgetMatch) widget = widgetMatch[1];

                        const filterMatch = text.match(/\|\|FILTER:(.*?)\|\|/);
                        if (filterMatch) filterType = filterMatch[1];

                        // Clean Text
                        const cleanText = text
                            .replace(/\|\|AGENT:[\s\S]*?\|\|/g, '')
                            .replace(/\|\|WIDGET:[\s\S]*?\|\|/g, '')
                            .replace(/\|\|FILTER:[\s\S]*?\|\|/g, '');

                        return { ...msg, text: cleanText, agentType, widget, filterType };
                    });

                    setMessages(validMessages.length > 0 ? validMessages : INITIAL_MESSAGES);

                    // Restore Context
                    if (data.chat.activeWidget) setActiveWidget(data.chat.activeWidget);
                    if (data.chat.widgetData) setWidgetData(data.chat.widgetData);

                } else {
                    // Session not found (maybe new?)
                    setMessages(INITIAL_MESSAGES);
                }
            } catch (e) {
                console.error("Load session failed", e);
                setMessages(INITIAL_MESSAGES);
            }
        };

        loadSession();
    }, [sessionId]);

    // 3. Create New Session
    const createNewSession = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: userMobile,
                    title: "New Chat",
                    messages: INITIAL_MESSAGES
                })
            });
            const data = await res.json();
            if (data.success) {
                navigate(`/chat/${data.sessionId}`);
                fetchHistory();
            }
        } catch (e) {
            console.error("Create session failed", e);
        }
    };

    // 4. Delete Session
    const deleteSession = async (idToDelete) => {
        try {
            const res = await fetch(`http://localhost:5000/api/chat/${idToDelete}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setSessions(prev => prev.filter(s => s.sessionId !== idToDelete));
                if (idToDelete === sessionId) {
                    createNewSession();
                }
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const addMessage = (text, sender, agentType = 'MASTER_AGENT') => {
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text,
            sender,
            agentType,
            timestamp: new Date().toISOString()
        }]);
    };

    // --- ABORT CONTROLLER ---
    const abortControllerRef = useRef(null);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setAgentStatus('idle');
        }
    }, []);

    const processUserMessage = async (text) => {
        addMessage(text, 'user');
        setSuggestions([]);
        setActiveWidget(null);
        setAgentStatus('analyzing');

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            // [FIX] Define the variables needed for the fetch body
            const historyPayload = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: historyPayload,
                    mobile: userMobile, // [FIX] Use userMobile state
                    sessionId: sessionId // [FIX] Use sessionId state
                }),
                signal
            });

            const data = await response.json();
            setAgentStatus('idle');

            if (data.success) {
                // HANDLE NEW MULTI-BUBBLE FLOW
                if (data.messages && Array.isArray(data.messages)) {
                    data.messages.forEach((msg, index) => {
                        const delay = index * 800;

                        setTimeout(() => {
                            let cleanText = msg.text || "";
                            let widgetCommand = null;

                            // 1. EXTRACT WIDGETS
                            const widgetMatch = cleanText.match(/\|\|WIDGET:(.*?)\|\|/);
                            if (widgetMatch) {
                                widgetCommand = widgetMatch[1];
                                cleanText = cleanText.replace(/\|\|WIDGET:.*?\|\|/g, '').trim();
                            }

                            // 2. EXTRACT FILTERS
                            const filterMatch = cleanText.match(/\|\|FILTER:(.*?)\|\|/);
                            if (filterMatch) {
                                cleanText = cleanText.replace(/\|\|FILTER:.*?\|\|/g, '').trim();
                            }

                            // 3. CLEAN AGENT TAGS
                            cleanText = cleanText.replace(/\|\|AGENT:.*?\|\|/g, '').trim();

                            // 4. ADD MESSAGE
                            if (cleanText) {
                                addMessage(cleanText, 'bot', msg.agentType || 'MasterAgent');
                            }

                            // 5. UPDATE AGENT STATE
                            if (msg.agentType) {
                                setActiveAgent(msg.agentType);
                            }

                            // 6. TRIGGER WIDGET
                            if (widgetCommand) {
                                console.log(`[useChat] Triggering Widget: ${widgetCommand}`);
                                if (widgetCommand === 'PRODUCT_LIST') {
                                    if (activeWidget) setActiveWidget(null);
                                } else if (widgetCommand === 'CLOSE') {
                                    setActiveWidget(null);
                                } else {
                                    setActiveWidget(widgetCommand);
                                    if (widgetCommand === 'SANCTION_LETTER') {
                                        setSuggestions(["Download PDF", "Email me"]);
                                        // Pass specific data if backend provided it
                                        // (Assuming backend stores it in DB/State, simpler to rely on latest DB fetch for complex data, 
                                        //  but we can check if response had it)
                                    }
                                }
                            }
                        }, delay);
                    });
                }
                else {
                    // LEGACY FALLBACK
                    addMessage(data.response, 'bot');
                }

                // Refresh Sidebar History to show snippet
                setTimeout(() => fetchHistory(), 2000);

            } else {
                throw new Error(data.message || "Backend Error");
            }

        } catch (e) {
            if (e.name === 'AbortError') return;
            console.error(e);
            setAgentStatus('idle');
            addMessage("I'm having trouble connecting. Please try again.", 'bot');
        } finally {
            abortControllerRef.current = null;
        }
    };

    // [FIX] Widget Action now drives the conversation forward via Backend
    const handleWidgetAction = async (action, data) => {
        console.log(`[useChat] Widget Action: ${action}`, data);

        if (action === 'LOAN_CONFIRMED') {
            // Send the user's choice to the bot to trigger Verification Agent
            // Matches SalesAgent logic: "Amount agreed"
            const userMsg = `I agree to the deal: ${data.amount} for ${data.tenure} months`;
            await processUserMessage(userMsg);
        }
        else if (action === 'KYC_UPLOADED' || action === 'KYC_COMPLETED') {
            // Tell Verification Agent we are done
            await processUserMessage("I have uploaded my documents.");
        }
        else if (action === 'ACCEPT_OFFER') {
            // Tell Sanction Agent we are done
            await processUserMessage("Done. I accept the sanction letter.");
        }
        else if (action === 'CLOSE') {
            setActiveWidget(null);
        }
    };

    return {
        messages,
        activeAgent,
        agentStatus,
        activeWidget,
        widgetData,
        suggestions,
        sendMessage: processUserMessage,
        stopGeneration,
        onWidgetAction: handleWidgetAction,
        createNewSession,
        sessions,
        deleteSession
    };
};