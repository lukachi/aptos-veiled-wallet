import { create } from 'zustand'
import { combine, createJSONStorage, persist } from 'zustand/middleware'

import { authorize, refresh } from '@/api/modules/auth'
import { sleep } from '@/helpers'
import { zustandSecureStorage } from '@/store/helpers'
import { localAuthStore } from '@/store/modules/local-auth'
import { walletStore } from '@/store/modules/wallet'

const useAuthStore = create(
  persist(
    combine(
      {
        accessToken: '',
        refreshToken: '',
        isRefreshing: false,

        _hasHydrated: false,
      },
      set => ({
        setHasHydrated: (value: boolean): void => {
          set({
            _hasHydrated: value,
          })
        },

        setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
          set({ accessToken: accessToken, refreshToken: refreshToken })
        },
        logout: () => {
          set({ accessToken: '', refreshToken: '' })
        },
        refresh: async (): Promise<string> => {
          set({ isRefreshing: true })
          await sleep(1000)

          const { data } = await refresh()

          const newAccessToken = data.access_token
          const newRefreshToken = data.refresh_token

          set({ accessToken: newAccessToken, refreshToken: newRefreshToken })
          set({ isRefreshing: false })

          return newAccessToken
        },
      }),
    ),
    {
      name: 'auth-store',
      version: 1,
      storage: createJSONStorage(() => zustandSecureStorage),

      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },

      partialize: state => ({ accessToken: state.accessToken, refreshToken: state.refreshToken }),
    },
  ),
)

const useIsAuthorized = () => {
  const accessToken = useAuthStore(state => state.accessToken)

  return accessToken !== ''
}

const useLogin = () => {
  const setTokens = useAuthStore(state => state.setTokens)

  // TODO: change to state?
  return async (privateKey: string) => {
    const { data: authTokens } = await authorize(privateKey) // FIXME

    setTokens(authTokens.access_token.token, authTokens.refresh_token.token)
  }
}

const useLogout = () => {
  const logout = useAuthStore(state => state.logout)

  const deletePrivateKey = walletStore.useDeletePrivateKey()
  const resetLocalAuthStore = localAuthStore.useLocalAuthStore(state => state.resetStore)

  return async () => {
    logout()
    await Promise.all([deletePrivateKey(), resetLocalAuthStore()])
  }
}

export const authStore = {
  useAuthStore: useAuthStore,

  useLogin: useLogin,
  useIsAuthorized: useIsAuthorized,
  useLogout: useLogout,
}
