import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

interface Message {
    id: string;
    role: 'user' | 'model';
    content: string;
}

export function ChatWidget() {
    const { currentUser } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Initial greeting based on role
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            if (currentUser?.role === 'admin') {
                setMessages([{ id: 'init', role: 'model', content: "Hello Admin! I'm your SmartBook companion. How can I assist you with the platform today?" }]);
            } else if (currentUser?.role === 'student') {
                setMessages([{ id: 'init', role: 'model', content: "Hi there! I'm your educational assistant. Tell me what subject you want to learn and your preferred language, and I'll find the best high-view YouTube tutorials for you!" }]);
            } else {
                setMessages([{ id: 'init', role: 'model', content: "Hello! How can I help you today?" }]);
            }
        }
    }, [isOpen, currentUser, messages.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Determine system instruction based on role
            let systemInstruction = "You are a helpful AI assistant.";
            if (currentUser?.role === 'student') {
                systemInstruction = "You are a highly specialized educational assistant for students. The user will ask to learn about a specific subject. You MUST ONLY recommend YouTube video tutorials and courses in their preferred language. CRITICAL RULES:\n1. You MUST ONLY recommend videos that have over 1 million views.\n2. ONLY provide subject-related educational videos. If they ask about anything else, politely decline.\n3. You MUST provide the full, active HTTPS URL link to every YouTube video using Markdown formatting: [Video Title](https://www.youtube.com/watch?v=...).\nFormat your response cleanly using bullet points, bolding the titles, and including the views and language.";
            } else if (currentUser?.role === 'admin') {
                systemInstruction = "You are the administrative AI core for 'SmartBook', a college classroom booking system. System Architecture:\n- Roles: Student, Faculty, Admin.\n- Students book classrooms and request a Faculty sponsor.\n- Faculty only approve/reject student bookings. They can request 'Do Not Disturb' (DND) leaves.\n- Admins (who you are talking to) manage Classrooms (add/remove), approve Faculty DND requests, and have a view-only 'All Bookings' master dashboard. Admins DO NOT approve individual bookings.\nYour job is to act as a highly intelligent co-pilot. Answer all questions directly regarding how to operate the app, manage users, or resolve conflicts.";
            }

            // Format previous history for Groq (OpenAI format)
            const formattedHistory = messages
                .filter(m => m.id !== 'init')
                .map(m => ({
                    role: m.role === 'model' ? 'assistant' : 'user',
                    content: m.content
                }));

            // Build the messages array with the system prompt first
            const apiMessages = [
                { role: 'system', content: systemInstruction },
                ...formattedHistory,
                { role: 'user', content: userMessage.content }
            ];

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: apiMessages,
                    temperature: 0.7,
                    max_tokens: 800,
                })
            });

            if (!response.ok) {
                const errConfig = await response.json();
                console.error("Groq API Error:", errConfig);
                throw new Error('API request failed');
            }

            const data = await response.json();
            const botText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request right now.";

            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: botText }]);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: "Oops! I encountered a network error connecting to my brain. Please try again in a moment." }]);
        } finally {
            setLoading(false);
        }
    };

    // Don't render anything if not logged in
    if (!currentUser) return null;

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: 360, height: 500, background: '#fff', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    marginBottom: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0'
                }}>
                    {/* Header */}
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>SmartBook AI</div>
                                <div style={{ fontSize: 12, opacity: 0.9 }}>{currentUser.role === 'student' ? 'Educational Guide' : 'System Companion'}</div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 0 }}>&times;</button>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: 20, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {messages.map((msg) => (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '85%', padding: '12px 16px', borderRadius: 18, fontSize: 14, lineHeight: 1.5,
                                    background: msg.role === 'user' ? '#6366f1' : '#fff',
                                    color: msg.role === 'user' ? '#fff' : '#1e293b',
                                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                                    borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                                    borderBottomLeftRadius: msg.role === 'model' ? 4 : 18,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    wordBreak: 'break-word'
                                }}>
                                    {/* Safely render basic markdown (links and bold) */}
                                    <div dangerouslySetInnerHTML={{
                                        __html: msg.content
                                            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape HTML
                                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                                            .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer" style="color: ${msg.role === 'user' ? '#93c5fd' : '#3b82f6'}; text-decoration: underline; font-weight: 600;">$1</a>`) // Links
                                            .replace(/\n/g, '<br />') // Newlines
                                    }} />
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#fff', padding: '12px 16px', borderRadius: 18, border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
                                <div className="typing-dot" style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: '50%', margin: '0 2px', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                                <div className="typing-dot" style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: '50%', margin: '0 2px', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></div>
                                <div className="typing-dot" style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: '50%', margin: '0 2px', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            style={{ flex: 1, padding: '10px 16px', borderRadius: 999, border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: 14, outline: 'none' }}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            style={{
                                width: 40, height: 40, borderRadius: '50%', border: 'none', background: loading || !input.trim() ? '#cbd5e1' : '#6366f1',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            <span style={{ fontSize: 16, transform: 'rotate(-45deg) translate(2px, -2px)' }}>✈️</span>
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', boxShadow: '0 10px 25px rgba(59,130,246,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
                    transform: isOpen ? 'scale(0.9)' : 'scale(1)'
                }}
            >
                {isOpen ? <span style={{ fontSize: 24 }}>&times;</span> : '✨'}
            </button>

            {/* Injecting basic keyframes for typing animation */}
            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
