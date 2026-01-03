import React from 'react'

export default function RiskBadge({level='low', children}:{level?:'low'|'high', children:React.ReactNode}){
  const cls = `risk ${level==='low'? 'low':'high'}`
  return <span className={cls}>{children}</span>
}
