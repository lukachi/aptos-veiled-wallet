import { create } from 'zustand'
import { combine, createJSONStorage, persist } from 'zustand/middleware'

import { generatePrivateKey } from '@/api/modules/aptos'
import { zustandSecureStorage } from '@/store/helpers'

type StoreState = {
  privateKeyHexList: string[]
  decryptionKeyHexMap: Record<string, string>

  selectedPrivateKeyHex: string

  _hasHydrated: boolean
}

const useWalletStore = create(
  persist(
    combine(
      {
        privateKeyHexList: [],
        decryptionKeyHexMap: {},

        selectedPrivateKeyHex: '',

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
            selectedPrivateKeyHex: privateKeyHex,
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
        selectedPrivateKeyHex: state.selectedPrivateKeyHex,
      }),
    },
  ),
)

export const walletStore = {
  useWalletStore,

  generatePrivateKey,
}
