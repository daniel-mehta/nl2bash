import React from 'react'
import CommandBox from '../components/CommandBox'
import Examples from '../components/Examples'
import Assumptions from '../components/Assumptions'
import RiskBadge from '../components/RiskBadge'

export default function Page(){
  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="title">nl2bash — natural language to bash</div>
          <div className="muted">Type a request and get a suggested shell command</div>
        </div>
        <div style={{marginLeft:'auto'}}>
          <RiskBadge level="low">Low risk</RiskBadge>
        </div>
      </header>

      <div className="grid">
        <div>
          <div className="card commandBox">
            <CommandBox />
          </div>
          <div style={{height:16}} />
          <div className="card">
            <h4>Examples</h4>
            <Examples />
          </div>
        </div>

        <aside>
          <div className="card">
            <h4>Assumptions</h4>
            <Assumptions />
          </div>
        </aside>
      </div>
    </div>
  )
}
