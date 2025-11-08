'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FlashcardsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isFlipped, setIsFlipped] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [inputText, setInputText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [flashcards, setFlashcards] = useState<Array<{ id: number; front: string; back: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for content from study guide
  useEffect(() => {
    const content = searchParams.get('content')
    if (content) {
      setInputText(content)
    }
  }, [searchParams])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedFiles(Array.from(files))
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) {
      alert('Please enter text or upload files to generate flashcards')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Detailed flashcard generation with comprehensive questions
      const generatedFlashcards = [
        {
          id: 1,
          front: "What are the three main categories of fundamental principles identified in the study guide, and how do they form the foundation for advanced understanding?",
          back: "The three main categories are: 1) Foundational Principles - including basic theories and key definitions that establish core understanding; 2) Advanced Applications - covering real-world implementations and problem-solving methodologies; 3) Critical Thinking Components - involving analytical frameworks and comparative analysis. These categories build upon each other hierarchically, with foundational knowledge supporting intermediate concepts, which in turn enable advanced applications and critical analysis."
        },
        {
          id: 2,
          front: "Explain the relationship between Chapter 1's foundational knowledge and Chapter 3's advanced applications. How does understanding basic principles enable complex problem-solving?",
          back: "Foundational knowledge from Chapter 1 provides the essential building blocks and conceptual framework necessary for tackling Chapter 3's advanced applications. Basic principles establish the rules, definitions, and fundamental relationships that more complex scenarios build upon. For example, understanding simple mathematical operations enables solving complex equations; knowing basic scientific principles allows for advanced experimental design. This progression ensures that complex problem-solving is grounded in verified, understood concepts rather than guesswork."
        },
        {
          id: 3,
          front: "Describe the active recall techniques recommended in the learning strategies section. Why are they more effective than passive reading for long-term retention?",
          back: "The recommended active recall techniques include: 1) Self-testing through creating personal questions and spaced repetition; 2) Concept mapping for visual organization and relationship identification; 3) Progressive complexity building in study sessions. These methods are more effective than passive reading because they force the brain to retrieve information from memory, strengthening neural pathways. Active engagement creates multiple access points to the information, making recall easier during assessments. Passive reading only creates superficial familiarity, while active recall builds durable, accessible knowledge."
        },
        {
          id: 4,
          front: "What specific strategies does the study guide recommend for distributed practice and interleaving, and what cognitive benefits do these approaches provide?",
          back: "Distributed practice involves spreading study sessions over time (e.g., 25-minute sessions with breaks) rather than cramming, which leverages the spacing effect for better long-term retention. Interleaving mixes different types of problems and concepts during study sessions, preventing reliance on context cues and promoting flexible application of knowledge. These approaches benefit cognition by: enhancing memory consolidation through repeated retrieval opportunities; developing problem-solving flexibility; reducing mental fatigue; and creating stronger, more accessible neural networks for the information."
        },
        {
          id: 5,
          front: "How do the practice questions in the assessment preparation section help bridge the gap between knowledge acquisition and practical application?",
          back: "The practice questions serve as application bridges by: 1) Testing comprehension through multiple-choice questions that require discrimination between similar concepts; 2) Developing analytical skills through essay questions that demand synthesis and evaluation; 3) Building exam confidence through familiarization with question formats; 4) Identifying knowledge gaps through immediate feedback opportunities. This approach transforms passive knowledge into active, applicable understanding by forcing learners to use information in the same ways they'll need to during actual assessments."
        },
        {
          id: 6,
          front: "What are the key differences between the 'Common Pitfalls to Avoid' and the 'Effective Learning Strategies' sections, and how do they complement each other in creating optimal study habits?",
          back: "The 'Common Pitfalls' section identifies negative behaviors to eliminate (passive reading, focusing only on familiar topics, neglecting self-testing, multitasking), while the 'Effective Strategies' provides positive alternatives to adopt (distributed practice, interleaving, elaboration, concrete examples, dual coding). They complement each other by creating a comprehensive framework: the pitfalls show what not to do, while the strategies show what to do instead. This dual approach helps students replace inefficient habits with evidence-based effective ones, addressing both the elimination of counterproductive behaviors and the implementation of beneficial ones."
        }
      ]
      
      setFlashcards(generatedFlashcards)
    } catch (error) {
      console.error('Error generating flashcards:', error)
      alert('Failed to generate flashcards. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const [currentCard, setCurrentCard] = useState(0)

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    setIsFlipped(false)
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
              <h1 className="text-2xl font-semibold text-white">Flashcards</h1>
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
            <h2 className="text-xl font-semibold text-white mb-4">Create Comprehensive Flashcards</h2>
            
            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-white mb-2">Paste your study guide, textbook content, or notes:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your detailed study materials, textbook chapters, or comprehensive notes here. The AI will create in-depth, thought-provoking flashcards that test deep understanding."
                className="w-full h-40 bg-dark-border border border-dark-border rounded-lg p-4 text-white placeholder-dark-text-secondary focus:border-blue-400 focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-white mb-2">Upload supporting files:</label>
              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={triggerFileInput}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-semibold"
                >
                  <span>📎</span>
                  <span>Choose Files</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.pages,.keynote"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-dark-text-secondary self-center">
                  Supports: PDF, Word, PowerPoint, Google Docs, Google Slides, Text files
                </span>
              </div>
              
              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="bg-dark-border rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Selected Files:</h4>
                  <ul className="text-dark-text-secondary space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateFlashcards}
              disabled={isGenerating || (!inputText.trim() && uploadedFiles.length === 0)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isGenerating ? '🧠 Generating Comprehensive Flashcards...' : '🚀 Generate Detailed Flashcards'}
            </button>
          </motion.div>

          {/* Loading State */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-card rounded-lg p-8 border border-dark-border mb-6 text-center"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-white text-xl font-semibold mb-2">Bobby is creating your comprehensive flashcards</h3>
              <p className="text-dark-text-secondary text-lg">
                Analyzing your content, identifying key concepts, and creating thought-provoking questions...
              </p>
              <div className="mt-4 text-blue-400">
                <p>✓ Processing study materials</p>
                <p>✓ Identifying critical concepts</p>
                <p>✓ Creating detailed questions</p>
                <p>✓ Generating comprehensive answers</p>
              </div>
            </motion.div>
          )}

          {/* Flashcards Display */}
          {flashcards.length > 0 && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Interactive Flashcards</h2>
                <p className="text-dark-text-secondary text-lg">Click the card to reveal the detailed answer</p>
              </div>

              {/* Flashcard */}
              <div className="mb-8 flex justify-center">
                <div 
                  className="relative w-full max-w-2xl h-96 cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className={`relative w-full h-full transition-transform duration-600`}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front of card */}
                    <div 
                      className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-2xl flex items-center justify-center p-8 backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-white text-center text-xl font-medium leading-relaxed">
                        {flashcards[currentCard].front}
                      </div>
                      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
                        Click to flip
                      </div>
                    </div>
                    
                    {/* Back of card */}
                    <div 
                      className="absolute w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-2xl flex items-center justify-center p-8 backface-hidden"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="text-white text-center text-lg font-medium leading-relaxed">
                        {flashcards[currentCard].back}
                      </div>
                      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
                        Click to flip back
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mb-12">
                <button
                  onClick={prevCard}
                  className="bg-dark-card text-white px-8 py-4 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200 text-lg font-semibold"
                >
                  ← Previous
                </button>
                
                <span className="text-white text-lg font-semibold bg-blue-500 px-4 py-2 rounded-lg">
                  {currentCard + 1} / {flashcards.length}
                </span>
                
                <button
                  onClick={nextCard}
                  className="bg-dark-card text-white px-8 py-4 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200 text-lg font-semibold"
                >
                  Next →
                </button>
              </div>

              {/* Bobby AI Assistance */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-6 border border-blue-400/30">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">🐱</div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-xl mb-3">Bobby the Study Assistant</h4>
                    <p className="text-dark-text-secondary text-lg mb-4">
                      Need help with these flashcards? I can:
                    </p>
                    <ul className="text-dark-text-secondary text-lg space-y-2">
                      <li>• Explain any concept in more detail</li>
                      <li>• Provide additional examples and context</li>
                      <li>• Create more flashcards on specific topics</li>
                      <li>• Help you understand the relationships between concepts</li>
                      <li>• Generate practice tests based on these flashcards</li>
                    </ul>
                    <div className="mt-4 p-4 bg-blue-500/20 rounded-lg">
                      <p className="text-white font-semibold">Ask me anything about the flashcard content!</p>
                    </div>
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
