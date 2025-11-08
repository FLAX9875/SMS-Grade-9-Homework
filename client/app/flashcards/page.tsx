'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function FlashcardsPage() {
  const router = useRouter()
  const [isFlipped, setIsFlipped] = useState(false)

  // Sample flashcards data
  const sampleFlashcards = [
    { id: 1, front: "What is the capital of France?", back: "Paris" },
    { id: 2, front: "What is 2 + 2?", back: "4" },
    { id: 3, front: "What is the chemical symbol for water?", back: "H₂O" }
  ]

  const [currentCard, setCurrentCard] = useState(0)

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % sampleFlashcards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + sampleFlashcards.length) % sampleFlashcards.length)
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Interactive Flashcards</h2>
            <p className="text-dark-text-secondary">Click the card to flip it</p>
          </div>

          {/* Flashcard */}
          <div className="mb-8">
            <motion.div
              className="cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 h-64 rounded-xl shadow-lg flex items-center justify-center p-6">
                <div className="text-white text-center text-xl font-medium">
                  {isFlipped 
                    ? sampleFlashcards[currentCard].back 
                    : sampleFlashcards[currentCard].front
                  }
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevCard}
              className="bg-dark-card text-white px-6 py-3 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200"
            >
              Previous
            </button>
            
            <span className="text-dark-text-secondary">
              {currentCard + 1} / {sampleFlashcards.length}
            </span>
            
            <button
              onClick={nextCard}
              className="bg-dark-card text-white px-6 py-3 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200"
            >
              Next
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-dark-card rounded-lg p-6 border border-dark-border">
            <h3 className="text-white font-semibold mb-4">Flashcards Feature</h3>
            <p className="text-dark-text-secondary mb-4">
              This is a preview of the flashcards feature. In the full version, you'll be able to:
            </p>
            <ul className="text-dark-text-secondary space-y-2">
              <li>• Create custom flashcard decks</li>
              <li>• Import from study guides</li>
              <li>• Track your progress</li>
              <li>• Share decks with classmates</li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
