import React, { createContext, useContext, useState } from 'react'

export const RoleContext = createContext()

export const ROLES = {
  ADMIN: {
    id: 'Admin',
    name: 'Executive Administrator',
    badge: '👑 Executive',
    color: '#0284c7',
    description: 'Full executive control, high-value approvals, corporate dossier management & user administration.'
  },
  TENDERS_MANAGER: {
    id: 'Tenders_Manager',
    name: 'Tenders & Sales Manager',
    badge: '📈 Bidding & Sales',
    color: '#16a34a',
    description: 'Client relationship, sales quotes, client LPOs, and deliverable invoicing.'
  },
  PROCUREMENT_OFFICER: {
    id: 'Procurement_Officer',
    name: 'Procurement & Logistics Officer',
    badge: '📦 Supply Chain',
    color: '#d97706',
    description: 'Supplier RFQs, raising POs, logging site GRNs, and inventory stock management.'
  },
  SITE_ENGINEER: {
    id: 'Site_Engineer',
    name: 'Site Engineer / QA/QC Manager',
    badge: '👷 Field Operations',
    color: '#9333ea',
    description: 'Site progress reports, QA/QC checklists, deliverable proof upload, daily logs & variation orders.'
  },
  ACCOUNTANT: {
    id: 'Accountant',
    name: 'Finance & Treasury Accountant',
    badge: '💳 Finance & Audit',
    color: '#059669',
    description: 'AI 3-Way Match engine, supplier invoice processing, treasury payments & cashflow forecasting.'
  }
}

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('Admin') // Default: Executive Administrator

  const getRoleDetails = () => {
    return Object.values(ROLES).find(r => r.id === currentRole) || ROLES.ADMIN
  }

  const canAccessModule = (moduleName) => {
    if (currentRole === 'Admin') return true
    if (moduleName === 'tenders' && (currentRole === 'Tenders_Manager' || currentRole === 'Site_Engineer')) return true
    if (moduleName === 'procurement' && (currentRole === 'Procurement_Officer' || currentRole === 'Accountant')) return true
    if (moduleName === 'finances' && currentRole === 'Accountant') return true
    if (moduleName === 'corporate' && (currentRole === 'Tenders_Manager' || currentRole === 'Procurement_Officer')) return true
    return false
  }

  return (
    <RoleContext.Provider value={{
      currentRole,
      setCurrentRole,
      getRoleDetails,
      canAccessModule,
      ROLES
    }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
