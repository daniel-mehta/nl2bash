import React, {useState} from 'react'

export default function CommandBox(){
  const [input,setInput] = useState('')
  const [result,setResult] = useState<string | null>(null)

  function handleRun(){
    // placeholder: in real app call backend or use heuristic
    setResult(`echo "You asked: ${input.replace(/"/g,'\"')}"`)
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
        <div style={{marginTop:12}} className="card">
          <div style={{fontFamily:'monospace',whiteSpace:'pre'}}>{result}</div>
        </div>
      )}
    </div>
  )
}
