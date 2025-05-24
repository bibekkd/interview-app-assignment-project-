import { useEffect, useRef } from "react";

interface Event {
    type: string;
    event_id?: string;
    timestamp?: string;
    item?: {
        type: string;
        role: string;
        content?: Array<{
            type: string;
            text: string;
        }>;
    };
    response?: {
        instructions?: string;
        output?: Array<{
            type: string;
            name: string;
            arguments: string;
        }>;
    };
    delta?: string;
    transcript?: string;
}

interface InterviewFormData {
    techStack: string[];
    level: string;
}

interface InterviewEvaluationProps {
    functionCallOutput: {
        arguments: string;
    };
}

interface TranscriptEntry {
    role: string;
    text: string;
    timestamp: string;
}

interface ToolPanelProps {
    isSessionActive: boolean;
    sendClientEvent: (event: Event) => void;
    events: Event[];
    interviewMode: boolean;
    currentQuestion: number;
    formData: InterviewFormData;
    interviewComplete: boolean;
    interviewScore: number | null;
    transcript: TranscriptEntry[];
    functionCallOutput: {
        type: string;
        name: string;
        arguments: string;
    } | null;
    currentUserTranscript: string;
    currentAITranscript: string;
    isUserSpeaking: boolean;
    isAISpeaking: boolean;
}

// Interview tool description
const interviewFunctionDescription = `
Call this function to evaluate a technical interview candidate.
`;

// Interview tool definition
const interviewSessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "evaluate_interview",
        description: interviewFunctionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            interview_summary: {
              type: "string",
              description: `Write a summary of the interview in 100-120 words, mentioning specific strengths and areas for improvement`,
            },
            score: {
              type: "object",
              description: `Scoring for each category (0-10): Communication, Problem-solving, Technical depth, Culture fit, Clarity & brevity`,
              properties: {
                communication: { type: "number", minimum: 0, maximum: 10 },
                problem_solving: { type: "number", minimum: 0, maximum: 10 },
                technical_depth: { type: "number", minimum: 0, maximum: 10 },
                culture_fit: { type: "number", minimum: 0, maximum: 10 },
                clarity_brevity: { type: "number", minimum: 0, maximum: 10 }
              }
            },
          },
          required: ["interview_summary", "score"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function InterviewEvaluation({ functionCallOutput }: InterviewEvaluationProps) {
    const { interview_summary, score } = JSON.parse(functionCallOutput.arguments) as {
        interview_summary: string;
        score: Record<string, number>;
    };

    const totalScore = Math.round(
        Object.values(score).reduce((sum, value) => sum + value, 0) / Object.keys(score).length
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Interview Results</h3>
                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-blue-800 font-bold">Total Score: {totalScore}/10</span>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-2">Interview Summary</h4>
                        <p className="text-gray-600 leading-relaxed">{interview_summary}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-3">Detailed Scores</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(score).map(([category, value]) => (
                                <div key={category} className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                                style={{ width: `${(value / 10) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-bold text-blue-600 min-w-[2.5rem] text-right">{value}/10</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToolPanel({
    sendClientEvent,
    events,
    isSessionActive,
    interviewMode,
    currentQuestion,
    formData,
    interviewComplete,
    interviewScore,
    transcript,
    functionCallOutput,
    currentUserTranscript,
    currentAITranscript,
    isUserSpeaking,
    isAISpeaking
}: ToolPanelProps) {
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of transcript
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript, currentUserTranscript, currentAITranscript]);

    const getInterviewStage = () => {
        if (!isSessionActive) return "Not Started";
        if (currentQuestion === 0) return "Setup";
        if (interviewComplete) return "Complete";
        return `Question ${currentQuestion} of 4`;
    };

    const getSpeakingStatus = () => {
        if (isUserSpeaking) return "User is speaking...";
        if (isAISpeaking) return "AI is responding...";
        return "Listening";
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Interview Panel</h2>
                <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                        isSessionActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    <span className="text-sm text-gray-600">{getInterviewStage()}</span>
                </div>
                {isSessionActive && (
                    <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                            isUserSpeaking ? 'bg-red-500 animate-pulse' : 
                            isAISpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                        }`}></span>
                        <span className="text-xs text-gray-500">{getSpeakingStatus()}</span>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Live Transcript Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-md font-medium text-gray-700">Live Transcript</h3>
                        <span className="text-sm text-gray-500">
                            {transcript.length} messages
                            {(currentUserTranscript || currentAITranscript) && " • Live"}
                        </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 h-[400px] overflow-y-auto">
                        {transcript.length === 0 && !currentUserTranscript && !currentAITranscript ? (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <p>No messages yet.</p>
                                    <p className="text-xs mt-1">Start speaking to see the transcript.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Completed transcript entries */}
                                {transcript.map((entry, index) => (
                                    <div
                                        key={index}
                                        className={`flex flex-col ${
                                            entry.role === "User" ? "items-end" : "items-start"
                                        }`}
                                    >
                                        <div className={`max-w-[80%] rounded-lg p-3 ${
                                            entry.role === "User"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-xs font-medium">
                                                    {entry.role}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {entry.timestamp}
                                                </div>
                                            </div>
                                            <div className="text-sm">{entry.text}</div>
                                        </div>
                                    </div>
                                ))}

                                {/* Live user transcript */}
                                {(isUserSpeaking || currentUserTranscript) && (
                                    <div className="flex flex-col items-end">
                                        <div className="max-w-[80%] rounded-lg p-3 bg-blue-50 border-2 border-blue-200 text-blue-800">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="text-xs font-medium">User</div>
                                                <div className="text-xs text-blue-600">
                                                    {isUserSpeaking ? "Speaking..." : "Processing..."}
                                                </div>
                                                {isUserSpeaking && (
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="text-sm">
                                                {currentUserTranscript || "..."}
                                                {isUserSpeaking && <span className="animate-pulse">|</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Live AI transcript */}
                                {(isAISpeaking || currentAITranscript) && (
                                    <div className="flex flex-col items-start">
                                        <div className="max-w-[80%] rounded-lg p-3 bg-green-50 border-2 border-green-200 text-gray-800">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="text-xs font-medium">AI Interviewer</div>
                                                <div className="text-xs text-green-600">
                                                    {isAISpeaking ? "Speaking..." : "Processing..."}
                                                </div>
                                                {isAISpeaking && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="text-sm">
                                                {currentAITranscript || "..."}
                                                {isAISpeaking && <span className="animate-pulse">|</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={transcriptEndRef} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Interview Evaluation Section */}
                {interviewComplete && functionCallOutput && (
                    <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-700 mb-2">Interview Evaluation</h3>
                        <div className="bg-white rounded-lg shadow p-4">
                            <InterviewEvaluation functionCallOutput={functionCallOutput} />
                        </div>
                    </div>
                )}

                {/* Events Log Section */}
                <div>
                    <h3 className="text-md font-medium text-gray-700 mb-2">Events Log</h3>
                    <div className="bg-gray-50 rounded-lg p-4 h-[200px] overflow-y-auto">
                        {events.length === 0 ? (
                            <p className="text-gray-500">No events yet</p>
                        ) : (
                            <div className="space-y-2">
                                {events.slice(0, 20).map((event, index) => (
                                    <div key={index} className="text-sm">
                                        <span className="text-gray-500">{event.timestamp}</span>
                                        <span className="ml-2 text-gray-700">{event.type}</span>
                                        {(event.type.includes('transcript') || event.type.includes('speech')) && (
                                            <span className="ml-2 text-blue-600 text-xs">
                                                {event.delta || event.transcript || ''}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ToolPanel;