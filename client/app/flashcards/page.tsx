'use client'

import { useState, useEffect } from 'react'
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

  // Check for content from study guide
  useEffect(() => {
    const content = searchParams.get('content')
    if (content) {
      setInputText(content)
    }
  }, [searchParams])

  // Sample flashcards if none generated
  const sampleFlashcards = [
    { id: 1, front: "What is the capital of France?", back: "Paris" },
    { id: 2, front: "What is 2 + 2?", back: "4" },
    { id: 3, front: "What is the chemical symbol for water?", back: "H₂O" }
  ]

  const [currentCard, setCurrentCard] = useState(0)
  const currentFlashcards = flashcards.length > 0 ? flashcards : sampleFlashcards

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % currentFlashcards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + currentFlashcards.length) % currentFlashcards.length)
    setIsFlipped(false)
  }

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to generate flashcards')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock flashcard generation
      const generatedFlashcards = [
        { id: 1, front: "Key concept from your text", back: "Detailed explanation" },
        { id: 2, front: "Important term", back: "Definition and examples" },
        { id: 3, front: "Main idea", back: "Supporting details" },
        { id: 4, front: "Study question", back: "Comprehensive answer" }
      ]
      
      setFlashcards(generatedFlashcards)
    } catch (error) {
      console.error('Error generating flashcards:', error)
      alert('Failed to generate flashcards. Please try again.')
    } finally {
      setIsGenerating(false)
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
        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-card rounded-lg p-6 border border-dark-border mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Create Flashcards</h2>
            
            <div className="mb-4">
              <label className="block text-white mb-2">Paste your text or study guide:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your study guide, notes, or any content to generate flashcards from..."
                className="w-full h-32 bg-dark-border border border-dark-border rounded-lg p-4 text-white placeholder-dark-text-secondary focus:border-blue-400 focus:outline-none transition-colors duration-200"
              />
            </div>

            <button
              onClick={handleGenerateFlashcards}
              disabled={isGenerating || !inputText.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Flashcards...' : 'Generate Flashcards from Text'}
            </button>
          </motion.div>

          {/* Loading State */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-card rounded-lg p-8 border border-dark-border mb-6 text-center"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-white text-lg font-semibold mb-2">AI is creating your flashcards</h3>
              <p className="text-dark-text-secondary">
                Bobby is analyzing your content and creating effective flashcards...
              </p>
            </motion.div>
          )}

          {/* Flashcards Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">Interactive Flashcards</h2>
              <p className="text-dark-text-secondary">Click the card to flip it</p>
            </div>

            {/* Flashcard */}
            <div className="mb-8">
              <motion.div
                className="cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="relative w-full h-64">
                  {/* Front of card */}
                  <div 
                    className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg flex items-center justify-center p-6 backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-white text-center text-xl font-medium">
                      {currentFlashcards[currentCard].front}
                    </div>
                  </div>
                  
                  {/* Back of card */}
                  <div 
                    className="absolute w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg flex items-center justify-center p-6 backface-hidden"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="text-white text-center text-xl font-medium">
                      {currentFlashcards[currentCard].back}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mb-12">
              <button
                onClick={prevCard}
                className="bg-dark-card text-white px-6 py-3 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200"
              >
                Previous
              </button>
              
              <span className="text-dark-text-secondary">
                {currentCard + 1} / {currentFlashcards.length}
              </span>
              
              <button
                onClick={nextCard}
                className="bg-dark-card text-white px-6 py-3 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200"
              >
                Next
              </button>
            </div>

            {/* Bobby AI Assistance */}
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/30">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🐱</div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Bobby the Study Cat</h4>
                  <p className="text-dark-text-secondary">
                    Need help with these flashcards? Ask me to explain any concept or create more flashcards from your notes!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
