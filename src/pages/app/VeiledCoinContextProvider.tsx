import type { Account } from '@aptos-labs/ts-sdk'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

type TokenBaseInfo = {
  address: string
  name: string
  symbol: string
  decimals: string
  iconUri: string
}

type AccountDecryptionKeyStatus = {
  isFrozen: boolean
  isNormalized: boolean
  isRegistered: boolean

  pendingAmount: string
  actualAmount: string
}

type VeiledCoinContextType = {
  accountList: Account[]

  selectedAccount: Account

  addNewAccount: () => void
  removeAccount: (account: Account) => void

  tokens: TokenBaseInfo[]

  addToken: (token: TokenBaseInfo) => void
  removeToken: (address: string) => void

  selectedAccountDecryptionKeyHex: string
  selectedAccountEncryptionKeyHex: string
  selectedAccountDecryptionKeyHexPerTokensStatusesMap: Record<string, AccountDecryptionKeyStatus>

  setAccountDecryptionKey: (decryptionKeyHex?: string) => string
  registerAccountEncryptionKey: (encryptionKeyHex: string) => void

  decryptionKeyStatusLoadingState: 'idle' | 'loading' | 'success' | 'error' // FIXME: implement
  loadSelectedDecryptionKeyState: () => Promise<void>
}

const veiledCoinContext = createContext<VeiledCoinContextType>({
  accountList: [],
  selectedAccount: {} as Account,

  addNewAccount: () => {},
  removeAccount: () => {},

  tokens: [],

  addToken: () => {},
  removeToken: () => {},

  selectedAccountDecryptionKeyHex: '',
  selectedAccountEncryptionKeyHex: '',
  selectedAccountDecryptionKeyHexPerTokensStatusesMap: {},

  setAccountDecryptionKey: () => '',
  registerAccountEncryptionKey: () => {},

  decryptionKeyStatusLoadingState: 'idle',
  loadSelectedDecryptionKeyState: async () => {},
})

export const useVeiledCoinContext = () => {
  return useContext(veiledCoinContext)
}

export const VeiledCoinContextProvider = ({ children }: PropsWithChildren) => {
  return <veiledCoinContext.Provider value={{}}>{children}</veiledCoinContext.Provider>
}
