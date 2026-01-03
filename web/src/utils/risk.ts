export type RiskLevel = 'low' | 'medium' | 'high'

const HIGH_REGEX: RegExp[] = [
  /\brm\b/i,
  /\brm\s+-rf\b/i,
  /\bsudo\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\/dev\/sd/i,
  /\bdd\b/i
]

const MEDIUM_REGEX: RegExp[] = [
  /\bmv\b/i,
  /\brsync\b/i,
  /\btruncate\b/i,
  /\bchgrp\b/i,
  /\bscp\b/i,
  /\bcurl\s+.*\|\s*sh\b/i,
  /\bwget\s+.*\|\s*sh\b/i
]

export function detectRisk(command: string): RiskLevel {
  if (!command || !command.trim()) return 'low'
  const cmd = command.trim().toLowerCase()

  let score = 0

  // strong indicators (large weight)
  const strong = [
    'rm -rf', 'rm -r', 'rm ', 'sudo ', 'mkfs', 'dd ', 'shutdown', 'reboot',
    '/dev/sd', '> /dev', ':(){', 'chmod ', 'chown ', 'fsck'
  ]
  for (const p of strong) if (cmd.includes(p)) score += 40

  // medium indicators
  const medium = ['mv ', 'rsync ', 'truncate ', 'scp ', 'chgrp ', 'curl ', 'wget ', 'chmod -R']
  for (const p of medium) if (cmd.includes(p)) score += 20

  // flags and modifiers
  if (/\b--force\b|\b-f\b/.test(cmd)) score += 10
  if (/\b-rf\b|\b-r\b/.test(cmd)) score += 15
  if (/\bsudo\b/.test(cmd)) score += 30

  // piping/downloading to shell
  if (/curl\s+.*\|\s*sh|wget\s+.*\|\s*sh/.test(cmd)) score += 50

  // redirects, pipes, and chaining increase risk incrementally
  const chainCount = (cmd.match(/[|&;]/g) || []).length
  score += Math.min(chainCount * 8, 40)

  // writing to system paths or root-level paths
  if (/(^|\s)\/(etc|root|boot|sys|proc)\b/.test(cmd)) score += 25

  // final thresholds
  if (score >= 70) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}