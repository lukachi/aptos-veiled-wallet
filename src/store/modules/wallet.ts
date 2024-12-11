import { create } from 'zustand'
import { combine, createJSONStorage, persist } from 'zustand/middleware'

import { generateDecryptionKey, generatePrivateKey } from '@/api/modules/aptos'
import { zustandSecureStorage } from '@/store/helpers'

const useWalletStore = create(
  persist(
    combine(
      {
        privateKey: '',
        decryptionKey: '',

        _hasHydrated: false,
      },
      set => ({
        setHasHydrated: (value: boolean) => {
          set({
            _hasHydrated: value,
          })
        },
        setWalletKeys: (args: { privateKey: string; decryptionKey: string }): void => {
          set({ privateKey: args.privateKey, decryptionKey: args.decryptionKey })
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

      partialize: state => ({ privateKey: state.privateKey, decryptionKey: state.decryptionKey }),
    },
  ),
)

const useGenerateWalletKeys = () => {
  return async () => {
    return { privateKey: generatePrivateKey(), decryptionKey: generateDecryptionKey() }
  }
}

const useDeletePrivateKey = () => {
  const setWalletKeys = useWalletStore(state => state.setWalletKeys)

  return () => {
    return setWalletKeys({
      privateKey: '',
      decryptionKey: '',
    })
  }
}

export const walletStore = {
  useWalletStore,

  useGenerateWalletKeys: useGenerateWalletKeys,
  useDeletePrivateKey,
}
