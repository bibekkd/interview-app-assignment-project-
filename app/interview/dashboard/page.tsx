'use client'

import { useRef, useState, useEffect } from 'react';
import SessionControls from '@/components/SessionControls';
import ToolPanel from '@/components/Panel';

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

interface TranscriptEntry {
    role: string;
    text: string;
}

interface InterviewFormData {
    techStack: string[];
    level: string;
}

const Page = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const audioElement = useRef<HTMLAudioElement | null>(null);
    const [events, setEvents] = useState<Event[]>([]);

    // Interview state
    const [interviewMode, setInterviewMode] = useState(true);
    const [formData, setFormData] = useState<InterviewFormData>({
        techStack: [],
        level: ""
    });
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [interviewComplete, setInterviewComplete] = useState(false);
    const [interviewScore, setInterviewScore] = useState<number | null>(null);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [functionCallOutput, setFunctionCallOutput] = useState<{
        type: string;
        name: string;
        arguments: string;
    } | null>(null);

    async function startSession() {
        try {
            const tokenResponse = await fetch('/api/token');
            const data = await tokenResponse.json();
            const EPHEMERAL_KEY = data.client_secret.value;

            const pc = new RTCPeerConnection();

            audioElement.current = document.createElement('audio');
            audioElement.current.autoplay = true;
            pc.ontrack = (e) => {
                if (audioElement.current) {
                    audioElement.current.srcObject = e.streams[0];
                }
            };

            const ms = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const audioTrack = ms.getTracks()[0];
            if (audioTrack) {
                pc.addTrack(audioTrack);
            }

            const dc = pc.createDataChannel('oai-events');
            setDataChannel(dc);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-12-17';
            const sdpResponse = await fetch(
                `${baseUrl}?model=${model}`,
                {
                    method: 'POST',
                    body: offer.sdp,
                    headers: {
                        Authorization: `Bearer ${EPHEMERAL_KEY}`,
                        'Content-Type': 'application/sdp',
                    },
                }
            );

            const answer = {
                type: 'answer' as const,
                sdp: await sdpResponse.text(),
            };
            await pc.setRemoteDescription(answer);

            peerConnection.current = pc;
            setIsSessionActive(true);
        } catch (error) {
            console.error('Failed to start session:', error);
            setIsSessionActive(false);
            setDataChannel(null);
            peerConnection.current = null;
        }
    }

    function stopSession() {
        if (dataChannel) {
            dataChannel.close();
        }

        if (peerConnection.current) {
            peerConnection.current.getSenders().forEach((sender) => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            peerConnection.current.close();
        }

        if (audioElement.current) {
            audioElement.current.srcObject = null;
        }

        if (interviewMode && formData.techStack.length > 0 && currentQuestion > 0 && !interviewComplete) {
            setInterviewComplete(true);
            const answersCount = answers.length || 0;
            const summaryText = answersCount > 0 
                ? `Partial interview evaluation based on ${answersCount} questions answered. The candidate showed interest in ${formData.techStack.join(', ')} at ${formData.level} level.`
                : `Interview ended early. The candidate was interested in ${formData.techStack.join(', ')} at ${formData.level} level but did not complete any questions.`;
            
            const scoreValue = Math.max(3, Math.round((answersCount / 4) * 7));
            
            const partialEvaluation = {
                type: "function_call",
                name: "evaluate_interview",
                arguments: JSON.stringify({
                    interview_summary: summaryText,
                    score: {
                        communication: scoreValue,
                        problem_solving: scoreValue,
                        technical_depth: scoreValue,
                        culture_fit: scoreValue,
                        clarity_brevity: scoreValue
                    }
                })
            };
            setFunctionCallOutput(partialEvaluation);
        }

        setIsSessionActive(false);
        setDataChannel(null);
        peerConnection.current = null;
    }

    function sendClientEvent(message: Event) {
        if (dataChannel) {
            const timestamp = new Date().toLocaleTimeString();
            message.event_id = message.event_id || crypto.randomUUID();
            dataChannel.send(JSON.stringify(message));

            if (!message.timestamp) {
                message.timestamp = timestamp;
            }
            setEvents((prev) => [message, ...prev]);
        } else {
            console.error("Failed to send message - no data channel available", message);
        }
    }

    useEffect(() => {
        if (dataChannel) {
            dataChannel.addEventListener("message", (e) => {
                const event = JSON.parse(e.data) as Event;
                if (!event.timestamp) {
                    event.timestamp = new Date().toLocaleTimeString();
                }

                // Handle transcription events
                if (event.type === "conversation.item.create" && 
                    event.item?.role === "assistant" && 
                    event.item?.content?.[0]?.type === "input_text") {
                    const text = event.item.content[0].text;
                    setTranscript(prev => [...prev, { role: "AI interviewer", text }]);

                    // Check if this is the last question
                    if (currentQuestion === 4) {
                        setInterviewComplete(true);
                        sendClientEvent({
                            type: "response.create",
                            response: {
                                instructions: `The interview is complete. Evaluate the candidate's performance based on their answers to the 4 questions about ${formData.techStack.join(', ')} at ${formData.level} level.`
                            }
                        });
                    }
                }

                // Handle user transcription
                if (event.type === "conversation.item.create" && 
                    event.item?.role === "user" && 
                    event.item?.content?.[0]?.type === "input_text") {
                    const text = event.item.content[0].text;
                    setTranscript(prev => [...prev, { role: "User", text }]);

                    // Check for skip command in user's text
                    const skipKeywords = ["skip", "skip question", "next question", "move on"];
                    const hasSkipCommand = skipKeywords.some(keyword => 
                        text.toLowerCase().includes(keyword));
                    
                    if (hasSkipCommand && currentQuestion > 0 && currentQuestion < 4) {
                        // Skip to next question
                        setCurrentQuestion(prev => prev + 1);
                        sendClientEvent({
                            type: "response.create",
                            response: {
                                instructions: `The candidate wants to skip question ${currentQuestion}. Move to question ${currentQuestion + 1} about ${formData.techStack.join(', ')} at ${formData.level} level.`
                            }
                        });
                    } else {
                        // Normal question increment after user's response
                        if (currentQuestion > 0 && currentQuestion < 4) {
                            setCurrentQuestion(prev => prev + 1);
                        }
                    }
                    
                    // Auto-end session when all questions are completed
                    if (currentQuestion === 4 && !interviewComplete) {
                        setInterviewComplete(true);
                        sendClientEvent({
                            type: "response.create",
                            response: {
                                instructions: `The interview is complete. Evaluate the candidate's performance based on their answers to the 4 questions about ${formData.techStack.join(', ')} at ${formData.level} level.`
                            }
                        });
                        
                        // Auto-stop session after a short delay to allow evaluation to complete
                        setTimeout(() => {
                            if (isSessionActive) {
                                stopSession();
                            }
                        }, 5000);
                    }
                }

                // Handle function calls
                if (event.type === "response.done" && event.response?.output) {
                    event.response.output.forEach((output) => {
                        if (output.type === "function_call" && output.name === "evaluate_interview") {
                            setFunctionCallOutput(output);
                            try {
                                const args = JSON.parse(output.arguments);
                                if (args.score) {
                                    const scores = Object.values(args.score) as number[];
                                    const totalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                                    setInterviewScore(Math.round(totalScore));
                                }
                            } catch (e) {
                                console.error("Error parsing function call arguments", e);
                            }
                        }
                    });
                }

                setEvents((prev) => [event, ...prev]);
            });

            dataChannel.addEventListener("open", () => {
                setIsSessionActive(true);
                setEvents([]);
                
                setFormData({
                    techStack: [],
                    level: ""
                });
                setCurrentQuestion(0);
                setAnswers([]);
                setInterviewComplete(false);
                setInterviewScore(null);
                setTranscript([]);
                setFunctionCallOutput(null);
            });
        }
    }, [dataChannel, interviewMode, currentQuestion, formData, interviewComplete, sendClientEvent, setCurrentQuestion]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Main Interview Section */}
            <div className="flex-1 p-8 pr-[440px]">
                <div className="max-w-4xl mx-auto">
                    <SessionControls 
                        startSession={startSession}
                        stopSession={stopSession}
                        isSessionActive={isSessionActive}
                        formData={formData}
                        setFormData={setFormData}
                        currentQuestion={currentQuestion}
                        setCurrentQuestion={setCurrentQuestion}
                        interviewComplete={interviewComplete}
                        interviewScore={interviewScore}
                        sendClientEvent={sendClientEvent}
                    />
                </div>
            </div>

            {/* Tool Panel */}
            <div className="fixed top-0 right-0 w-[420px] h-screen bg-white border-l border-gray-200 shadow-lg">
                <div className="h-full overflow-y-auto">
                    <ToolPanel
                        sendClientEvent={sendClientEvent}
                        events={events}
                        isSessionActive={isSessionActive}
                        interviewMode={interviewMode}
                        currentQuestion={currentQuestion}
                        formData={formData}
                        interviewComplete={interviewComplete}
                        interviewScore={interviewScore}
                        transcript={transcript}
                        functionCallOutput={functionCallOutput}
                    />
                </div>
            </div>
        </div>
    );
};

export default Page;
