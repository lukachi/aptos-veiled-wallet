import { create } from 'zustand'
import { combine, createJSONStorage, persist } from 'zustand/middleware'

import { generatePrivateKeyHex } from '@/api/modules/aptos'
import { zustandSecureStorage } from '@/store/helpers'

export type TokenBaseInfo = {
  address: string
  name: string
  symbol: string
  decimals: string
  iconUri: string
}

type StoreState = {
  privateKeyHexList: string[]
  decryptionKeyHexMap: Record<string, string>

  _selectedPrivateKeyHex: string

  tokensListToDecryptionKeyHexMap: Record<string, TokenBaseInfo[]>
  selectedTokenAddress: string

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
        selectedTokenAddress: '',

        _hasHydrated: false,
      } as StoreState,
      set => ({
        setHasHydrated: (value: boolean) => {
          set({
            _hasHydrated: value,
          })
        },

        addPrivateKey: (privateKeyHex: string): void => {
          set(state => ({
            privateKeyHexList: [...state.privateKeyHexList, privateKeyHex],
            _selectedPrivateKeyHex: privateKeyHex,
          }))
        },
        setDecryptionKey: (privateKeyHex: string, decryptionKeyHex: string): void => {
          set(state => ({
            decryptionKeyHexMap: {
              ...state.decryptionKeyHexMap,
              [privateKeyHex]: decryptionKeyHex,
            },
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
            decryptionKeyHexMap: Object.fromEntries(
              Object.entries(state.decryptionKeyHexMap).filter(([key]) => key !== privateKeyHex),
            ),
          }))
        },

        setSelectedTokenAddress: (tokenAddress: string): void => {
          set({
            selectedTokenAddress: tokenAddress,
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

        clearStoredKeys: (): void => {
          set({
            privateKeyHexList: [],
            decryptionKeyHexMap: {},
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
        decryptionKeyHexMap: state.decryptionKeyHexMap,
        _selectedPrivateKeyHex: state._selectedPrivateKeyHex,
        tokensListToDecryptionKeyHexMap: state.tokensListToDecryptionKeyHexMap,
        selectedTokenAddress: state.selectedTokenAddress,
      }),
    },
  ),
)

const useSelectedPrivateKeyHex = () => {
  return useWalletStore(state => state._selectedPrivateKeyHex || state.privateKeyHexList[0])
}

export const walletStore = {
  useWalletStore,

  generatePrivateKeyHex,
  useSelectedPrivateKeyHex,
}
