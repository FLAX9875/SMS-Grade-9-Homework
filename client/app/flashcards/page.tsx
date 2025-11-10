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
  const [numQuestions, setNumQuestions] = useState(10)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const content = searchParams.get('content')
    if (content) {
      setInputText(decodeURIComponent(content))
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

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content || '')
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file)
      } else {
        reader.readAsDataURL(file)
      }
    })
  }

  const extractTextFromFiles = async (files: File[]): Promise<string> => {
    let extractedText = ''
    
    for (const file of files) {
      try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const content = await readFileContent(file)
          extractedText += `\n\n--- Content from ${file.name} ---\n${content}`
        } else {
          extractedText += `\n\n--- File: ${file.name} (${file.type}) - Please process this file content manually ---`
        }
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error)
        extractedText += `\n\n--- Error reading file: ${file.name} ---`
      }
    }
    
    return extractedText
  }

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) {
      alert('Please enter text or upload files to generate flashcards')
      return
    }

    setIsGenerating(true)
    
    try {
      let content = inputText
      
      if (uploadedFiles.length > 0) {
        const fileContent = await extractTextFromFiles(uploadedFiles)
        content += fileContent
      }

      const generatedFlashcards = generateFlashcardsFromContent(content, numQuestions)
      setFlashcards(generatedFlashcards)
    } catch (error) {
      console.error('Error generating flashcards:', error)
      alert('Failed to generate flashcards. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFlashcardsFromContent = (content: string, count: number) => {
    const lines = content.split('\n')
    const flashcards = []
    let keyTerms: Array<{term: string, definition: string}> = []
    let regions: Array<{name: string, description: string}> = []
    let climateRegions: Array<{name: string, characteristics: string}> = []
    let facts: string[] = []

    let currentSection = ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine.includes('Key Terms/Concepts')) {
        currentSection = 'terms'
        continue
      } else if (trimmedLine.includes('Key Regions')) {
        currentSection = 'regions'
        continue
      } else if (trimmedLine.includes('Key Climate Regions')) {
        currentSection = 'climate'
        continue
      } else if (trimmedLine.includes('Facts to Memorize') || trimmedLine.includes('Cause and Effect')) {
        currentSection = 'facts'
        continue
      }

      if (currentSection === 'terms' && trimmedLine.includes(':')) {
        const [term, definition] = trimmedLine.split(':').map(s => s.trim())
        if (term && definition) {
          keyTerms.push({ term, definition })
        }
      } else if (currentSection === 'regions' && trimmedLine.includes('\t')) {
        const [name, description] = trimmedLine.split('\t').map(s => s.trim())
        if (name && description && name !== 'Region') {
          regions.push({ name, description })
        }
      } else if (currentSection === 'climate' && trimmedLine.includes('\t')) {
        const [name, characteristics] = trimmedLine.split('\t').map(s => s.trim())
        if (name && characteristics && name !== 'Climate Region') {
          climateRegions.push({ name, characteristics })
        }
      } else if (currentSection === 'facts' && (trimmedLine.includes('-') || trimmedLine.includes('•'))) {
        facts.push(trimmedLine.replace('-', '').replace('•', '').trim())
      }
    }

    let id = 1

    keyTerms.slice(0, Math.min(count, keyTerms.length)).forEach(term => {
      flashcards.push({
        id: id++,
        front: `What is the definition of "${term.term}"?`,
        back: term.definition
      })
    })

    const remainingSlots = count - flashcards.length
    if (remainingSlots > 0) {
      regions.slice(0, Math.min(remainingSlots, regions.length)).forEach(region => {
        flashcards.push({
          id: id++,
          front: `Describe the ${region.name} region.`,
          back: region.description
        })
      })
    }

    const moreSlots = count - flashcards.length
    if (moreSlots > 0) {
      climateRegions.slice(0, Math.min(moreSlots, climateRegions.length)).forEach(climate => {
        flashcards.push({
          id: id++,
          front: `What are the characteristics of the ${climate.name} climate region?`,
          back: climate.characteristics
        })
      })
    }

    const finalSlots = count - flashcards.length
    if (finalSlots > 0) {
      facts.slice(0, Math.min(finalSlots, facts.length)).forEach(fact => {
        flashcards.push({
          id: id++,
          front: `What is this fact about: "${fact.substring(0, 50)}..."?`,
          back: fact
        })
      })
    }

    while (flashcards.length < count) {
      flashcards.push({
        id: id++,
        front: `Study question ${id} about the provided content`,
        back: 'Review your study materials for this information'
      })
    }

    return flashcards
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-card rounded-lg p-6 border border-dark-border mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Create Flashcards</h2>
            
            <div className="mb-4">
              <label className="block text-white mb-2">Paste your study materials:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your notes, study guide, or any content here..."
                className="w-full h-32 bg-dark-border border border-dark-border rounded-lg p-4 text-white placeholder-dark-text-secondary focus:border-blue-400 focus:outline-none transition-colors duration-200"
              />
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2">Number of flashcards to generate:</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="bg-dark-border border border-dark-border rounded-lg p-3 text-white focus:border-blue-400 focus:outline-none transition-colors duration-200"
              >
                <option value={5}>5 flashcards</option>
                <option value={10}>10 flashcards</option>
                <option value={15}>15 flashcards</option>
                <option value={20}>20 flashcards</option>
                <option value={25}>25 flashcards</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-white mb-2">Or upload files:</label>
              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={triggerFileInput}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
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
              onClick={handleGenerateFlashcards}
              disabled={isGenerating || (!inputText.trim() && uploadedFiles.length === 0)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Flashcards...' : `Generate ${numQuestions} Flashcards`}
            </button>
          </motion.div>

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-card rounded-lg p-8 border border-dark-border mb-6 text-center"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-white text-lg font-semibold mb-2">Creating your flashcards</h3>
              <p className="text-dark-text-secondary">
                Generating {numQuestions} flashcards from your content...
              </p>
            </motion.div>
          )}

          {flashcards.length > 0 && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Your Flashcards</h2>
                <p className="text-dark-text-secondary">Click the card to flip it</p>
              </div>

              <div className="mb-8">
                <div 
                  className="relative w-full h-64 cursor-pointer mx-auto"
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className={`relative w-full h-full transition-transform duration-500`}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    <div 
                      className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg flex items-center justify-center p-6"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-white text-center text-lg font-medium">
                        {flashcards[currentCard].front}
                      </div>
                    </div>
                    
                    <div 
                      className="absolute w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg flex items-center justify-center p-6"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="text-white text-center text-lg font-medium">
                        {flashcards[currentCard].back}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={prevCard}
                  className="bg-dark-card text-white px-6 py-3 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200"
                >
                  Previous
                </button>
                
                <span className="text-white font-semibold">
                  {currentCard + 1} / {flashcards.length}
                </span>
                
                <button
                  onClick={nextCard}
                  className="bg-dark-card text-white px-6 py-3 rounded-lg border border-dark-border hover:border-blue-400 transition-colors duration-200"
                >
                  Next
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/30">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🐱</div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Bobby the Study Cat</h4>
                    <p className="text-dark-text-secondary">
                      Need help with these flashcards? Ask me anything about the content!
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
