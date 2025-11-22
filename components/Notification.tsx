'use client'

import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Notification({ message, type, onClose }: NotificationProps) {
  const typeStyles = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-300',
      iconBg: 'bg-green-500',
      text: 'text-green-900',
      title: 'text-green-800',
      button: 'text-green-700 hover:bg-green-100',
      icon: CheckCircle2,
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-300',
      iconBg: 'bg-red-500',
      text: 'text-red-900',
      title: 'text-red-800',
      button: 'text-red-700 hover:bg-red-100',
      icon: XCircle,
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
      border: 'border-blue-300',
      iconBg: 'bg-blue-500',
      text: 'text-blue-900',
      title: 'text-blue-800',
      button: 'text-blue-700 hover:bg-blue-100',
      icon: Info,
    },
  }

  const styles = typeStyles[type]
  const Icon = styles.icon

  return (
    <div
      className={`relative min-w-[360px] max-w-md rounded-xl border-2 ${styles.border} ${styles.bg} shadow-2xl transform transition-all duration-300`}
      style={{
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="p-5 flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center shadow-md`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 pt-0.5">
          <p className={`font-bold text-base mb-1 ${styles.title}`}>
            {type === 'success' ? 'Success!' : type === 'error' ? 'Error' : 'Information'}
          </p>
          <p className={`text-sm leading-relaxed ${styles.text} font-medium`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 w-7 h-7 rounded-full ${styles.button} flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
