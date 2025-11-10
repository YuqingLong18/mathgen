import './globals.css'

export const metadata = {
  title: 'Solution Manual Generator',
  description: 'Generate LaTeX-formatted solutions from math problem sheets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

