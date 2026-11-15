import { useState, useCallback } from 'react'

const API_BASE = '/api'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

// FastAPI errors: `detail` is a string, or a list of field errors for validation (422)
interface ErrorBody {
  detail?: string | { msg: string }[]
}

function errorMessage(body: ErrorBody, status: number) {
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail)) return body.detail.map((e) => e.msg).join('; ')
  return `HTTP ${status}`
}

// An HTTP error from the API; `status` lets callers tell e.g. 404 from other failures
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async <T>(method: Method, endpoint: string, data?: unknown): Promise<T> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data === undefined ? undefined : JSON.stringify(data),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ErrorBody
        throw new ApiError(errorMessage(body, response.status), response.status)
      }

      // 204 No Content (DELETE): callers use request<void>
      if (response.status === 204) return undefined as T

      return (await response.json()) as T
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const get = useCallback(<T>(endpoint: string) => request<T>('GET', endpoint), [request])
  const post = useCallback(<T>(endpoint: string, data: unknown) => request<T>('POST', endpoint, data), [request])
  const put = useCallback(<T>(endpoint: string, data: unknown) => request<T>('PUT', endpoint, data), [request])
  const del = useCallback((endpoint: string) => request<void>('DELETE', endpoint), [request])

  return { get, post, put, delete: del, loading, error }
}
