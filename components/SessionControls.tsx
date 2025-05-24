import { useState } from 'react';

interface InterviewFormData {
    techStack: string[];
    level: string;
}

export interface SessionControlsProps {
    startSession: () => Promise<void>;
    stopSession: () => void;
    isSessionActive: boolean;
    formData: InterviewFormData;
    setFormData: (data: InterviewFormData) => void;
    currentQuestion: number;
    setCurrentQuestion: (question: number) => void;
    interviewComplete: boolean;
    interviewScore: number | null;
    sendClientEvent: (event: Event) => void;
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

function InterviewForm({
    formData,
    setFormData,
    onSubmit
}: {
    formData: InterviewFormData;
    setFormData: (data: InterviewFormData) => void;
    onSubmit: () => void;
}) {
    const [newTech, setNewTech] = useState('');

    const handleAddTech = () => {
        if (newTech.trim() && !formData.techStack.includes(newTech.trim())) {
            setFormData({
                ...formData,
                techStack: [...formData.techStack, newTech.trim()]
            });
            setNewTech('');
        }
    };

    const handleRemoveTech = (tech: string) => {
        setFormData({
            ...formData,
            techStack: formData.techStack.filter(t => t !== tech)
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800">Interview Setup</h3>
            
            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tech Stack
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTech}
                            onChange={(e) => setNewTech(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTech();
                                }
                            }}
                            placeholder="Add a technology..."
                            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleAddTech}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.techStack.map((tech) => (
                            <span
                                key={tech}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                                {tech}
                                <button
                                    onClick={() => handleRemoveTech(tech)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interview Level
                    </label>
                    <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select level...</option>
                        <option value="Junior">Junior</option>
                        <option value="Mid-level">Mid-level</option>
                        <option value="Senior">Senior</option>
                    </select>
                </div>

                <button
                    onClick={onSubmit}
                    disabled={!formData.techStack.length || !formData.level}
                    className={`mt-4 px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                        !formData.techStack.length || !formData.level
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    Start Interview
                </button>
            </div>
        </div>
    );
}

function SessionActive({
    stopSession,
    formData,
    currentQuestion,
    interviewComplete,
    interviewScore,
    sendClientEvent,
    setCurrentQuestion
}: {
    stopSession: () => void;
    formData: InterviewFormData;
    currentQuestion: number;
    interviewComplete: boolean;
    interviewScore: number | null;
    sendClientEvent: (event: Event) => void;
    setCurrentQuestion: (question: number) => void;
}) {
    const [isDisconnecting, setIsDisconnecting] = useState(false);

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

    const handleSkipQuestion = () => {
        if (currentQuestion < 4) {
            // Increment the question counter directly
            setCurrentQuestion(currentQuestion + 1);
            
            sendClientEvent({
                type: "response.create",
                response: {
                    instructions: `The candidate wants to skip question ${currentQuestion}. Move to question ${currentQuestion + 1} about ${formData.techStack.join(', ')} at ${formData.level} level.`
                }
            });
        }
    };

    const getInterviewStatus = () => {
        if (interviewComplete) return "Interview complete";
        return `Question ${currentQuestion} of 4`;
    };

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
                            {formData.techStack.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Tech:</span>
                                    <span className="text-green-600 font-semibold">
                                        {formData.techStack.join(', ')}
                                    </span>
                                </div>
                            )}
                            {formData.level && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Level:</span>
                                    <span className="text-purple-600 font-semibold">{formData.level}</span>
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
                    {currentQuestion > 0 && currentQuestion <= 4 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${((currentQuestion) / 4) * 100}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                        <span>🎙️</span>
                        <span>Session Active - Happy Interviewing!</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentQuestion > 0 && currentQuestion < 4 && !interviewComplete && (
                            <button
                                onClick={handleSkipQuestion}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                            >
                                Skip Question
                            </button>
                        )}
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
                </div>
            </div>
        </div>
    );
}

export default function SessionControls({
    startSession,
    stopSession,
    isSessionActive,
    formData,
    setFormData,
    currentQuestion,
    setCurrentQuestion,
    interviewComplete,
    interviewScore,
    sendClientEvent
}: SessionControlsProps) {
    const handleFormSubmit = () => {
        setCurrentQuestion(1);
        sendClientEvent({
            type: "response.create",
            response: {
                instructions: `You are a technical interviewer. The candidate knows ${formData.techStack.join(', ')} and wants a ${formData.level} level interview. You must ask exactly 4 technical questions, no more and no less. Start with the first question.`
            }
        });
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            {!isSessionActive ? (
                <SessionStopped startSession={startSession} />
            ) : currentQuestion === 0 ? (
                <InterviewForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleFormSubmit}
                />
            ) : (
                <SessionActive 
                    stopSession={stopSession} 
                    formData={formData}
                    currentQuestion={currentQuestion}
                    interviewComplete={interviewComplete}
                    interviewScore={interviewScore}
                    sendClientEvent={sendClientEvent}
                    setCurrentQuestion={setCurrentQuestion}
                />
            )}
        </div>
    );
}
