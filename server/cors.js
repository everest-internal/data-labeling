import cors from 'cors'

export function buildCors() {
  const origin = process.env.CORS_ORIGIN || '*'
  return cors({ origin })
}