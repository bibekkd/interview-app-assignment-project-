import { useEffect, useState, useRef } from "react";

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

interface ToolPanelProps {
    isSessionActive: boolean;
    sendClientEvent: (event: Event) => void;
    events: Event[];
    interviewMode: boolean;
    currentQuestion: number;
    formData: InterviewFormData;
    interviewComplete: boolean;
    interviewScore: number | null;
    transcript: Array<{ role: string; text: string }>;
    functionCallOutput: {
        type: string;
        name: string;
        arguments: string;
    } | null;
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

export default function ToolPanel({
    isSessionActive,
    sendClientEvent,
    events,
    interviewMode,
    currentQuestion,
    formData,
    interviewComplete,
    interviewScore,
    transcript = [],
    functionCallOutput
}: ToolPanelProps) {
    const [functionAdded, setFunctionAdded] = useState(false);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!events || events.length === 0 || !isSessionActive) return;

        const firstEvent = events[events.length - 1];
        if (!functionAdded && firstEvent.type === "session.created" && interviewMode && isSessionActive) {
            sendClientEvent(interviewSessionUpdate);
            setFunctionAdded(true);
        }
    }, [events, interviewMode, functionAdded, sendClientEvent, isSessionActive]);

    useEffect(() => {
        if (!isSessionActive) {
            setFunctionAdded(false);
        }
    }, [isSessionActive]);

    // Auto-scroll to bottom when transcript updates
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript]);

    // Get interview stage description
    const getInterviewStage = () => {
        if (!formData.techStack.length) return "Waiting for candidate to specify their tech stack";
        if (currentQuestion === 0) return "Interview not yet started";
        if (currentQuestion >= 1 && currentQuestion <= 4) return `Question ${currentQuestion} of 4`;
        if (interviewComplete) return "Interview completed";
        return "Interview in progress";
    };

    return (
        <section className="h-full w-full flex flex-col gap-4">
            <div className="h-full bg-white rounded-lg shadow-md p-6 flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Interview Assistant</h2>
                {isSessionActive ? (
                    <div className="flex flex-col gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="font-semibold text-gray-700 mb-3">Interview Status</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Stage:</span>
                                    <span className="text-blue-600 font-semibold">{getInterviewStage()}</span>
                                </div>
                                {formData.techStack.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">Tech Stack:</span>
                                        <span className="text-green-600 font-semibold">{formData.techStack.join(', ')}</span>
                                    </div>
                                )}
                                {formData.level && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">Level:</span>
                                        <span className="text-purple-600 font-semibold">{formData.level}</span>
                                    </div>
                                )}
                                {currentQuestion > 0 && currentQuestion <= 4 && (
                                    <div className="flex flex-col gap-2">
                                        <span className="font-medium text-gray-600">Progress:</span>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                                style={{ width: `${(currentQuestion / 4) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {functionCallOutput ? (
                            <InterviewEvaluation functionCallOutput={functionCallOutput} />
                        ) : interviewComplete || currentQuestion > 4 ? (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-800">⏳</span>
                                    <p className="text-yellow-800 font-medium">Evaluating interview responses...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <h3 className="font-semibold text-gray-700 mb-3">Interview Instructions</h3>
                                <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                                    <li>Start by telling the assistant what tech stack you&apos;re proficient in</li>
                                    <li>The assistant will ask you 4 technical questions</li>
                                    <li>Answer each question to the best of your ability</li>
                                    <li>After all questions, you&apos;ll receive a score and feedback</li>
                                </ol>
                            </div>
                        )}
                        
                        {/* Transcript Section */}
                        <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-700">Live Transcript</h3>
                                <span className="text-sm text-gray-500">
                                    {transcript.length} messages
                                </span>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {transcript.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No messages yet. The transcript will appear here as you speak.</p>
                                    </div>
                                ) : (
                                    transcript.map((entry, index) => (
                                        <div 
                                            key={index} 
                                            className={`p-3 rounded-lg ${
                                                entry.role === "User" 
                                                    ? "bg-blue-50 border border-blue-100" 
                                                    : "bg-white border border-gray-200"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className={`font-medium ${
                                                    entry.role === "User" 
                                                        ? "text-blue-700" 
                                                        : "text-gray-700"
                                                }`}>
                                                    {entry.role}:
                                                </span>
                                                <span className="text-gray-600 flex-1">{entry.text}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={transcriptEndRef} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Start the session to begin your technical interview...</p>
                    </div>
                )}
            </div>
        </section>
    );
}

