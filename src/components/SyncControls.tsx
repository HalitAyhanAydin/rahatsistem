'use client'

import React, { useState } from 'react'

interface SyncControlsProps {
  onSync: () => Promise<void>
  lastSync: Date | null
}

const SyncControls: React.FC<SyncControlsProps> = ({ onSync, lastSync }) => {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync()
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Henüz senkronize edilmedi'
    
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-600">
        <div>Son Senkronizasyon:</div>
        <div className="font-medium">{formatLastSync(lastSync)}</div>
      </div>
      
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          syncing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {syncing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Senkronize Ediliyor...
          </div>
        ) : (
          'Senkronize Et'
        )}
      </button>
    </div>
  )
}

export default SyncControls
