'use client'

import { useNotification } from './NotificationContext'
import Notification from './Notification'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map((notification, index) => (
        <div key={notification.id} className="pointer-events-auto" style={{ marginTop: `${index * 0.5}rem` }}>
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  )
}

