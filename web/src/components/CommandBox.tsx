import React, {useState} from 'react'
import {detectRisk, RiskLevel} from '../utils/risk'
import { useRisk } from '../lib/riskContext'

export default function CommandBox(){
  const [input,setInput] = useState('')
  const [result,setResult] = useState<string | null>(null)
  const { risk, setRisk } = useRisk()

  function handleRun(){
    // Call backend endpoint to generate command
    fetch("http://localhost:3000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, os: "wsl" })
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: r.statusText }));
          setResult(`Error: ${err.error || JSON.stringify(err)}`);
          setRisk('high');
          return;
        }
        const data = await r.json();
        const cmd = Array.isArray(data.commands) ? data.commands.join('\n') : JSON.stringify(data);
        setResult(cmd);
        setRisk(detectRisk(cmd));
      })
      .catch((e) => {
        setResult(`Fetch error: ${String(e)}`);
        setRisk('high');
      });
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
