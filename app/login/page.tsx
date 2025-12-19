'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type UILanguage = 'en' | 'zh'

type Translation = {
  productBadge: string
  heading: string
  subheading: string
  usernameLabel: string
  usernamePlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  submitIdle: string
  submitLoading: string
  errors: {
    invalidCredentials: string
    network: string
  }
}

const translations: Record<UILanguage, Translation> = {
  en: {
    productBadge: 'MathGen',
    heading: 'Sign in',
    subheading: 'Use your central account to continue',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Enter your username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    submitIdle: 'Sign in',
    submitLoading: 'Signing in...',
    errors: {
      invalidCredentials: 'Invalid credentials',
      network: 'Unable to reach authentication service',
    },
  },
  zh: {
    productBadge: 'MathGen',
    heading: '登录',
    subheading: '使用中心账户继续访问',
    usernameLabel: '用户名',
    usernamePlaceholder: '请输入用户名',
    passwordLabel: '密码',
    passwordPlaceholder: '请输入密码',
    submitIdle: '登录',
    submitLoading: '正在登录...',
    errors: {
      invalidCredentials: '账号或密码错误',
      network: '无法连接到认证服务',
    },
  },
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en')
  const t = translations[uiLanguage]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push(redirect)
      } else {
        setError(data.error || t.errors.invalidCredentials)
      }
    } catch (err) {
      setError(t.errors.network)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setUiLanguage('en')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${uiLanguage === 'en' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              aria-pressed={uiLanguage === 'en'}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setUiLanguage('zh')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${uiLanguage === 'zh' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              aria-pressed={uiLanguage === 'zh'}
            >
              中文
            </button>
          </div>
        </div>
        <div className="text-center mb-6">
          <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-1">
            {t.productBadge}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.heading}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t.subheading}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              {t.usernameLabel}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder={t.usernamePlaceholder}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {t.passwordLabel}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder={t.passwordPlaceholder}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {loading ? t.submitLoading : t.submitIdle}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100 px-4">
          <div className="text-gray-600 text-sm">Loading login form...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
