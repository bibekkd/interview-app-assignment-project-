import { useState } from 'react';

export interface SessionControlsProps {
    startSession: () => Promise<void>;
    stopSession: () => void;
    isSessionActive: boolean;
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
        <div className="flex items-center justify-center">
        <button
            onClick={handleStartSession}
            disabled={isActivating}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
            isActivating
                ? 'bg-gray-600 opacity-70 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
            }`}
        >
            {isActivating
            ? 'Starting session...'
            : 'Start session'}
        </button>
        </div>
    );
    }

    function SessionActive({
    stopSession,
    }: { stopSession: () => void }) {
    const [isDisconnecting, setIsDisconnecting] =
        useState(false);

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
        <div className="bg-white dark:bg-gray-800 flex items-center justify-center w-auto h-auto gap-4 p-4 rounded-lg">
        <div className="text-green-600 dark:text-green-400 font-medium">
            🎙️ Session Active - Happy Interviewing!
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
            ? 'Disconnecting...'
            : 'End session'}
        </button>
        </div>
    );
    }

    export default function SessionControls({
    startSession,
    stopSession,
    isSessionActive,
    }: SessionControlsProps) {
    return (
        <div className="flex gap-4 border-t-2 border-gray-200 dark:border-gray-700 h-full rounded-md p-4">
        {isSessionActive ? (
            <SessionActive stopSession={stopSession} />
        ) : (
            <SessionStopped startSession={startSession} />
        )}
        </div>
    );
}
