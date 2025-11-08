'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import axios from 'axios'

// Dynamic API URL
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://sms-grade-9-homework-server.onrender.com'
}

const API_URL = getApiUrl()

interface Homework {
  _id: string
  title: string
  subject: string
  dueDate: string
  description: string
}

export default function StudyGuidesPage() {
  const router = useRouter()
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/homework`)
        setHomework(response.data)
      } catch (error) {
        console.error('Error fetching homework:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHomework()
  }, [])

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="bg-dark-card rounded-lg p-8 border border-dark-border">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-white mb-4">Study Guides Coming Soon!</h2>
            <p className="text-dark-text-secondary mb-6">
              This feature is currently under development. You'll be able to generate custom study guides based on your homework assignments.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-dark-border p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Available Homework</h3>
                {loading ? (
                  <p className="text-dark-text-secondary">Loading...</p>
                ) : homework.length > 0 ? (
                  <ul className="text-dark-text-secondary space-y-2">
                    {homework.map((item) => (
                      <li key={item._id}>• {item.title} ({item.subject})</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-dark-text-secondary">No homework available</p>
                )}
              </div>
              <div className="bg-dark-border p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Planned Features</h3>
                <ul className="text-dark-text-secondary space-y-2">
                  <li>• AI-generated study guides</li>
                  <li>• Custom topic selection</li>
                  <li>• Export to PDF</li>
                  <li>• Share with classmates</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
