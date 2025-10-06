'use client'
import { useState } from 'react'

// A helper function to generate a unique ID
const generateId = () => Date.now()

export const useToasts = () => {
  const [toasts, setToasts] = useState<any>([])

  // Function to add a new toast
  const addToast = (message: any, options: any = {}) => {
    const id = generateId()
    const newToast = {
      id,
      message,
      ...options,
    }
    setToasts((prevToasts: any) => [...prevToasts, newToast])

    // Optional: Automatically remove the toast after a delay
    // The delay is passed in the options
    if (options.delay) {
      setTimeout(() => {
        removeToast(id)
      }, options.delay)
    }
  }

  // Function to remove a toast by its ID
  const removeToast = (id: any) => {
    setToasts((prevToasts: any) => prevToasts.filter((toast: any) => toast.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast,
  }
}
