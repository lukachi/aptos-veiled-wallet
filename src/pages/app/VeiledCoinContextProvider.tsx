import type { Ed25519Account, VeiledAmount } from '@aptos-labs/ts-sdk'
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

const AccountDecryptionKeyStatusRawDefault: Omit<
  AccountDecryptionKeyStatus,
  'pendingAmount' | 'actualAmount'
> & { pending: VeiledAmount | undefined; actual: VeiledAmount | undefined } = {
  isFrozen: false,
  isNormalized: false,
  isRegistered: false,

  pending: undefined,
  actual: undefined,
}

const AccountDecryptionKeyStatusDefault: AccountDecryptionKeyStatus = {
  isFrozen: false,
  isNormalized: false,
  isRegistered: false,

  pendingAmount: '0',
  actualAmount: '0',
}

type DecryptionKeyStatusLoadingState = 'idle' | 'loading' | 'success' | 'error'

type VeiledCoinContextType = {
  accountsList: Ed25519Account[]

  selectedAccount: Ed25519Account

  addNewAccount: (privateKeyHex?: string) => void
  removeAccount: (accountAddress: string) => void
  setSelectedAccount: (accountAddressHex: string) => void

  aptBalance: number
  reloadAptBalance: () => Promise<void>

  tokens: TokenBaseInfo[]
  perTokenStatuses: Record<string, AccountDecryptionKeyStatus>

  selectedToken: TokenBaseInfo

  addToken: (token: TokenBaseInfo) => void
  removeToken: (address: string) => void
  txHistory: TxHistoryItem[]
  addTxHistoryItem: (details: TxHistoryItem) => void
  setSelectedTokenAddress: (tokenAddress: string) => void

  selectedAccountDecryptionKey: TwistedEd25519PrivateKey
  selectedAccountDecryptionKeyStatus: AccountDecryptionKeyStatus

  registerAccountEncryptionKey: (tokenAddress: string) => Promise<void>
  normalizeAccount: () => Promise<void>
  unfreezeAccount: () => Promise<void>
  rolloverAccount: () => Promise<void>
  transfer: (
    receiverEncryptionKeyHex: string,
    amount: number,
    auditorsEncryptionKeyHexList?: string[],
  ) => Promise<void>
  withdraw: (amount: number) => Promise<void>
  deposit: (amount: number) => Promise<void>
  // TODO: rotate keys

  decryptionKeyStatusLoadingState: DecryptionKeyStatusLoadingState
  loadSelectedDecryptionKeyState: () => Promise<void>

  testMintTokens: () => Promise<void>
}

const veiledCoinContext = createContext<VeiledCoinContextType>({
  accountsList: [],
  selectedAccount: {} as Ed25519Account,

  addNewAccount: () => {},
  removeAccount: () => {},
  setSelectedAccount: () => {},

  aptBalance: 0,
  reloadAptBalance: async () => {},

  tokens: [],
  perTokenStatuses: {},
  selectedToken: Config.DEFAULT_TOKEN as TokenBaseInfo,
  txHistory: [],
  addTxHistoryItem: () => {},

  addToken: () => {},
  removeToken: () => {},
  setSelectedTokenAddress: () => {},

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
    addTxHistoryItem: state.addTxHistoryItem,
  }))

  const selectedTokenAddress = walletStore.useSelectedTokenAddress()

  const savedTokensPerDK = useMemo(
    () =>
      decryptionKeyHex ? tokensStoreManager.tokensListToDecryptionKeyHexMap[decryptionKeyHex] : [],
    [decryptionKeyHex, tokensStoreManager.tokensListToDecryptionKeyHexMap],
  )

  const tokens = useMemo(() => {
    if (!savedTokensPerDK?.length) {
      return [Config.DEFAULT_TOKEN]
    }

    return [Config.DEFAULT_TOKEN, ...savedTokensPerDK]
  }, [savedTokensPerDK])

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

  const addTxHistoryItem = useCallback(
    (details: TxHistoryItem) => {
      if (!decryptionKeyHex) throw new TypeError('decryptionKeyHex is not set')

      tokensStoreManager.addTxHistoryItem(decryptionKeyHex, selectedToken.address, details)
    },
    [decryptionKeyHex, selectedToken.address, tokensStoreManager],
  )

  return {
    tokens,
    selectedToken,
    txHistory,
    setSelectedTokenAddress: tokensStoreManager.setSelectedTokenAddress,
    addToken,
    removeToken,
    addTxHistoryItem: addTxHistoryItem,
  }
}

const useSelectedAccountDecryptionKeyStatus = (
  decryptionKeyHex: string | undefined,
  tokenAddress: string | undefined,
) => {
  const selectedPrivateKeyHex = walletStore.useSelectedPrivateKeyHex()
  const tokensListToDecryptionKeyHexMap = walletStore.useWalletStore(
    state => state.tokensListToDecryptionKeyHexMap,
  )

  const currentTokensList = useMemo(() => {
    if (!decryptionKeyHex) return []

    const savedTokensPerDK = tokensListToDecryptionKeyHexMap?.[decryptionKeyHex]

    if (!savedTokensPerDK?.length) {
      return [Config.DEFAULT_TOKEN]
    }

    return [Config.DEFAULT_TOKEN, ...savedTokensPerDK]
  }, [decryptionKeyHex, tokensListToDecryptionKeyHexMap])

  const { data, isLoading, isLoadingError, isEmpty, reload } = useLoading<
    {
      tokenAddress: string
      pending: VeiledAmount | undefined
      actual: VeiledAmount | undefined
      isRegistered: boolean
      isNormalized: boolean
      isFrozen: boolean
    }[]
  >(
    [
      {
        tokenAddress: Config.DEFAULT_TOKEN.address,
        ...AccountDecryptionKeyStatusRawDefault,
      },
    ],
    async () => {
      if (!decryptionKeyHex || !currentTokensList.length)
        return [
          {
            tokenAddress: Config.DEFAULT_TOKEN.address,
            ...AccountDecryptionKeyStatusRawDefault,
          },
        ]

      const perTokenDetails: {
        tokenAddress: string
        pending: VeiledAmount | undefined
        actual: VeiledAmount | undefined
        isRegistered: boolean
        isNormalized: boolean
        isFrozen: boolean
      }[] = await Promise.all(
        currentTokensList.map(async el => {
          try {
            const isRegistered = await getIsAccountRegisteredWithToken(
              selectedPrivateKeyHex,
              el.address,
            )

            if (isRegistered) {
              const [{ pending, actual }, isNormalized, isFrozen] = await Promise.all([
                getVeiledBalances(selectedPrivateKeyHex, decryptionKeyHex, el.address),
                getIsBalanceNormalized(selectedPrivateKeyHex, el.address),
                getIsBalanceFrozen(selectedPrivateKeyHex, el.address),
              ])

              return {
                tokenAddress: el.address,
                pending,
                actual,
                isRegistered,
                isNormalized,
                isFrozen,
              }
            }

            return {
              tokenAddress: el.address,
              pending: undefined,
              actual: undefined,
              isRegistered,
              isNormalized: false,
              isFrozen: false,
            }
          } catch (e) {
            return {
              tokenAddress: el.address,
              pending: undefined,
              actual: undefined,
              isRegistered: false,
              isNormalized: false,
              isFrozen: false,
            }
          }
        }),
      )

      return perTokenDetails
    },
    {
      loadArgs: [selectedPrivateKeyHex, currentTokensList],
    },
  )

  const perTokenStatusesRaw = useMemo(() => {
    return data.reduce(
      (acc, { tokenAddress: tokenAddr, ...rest }) => {
        acc[tokenAddr] = rest

        return acc
      },
      {} as Record<
        string,
        { pending: VeiledAmount | undefined; actual: VeiledAmount | undefined } & Omit<
          AccountDecryptionKeyStatus,
          'pendingAmount' | 'actualAmount'
        >
      >,
    )
  }, [data])

  const perTokenStatuses = useMemo(() => {
    return Object.entries(perTokenStatusesRaw)
      .map<[string, AccountDecryptionKeyStatus]>(([key, value]) => {
        const { pending, actual, ...rest } = value

        return [
          key,
          {
            ...rest,
            pendingAmount: pending?.amount?.toString(),
            actualAmount: actual?.amount?.toString(),
          } as AccountDecryptionKeyStatus,
        ]
      })
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value

          return acc
        },
        {} as Record<string, AccountDecryptionKeyStatus>,
      )
  }, [perTokenStatusesRaw])

  const selectedAccountDecryptionKeyStatusRaw = useMemo(() => {
    if (!perTokenStatusesRaw) return AccountDecryptionKeyStatusRawDefault

    if (!tokenAddress) {
      return perTokenStatusesRaw[Config.DEFAULT_TOKEN.address]
    }

    return perTokenStatusesRaw[tokenAddress]
  }, [perTokenStatusesRaw, tokenAddress])

  const selectedAccountDecryptionKeyStatus = useMemo(() => {
    if (!perTokenStatuses) return AccountDecryptionKeyStatusDefault

    if (!tokenAddress) return perTokenStatuses[Config.DEFAULT_TOKEN.address]

    return perTokenStatuses[tokenAddress]
  }, [perTokenStatuses, tokenAddress])

  const decryptionKeyStatusLoadingState = useMemo((): DecryptionKeyStatusLoadingState => {
    if (isLoading) return 'loading'

    if (isLoadingError) return 'error'

    if (isEmpty) return 'idle'

    return 'success'
  }, [isEmpty, isLoading, isLoadingError])

  const normalizeAccount = async () => {
    if (!decryptionKeyHex || !tokenAddress) throw new TypeError('Decryption key is not set')

    const actualBalance = perTokenStatusesRaw[tokenAddress]?.actual

    if (!actualBalance) throw new TypeError('actual balance not loaded')

    if (!actualBalance?.amountEncrypted || !actualBalance?.amount)
      throw new TypeError('Pending amount is not loaded')

    await normalizeVeiledBalance(
      selectedPrivateKeyHex,
      decryptionKeyHex,
      actualBalance.amountEncrypted,
      actualBalance.amount,
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
    perTokenStatusesRaw,
    perTokenStatuses,
    selectedAccountDecryptionKeyStatusRaw,
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

  const {
    tokens,
    selectedToken,
    txHistory,
    addToken,
    removeToken,
    addTxHistoryItem,
    setSelectedTokenAddress,
  } = useTokens(selectedAccountDecryptionKey.toString())

  const {
    perTokenStatuses,
    decryptionKeyStatusLoadingState,
    selectedAccountDecryptionKeyStatusRaw,
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
    async (
      receiverEncryptionKey: string,
      amount: number,
      auditorsEncryptionKeyHexList?: string[],
    ) => {
      if (!selectedAccountDecryptionKeyStatusRaw.actual?.amountEncrypted)
        throw new TypeError('actual amount not loaded')

      await transferVeiledCoin(
        selectedAccount.privateKey.toString(),
        selectedAccountDecryptionKey.toString(),
        selectedAccountDecryptionKeyStatusRaw.actual.amountEncrypted,
        BigInt(amount),
        receiverEncryptionKey,
        auditorsEncryptionKeyHexList ?? [], // TODO: add auditors
        selectedToken.address,
      )
    },
    [
      selectedAccount.privateKey,
      selectedAccountDecryptionKey,
      selectedAccountDecryptionKeyStatusRaw.actual?.amountEncrypted,
      selectedToken.address,
    ],
  )

  const withdraw = useCallback(
    async (amount: number) => {
      if (!selectedAccountDecryptionKeyStatusRaw.actual?.amountEncrypted)
        throw new TypeError('actual amount not loaded')

      await withdrawVeiledBalance(
        selectedAccount.privateKey.toString(),
        selectedAccountDecryptionKey.toString(),
        BigInt(amount),
        selectedAccountDecryptionKeyStatusRaw.actual.amountEncrypted,
        selectedToken.address,
      )
    },
    [
      selectedAccountDecryptionKeyStatusRaw.actual?.amountEncrypted,
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
        perTokenStatuses,
        selectedToken,
        txHistory,
        addToken,
        removeToken,
        addTxHistoryItem,
        setSelectedTokenAddress,

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
