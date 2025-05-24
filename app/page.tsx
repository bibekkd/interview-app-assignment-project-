'use client'
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">AI Interview</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="#about" className="text-gray-600 hover:text-gray-900">About</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered Technical Interviews
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of technical interviews with our AI-powered platform. 
              Get instant feedback and comprehensive skill assessment through voice-based interviews.
            </p>
            <button
              onClick={() => router.push('/interview/dashboard')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Voice-Based Interviews</h3>
              <p className="text-gray-600">Natural conversation flow with real-time voice transcription and AI responses.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Evaluation</h3>
              <p className="text-gray-600">Get comprehensive skill assessment and detailed feedback immediately after the interview.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Analysis</h3>
              <p className="text-gray-600">Advanced AI technology provides instant transcription and analysis of your responses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About Our Platform</h2>
              <p className="text-gray-600 mb-4">
                Our AI-powered interview platform revolutionizes the technical interview process by providing a seamless, 
                voice-based interaction experience. Using OpenAI's advanced Realtime WebRTC API, we deliver a natural 
                conversation flow while maintaining professional assessment standards.
              </p>
              <p className="text-gray-600">
                The platform conducts structured 4-question interviews, providing instant feedback and comprehensive 
                skill scoring across multiple dimensions, helping candidates understand their strengths and areas for improvement.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600">✓</span>
                  </div>
                  <span className="text-gray-700">Real-time voice transcription</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600">✓</span>
                  </div>
                  <span className="text-gray-700">Instant feedback and scoring</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600">✓</span>
                  </div>
                  <span className="text-gray-700">Comprehensive skill assessment</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600">✓</span>
                  </div>
                  <span className="text-gray-700">Modern Next.js 14 technology</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Interview</h3>
              <p className="text-gray-600">
                Revolutionizing technical interviews with AI-powered voice-based assessments.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
                </li>
                <li>
                  <Link href="#about" className="text-gray-600 hover:text-gray-900">About</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology</h3>
              <ul className="space-y-2">
                <li className="text-gray-600">Next.js 14</li>
                <li className="text-gray-600">OpenAI Realtime API</li>
                <li className="text-gray-600">WebRTC</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-600">
            <p>© 2024 AI Interview. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
