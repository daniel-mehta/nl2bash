import React, {useState} from 'react'
import {detectRisk, RiskLevel} from '../utils/risk'

export default function CommandBox(){
  const [input,setInput] = useState('')
  const [result,setResult] = useState<string | null>(null)
  const [risk, setRisk] = useState<RiskLevel>('low')

  function handleRun(){
    const generated = `echo "You asked: ${input.replace(/"/g,'\"')}"` // placeholder: in real app call backend or use heuristic
    setResult(generated)
    setRisk(detectRisk(generated))
  }

  return (
    <div>
      <label className="muted">Describe what you want to do</label>
      <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="e.g. delete node_modules older than 30 days" />
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button className="btn" onClick={handleRun}>Generate</button>
        <button className="btn" onClick={()=>{setInput('');setResult(null)}} style={{background:'#2b2f38'}}>Clear</button>
      </div>

      {result && (
        <div className="card" style={{marginTop:12}}>
          <div className={`risk-indicator ${risk}`} style={{marginTop:8}}>
            Risk Level: {risk === 'high' ? 'High risk' : risk === 'medium' ? 'Medium' : 'Low'}
          </div>
          <pre style={{fontFamily:'monospace', whiteSpace:'pre'}}>{result}</pre>
        </div>
      )}
    </div>
  )
}
