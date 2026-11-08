import React, { createContext, useContext, useState, useEffect } from 'react'

export const RoleContext = createContext()

export const STANDARD_ROLES = {
  ADMIN: {
    id: 'Admin',
    name: 'Executive Administrator',
    badge: '👑 Admin',
    color: '#0284c7',
    department: 'Executive Directorate',
    reportsTo: 'Board of Directors',
    description: 'Full executive oversight, high-value approvals, corporate hub administration, dossiers & user access management.',
    tasks: [
      'Full System Oversight & Executive Dashboards',
      'Corporate Hub Administration (Bank Accounts, Directors, Statutory Licenses)',
      'High-Value Contract & Purchase Order Approvals',
      'Exporting Qualification Dossiers & Managing User Access'
    ]
  },
  OPERATIONS: {
    id: 'Operations',
    name: 'Operations Manager',
    badge: '🏗️ Operations Manager',
    color: '#16a34a',
    department: 'Operations & Bidding',
    reportsTo: 'Executive Administrator (Admin)',
    description: 'Leads bidding, tender submissions, client sales quotes, LPOs, project schedules, and supervises Site Engineers.',
    tasks: [
      'Creating Tenders, Sales Quotations (SQ) & Bidding Proposals',
      'Recording incoming Client Local Purchase Orders (LPO)',
      'Supervising Site Engineers & Project Milestone Deliverables',
      'Authorizing QA/QC Inspection Reports, Site Works & Handover Certificates'
    ]
  },
  SITE_ENGINEER: {
    id: 'Site_Engineer',
    name: 'Site Engineer / Field Officer',
    badge: '👷 Site Engineer',
    color: '#059669',
    department: 'Operations & Field Execution',
    reportsTo: 'Operations Manager',
    description: 'Executes field site deliverables, milestone tracking, uploads photo proof, QA/QC checklists, and work diaries.',
    tasks: [
      'Fulfill tender milestones & upload photo/document proof',
      'Generate Site Visit Reports, Daily Work Logs & Weather Diaries',
      'Execute QA/QC Quality Assurance Inspection Checklists',
      'Submit Variation Orders (VO) & Request Handover Approvals'
    ]
  },
  PROCUREMENT_FINANCE: {
    id: 'Procurement_Finance',
    name: 'Procurement & Finance Manager',
    badge: '💳 Procurement & Finance Manager',
    color: '#d97706',
    department: 'Supply Chain & Treasury Oversight',
    reportsTo: 'Executive Administrator (Admin)',
    description: 'Oversees end-to-end supply chain, vendor RFQs, purchase orders, store inventory, accounting ledgers, and cashflow.',
    tasks: [
      'Approve supplier RFQs, material orders (PO) & store requisitions',
      'Oversee site delivery receipts (GRN) & inventory levels',
      'Supervise AI 3-Way Match Verification (PO vs GRN vs Invoice)',
      'Process supplier invoices, treasury accounts & 30/60/90-day cashflow analytics'
    ]
  },
  PROCUREMENT_OFFICER: {
    id: 'Procurement_Officer',
    name: 'Procurement Officer',
    badge: '📦 Procurement Officer',
    color: '#ea580c',
    department: 'Procurement & Supply Chain',
    reportsTo: 'Procurement & Finance Manager',
    description: 'Manages vendor relations, sourcing RFQs, issuing Purchase Orders, receiving site materials (GRN), and warehouse stock.',
    tasks: [
      'Issue Requests for Quotation (RFQ) to vendors & suppliers',
      'Raise Purchase Orders (PO) for materials, equipment & subcontracts',
      'Log Goods Received Notes (GRN) upon physical site delivery',
      'Manage warehouse stock requisitions & live inventory levels'
    ]
  },
  FINANCE_OFFICER: {
    id: 'Finance_Officer',
    name: 'Accountant / Finance Officer',
    badge: '💰 Finance Officer',
    color: '#ca8a04',
    department: 'Finance & Treasury',
    reportsTo: 'Procurement & Finance Manager',
    description: 'Maintains financial ledgers, processes incoming supplier invoices, performs AI 3-Way matching, and monitors treasury accounts.',
    tasks: [
      'Run automated AI 3-Way Match Engine (PO vs GRN vs Invoice)',
      'Record incoming Supplier Invoices & process disbursements',
      'Monitor Bank, M-Pesa & Petty Cash Treasury Account balances',
      'Generate cashflow reports, expense analytics & payment schedules'
    ]
  }
}

export const ROLES = STANDARD_ROLES

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const saved = localStorage.getItem('akpali_user_session')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.role) return parsed.role
      }
    } catch (e) {}
    return 'Admin'
  })

  useEffect(() => {
    const syncRoleFromSession = () => {
      try {
        const saved = localStorage.getItem('akpali_user_session')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.role) setCurrentRole(parsed.role)
        }
      } catch (e) {}
    }
    window.addEventListener('userSessionUpdated', syncRoleFromSession)
    window.addEventListener('storage', syncRoleFromSession)
    return () => {
      window.removeEventListener('userSessionUpdated', syncRoleFromSession)
      window.removeEventListener('storage', syncRoleFromSession)
    }
  }, [])

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
    const role = (currentRole || 'Admin').toLowerCase()
    if (role === 'admin') return true
    if (moduleName === 'dashboard') return true

    // Tenders & Projects: Operations Manager and Site Engineer
    if (moduleName === 'tenders' && (role === 'operations' || role === 'site_engineer')) return true

    // Procurement: Procurement & Finance Manager and Procurement Officer
    if (moduleName === 'procurement' && (role === 'procurement_finance' || role === 'procurement_officer')) return true

    // Corporate Bookkeeping: Procurement & Finance Manager and Finance Officer
    if (moduleName === 'finances' && (role === 'procurement_finance' || role === 'finance_officer')) return true

    // Corporate Governance Hub: EXCLUSIVELY accessible to Admin
    if (moduleName === 'corporate' && role === 'admin') return true

    return false
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
