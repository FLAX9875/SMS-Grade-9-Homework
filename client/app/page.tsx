'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { formatDistanceToNow, format } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz'
import HomeworkCard from './components/HomeworkCard'
import HomeworkModal from './components/HomeworkModal'
import Header from './components/Header'

interface Homework {
  _id: string
  title: string
  subject: string
  dueDate: string
  description: string
  status: 'Done' | 'Not Done'
  completedBy: Array<{
    username: string
    completedAt: string
  }>
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const WINNIPEG_TIMEZONE = 'America/Winnipeg'

export default function Home() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [activeTab, setActiveTab] = useState<'main' | 'done'>('main')

  // Get or set username
  useEffect(() => {
    const savedUsername = localStorage.getItem('homework-username')
    if (savedUsername) {
      setUsername(savedUsername)
    } else {
      const newUsername = prompt('Enter your name for the homework tracker:') || 'Student'
      setUsername(newUsername)
      localStorage.setItem('homework-username', newUsername)
    }
  }, [])

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

  useEffect(() => {
    fetchHomework()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHomework, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleCardClick = (homework: Homework) => {
    setSelectedHomework(homework)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHomework(null)
  }

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    try {
      if (!username) return
      
      // Use personal completion API
      await axios.post(`${API_URL}/api/homework/${id}/complete`, { username })
      
      // Update local state to reflect personal completion
      setHomework(prev => prev.map(item => {
        if (item._id === id) {
          const isCompleted = item.completedBy.some(completion => completion.username === username)
          if (isCompleted) {
            // Remove from personal completion
            return {
              ...item,
              completedBy: item.completedBy.filter(completion => completion.username !== username)
            }
          } else {
            // Add to personal completion
            return {
              ...item,
              completedBy: [...item.completedBy, { username, completedAt: new Date().toISOString() }]
            }
          }
        }
        return item
      }))
    } catch (error) {
      console.error('Error updating homework status:', error)
    }
  }

  const getStatusColor = (homework: Homework) => {
    const isPersonallyCompleted = homework.completedBy.some(completion => completion.username === username)
    return isPersonallyCompleted ? 'text-green-400' : 'text-red-400'
  }

  const getPersonalStatus = (homework: Homework) => {
    const isPersonallyCompleted = homework.completedBy.some(completion => completion.username === username)
    return isPersonallyCompleted ? 'Done' : 'Not Done'
  }

  const getUrgencyColor = (dueDate: string) => {
    const due = new Date(dueDate)
    const nowWinnipeg = utcToZonedTime(new Date(), WINNIPEG_TIMEZONE)
    const dueWinnipeg = utcToZonedTime(due, WINNIPEG_TIMEZONE)
    const diffDays = Math.ceil((dueWinnipeg.getTime() - nowWinnipeg.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-500' // Overdue
    if (diffDays <= 1) return 'text-red-400' // Due today/tomorrow
    if (diffDays <= 3) return 'text-yellow-400' // Due soon
    return 'text-gray-400' // Not urgent
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">Loading homework...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold text-white mb-2">SMS Grade 9 Homework</h1>
          <p className="text-dark-text-secondary text-sm">
            {homework.length} assignment{homework.length !== 1 ? 's' : ''} total
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-dark-card p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'main'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-dark-text-secondary hover:text-white hover:bg-dark-border'
              }`}
            >
              Main
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'done'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'text-dark-text-secondary hover:text-white hover:bg-dark-border'
              }`}
            >
              Done
            </button>
          </div>
        </motion.div>

        {homework.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-white mb-2">No homework!</h2>
            <p className="text-dark-text-secondary">
              Add homework using the Discord bot or wait for assignments to be added.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {homework
                .filter(item => {
                  const isPersonallyCompleted = item.completedBy.some(completion => completion.username === username)
                  if (activeTab === 'main') {
                    // Show items that are not personally completed
                    return !isPersonallyCompleted
                  } else {
                    // Show items that are personally completed
                    return isPersonallyCompleted
                  }
                })
                .map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <HomeworkCard
                    homework={item}
                    onClick={() => handleCardClick(item)}
                    onStatusToggle={() => handleStatusToggle(item._id, getPersonalStatus(item))}
                    getStatusColor={getStatusColor}
                    getUrgencyColor={getUrgencyColor}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Show message when no items in current tab */}
        {homework.length > 0 && homework.filter(item => {
          const isPersonallyCompleted = item.completedBy.some(completion => completion.username === username)
          if (activeTab === 'main') {
            return !isPersonallyCompleted
          } else {
            return isPersonallyCompleted
          }
        }).length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">
              {activeTab === 'main' ? '🎉' : '✅'}
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">No homework!</h2>
            <p className="text-dark-text-secondary">
              {activeTab === 'main' 
                ? 'You have no pending homework assignments.' 
                : 'No homework! Woohoo, you rock!'}
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer with credit */}
      <footer className="mt-16 py-8 border-t border-dark-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-dark-text-secondary text-sm">
            Created by <span className="text-white font-medium">Zaire</span> • SMS Grade 9 Homework 
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {isModalOpen && selectedHomework && (
          <HomeworkModal
            homework={selectedHomework}
            onClose={handleCloseModal}
            onStatusToggle={() => handleStatusToggle(selectedHomework._id, getPersonalStatus(selectedHomework))}
            getStatusColor={getStatusColor}
            getUrgencyColor={getUrgencyColor}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
