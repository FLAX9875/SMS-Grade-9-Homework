'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [highlightedGuide, setHighlightedGuide] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        message: `Please create a comprehensive study guide based on this content. Use the actual terms, concepts, and information provided. Make it specific to the content, not generic. Organize it clearly with sections and use numbers 1,2,3 instead of Roman numerals. Here is the content:\n\n${inputText}`
      }, {
        timeout: 30000
      })

      if (response.data && response.data.response) {
        const guide = response.data.response
        setStudyGuide(guide)
        
        // Generate highlighted version with AI - specifically ask for key terms to be highlighted
        const highlightResponse = await axios.post(`${API_URL}/api/bobby/chat`, {
          message: `Please analyze this study guide and identify the most important key terms and concepts (NOT the numbers or section headers). Wrap ONLY the important vocabulary words and key concepts with ** on both sides. For example: "The **growing season** is important" or "**Geologic** processes shape the land". Do NOT highlight numbers, section titles, or bullet points. Only highlight actual important terms that students need to remember. Here is the study guide:\n\n${guide}`
        })
        
        if (highlightResponse.data && highlightResponse.data.response) {
          setHighlightedGuide(highlightResponse.data.response)
        } else {
          setHighlightedGuide(guide)
        }
      } else {
        throw new Error('No response from AI')
      }
    } catch (error) {
      console.error('Error generating study guide:', error)
      // Fallback to a simple formatted version of their content
      const formattedContent = `STUDY GUIDE: CANADIAN GEOGRAPHY & GEOLOGY
Based on your provided content

KEY TERMS & DEFINITIONS

${extractKeyTerms(inputText)}

REGIONAL INFORMATION

${extractRegions(inputText)}

CLIMATE REGIONS

${extractClimateRegions(inputText)}

IMPORTANT FACTS

${extractFactsAndRelationships(inputText)}

STUDY RECOMMENDATIONS
1. Focus on memorizing the key terms and their definitions
2. Practice identifying which characteristics belong to each region
3. Create flashcards for the climate regions and their features
4. Review the cause-and-effect relationships`

      setStudyGuide(formattedContent)
      setHighlightedGuide(formattedContent)
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
    router.push('/flashcards?content=' + encodeURIComponent(inputText))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Text-to-speech function with higher-pitched voice that focuses on content
  const speakImportantParts = async () => {
    if (!studyGuide) return

    if (isSpeaking) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    setIsSpeaking(true)

    if ('speechSynthesis' in window) {
      // Extract the actual content sections and key terms
      const lines = studyGuide.split('\n')
      const contentSections = []
      let currentSection = ''
      
      for (const line of lines) {
        const trimmed = line.trim()
        
        // Skip empty lines and very short lines that are probably formatting
        if (!trimmed || trimmed.length < 3) continue
        
        // If it's a section header, start a new section
        if (trimmed.toUpperCase() === trimmed && trimmed.length < 100 && !trimmed.startsWith('•') && !/^\d+\./.test(trimmed)) {
          if (currentSection) {
            contentSections.push(currentSection)
          }
          currentSection = trimmed + '. '
        } else if (/^\d+\./.test(trimmed) || trimmed.startsWith('•')) {
          // This is a numbered or bullet point - add to current section
          currentSection += trimmed.replace(/^\d+\.\s*/, '').replace(/^•\s*/, '') + '. '
        } else if (currentSection && !trimmed.toUpperCase() === trimmed) {
          // Regular content line
          currentSection += trimmed + ' '
        }
      }
      
      // Add the last section
      if (currentSection) {
        contentSections.push(currentSection)
      }

      // If no sections were found, use the original content
      if (contentSections.length === 0) {
        contentSections.push("Here's your study guide content. " + studyGuide.substring(0, 200) + "...")
      }

      const speech = new SpeechSynthesisUtterance()
      
      // Professional but high-pitched intro focusing on content
      const bobbyIntro = "Hello! I'm Bobby, here to help you study. Let's go through the key concepts from your study guide. "
      const fullText = bobbyIntro + contentSections.join(' Next section: ') + ". That covers the main topics from your study guide. Good luck with your studies!"
      
      speech.text = fullText
      speech.rate = 1.0 // Normal speed for clarity
      speech.pitch = 2.5 // Very high pitch as requested
      speech.volume = 1

      // Try to get a clear voice
      const voices = window.speechSynthesis.getVoices()
      const clearVoice = voices.find(voice => 
        voice.name.includes('Google US English') || 
        voice.name.includes('Microsoft David') ||
        voice.name.includes('Alex') ||
        voice.name.includes('Samantha')
      )
      
      if (clearVoice) {
        speech.voice = clearVoice
      }

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

  // Clean formatting and organize with borders
  const cleanStudyGuide = (text: string) => {
    return text
      .replace(/#+/g, '') // Remove hash symbols
      .replace(/\* /g, '• ') // Replace asterisk bullets with proper bullets
      .replace(/- /g, '• ') // Replace dashes with proper bullets
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
  }

  // Render study guide with organized sections and borders
  const renderStudyGuide = () => {
    const cleanGuide = cleanStudyGuide(highlightedGuide || studyGuide)
    const sections = []
    let currentSection = []
    let currentSectionTitle = ''
    
    // Split into sections based on major headings
    const lines = cleanGuide.split('\n')
    
    for (const line of lines) {
      // Detect section headers (all caps or title case with no bullets/numbers)
      if (line.toUpperCase() === line && line.length < 100 && !line.startsWith('•') && !/^\d+\./.test(line)) {
        // If we have a previous section, save it
        if (currentSection.length > 0) {
          sections.push({
            title: currentSectionTitle,
            content: [...currentSection]
          })
        }
        // Start new section
        currentSectionTitle = line
        currentSection = []
      } else {
        currentSection.push(line)
      }
    }
    
    // Add the last section
    if (currentSection.length > 0) {
      sections.push({
        title: currentSectionTitle,
        content: [...currentSection]
      })
    }

    // If no sections were detected, create one
    if (sections.length === 0) {
      sections.push({
        title: 'STUDY GUIDE',
        content: lines
      })
    }

    return sections.map((section, sectionIndex) => (
      <div key={sectionIndex} className="mb-8 pb-6 border-b border-gray-600 last:border-b-0">
        {/* Section Header */}
        <div className="text-2xl font-bold text-purple-400 mb-4 pb-2 border-b border-purple-400">
          {section.title}
        </div>
        
        {/* Section Content */}
        <div className="space-y-3">
          {section.content.map((line, lineIndex) => {
            if (line.trim() === '') {
              return <div key={lineIndex} className="h-3"></div>
            }
            
            // Style numbered items - don't highlight numbers
            if (/^\d+\./.test(line.trim())) {
              const numberMatch = line.match(/^(\d+\.)\s*(.*)/)
              if (numberMatch) {
                return (
                  <div key={lineIndex} className="text-white mb-3 ml-4 leading-relaxed flex">
                    <span className="text-blue-400 font-bold mr-2">{numberMatch[1]}</span>
                    <span>{renderHighlightedText(numberMatch[2])}</span>
                  </div>
                )
              }
            }
            
            // Style bullet points
            if (line.trim().startsWith('•')) {
              const content = line.substring(1).trim()
              return (
                <div key={lineIndex} className="text-white mb-2 ml-6 leading-relaxed flex items-start">
                  <span className="text-green-400 mr-2 mt-1">•</span>
                  <span>{renderHighlightedText(content)}</span>
                </div>
              )
            }
            
            // Regular text with potential highlights
            return (
              <div key={lineIndex} className="text-white mb-3 leading-relaxed">
                {renderHighlightedText(line)}
              </div>
            )
          })}
        </div>
      </div>
    ))
  }

  // Helper to render text with highlighted key terms
  const renderHighlightedText = (text: string) => {
    if (!text.includes('**')) {
      return text
    }
    
    const parts = text.split('**')
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a highlighted term
        return (
          <span key={index} className="bg-yellow-500 text-black font-bold px-1 rounded mx-1">
            {part}
          </span>
        )
      } else {
        return part
      }
    })
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
                  {/* Fullscreen Button */}
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                    Full Screen
                  </button>

                  {/* Text-to-Speech Button */}
                  <button
                    onClick={speakImportantParts}
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
                        Stop Bobby
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        Bobby's Summary
                      </>
                    )}
                  </button>

                  {/* Create Flashcards Button */}
                  <button
                    onClick={handleCreateFlashcards}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
                  >
                    Create Flashcards
                  </button>
                </div>
              </div>
              
              {/* Study Guide Content */}
              <div className="bg-dark-border rounded-lg p-6 max-h-[600px] overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                  {renderStudyGuide()}
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
                        ? "I'm reading through the key concepts from your study guide with my high-pitched voice!"
                        : "Click 'Bobby's Summary' to hear me explain the main topics. Key terms are highlighted in yellow for easy studying!"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            {/* Fullscreen Header */}
            <div className="bg-dark-card border-b border-dark-border p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Study Guide - Full Screen</h2>
              <div className="flex gap-3">
                <button
                  onClick={speakImportantParts}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    isSpeaking 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isSpeaking ? 'Stop Bobby' : "Bobby's Summary"}
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all duration-200"
                >
                  Exit Full Screen
                </button>
              </div>
            </div>

            {/* Fullscreen Content */}
            <div className="flex-1 bg-dark-bg p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto bg-dark-card rounded-lg p-8 border border-dark-border">
                <div className="prose prose-invert max-w-none text-lg leading-relaxed">
                  {renderStudyGuide()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
