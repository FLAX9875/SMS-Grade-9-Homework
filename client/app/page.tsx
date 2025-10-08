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
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const WINNIPEG_TIMEZONE = 'America/Winnipeg'

export default function Home() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      const newStatus = currentStatus === 'Done' ? 'Not Done' : 'Done'
      
      if (newStatus === 'Done') {
        // If marking as done, delete the homework
        await axios.delete(`${API_URL}/api/homework/${id}`)
        // Remove from local state immediately
        setHomework(prev => prev.filter(item => item._id !== id))
      } else {
        // If marking as not done, just update status
        await axios.put(`${API_URL}/api/homework/${id}`, { status: newStatus })
        fetchHomework() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating homework status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'Done' ? 'text-green-400' : 'text-red-400'
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
              {homework.map((item, index) => (
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
                    onStatusToggle={() => handleStatusToggle(item._id, item.status)}
                    getStatusColor={getStatusColor}
                    getUrgencyColor={getUrgencyColor}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer with credit */}
      <footer className="mt-16 py-8 border-t border-dark-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-dark-text-secondary text-sm">
            Created by <span className="text-white font-medium">Zaire</span> • SMS Grade 9 Homework Tracker
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {isModalOpen && selectedHomework && (
          <HomeworkModal
            homework={selectedHomework}
            onClose={handleCloseModal}
            onStatusToggle={() => handleStatusToggle(selectedHomework._id, selectedHomework.status)}
            getStatusColor={getStatusColor}
            getUrgencyColor={getUrgencyColor}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
