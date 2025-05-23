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

const Page = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const audioElement = useRef<HTMLAudioElement | null>(null);
    const [events, setEvents] = useState<Event[]>([]);

    // Interview state
    const [interviewMode, setInterviewMode] = useState(true);
    const [techStack, setTechStack] = useState("");
    const [level, setLevel] = useState("");
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

        if (interviewMode && techStack && currentQuestion > 0 && !interviewComplete && answers.length > 0) {
            setInterviewComplete(true);
            const partialEvaluation = {
                type: "function_call",
                name: "evaluate_interview",
                arguments: JSON.stringify({
                    interview_summary: `Partial interview evaluation based on ${answers.length} questions answered. The candidate showed interest in ${techStack} at ${level} level.`,
                    score: {
                        communication: Math.max(5, Math.round((answers.length / 4) * 7)),
                        problem_solving: Math.max(5, Math.round((answers.length / 4) * 7)),
                        technical_depth: Math.max(5, Math.round((answers.length / 4) * 7)),
                        culture_fit: Math.max(5, Math.round((answers.length / 4) * 7)),
                        clarity_brevity: Math.max(5, Math.round((answers.length / 4) * 7))
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

    function sendTextMessage(message: string) {
        const event: Event = {
            type: "conversation.item.create",
            item: {
                type: "message",
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: message,
                    },
                ],
            },
        };

        setTranscript(prev => [...prev, { role: "User", text: message }]);
        sendClientEvent(event);

        if (interviewMode) {
            if (!techStack && currentQuestion === 0) {
                setTechStack(message);
                setCurrentQuestion(1);
                sendClientEvent({
                    type: "response.create",
                    response: {
                        instructions: `You are a technical interviewer. The candidate mentioned they know ${message}. Ask them what level of interview they want (Junior, Mid-level, or Senior).`
                    }
                });
                return;
            }

            if (!level && currentQuestion === 1) {
                setLevel(message);
                setCurrentQuestion(2);
                sendClientEvent({
                    type: "response.create",
                    response: {
                        instructions: `Ask the candidate the first technical question about ${techStack} at ${message} level. Be specific and challenging.`
                    }
                });
                return;
            }

            if (currentQuestion >= 2 && currentQuestion <= 5) {
                if (message.toLowerCase().includes("skip")) {
                    setCurrentQuestion(prev => prev + 1);
                    if (currentQuestion < 5) {
                        sendClientEvent({
                            type: "response.create",
                            response: {
                                instructions: `Ask the candidate technical question #${currentQuestion + 1} about ${techStack} at ${level} level.`
                            }
                        });
                    }
                    return;
                }

                setAnswers(prev => [...prev, message]);
                
                if (currentQuestion < 5) {
                    setCurrentQuestion(prev => prev + 1);
                    sendClientEvent({
                        type: "response.create",
                        response: {
                            instructions: `Ask the candidate technical question #${currentQuestion + 1} about ${techStack} at ${level} level.`
                        }
                    });
                } else {
                    setInterviewComplete(true);
                    setCurrentQuestion(6);
                    sendClientEvent({
                        type: "response.create",
                        response: {
                            instructions: `The technical interview is now complete. Evaluate the candidate's answers to the 4 questions about ${techStack} at ${level} level. Provide a detailed assessment with scores for communication, problem-solving, technical depth, culture fit, and clarity & brevity.`
                        }
                    });
                }
                return;
            }
        }
        
        sendClientEvent({ type: "response.create" });
    }

    useEffect(() => {
        if (dataChannel) {
            dataChannel.addEventListener("message", (e) => {
                const event = JSON.parse(e.data) as Event;
                if (!event.timestamp) {
                    event.timestamp = new Date().toLocaleTimeString();
                }

                if (event.type === "conversation.item.create" && 
                    event.item?.role === "assistant" && 
                    event.item?.content?.[0]?.type === "input_text") {
                    const text = event.item.content[0].text;
                    setTranscript(prev => [...prev, { role: "AI interviewer", text }]);
                }

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
                
                setTechStack("");
                setLevel("");
                setCurrentQuestion(0);
                setAnswers([]);
                setInterviewComplete(false);
                setInterviewScore(null);
                setTranscript([]);
                setFunctionCallOutput(null);
                
                if (interviewMode) {
                    setTimeout(() => {
                        sendClientEvent({
                            type: "response.create",
                            response: {
                                instructions: "You are a technical interviewer. Ask the candidate what tech stack they're proficient in. Be direct and concise."
                            }
                        });
                    }, 1000);
                }
            });
        }
    }, [dataChannel, interviewMode, currentQuestion, techStack, level, interviewComplete]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Main Interview Section */}
            <div className="flex-1 p-8 pr-[440px]">
                <div className="max-w-4xl mx-auto">
                    <SessionControls 
                        startSession={startSession}
                        stopSession={stopSession}
                        isSessionActive={isSessionActive}
                        techStack={techStack}
                        level={level}
                        sendTextMessage={sendTextMessage}
                        currentQuestion={currentQuestion}
                        interviewComplete={interviewComplete}
                        interviewScore={interviewScore}
                    />
                </div>
            </div>

            {/* Tool Panel */}
            <div className="fixed top-0 right-0 w-[420px] h-screen bg-white border-l border-gray-200 shadow-lg">
                <div className="h-full overflow-y-auto">
                    <ToolPanel
                        sendClientEvent={sendClientEvent}
                        sendTextMessage={sendTextMessage}
                        events={events}
                        isSessionActive={isSessionActive}
                        interviewMode={interviewMode}
                        currentQuestion={currentQuestion}
                        techStack={techStack}
                        level={level}
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
