import type { Account } from '@aptos-labs/ts-sdk'
import { TwistedEd25519PrivateKey } from '@aptos-labs/ts-sdk'
import type { PropsWithChildren } from 'react'
import { useCallback } from 'react'
import { createContext, useContext, useMemo } from 'react'

import {
  accountFromPrivateKey,
  depositVeiledBalance,
  getAptBalance,
  getIsAccountRegisteredWithToken,
  getIsBalanceFrozen,
  getIsBalanceNormalized,
  getVeiledBalances,
  mintTokens,
  normalizeVeiledBalance,
  registerVeiledBalance,
  safelyRolloverVeiledBalance,
  transferVeiledCoin,
  withdrawVeiledBalance,
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
  removeAccount: (accountAddress: string) => void
  setSelectedAccount: (accountAddressHex: string) => void

  aptBalance: number
  reloadAptBalance: () => Promise<void>

  tokens: TokenBaseInfo[]
  selectedToken: TokenBaseInfo

  addToken: (token: TokenBaseInfo) => void
  removeToken: (address: string) => void
  txHistory: TxHistoryItem[]

  selectedAccountDecryptionKey: TwistedEd25519PrivateKey
  selectedAccountDecryptionKeyStatus: AccountDecryptionKeyStatus

  registerAccountEncryptionKey: (tokenAddress: string) => Promise<void>
  normalizeAccount: () => Promise<void>
  unfreezeAccount: () => Promise<void>
  rolloverAccount: () => Promise<void>
  transfer: (receiverEncryptionKeyHex: string, amount: number) => Promise<void>
  withdraw: (amount: number) => Promise<void>
  deposit: (amount: number) => Promise<void>
  // TODO: rotate keys

  decryptionKeyStatusLoadingState: DecryptionKeyStatusLoadingState
  loadSelectedDecryptionKeyState: () => Promise<void>

  testMintTokens: () => Promise<void>
}

const veiledCoinContext = createContext<VeiledCoinContextType>({
  accountsList: [],
  selectedAccount: {} as Account,

  addNewAccount: () => {},
  removeAccount: () => {},
  setSelectedAccount: () => {},

  aptBalance: 0,
  reloadAptBalance: async () => {},

  tokens: [],
  selectedToken: Config.DEFAULT_TOKEN as TokenBaseInfo,
  txHistory: [],

  addToken: () => {},
  removeToken: () => {},

  selectedAccountDecryptionKey: TwistedEd25519PrivateKey.generate(),
  selectedAccountDecryptionKeyStatus: {
    isFrozen: false,
    isNormalized: true,
    isRegistered: true,
    pendingAmount: '0',
    actualAmount: '0',
  },

  registerAccountEncryptionKey: async () => {},
  normalizeAccount: async () => {},
  unfreezeAccount: async () => {},
  rolloverAccount: async () => {},
  transfer: async () => {},
  withdraw: async () => {},
  deposit: async () => {},

  decryptionKeyStatusLoadingState: 'idle',
  loadSelectedDecryptionKeyState: async () => {},

  testMintTokens: async () => {},
})

export const useVeiledCoinContext = () => {
  return useContext(veiledCoinContext)
}

const useAccounts = () => {
  const { privateKeyHexList, addAndSetPrivateKey, removePrivateKey, setSelectedPrivateKeyHex } =
    walletStore.useWalletStore(state => ({
      privateKeyHexList: state.privateKeyHexList,
      addAndSetPrivateKey: state.addAndSetPrivateKey,
      removePrivateKey: state.removePrivateKey,
      setSelectedPrivateKeyHex: state.setSelectedPrivateKeyHex,
    }))

  const selectedPrivateKeyHex = walletStore.useSelectedPrivateKeyHex()

  const { data: aptBalance, reload } = useLoading(
    0,
    () => {
      return getAptBalance(selectedPrivateKeyHex)
    },
    { loadArgs: [selectedPrivateKeyHex] },
  )

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

      addAndSetPrivateKey(newPrivateKeyHex)
    },
    [addAndSetPrivateKey],
  )

  const setSelectedAccount = useCallback(
    (accountAddressHex: string) => {
      const accountToSet = accountsList.find(
        el => el.accountAddress.toString().toLowerCase() === accountAddressHex.toLowerCase(),
      )

      if (accountToSet?.privateKey) {
        setSelectedPrivateKeyHex(accountToSet?.privateKey.toString())
      }
    },
    [accountsList, setSelectedPrivateKeyHex],
  )

  const removeAccount = (accountAddressHex: string) => {
    const currentAccountsListLength = accountsList.length

    const filteredAccountsList = accountsList.filter(
      el => el.accountAddress.toString().toLowerCase() !== accountAddressHex.toLowerCase(),
    )

    if (
      currentAccountsListLength !== filteredAccountsList.length &&
      filteredAccountsList.length > 0
    ) {
      const accountToRemove = accountsList.find(
        el => el.accountAddress.toString().toLowerCase() === accountAddressHex.toLowerCase(),
      )

      if (accountToRemove?.privateKey) {
        removePrivateKey(accountToRemove.privateKey.toString())
        setSelectedPrivateKeyHex(filteredAccountsList[0].privateKey.toString())
      }
    }
  }

  return {
    accountsList,

    selectedPrivateKeyHex,
    selectedAccount,

    setSelectedAccount,
    addNewAccount,
    removeAccount,

    aptBalance,
    reloadAptBalance: reload,
  }
}

const useSelectedAccountDecryptionKey = () => {
  const selectedPrivateKeyHex = walletStore.useSelectedPrivateKeyHex()

  const selectedAccountDecryptionKey = useMemo(() => {
    return walletStore.decryptionKeyFromPrivateKey(selectedPrivateKeyHex)
  }, [selectedPrivateKeyHex])

  const registerAccountEncryptionKey = async (tokenAddress: string) => {
    await registerVeiledBalance(
      selectedPrivateKeyHex,
      selectedAccountDecryptionKey.publicKey().toString(),
      tokenAddress,
    )
  }

  return {
    selectedAccountDecryptionKey,

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

    return tokens.find(token => token.address === selectedTokenAddress) || Config.DEFAULT_TOKEN
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

  const { data, isLoading, isLoadingError, isEmpty, reload } = useLoading(
    undefined,
    async () => {
      if (!decryptionKeyHex) return undefined

      const isRegistered = await getIsAccountRegisteredWithToken(
        selectedPrivateKeyHex,
        tokenAddress,
      )

      if (isRegistered) {
        const [{ pending, actual }, isNormalized, isFrozen] = await Promise.all([
          getVeiledBalances(selectedPrivateKeyHex, decryptionKeyHex, tokenAddress),
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
      }

      return {
        pending: undefined,
        actual: undefined,
        isRegistered,
        isNormalized: undefined,
        isFrozen: undefined,
      }
    },
    {
      loadArgs: [selectedPrivateKeyHex],
    },
  )

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

    if (!data?.actual?.amountEncrypted || !data?.actual?.amount)
      throw new TypeError('Pending amount is not loaded')

    await normalizeVeiledBalance(
      selectedPrivateKeyHex,
      decryptionKeyHex,
      data.actual.amountEncrypted,
      data.actual.amount,
      tokenAddress,
    )
  }

  const unfreezeAccount = async () => {
    if (!decryptionKeyHex) throw new TypeError('Decryption key is not set')

    // TODO: implement me
    // mb: rotate keys with unfreeze
  }

  const rolloverAccount = useCallback(async () => {
    if (!decryptionKeyHex) throw new TypeError('Decryption key is not set')

    await safelyRolloverVeiledBalance(selectedPrivateKeyHex, decryptionKeyHex, tokenAddress)
  }, [decryptionKeyHex, selectedPrivateKeyHex, tokenAddress])

  return {
    pendingVeiledBalance: data?.pending,
    actualVeiledBalance: data?.actual,
    selectedAccountDecryptionKeyStatus,
    decryptionKeyStatusLoadingState,
    loadSelectedDecryptionKeyState: reload,
    normalizeAccount,
    unfreezeAccount,
    rolloverAccount,
  }
}

export const VeiledCoinContextProvider = ({ children }: PropsWithChildren) => {
  const {
    accountsList,
    selectedAccount,
    setSelectedAccount,
    addNewAccount,
    removeAccount,
    aptBalance,
    reloadAptBalance,
  } = useAccounts()

  const { selectedAccountDecryptionKey, registerAccountEncryptionKey } =
    useSelectedAccountDecryptionKey()

  const { tokens, selectedToken, txHistory, addToken, removeToken } = useTokens(
    selectedAccountDecryptionKey.toString(),
  )

  const {
    actualVeiledBalance,
    decryptionKeyStatusLoadingState,
    selectedAccountDecryptionKeyStatus,
    loadSelectedDecryptionKeyState,
    normalizeAccount,
    unfreezeAccount,
    rolloverAccount,
  } = useSelectedAccountDecryptionKeyStatus(
    selectedAccountDecryptionKey.toString(),
    selectedToken.address,
  )

  const transfer = useCallback(
    async (receiverEncryptionKey: string, amount: number) => {
      if (!actualVeiledBalance?.amountEncrypted) throw new TypeError('actual amount not loaded')

      await transferVeiledCoin(
        selectedAccount.privateKey.toString(),
        selectedAccountDecryptionKey.toString(),
        actualVeiledBalance?.amountEncrypted,
        BigInt(amount),
        receiverEncryptionKey,
        [], // TODO: add auditors
        selectedToken.address,
      )
    },
    [
      actualVeiledBalance?.amountEncrypted,
      selectedAccount.privateKey,
      selectedAccountDecryptionKey,
      selectedToken.address,
    ],
  )

  const withdraw = useCallback(
    async (amount: number) => {
      if (!actualVeiledBalance?.amountEncrypted) throw new TypeError('actual amount not loaded')

      await withdrawVeiledBalance(
        selectedAccount.privateKey.toString(),
        selectedAccountDecryptionKey.toString(),
        BigInt(amount),
        actualVeiledBalance?.amountEncrypted,
        selectedToken.address,
      )
    },
    [
      actualVeiledBalance?.amountEncrypted,
      selectedAccount.privateKey,
      selectedAccountDecryptionKey,
      selectedToken.address,
    ],
  )

  const deposit = useCallback(
    async (amount: number) => {
      await depositVeiledBalance(
        selectedAccount.privateKey.toString(),
        amount,
        selectedToken.address,
      )
    },
    [selectedAccount.privateKey, selectedToken.address],
  )

  const testMintTokens = useCallback(async () => {
    await mintTokens(selectedAccount.privateKey.toString(), 10)
    await deposit(10)
  }, [deposit, selectedAccount.privateKey])

  return (
    <veiledCoinContext.Provider
      value={{
        accountsList,

        selectedAccount,

        setSelectedAccount,
        addNewAccount,
        removeAccount,

        aptBalance,
        reloadAptBalance,

        tokens,
        selectedToken,
        txHistory,
        addToken,
        removeToken,

        selectedAccountDecryptionKey,
        registerAccountEncryptionKey,
        normalizeAccount,
        unfreezeAccount,
        rolloverAccount,
        transfer,
        withdraw,
        deposit,

        selectedAccountDecryptionKeyStatus,
        decryptionKeyStatusLoadingState,
        loadSelectedDecryptionKeyState,

        testMintTokens,
      }}
    >
      {children}
    </veiledCoinContext.Provider>
  )
}
