import { useState, useCallback } from 'react'

const API_BASE = '/api'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (method, endpoint, data = null) => {
    setLoading(true)
    setError(null)

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(`${API_BASE}${endpoint}`, options)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `HTTP ${response.status}`)
      }

      if (response.status === 204) {
        return null
      }

      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const get = useCallback((endpoint) => request('GET', endpoint), [request])
  const post = useCallback((endpoint, data) => request('POST', endpoint, data), [request])
  const del = useCallback((endpoint) => request('DELETE', endpoint), [request])

  return { get, post, delete: del, loading, error }
}
