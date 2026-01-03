import React from 'react'
import { createRoot } from 'react-dom/client'
import Page from './app/page'
import './styles.css'

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
)
