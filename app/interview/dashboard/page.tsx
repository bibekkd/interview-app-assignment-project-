'use client'

import { useRef, useState } from 'react';
import SessionControls from '@/components/SessionControls';

const page = () => {
    const [isSessionActive, setIsSessionActive] =
        useState(false);
    const [dataChannel, setDataChannel] =
        useState<RTCDataChannel | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(
        null
    );
    const audioElement = useRef<HTMLAudioElement | null>(
        null
    );

  async function startSession() {
    try {
      // Get a session token for OpenAI Realtime API
      const tokenResponse = await fetch('/api/token');
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a peer connection
      const pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      audioElement.current =
        document.createElement('audio');
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElement.current) {
          audioElement.current.srcObject = e.streams[0];
        }
      };

      // Add local audio track for microphone input in the browser
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const audioTrack = ms.getTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack);
      }

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel('oai-events');
      setDataChannel(dc);

      // Start the session using the Session Description Protocol (SDP)
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
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;

      // Set session as active after successful connection
      setIsSessionActive(true);
    } catch (error) {
      console.error('Failed to start session:', error);
      // Reset state on error
      setIsSessionActive(false);
      setDataChannel(null);
      peerConnection.current = null;
    }
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (peerConnection.current) {
      peerConnection.current
        .getSenders()
        .forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });
      peerConnection.current.close();
    }

    // Stop audio element if it exists
    if (audioElement.current) {
      audioElement.current.srcObject = null;
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  return (
    <div className="px-20 pt-10">
      <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
        <SessionControls
          startSession={startSession}
          stopSession={stopSession}
          isSessionActive={isSessionActive}
        />
      </section>
      <div>
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h3 className="text-2xl font-bold text-black mb-4 dark:text-white">
            Start your session to ace your interview
          </h3>
          <p className="text-black dark:text-white mb-6">
            Practice with our AI-powered mock interviews to
            improve your skills and confidence
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <span className="text-blue-600 dark:text-blue-300 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <span className="text-sm font-medium text-black dark:text-white">
                Real-time feedback
              </span>
            </div>
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <span className="text-blue-600 dark:text-blue-300 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <span className="text-sm font-medium text-black dark:text-white">
                30-min sessions
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
