import React, { createContext, useContext, useState } from 'react'
import type { RiskLevel } from '../utils/risk'

type RiskContextType = {
  risk: RiskLevel
  setRisk: (r: RiskLevel) => void
}

const RiskContext = createContext<RiskContextType | undefined>(undefined)

export function RiskProvider({ children }: { children: React.ReactNode }) {
  const [risk, setRisk] = useState<RiskLevel>('low')
  return <RiskContext.Provider value={{ risk, setRisk }}>{children}</RiskContext.Provider>
}

export function useRisk() {
  const ctx = useContext(RiskContext)
  if (!ctx) throw new Error('useRisk must be used within RiskProvider')
  return ctx
}

export default RiskContext
