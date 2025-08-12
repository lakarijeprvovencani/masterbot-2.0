import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

export type ChatRole = 'user' | 'assistant'
export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
}

interface ChatContextType {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  append: (msg: ChatMessage) => void
  clear: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const storageKey = useMemo(() => (user?.id ? `chat-${user.id}` : undefined), [user?.id])
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Load from sessionStorage when user changes
  useEffect(() => {
    if (!storageKey) {
      setMessages([])
      return
    }
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Omit<ChatMessage, 'timestamp'> & { timestamp: string }[]
        setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    }
  }, [storageKey])

  // Persist on change
  useEffect(() => {
    if (!storageKey) return
    const serializable = messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }))
    sessionStorage.setItem(storageKey, JSON.stringify(serializable))
  }, [messages, storageKey])

  const append = (msg: ChatMessage) => setMessages(prev => [...prev, msg])
  const clear = () => setMessages([])

  const value: ChatContextType = { messages, setMessages, append, clear }
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
