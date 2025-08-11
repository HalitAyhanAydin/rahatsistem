'use client'

import React, { useState, useEffect } from 'react'
import HierarchyView from '@/components/HierarchyView'
import SyncControls from '@/components/SyncControls'

export default function Home() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [hierarchy, setHierarchy] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch accounts and hierarchy
      const [accountsRes, hierarchyRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/accounts/hierarchy')
      ])
      
      if (accountsRes.ok && hierarchyRes.ok) {
        const accountsData = await accountsRes.json()
        const hierarchyData = await hierarchyRes.json()
        
        setAccounts(accountsData)
        setHierarchy(hierarchyData)
      } else {
        console.error('Error fetching data')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      const response = await fetch('/api/sync', { method: 'POST' })
      if (response.ok) {
        setLastSync(new Date())
        await fetchData()
      }
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Test API Veri Dökümantasyonu
            </h1>
            <SyncControls onSync={handleSync} lastSync={lastSync} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Hesap Kodları Hierarchical Görünümü
            </h2>
            <p className="text-sm text-gray-600">
              Toplam {accounts.length} hesap kodu bulunmaktadır.
            </p>
          </div>
          
          <HierarchyView hierarchy={hierarchy} />
        </div>
      </main>
    </div>
  )
}
