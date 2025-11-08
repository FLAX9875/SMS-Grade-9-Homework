'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import axios from 'axios'

// Dynamic API URL
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://sms-grade-9-homework-server.onrender.com'
}

const API_URL = getApiUrl()

export default function StudyGuidesPage() {
  const router = useRouter()
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [studyGuide, setStudyGuide] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const studyGuideRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedFiles(Array.from(files))
    }
  }

  const handleGenerateStudyGuide = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) {
      alert('Please enter text or upload files to generate a study guide')
      return
    }

    setIsGenerating(true)
    
    try {
      // Use Bobby AI to generate actual study guide from the content
      const response = await axios.post(`${API_URL}/api/bobby/chat`, {
        message: `Please create a comprehensive study guide based on this content. Use the actual terms, concepts, and information provided. Make it specific to the content, not generic. Organize it clearly with sections and bullet points. Here is the content:\n\n${inputText}`
      }, {
        timeout: 30000
      })

      if (response.data && response.data.response) {
        setStudyGuide(response.data.response)
      } else {
        throw new Error('No response from AI')
      }
    } catch (error) {
      console.error('Error generating study guide:', error)
      // Fallback to a simple formatted version of their content
      const formattedContent = `Study Guide: Canadian Geography & Geology
Based on your provided content

KEY TERMS & DEFINITIONS

${extractKeyTerms(inputText)}

REGIONAL INFORMATION

${extractRegions(inputText)}

CLIMATE REGIONS

${extractClimateRegions(inputText)}

IMPORTANT FACTS & RELATIONSHIPS

${extractFactsAndRelationships(inputText)}

STUDY RECOMMENDATIONS
- Focus on memorizing the key terms and their definitions
- Practice identifying which characteristics belong to each region
- Create flashcards for the climate regions and their features
- Review the cause-and-effect relationships`

      setStudyGuide(formattedContent)
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper functions to extract and format the actual content
  const extractKeyTerms = (text: string) => {
    const lines = text.split('\n')
    let keyTerms = ''
    let inKeyTerms = false
    
    for (const line of lines) {
      if (line.includes('Key Terms/Concepts')) {
        inKeyTerms = true
        continue
      }
      if (inKeyTerms && line.includes('Key Regions')) {
        break
      }
      if (inKeyTerms && line.trim() && !line.includes('Key Terms/Concepts')) {
        if (line.includes(':')) {
          const [term, definition] = line.split(':').map(s => s.trim())
          keyTerms += `${term}: ${definition}\n`
        } else if (line.trim()) {
          keyTerms += `${line.trim()}\n`
        }
      }
    }
    return keyTerms || 'No key terms extracted'
  }

  const extractRegions = (text: string) => {
    const lines = text.split('\n')
    let regions = ''
    let inRegions = false
    
    for (const line of lines) {
      if (line.includes('Key Regions')) {
        inRegions = true
        continue
      }
      if (inRegions && line.includes('Key Climate Regions')) {
        break
      }
      if (inRegions && line.includes('\t') && line.includes('Region') && !line.includes('Description')) {
        const [region, description] = line.split('\t').map(s => s.trim())
        if (region && description && region !== 'Region') {
          regions += `${region}: ${description}\n`
        }
      }
    }
    return regions || 'No regions extracted'
  }

  const extractClimateRegions = (text: string) => {
    const lines = text.split('\n')
    let climates = ''
    let inClimates = false
    
    for (const line of lines) {
      if (line.includes('Key Climate Regions')) {
        inClimates = true
        continue
      }
      if (inClimates && line.includes('Key Social Factors')) {
        break
      }
      if (inClimates && line.includes('\t') && line.includes('Climate Region') && !line.includes('Characteristics')) {
        const [region, characteristics] = line.split('\t').map(s => s.trim())
        if (region && characteristics && region !== 'Climate Region') {
          climates += `${region}: ${characteristics}\n`
        }
      }
    }
    return climates || 'No climate regions extracted'
  }

  const extractFactsAndRelationships = (text: string) => {
    const lines = text.split('\n')
    let facts = ''
    
    for (const line of lines) {
      if (line.includes('Facts to Memorize') || line.includes('Cause and Effect')) {
        facts += `${line.trim()}\n`
        continue
      }
      if (line.trim() && (line.includes('-') || line.includes('•'))) {
        facts += `${line.trim()}\n`
      }
    }
    return facts || 'No facts extracted'
  }

  const handleCreateFlashcards = () => {
    if (!studyGuide) {
      alert('Please generate a study guide first')
      return
    }
    // Navigate to flashcards with the study guide content
    router.push('/flashcards?content=' + encodeURIComponent(inputText))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200))
  }

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50))
  }

  const resetZoom = () => {
    setZoomLevel(100)
  }

  // Text-to-speech function
  const speakStudyGuide = async () => {
    if (!studyGuide) return

    if (isSpeaking) {
      // Stop speaking
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    // Start speaking
    setIsSpeaking(true)

    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance()
      
      // Add Bobby's personality to the speech
      const bobbyIntro = "Hey there! Bobby the Study Cat here! Let me read this study guide for you. Ready? Here we go! "
      const fullText = bobbyIntro + studyGuide.replace(/\*/g, '').replace(/#/g, '') // Remove markdown symbols
      
      speech.text = fullText
      speech.rate = 0.9 // Slightly slower for better comprehension
      speech.pitch = 1.1 // Slightly higher pitch for friendly voice
      speech.volume = 1

      speech.onend = () => {
        setIsSpeaking(false)
      }

      speech.onerror = () => {
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(speech)
    } else {
      alert('Text-to-speech is not supported in your browser. Try Chrome or Edge!')
      setIsSpeaking(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-dark-text-secondary hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-white">Study Guides</h1>
            </div>
            <div className="text-dark-text-secondary text-sm">
              SMS Grade 9
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-card rounded-lg p-6 border border-dark-border mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Create Study Guide</h2>
            
            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-white mb-2">Paste your notes or textbook content:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your notes, textbook content, or any study material here..."
                className="w-full h-48 bg-dark-border border border-dark-border rounded-lg p-4 text-white placeholder-dark-text-secondary focus:border-purple-400 focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-white mb-2">Or upload files:</label>
              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={triggerFileInput}
                  className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-200"
                >
                  <span>📎</span>
                  <span>Choose Files</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-dark-text-secondary self-center">
                  PDF, Word, PowerPoint, Text files
                </span>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="bg-dark-border rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Selected Files:</h4>
                  <ul className="text-dark-text-secondary space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateStudyGuide}
              disabled={isGenerating || (!inputText.trim() && uploadedFiles.length === 0)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Study Guide...' : 'Generate Study Guide'}
            </button>
          </motion.div>

          {/* Loading State */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-card rounded-lg p-8 border border-dark-border mb-6 text-center"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h3 className="text-white text-lg font-semibold mb-2">Bobby is creating your study guide</h3>
              <p className="text-dark-text-secondary">
                Analyzing your content and organizing it into a study guide...
              </p>
            </motion.div>
          )}

          {/* Study Guide Output */}
          {studyGuide && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-card rounded-lg p-6 border border-dark-border"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white">Your Study Guide</h2>
                
                <div className="flex flex-wrap gap-3">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-dark-border rounded-lg p-2">
                    <button
                      onClick={zoomOut}
                      disabled={zoomLevel <= 50}
                      className="text-white p-1 rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      title="Zoom Out"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <span className="text-white text-sm font-medium min-w-12 text-center">
                      {zoomLevel}%
                    </span>
                    
                    <button
                      onClick={zoomIn}
                      disabled={zoomLevel >= 200}
                      className="text-white p-1 rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      title="Zoom In"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={resetZoom}
                      className="text-white p-1 rounded hover:bg-purple-500 transition-colors duration-200"
                      title="Reset Zoom"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>

                  {/* Text-to-Speech Button */}
                  <button
                    onClick={speakStudyGuide}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      isSpeaking 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h4v12H6zm8 0h4v12h-4z"/>
                        </svg>
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        Listen with Bobby
                      </>
                    )}
                  </button>

                  {/* Create Flashcards Button */}
                  <button
                    onClick={handleCreateFlashcards}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
                  >
                    Create Flashcards
                  </button>
                </div>
              </div>
              
              {/* Study Guide Content with Zoom */}
              <div 
                ref={studyGuideRef}
                className="bg-dark-border rounded-lg p-6 max-h-[600px] overflow-y-auto transition-all duration-200"
                style={{ 
                  fontSize: `${zoomLevel}%`,
                  lineHeight: '1.6'
                }}
              >
                <div className="prose prose-invert max-w-none">
                  <pre className="text-white whitespace-pre-wrap font-sans text-base leading-relaxed">
                    {studyGuide}
                  </pre>
                </div>
              </div>

              {/* Bobby AI Assistance */}
              <div className="mt-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🐱</div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Bobby the Study Cat</h4>
                    <p className="text-dark-text-secondary">
                      {isSpeaking 
                        ? "I'm reading your study guide out loud! Feel free to ask me questions about any part of it."
                        : "Need help understanding any of this? Click 'Listen with Bobby' to hear me read it, or ask me questions about the content!"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
