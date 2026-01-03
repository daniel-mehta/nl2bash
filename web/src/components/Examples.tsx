import React from 'react'

const SAMPLES = [
  'Find and delete .log files older than 30 days',
  'Replace tabs with 2 spaces in all .js files',
  'List largest 10 files in the repo'
]

export default function Examples(){
  return (
    <ul className="examples">
      {SAMPLES.map(s => <li key={s}><code>{s}</code></li>)}
    </ul>
  )
}
