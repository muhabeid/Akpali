import React, { createContext, useContext, useState, useEffect } from 'react'

export const RoleContext = createContext()

export const STANDARD_ROLES = {
  ADMIN: {
    id: 'Admin',
    name: 'Executive Administrator',
    badge: '👑 Admin',
    color: '#0284c7',
    description: 'Full executive access, high-value approvals, corporate hub administration, dossiers & user management.',
    tasks: [
      'Full System Oversight & Executive Dashboards',
      'Corporate Hub Administration (Bank Accounts, Directors, Statutory Licenses)',
      'High-Value Contract & Purchase Order Approvals',
      'Exporting Qualification Dossiers & Managing User Access'
    ]
  },
  OPERATIONS: {
    id: 'Operations',
    name: 'Operations Manager (Tenders, Sales & Site Works)',
    badge: '🏗️ Operations',
    color: '#16a34a',
    description: 'Manages bidding, client sales quotes, LPOs, site execution, QA/QC reports, and deliverable fulfillment.',
    tasks: [
      'Creating Tenders, Sales Quotations (SQ) & Client Delivery Notes',
      'Recording incoming Client Local Purchase Orders (LPO)',
      'Uploading site deliverable evidence, photo proof & milestone fulfillment',
      'Generating QA/QC Inspection Forms, Site Visit Reports, Daily Logs & Variation Orders'
    ]
  },
  PROCUREMENT_FINANCE: {
    id: 'Procurement_Finance',
    name: 'Procurement & Finance Manager',
    badge: '💳 Procurement & Finance',
    color: '#d97706',
    description: 'Handles supplier RFQs, POs, site GRNs, inventory stock, AI 3-Way Matching, invoices & treasury cashflow.',
    tasks: [
      'Sourcing Supplier RFQs, raising Purchase Orders (PO) & Store Stock Requisitions',
      'Logging Goods Received Notes (GRN) & verified site material receipts',
      'Running AI 3-Way Match Verification (PO vs GRN vs Invoice)',
      'Processing Supplier Invoices, Treasury Accounts & 30/60/90-Day Cashflow Analytics'
    ]
  }
}

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('Admin')
  const [allRoles, setAllRoles] = useState(() => {
    const saved = localStorage.getItem('akpali_custom_roles')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { ...STANDARD_ROLES, ...parsed }
      } catch (e) {
        return STANDARD_ROLES
      }
    }
    return STANDARD_ROLES
  })

  useEffect(() => {
    // Persist custom roles
    const customOnly = {}
    Object.keys(allRoles).forEach(key => {
      if (!STANDARD_ROLES[key]) {
        customOnly[key] = allRoles[key]
      }
    })
    localStorage.setItem('akpali_custom_roles', JSON.stringify(customOnly))
  }, [allRoles])

  const addCustomRole = (newRole) => {
    const key = newRole.id.toUpperCase()
    setAllRoles(prev => ({
      ...prev,
      [key]: newRole
    }))
  }

  const getRoleDetails = (roleId = currentRole) => {
    const found = Object.values(allRoles).find(r => r.id.toLowerCase() === roleId.toLowerCase())
    return found || STANDARD_ROLES.ADMIN
  }

  const canAccessModule = (moduleName) => {
    if (currentRole === 'Admin') return true
    if (moduleName === 'tenders' && (currentRole === 'Operations')) return true
    if (moduleName === 'procurement' && (currentRole === 'Procurement_Finance')) return true
    if (moduleName === 'finances' && (currentRole === 'Procurement_Finance')) return true
    if (moduleName === 'corporate' && (currentRole === 'Operations' || currentRole === 'Procurement_Finance')) return true
    return true // Default open for custom roles
  }

  return (
    <RoleContext.Provider value={{
      currentRole,
      setCurrentRole,
      getRoleDetails,
      canAccessModule,
      addCustomRole,
      ROLES: allRoles
    }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
