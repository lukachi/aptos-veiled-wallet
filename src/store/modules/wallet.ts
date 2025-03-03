import type { TimeDate } from '@distributedlab/tools'
import { create } from 'zustand'
import { combine, createJSONStorage, persist } from 'zustand/middleware'

import { decryptionKeyFromPrivateKey, generatePrivateKeyHex } from '@/api/modules/aptos'
import { Config } from '@/config'
import { zustandSecureStorage } from '@/store/helpers'

export type TokenBaseInfo = {
  address: string
  name: string
  symbol: string
  decimals: number
  iconUri: string
}

export type TxHistoryItem = {
  txHash: string
  createdAt: TimeDate
  txType:
    | 'transfer'
    | 'transfer-native'
    | 'deposit'
    | 'withdraw'
    | 'rollover'
    | 'key-rotation'
    | 'freeze'
    | 'unfreeze'
    | 'register'
    | 'normalize'
    | 'mint'
}

type StoreState = {
  privateKeyHexList: string[]

  _selectedPrivateKeyHex: string

  tokensListToDecryptionKeyHexMap: Record<string, TokenBaseInfo[]>
  _selectedTokenAddress: string

  decryptionKeyPerTokenTxHistory: Record<
    string, // decryptionKeyHex - owner
    Record<
      string, // token
      TxHistoryItem[] // tx history
    >
  >

  _hasHydrated: boolean
}

const useWalletStore = create(
  persist(
    combine(
      {
        privateKeyHexList: [],
        decryptionKeyHexMap: {},

        _selectedPrivateKeyHex: '',

        tokensListToDecryptionKeyHexMap: {},
        _selectedTokenAddress: '',

        decryptionKeyPerTokenTxHistory: {},

        _hasHydrated: false,
      } as StoreState,
      set => ({
        setHasHydrated: (value: boolean) => {
          set({
            _hasHydrated: value,
          })
        },

        addAndSetPrivateKey: (privateKeyHex: string): void => {
          set(state => ({
            privateKeyHexList: [...state.privateKeyHexList, privateKeyHex],
            _selectedPrivateKeyHex: privateKeyHex,
          }))
        },
        setSelectedPrivateKeyHex: (privateKeyHex: string): void => {
          set({
            _selectedPrivateKeyHex: privateKeyHex,
          })
        },
        removePrivateKey: (privateKeyHex: string): void => {
          set(state => ({
            privateKeyHexList: state.privateKeyHexList.filter(hex => hex !== privateKeyHex),
          }))
        },

        setSelectedTokenAddress: (tokenAddress: string): void => {
          set({
            _selectedTokenAddress: tokenAddress,
          })
        },
        addToken: (decryptionKeyHex: string, token: TokenBaseInfo): void => {
          set(state => ({
            tokensListToDecryptionKeyHexMap: {
              ...state.tokensListToDecryptionKeyHexMap,
              [decryptionKeyHex]: [
                ...(state.tokensListToDecryptionKeyHexMap[decryptionKeyHex] || []),
                token,
              ],
            },
          }))
        },
        removeToken: (decryptionKeyHex: string, tokenAddress: string): void => {
          set(state => ({
            tokensListToDecryptionKeyHexMap: {
              ...state.tokensListToDecryptionKeyHexMap,
              [decryptionKeyHex]: (
                state.tokensListToDecryptionKeyHexMap[decryptionKeyHex] || []
              ).filter(token => token.address !== tokenAddress),
            },
          }))
        },
        addTxHistoryItem: (
          decryptionKeyHex: string,
          tokenAddress: string,
          details: TxHistoryItem,
        ): void => {
          set(state => ({
            decryptionKeyPerTokenTxHistory: {
              ...state.decryptionKeyPerTokenTxHistory,
              [decryptionKeyHex]: {
                ...state.decryptionKeyPerTokenTxHistory[decryptionKeyHex],
                [tokenAddress]: [
                  ...(state.decryptionKeyPerTokenTxHistory[decryptionKeyHex]?.[tokenAddress] || []),
                  details,
                ],
              },
            },
          }))
        },

        clearStoredKeys: (): void => {
          set({
            privateKeyHexList: [],
          })
        },
      }),
    ),
    {
      name: 'wallet',
      version: 1,
      storage: createJSONStorage(() => zustandSecureStorage),

      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },

      partialize: state => ({
        privateKeyHexList: state.privateKeyHexList,
        _selectedPrivateKeyHex: state._selectedPrivateKeyHex,
        tokensListToDecryptionKeyHexMap: state.tokensListToDecryptionKeyHexMap,
        selectedTokenAddress: state._selectedTokenAddress,
        decryptionKeyPerTokenTxHistory: state.decryptionKeyPerTokenTxHistory,
      }),
    },
  ),
)

const useSelectedPrivateKeyHex = () => {
  return useWalletStore(state => state._selectedPrivateKeyHex || state.privateKeyHexList[0])
}

const useSelectedTokenAddress = () => {
  return useWalletStore(state => state._selectedTokenAddress || Config.DEFAULT_TOKEN.address)
}

export const walletStore = {
  useWalletStore,

  generatePrivateKeyHex,
  useSelectedPrivateKeyHex,
  useSelectedTokenAddress,
  decryptionKeyFromPrivateKey,
}
