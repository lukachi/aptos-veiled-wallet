import type { Account } from '@aptos-labs/ts-sdk'
import { TwistedEd25519PrivateKey } from '@aptos-labs/ts-sdk'
import type { PropsWithChildren } from 'react'
import { useCallback } from 'react'
import { createContext, useContext, useMemo } from 'react'

import {
  accountFromPrivateKey,
  getIsAccountRegisteredWithToken,
  getIsBalanceFrozen,
  getIsBalanceNormalized,
  getVeiledBalances,
  normalizeVeiledBalance,
  registerVeiledBalance,
} from '@/api/modules/aptos'
import { Config } from '@/config'
import { useLoading } from '@/hooks'
import type { TxHistoryItem } from '@/store'
import { type TokenBaseInfo, walletStore } from '@/store'

type AccountDecryptionKeyStatus = {
  isFrozen: boolean
  isNormalized: boolean
  isRegistered: boolean

  pendingAmount: string
  actualAmount: string
}

type DecryptionKeyStatusLoadingState = 'idle' | 'loading' | 'success' | 'error'

type VeiledCoinContextType = {
  accountsList: Account[]

  selectedAccount: Account

  addNewAccount: (privateKeyHex?: string) => void
  removeAccount: (privateKeyHex: string) => void

  tokens: TokenBaseInfo[]
  selectedTokenAddress: string

  addToken: (token: TokenBaseInfo) => void
  removeToken: (address: string) => void
  txHistory: TxHistoryItem[]

  selectedAccountDecryptionKeyHex: string
  selectedAccountEncryptionKeyHex: string
  selectedAccountDecryptionKeyStatus: AccountDecryptionKeyStatus

  setAccountDecryptionKey: (decryptionKeyHex?: string) => string
  registerAccountEncryptionKey: (encryptionKeyHex: string, tokenAddress: string) => Promise<void>
  normalizeAccount: () => Promise<void>
  unfreezeAccount: () => Promise<void>
  // TODO: rotate keys

  decryptionKeyStatusLoadingState: DecryptionKeyStatusLoadingState
  loadSelectedDecryptionKeyState: () => Promise<void>
}

const veiledCoinContext = createContext<VeiledCoinContextType>({
  accountsList: [],
  selectedAccount: {} as Account,

  addNewAccount: () => {},
  removeAccount: () => {},

  tokens: [],
  selectedTokenAddress: '',
  txHistory: [],

  addToken: () => {},
  removeToken: () => {},

  selectedAccountDecryptionKeyHex: '',
  selectedAccountEncryptionKeyHex: '',
  selectedAccountDecryptionKeyStatus: {
    isFrozen: false,
    isNormalized: true,
    isRegistered: true,
    pendingAmount: '0',
    actualAmount: '0',
  },

  setAccountDecryptionKey: () => '',
  registerAccountEncryptionKey: async () => {},
  normalizeAccount: async () => {},
  unfreezeAccount: async () => {},

  decryptionKeyStatusLoadingState: 'idle',
  loadSelectedDecryptionKeyState: async () => {},
})

export const useVeiledCoinContext = () => {
  return useContext(veiledCoinContext)
}

const useAccounts = () => {
  const { privateKeyHexList, addPrivateKey, removePrivateKey } = walletStore.useWalletStore(
    state => ({
      privateKeyHexList: state.privateKeyHexList,
      addPrivateKey: state.addPrivateKey,
      removePrivateKey: state.removePrivateKey,
    }),
  )

  const selectedPrivateKeyHex = walletStore.useSelectedPrivateKeyHex()

  const accountsList = useMemo(
    () =>
      privateKeyHexList.map(hex => {
        return accountFromPrivateKey(hex)
      }),
    [privateKeyHexList],
  )

  const selectedAccount = useMemo(
    () => accountFromPrivateKey(selectedPrivateKeyHex),
    [selectedPrivateKeyHex],
  )

  const addNewAccount = useCallback(
    (privateKeyHex?: string) => {
      const newPrivateKeyHex = privateKeyHex ?? walletStore.generatePrivateKeyHex()

      addPrivateKey(newPrivateKeyHex)
    },
    [addPrivateKey],
  )

  const removeAccount = removePrivateKey

  return {
    accountsList,

    selectedAccount,

    addNewAccount,
    removeAccount,
  }
}

const useSelectedAccountDecryptionKey = () => {
  const { decryptionKeyHexMap, setDecryptionKey } = walletStore.useWalletStore(state => ({
    decryptionKeyHexMap: state.decryptionKeyHexMap,

    setDecryptionKey: state.setDecryptionKey,
  }))
  const selectedPrivateKeyHex = walletStore.useSelectedPrivateKeyHex()

  const selectedAccountDecryptionKeyHex = decryptionKeyHexMap[selectedPrivateKeyHex] ?? ''

  const selectedAccountDecryptionKey = useMemo(() => {
    if (!selectedAccountDecryptionKeyHex) return undefined

    return new TwistedEd25519PrivateKey(selectedAccountDecryptionKeyHex)
  }, [selectedAccountDecryptionKeyHex])

  const selectedAccountEncryptionKey = useMemo(() => {
    if (!selectedAccountDecryptionKey) return undefined

    return selectedAccountDecryptionKey.publicKey()
  }, [selectedAccountDecryptionKey])

  const selectedAccountEncryptionKeyHex = useMemo(() => {
    if (!selectedAccountEncryptionKey) return ''

    return selectedAccountEncryptionKey.toString()
  }, [selectedAccountEncryptionKey])

  const setAccountDecryptionKey = (decryptionKeyHex?: string) => {
    const newDecryptionKey = decryptionKeyHex
      ? new TwistedEd25519PrivateKey(decryptionKeyHex)
      : TwistedEd25519PrivateKey.generate()

    setDecryptionKey(selectedPrivateKeyHex, newDecryptionKey.toString())

    return newDecryptionKey.toString()
  }

  const registerAccountEncryptionKey = async (encryptionKeyHex: string, tokenAddress: string) => {
    await registerVeiledBalance(selectedPrivateKeyHex, encryptionKeyHex, tokenAddress)
  }

  return {
    selectedAccountDecryptionKeyHex,
    selectedAccountEncryptionKeyHex,

    setAccountDecryptionKey,
    registerAccountEncryptionKey,
  }
}

const useTokens = (decryptionKeyHex: string | undefined) => {
  const tokensStoreManager = walletStore.useWalletStore(state => ({
    tokensListToDecryptionKeyHexMap: state.tokensListToDecryptionKeyHexMap,
    decryptionKeyPerTokenTxHistory: state.decryptionKeyPerTokenTxHistory,
    setSelectedTokenAddress: state.setSelectedTokenAddress,
    addToken: state.addToken,
    removeToken: state.removeToken,
  }))

  const selectedTokenAddress = walletStore.useSelectedTokenAddress()

  const tokens = useMemo(() => {
    if (!decryptionKeyHex) return []

    return tokensStoreManager.tokensListToDecryptionKeyHexMap[decryptionKeyHex] ?? []
  }, [decryptionKeyHex, tokensStoreManager.tokensListToDecryptionKeyHexMap])

  const selectedToken = useMemo(() => {
    if (!decryptionKeyHex || !tokens.length) return Config.DEFAULT_TOKEN

    return tokens.find(token => token.address === selectedTokenAddress)
  }, [decryptionKeyHex, tokens, selectedTokenAddress])

  const txHistory = useMemo(() => {
    if (!decryptionKeyHex) return []

    if (!selectedToken) return []

    const mappedTxHistory =
      tokensStoreManager.decryptionKeyPerTokenTxHistory[decryptionKeyHex]?.[selectedToken.address]

    return mappedTxHistory ?? []
  }, [decryptionKeyHex, selectedToken, tokensStoreManager.decryptionKeyPerTokenTxHistory])

  const addToken = useCallback(
    (token: TokenBaseInfo) => {
      if (!decryptionKeyHex) throw new TypeError('Decryption key is not set')

      tokensStoreManager.addToken(decryptionKeyHex, token)
    },
    [decryptionKeyHex, tokensStoreManager],
  )

  const removeToken = useCallback(
    (address: string) => {
      if (!decryptionKeyHex) throw new TypeError('Decryption key is not set')

      tokensStoreManager.removeToken(decryptionKeyHex, address)
    },
    [decryptionKeyHex, tokensStoreManager],
  )

  return {
    tokens,
    selectedToken,
    txHistory,
    setSelectedTokenAddress: tokensStoreManager.setSelectedTokenAddress,
    addToken,
    removeToken,
  }
}

const useSelectedAccountDecryptionKeyStatus = (
  decryptionKeyHex: string | undefined,
  tokenAddress: string | undefined,
) => {
  const selectedPrivateKeyHex = walletStore.useSelectedPrivateKeyHex()

  const { data, isLoading, isLoadingError, isEmpty, reload } = useLoading(undefined, async () => {
    if (!decryptionKeyHex) return undefined

    const [{ pending, actual }, isRegistered, isNormalized, isFrozen] = await Promise.all([
      getVeiledBalances(selectedPrivateKeyHex, decryptionKeyHex, tokenAddress),
      getIsAccountRegisteredWithToken(selectedPrivateKeyHex, tokenAddress),
      getIsBalanceNormalized(selectedPrivateKeyHex, tokenAddress),
      getIsBalanceFrozen(selectedPrivateKeyHex, tokenAddress),
    ])

    return {
      pending,
      actual,
      isRegistered,
      isNormalized,
      isFrozen,
    }
  })

  const selectedAccountDecryptionKeyStatus = {
    isFrozen: data?.isFrozen ?? false,
    isNormalized: data?.isNormalized ?? false,
    isRegistered: data?.isRegistered ?? false,

    pendingAmount: data?.pending?.amount?.toString() ?? '0',
    actualAmount: data?.actual?.amount?.toString() ?? '0',
  }

  const decryptionKeyStatusLoadingState = useMemo((): DecryptionKeyStatusLoadingState => {
    if (isLoading) return 'loading'

    if (isLoadingError) return 'error'

    if (isEmpty) return 'idle'

    return 'success'
  }, [isEmpty, isLoading, isLoadingError])

  const normalizeAccount = async () => {
    if (!decryptionKeyHex) throw new TypeError('Decryption key is not set')

    if (!data?.pending?.amountEncrypted || !data?.pending?.amount)
      throw new TypeError('Pending amount is not loaded')

    await normalizeVeiledBalance(
      selectedPrivateKeyHex,
      decryptionKeyHex,
      data.pending.amountEncrypted,
      data.pending.amount,
      tokenAddress,
    )
  }

  const unfreezeAccount = async () => {
    if (!decryptionKeyHex) throw new TypeError('Decryption key is not set')

    // mb: rotate keys with unfreeze
  }

  return {
    selectedAccountDecryptionKeyStatus,
    decryptionKeyStatusLoadingState,
    loadSelectedDecryptionKeyState: reload,
    normalizeAccount,
    unfreezeAccount,
  }
}

export const VeiledCoinContextProvider = ({ children }: PropsWithChildren) => {
  const { accountsList, selectedAccount, addNewAccount, removeAccount } = useAccounts()

  const {
    selectedAccountDecryptionKeyHex,
    selectedAccountEncryptionKeyHex,
    setAccountDecryptionKey,
    registerAccountEncryptionKey,
  } = useSelectedAccountDecryptionKey()

  const { tokens, selectedToken, txHistory, addToken, removeToken } = useTokens(
    selectedAccountDecryptionKeyHex,
  )

  const {
    decryptionKeyStatusLoadingState,
    selectedAccountDecryptionKeyStatus,
    loadSelectedDecryptionKeyState,
    normalizeAccount,
    unfreezeAccount,
  } = useSelectedAccountDecryptionKeyStatus(selectedAccountDecryptionKeyHex, selectedToken?.address)

  return (
    <veiledCoinContext.Provider
      value={{
        accountsList,

        selectedAccount,

        addNewAccount,
        removeAccount,

        tokens,
        selectedTokenAddress: selectedToken?.address ?? '',
        txHistory,
        addToken,
        removeToken,

        selectedAccountDecryptionKeyHex,
        selectedAccountEncryptionKeyHex,
        setAccountDecryptionKey,
        registerAccountEncryptionKey,
        normalizeAccount,
        unfreezeAccount,

        selectedAccountDecryptionKeyStatus,
        decryptionKeyStatusLoadingState,
        loadSelectedDecryptionKeyState,
      }}
    >
      {children}
    </veiledCoinContext.Provider>
  )
}
