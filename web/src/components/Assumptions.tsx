import React from 'react'

export default function Assumptions(){
  return (
    <ul className="assumptions">
      <li>Commands are suggestions — verify before running.</li>
      <li>Scripts assume a POSIX-compatible shell (bash/zsh).</li>
      <li>Paths are relative to the current working directory.</li>
    </ul>
  )
}
