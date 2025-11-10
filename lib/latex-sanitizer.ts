/**
 * Sanitizes LaTeX code to prevent security issues
 */
export function sanitizeLatex(latex: string): string {
  let sanitized = latex

  // Block shell escape commands
  const dangerousCommands = [
    '\\write18',
    '\\immediate\\write18',
    '\\input{|',
    '\\openin',
    '\\openout',
    '\\read',
    '\\write',
    '\\newread',
    '\\newwrite',
    '\\def\\#',
  ]

  for (const cmd of dangerousCommands) {
    // Remove or comment out dangerous commands
    const regex = new RegExp(cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    sanitized = sanitized.replace(regex, `% BLOCKED: ${cmd}`)
  }

  // Block file I/O patterns
  sanitized = sanitized.replace(/\\input\s*\{[^}]*\|[^}]*\}/gi, '% BLOCKED: file input with pipe')
  sanitized = sanitized.replace(/\\write\s*\{[^}]*\|[^}]*\}/gi, '% BLOCKED: file write with pipe')

  return sanitized
}

