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
      // Simulate AI processing - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Detailed mock study guide
      const detailedStudyGuide = `# 📚 Comprehensive Study Guide
*Generated from your content on ${new Date().toLocaleDateString()}*

## 🎯 Executive Summary
This study guide provides an in-depth analysis of the key concepts, theories, and practical applications found in your submitted materials. The content has been organized to facilitate optimal learning and retention.

---

## 🔍 Detailed Content Analysis

### Core Concepts Identified
1. **Fundamental Principles**
   - Foundational theories that form the basis of understanding
   - Key definitions and terminology with contextual explanations
   - Interconnected relationships between different concepts

2. **Advanced Applications**
   - Real-world implementations of theoretical concepts
   - Problem-solving methodologies and approaches
   - Case studies and practical examples

3. **Critical Thinking Components**
   - Analytical frameworks for evaluation
   - Comparative analysis between different approaches
   - Synthesis of multiple information sources

---

## 📖 Chapter-by-Chapter Breakdown

### Chapter 1: Foundational Knowledge
**Key Topics:**
- Introduction to core principles and definitions
- Historical context and development of concepts
- Basic applications and examples

**Detailed Explanations:**
Each foundational concept is explored in depth, with multiple examples demonstrating practical applications. The relationships between different elements are clearly mapped to show how they interact within the broader framework.

### Chapter 2: Intermediate Concepts  
**Key Topics:**
- Building upon foundational knowledge
- Introducing complexity and nuance
- Developing analytical skills

**Learning Objectives:**
- Understand how basic principles scale to more complex scenarios
- Develop critical thinking skills for problem analysis
- Learn to identify patterns and relationships

### Chapter 3: Advanced Applications
**Key Topics:**
- Complex problem-solving techniques
- Integration of multiple concepts
- Real-world implementation strategies

**Practical Exercises:**
- Step-by-step problem-solving guides
- Case study analysis frameworks
- Application scenarios with detailed solutions

---

## 🧠 Learning Strategies

### Active Recall Techniques
1. **Self-Testing Methods**
   - Create your own questions based on the material
   - Use spaced repetition for long-term retention
   - Practice explaining concepts aloud

2. **Concept Mapping**
   - Visual organization of information
   - Relationship identification between topics
   - Hierarchical structuring of knowledge

### Study Session Planning
- **25-minute focused sessions** followed by 5-minute breaks
- **Weekly review cycles** to reinforce learning
- **Progressive complexity** building from simple to complex

---

## 📝 Practice Questions & Exercises

### Multiple Choice Questions
1. **Which of the following best describes [Key Concept]?**
   A) Basic explanation
   B) Intermediate understanding  
   C) Advanced application
   D) Comprehensive definition

   *Answer with detailed explanation: The correct answer is D because it encompasses all aspects of the concept while providing contextual understanding.*

2. **How does [Concept A] relate to [Concept B]?**
   *Analysis: This relationship is crucial because it demonstrates the interconnected nature of the subject matter and shows how foundational knowledge supports advanced applications.*

### Essay Questions
1. **"Discuss the impact of [Major Theme] on modern applications"**
   *Guidelines:*
   - Provide historical context
   - Analyze current implementations
   - Predict future developments
   - Support arguments with specific examples

2. **"Compare and contrast [Theory X] with [Theory Y]"**
   *Framework:*
   - Similarities in fundamental principles
   - Differences in application and scope
   - Relative strengths and limitations
   - Contextual appropriateness

---

## 🔬 Advanced Topics & Extensions

### Research Directions
- Current gaps in understanding
- Emerging trends and developments
- Potential areas for further investigation

### Interdisciplinary Connections
- How this subject relates to other fields
- Cross-disciplinary applications
- Integrated problem-solving approaches

---

## 💡 Study Tips & Best Practices

### Effective Learning Strategies
- **Distributed Practice**: Spread study sessions over time rather than cramming
- **Interleaving**: Mix different types of problems and concepts during study sessions
- **Elaboration**: Explain concepts in your own words and connect them to existing knowledge
- **Concrete Examples**: Use specific instances to understand abstract concepts
- **Dual Coding**: Combine verbal and visual representations of information

### Common Pitfalls to Avoid
- Passive reading without engagement
- Focusing only on familiar topics
- Neglecting to test understanding
- Studying while distracted or multitasking

---

## 🎓 Assessment Preparation

### Exam Strategies
- Time management techniques
- Question analysis methods
- Answer structuring approaches
- Stress management during assessments

### Performance Optimization
- Pre-test preparation routines
- During-test problem-solving strategies
- Post-test review and improvement plans

---

## 📚 Additional Resources

### Recommended Reading
- Primary source materials
- Supplementary textbooks
- Online learning platforms
- Research papers and articles

### Support Materials
- Practice problem sets
- Interactive learning tools
- Video explanations
- Study group guidelines

---

*This study guide was AI-generated based on your specific content and is designed to be a comprehensive learning companion. Regular review and active engagement with the material will maximize your understanding and retention.*`

      setStudyGuide(detailedStudyGuide)
    } catch (error) {
      console.error('Error generating study guide:', error)
      alert('Failed to generate study guide. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateFlashcards = () => {
    if (!studyGuide) {
      alert('Please generate a study guide first')
      return
    }
    // Navigate to flashcards with the study guide content
    router.push('/flashcards?content=' + encodeURIComponent(studyGuide))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
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
            <h2 className="text-xl font-semibold text-white mb-4">Create Comprehensive Study Guide</h2>
            
            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-white mb-2">Paste your textbook content, notes, or study materials:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your complete textbook chapters, detailed notes, research papers, or any educational content here. The more detailed your input, the more comprehensive your study guide will be."
                className="w-full h-40 bg-dark-border border border-dark-border rounded-lg p-4 text-white placeholder-dark-text-secondary focus:border-purple-400 focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-white mb-2">Upload supporting files:</label>
              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={triggerFileInput}
                  className="flex items-center space-x-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors duration-200 font-semibold"
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

            {/* Generate Button */}
            <button
              onClick={handleGenerateStudyGuide}
              disabled={isGenerating || (!inputText.trim() && uploadedFiles.length === 0)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isGenerating ? '🧠 Generating Comprehensive Study Guide...' : '🚀 Generate Detailed Study Guide'}
            </button>
          </motion.div>

          {/* Loading State */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-card rounded-lg p-8 border border-dark-border mb-6 text-center"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h3 className="text-white text-xl font-semibold mb-2">Bobby is creating your comprehensive study guide</h3>
              <p className="text-dark-text-secondary text-lg">
                Analyzing your content, identifying key concepts, and organizing detailed explanations...
              </p>
              <div className="mt-4 text-purple-400">
                <p>✓ Processing uploaded files</p>
                <p>✓ Extracting key concepts</p>
                <p>✓ Generating detailed explanations</p>
                <p>✓ Creating practice questions</p>
              </div>
            </motion.div>
          )}

          {/* Study Guide Output */}
          {studyGuide && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-card rounded-lg p-6 border border-dark-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Your Comprehensive Study Guide</h2>
                <button
                  onClick={handleCreateFlashcards}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-lg"
                >
                  🎴 Create Flashcards from This Guide
                </button>
              </div>
              
              <div className="bg-dark-border rounded-lg p-8 max-h-[600px] overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                  {studyGuide.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-3xl font-bold text-purple-400 mt-6 mb-4 border-b border-purple-400 pb-2">{line.replace('# ', '')}</h1>
                    } else if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-2xl font-bold text-pink-400 mt-6 mb-3">{line.replace('## ', '')}</h2>
                    } else if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-xl font-bold text-blue-400 mt-4 mb-2">{line.replace('### ', '')}</h3>
                    } else if (line.startsWith('- **')) {
                      return <li key={index} className="text-white text-lg mb-2 ml-4"><strong>{line.replace('- **', '').replace('**', '')}</strong></li>
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="text-white text-lg mb-2 ml-4">{line.replace('- ', '')}</li>
                    } else if (line.startsWith('1. ')) {
                      return <li key={index} className="text-white text-lg mb-2 ml-4">{line.replace('1. ', '')}</li>
                    } else if (line.startsWith('**')) {
                      return <p key={index} className="text-white text-lg font-semibold mb-3">{line.replace(/\*\*/g, '')}</p>
                    } else if (line.trim() === '---') {
                      return <hr key={index} className="my-6 border-gray-600" />
                    } else if (line.trim()) {
                      return <p key={index} className="text-white text-lg mb-4 leading-relaxed">{line}</p>
                    } else {
                      return <br key={index} />
                    }
                  })}
                </div>
              </div>

              {/* Bobby AI Assistance */}
              <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-400/30">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">🐱</div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-xl mb-3">Bobby the Study Assistant</h4>
                    <p className="text-dark-text-secondary text-lg mb-4">
                      Need help understanding any part of this study guide? I can:
                    </p>
                    <ul className="text-dark-text-secondary text-lg space-y-2">
                      <li>• Explain complex concepts in simpler terms</li>
                      <li>• Provide additional examples and analogies</li>
                      <li>• Help you create a study schedule</li>
                      <li>• Generate practice tests and quizzes</li>
                      <li>• Answer specific questions about the content</li>
                    </ul>
                    <div className="mt-4 p-4 bg-purple-500/20 rounded-lg">
                      <p className="text-white font-semibold">Just ask me anything about your study material!</p>
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
