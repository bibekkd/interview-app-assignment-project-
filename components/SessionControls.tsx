import { useState } from 'react';

export interface SessionControlsProps {
    startSession: () => Promise<void>;
    stopSession: () => void;
    isSessionActive: boolean;
    techStack: string | null;
    level: string | null;
    sendTextMessage: (message: string) => void;
    currentQuestion: number;
    interviewComplete: boolean;
    interviewScore: number | null;
}

function SessionStopped({
    startSession,
}: { startSession: () => Promise<void> }) {
    const [isActivating, setIsActivating] = useState(false);

    async function handleStartSession() {
        if (isActivating) return;

        setIsActivating(true);
        try {
            await startSession();
        } catch (error) {
            console.error('Failed to start session:', error);
        } finally {
            setIsActivating(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800">Technical Interview Assistant</h2>
            <p className="text-gray-600 text-center mb-4">
                Start your technical interview session to begin the assessment
            </p>
            <button
                onClick={handleStartSession}
                disabled={isActivating}
                className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                    isActivating
                        ? 'bg-gray-600 opacity-70 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
            >
                {isActivating
                    ? 'Starting session...'
                    : 'Start Interview Session'}
            </button>
        </div>
    );
}

function SessionActive({
    stopSession,
    techStack,
    level,
    sendTextMessage,
    currentQuestion,
    interviewComplete,
    interviewScore
}: {
    stopSession: () => void;
    techStack: string | null;
    level: string | null;
    sendTextMessage: (message: string) => void;
    currentQuestion: number;
    interviewComplete: boolean;
    interviewScore: number | null;
}) {
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [message, setMessage] = useState('');

    function handleSendClientEvent() {
        sendTextMessage(message);
        setMessage("");
    }

    const getInterviewStatus = () => {
        if (!techStack) return "Waiting for tech stack...";
        if (!level) return "Waiting for level selection...";
        if (interviewComplete) return "Interview complete";
        return `Question ${currentQuestion - 1} of 4`;
    };

    const getPlaceholder = () => {
        if (!techStack) return "Enter your tech stack...";
        if (!level) return "Enter your level (Junior/Mid-level/Senior)...";
        if (interviewComplete) return "Interview complete";
        return `Answer question ${currentQuestion - 1}... (or type 'skip' to skip)`;
    };

    function handleStopSession() {
        if (isDisconnecting) return;

        setIsDisconnecting(true);
        try {
            stopSession();
        } catch (error) {
            console.error('Failed to stop session:', error);
        } finally {
            setIsDisconnecting(false);
        }
    }

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-4">
            {/* Interview status bar */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Status:</span>
                            <span className="text-blue-600 font-semibold">{getInterviewStatus()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {techStack && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Tech:</span>
                                    <span className="text-green-600 font-semibold">{techStack}</span>
                                </div>
                            )}
                            {level && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Level:</span>
                                    <span className="text-purple-600 font-semibold">{level}</span>
                                </div>
                            )}
                            {interviewScore !== null && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Score:</span>
                                    <span className="font-bold text-yellow-600">{interviewScore}/100</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {currentQuestion > 1 && currentQuestion <= 5 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${((currentQuestion - 1) / 4) * 100}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input area */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <input
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && message.trim()) {
                                    handleSendClientEvent();
                                }
                            }}
                            type="text"
                            placeholder={getPlaceholder()}
                            className="w-full border border-gray-300 rounded-lg p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={interviewComplete && interviewScore !== null}
                        />
                        <button
                            onClick={() => {
                                if (message.trim()) {
                                    handleSendClientEvent();
                                }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={interviewComplete && interviewScore !== null || !message.trim()}
                        >
                            Send
                        </button>
                    </div>
                    <button
                        onClick={handleStopSession}
                        disabled={isDisconnecting}
                        className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                            isDisconnecting
                                ? 'bg-gray-600 opacity-70 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                        }`}
                    >
                        {isDisconnecting
                            ? 'Ending...'
                            : 'End Session'}
                    </button>
                </div>
                <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-2">
                    <span>🎙️</span>
                    <span>Session Active - Happy Interviewing!</span>
                </div>
            </div>
        </div>
    );
}

export default function SessionControls({
    startSession,
    stopSession,
    isSessionActive,
    techStack,
    level,
    sendTextMessage,
    currentQuestion,
    interviewComplete,
    interviewScore
}: SessionControlsProps) {
    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            {isSessionActive ? (
                <SessionActive 
                    stopSession={stopSession} 
                    techStack={techStack}
                    level={level}
                    sendTextMessage={sendTextMessage}
                    currentQuestion={currentQuestion}
                    interviewComplete={interviewComplete}
                    interviewScore={interviewScore}
                />
            ) : (
                <SessionStopped startSession={startSession} />
            )}
        </div>
    );
}
