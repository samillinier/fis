'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'
import { DataContext } from '@/context/DataContext'
import { initialData } from '@/data/mockData'

export default function Home() {
  const [data, setData] = useState(initialData)

  return (
    <DataContext.Provider value={{ data, setData }}>
      <main className="min-h-screen bg-white">
        <Dashboard />
      </main>
    </DataContext.Provider>
  )
}


