// components/StudySession.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Target, 
  Timer, 
  Trophy, 
  RotateCcw,
  Play,
  Pause,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import axios from 'axios' // ADD THIS IMPORT
