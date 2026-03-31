/**
 * Central configuration for API and WebSocket URLs.
 * Defaults to localhost for development, but uses environment variables for production.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

// Extract hostname and protocol for WebSocket
// If API_BASE_URL is https://api.xxx.com -> WSS_BASE_URL should be wss://api.xxx.com
// If API_BASE_URL is http://127.0.0.1:8000 -> WSS_BASE_URL should be ws://127.0.0.1:8000

const getWsUrl = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}`
  } catch (e) {
    // Fallback for relative or malformed URLs
    return baseUrl.replace(/^http/, 'ws')
  }
}

export const config = {
  apiUrl: API_BASE_URL,
  wsUrl: getWsUrl(API_BASE_URL),
}
