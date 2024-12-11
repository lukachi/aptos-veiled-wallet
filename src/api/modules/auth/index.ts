import { apiClient } from '@/api/client'

// TODO: mb implement aptos veiled register here
export const authorize = async (nullifierHex: string) => {
  return apiClient.post<{
    id: string
    type: 'token'

    access_token: {
      token: string
      token_type: 'access'
    }
    refresh_token: {
      token: string
      token_type: 'refresh'
    }
  }>('/integrations/decentralized-auth-svc/v1/authorize', {
    data: {
      id: nullifierHex,
      type: 'authorize',
    },
  })
}

export const refresh = async () => {
  return apiClient.get<{
    access_token: string
    refresh_token: string
  }>('/integrations/decentralized-auth-svc/v1/refresh')
}
