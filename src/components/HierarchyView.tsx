'use client'

import React, { useState } from 'react'

interface Account {
  code: string
  total_debt: number
  children: { [key: string]: Account }
}

interface HierarchyViewProps {
  hierarchy: { [key: string]: Account }
}

const HierarchyView: React.FC<HierarchyViewProps> = ({ hierarchy }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const renderNode = (account: Account, level: number = 0) => {
    const hasChildren = Object.keys(account.children).length > 0
    const isExpanded = expandedNodes.has(account.code)
    
    const getIndentStyle = (level: number) => ({
      marginLeft: `${level * 24}px`
    })

    return (
      <div key={account.code} className="mb-2">
        <div
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            level === 0
              ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
              : level === 1
              ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500'
              : 'bg-gray-50 hover:bg-gray-100 border-l-4 border-gray-500'
          }`}
          style={getIndentStyle(level)}
          onClick={() => hasChildren && toggleNode(account.code)}
        >
          <div className="flex items-center">
            {hasChildren && (
              <span className="mr-2 text-gray-500">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            <div>
              <div className="font-medium text-gray-900">
                Hesap Kodu: {account.code}
              </div>
              {level === 0 && (
                <div className="text-sm text-gray-500">
                  1. Kırılım (İlk 3 rakam)
                </div>
              )}
              {level === 1 && (
                <div className="text-sm text-gray-500">
                  2. Kırılım (İlk 5 rakam)
                </div>
              )}
              {level === 2 && (
                <div className="text-sm text-gray-500">
                  3. Kırılım (Tam kod)
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">
              {formatCurrency(account.total_debt)}
            </div>
            <div className="text-sm text-gray-500">
              Toplam Borç
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {Object.values(account.children)
              .sort((a, b) => a.code.localeCompare(b.code))
              .map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (Object.keys(hierarchy).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Henüz veri bulunmamaktadır.</div>
        <p className="text-gray-400 mt-2">
          Lütfen verileri senkronize etmek için "Senkronize Et" butonuna tıklayın.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Hierarchical Görünüm
        </h3>
        <div className="space-y-3">
          {Object.values(hierarchy)
            .sort((a, b) => a.code.localeCompare(b.code))
            .map(account => renderNode(account, 0))}
        </div>
      </div>
    </div>
  )
}

export default HierarchyView
