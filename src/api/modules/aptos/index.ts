import { Account } from '@aptos-labs/ts-sdk'

import { apiClient } from '@/api/client'
import { sleep } from '@/helpers'

export const generatePrivateKey = () => {
  const account = Account.generate()

  return account.privateKey.toString()
}

// TODO: mb implement aptos veiled register here
export const authorize = async () => {
  await sleep(1_000)
}

export const refresh = async () => {
  return apiClient.get<{
    access_token: string
    refresh_token: string
  }>('/integrations/decentralized-auth-svc/v1/refresh')
}
