'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-dark-card border-b border-dark-border"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Homework Tracker</h1>
            <p className="text-dark-text-secondary mt-1">
              Stay organized with your assignments
            </p>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-dark-text-secondary">Auto-refresh</p>
              <p className="text-xs text-gray-500">Every 30 seconds</p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
