import {
  Account,
  type AnyRawTransaction,
  Aptos,
  AptosConfig,
  type CommittedTransactionResponse,
  Ed25519PrivateKey,
  type InputGenerateTransactionPayloadData,
  Network,
  NetworkToNetworkName,
  TransactionWorkerEventsEnum,
  TwistedEd25519PrivateKey,
  TwistedEd25519PublicKey,
  type TwistedElGamalCiphertext,
  VeiledAmount,
  VeiledCoin,
} from '@aptos-labs/ts-sdk'

import { apiClient } from '@/api/client'
import { Config } from '@/config'
import { sleep } from '@/helpers'

const APTOS_NETWORK: Network = NetworkToNetworkName[Network.TESTNET]
const config = new AptosConfig({ network: APTOS_NETWORK })
export const aptos = new Aptos(config)

const accountFromPrivateKey = (privateKeyHex: string) => {
  return Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(privateKeyHex),
  })
}

export const sendAndWaitTx = async (
  transaction: AnyRawTransaction,
  signer: Account,
): Promise<CommittedTransactionResponse> => {
  const pendingTxn = await aptos.signAndSubmitTransaction({ signer, transaction })
  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash })
}

export const sendAndWaitBatchTxs = async (
  txPayloads: InputGenerateTransactionPayloadData[],
  sender: Account,
): Promise<CommittedTransactionResponse[]> => {
  aptos.transaction.batch.forSingleAccount({
    sender,
    data: txPayloads,
  })

  let allTxSentPromiseResolve: (value: void | PromiseLike<void>) => void

  const txHashes: string[] = []
  aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionSent, async data => {
    txHashes.push(data.transactionHash)

    if (txHashes.length === txPayloads.length) {
      allTxSentPromiseResolve()
    }
  })

  await new Promise<void>(resolve => {
    allTxSentPromiseResolve = resolve
  })

  return Promise.all(txHashes.map(txHash => aptos.waitForTransaction({ transactionHash: txHash })))
}

// TODO: implement range proof initialization

export const withdrawVeiledBalance = async (
  privateKeyHex: string,
  decryptionKeyHex: string,
  withdrawAmount: bigint,
  encryptedActualBalance: TwistedElGamalCiphertext[],
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKeyHex)
  const decryptionKey = new TwistedEd25519PrivateKey(decryptionKeyHex)

  const withdrawTx = await aptos.veiledCoin.withdraw({
    sender: account.accountAddress,
    tokenAddress,
    decryptionKey: decryptionKey,
    encryptedActualBalance,
    amountToWithdraw: withdrawAmount,
  })

  return sendAndWaitTx(withdrawTx, account)
}

export const transferVeiledCoin = async (
  privateKeyHex: string,
  decryptionKeyHex: string,
  encryptedActualBalance: TwistedElGamalCiphertext[],
  amountToTransfer: bigint,
  auditorsEncryptionKeyHexList: string[],
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKeyHex)
  const decryptionKey = new TwistedEd25519PrivateKey(decryptionKeyHex)

  const transferTx = await aptos.veiledCoin.transferCoin({
    senderDecryptionKey: decryptionKey,
    recipientEncryptionKey: decryptionKey.publicKey(),
    encryptedActualBalance: encryptedActualBalance,
    amountToTransfer,
    sender: account.accountAddress,
    tokenAddress,
    recipientAddress: account.accountAddress,
    auditorEncryptionKeys: auditorsEncryptionKeyHexList.map(
      hex => new TwistedEd25519PublicKey(hex),
    ),
  })

  return await sendAndWaitTx(transferTx, account)
}

export const safelyRotateVeiledBalance = async (
  privateKeyHex: string,
  decryptionKeyHex: string,
  currEncryptedBalance: TwistedElGamalCiphertext[],
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const newDecryptionKey = TwistedEd25519PrivateKey.generate()

  const account = accountFromPrivateKey(privateKeyHex)

  return VeiledCoin.safeRotateVBKey(aptos, account, {
    sender: account.accountAddress,

    currDecryptionKey: new TwistedEd25519PrivateKey(decryptionKeyHex),
    newDecryptionKey: newDecryptionKey,

    currEncryptedBalance: currEncryptedBalance,

    withUnfreezeBalance: true,
    tokenAddress,
  })
}

export const safelyRolloverVeiledBalance = async (
  privateKeyHex: string,
  decryptionKeyHex: string,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKeyHex)

  const rolloverTxPayloads = await aptos.veiledCoin.safeRolloverPendingVB({
    sender: account.accountAddress,
    tokenAddress,
    withFreezeBalance: false,
    decryptionKey: new TwistedEd25519PrivateKey(decryptionKeyHex),
  })

  return sendAndWaitBatchTxs(rolloverTxPayloads, account)
}

export const registerVeiledBalance = async (
  privateKeyHex: string,
  publicKeyHex: string,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKeyHex)

  const registerVBTxBody = await aptos.veiledCoin.registerBalance({
    sender: account.accountAddress,
    tokenAddress: tokenAddress,
    publicKey: new TwistedEd25519PublicKey(publicKeyHex),
  })

  return sendAndWaitTx(registerVBTxBody, account)
}

export const normalizeVeiledBalance = async (
  privateKey: string,
  decryptionKeyHex: string,
  amountEncrypted: TwistedElGamalCiphertext[],
  amount: bigint,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKey)

  const normalizeTx = await aptos.veiledCoin.normalizeUserBalance({
    tokenAddress,
    decryptionKey: new TwistedEd25519PrivateKey(decryptionKeyHex),
    unnormilizedEncryptedBalance: amountEncrypted,
    balanceAmount: amount,

    sender: account.accountAddress,
  })

  return sendAndWaitTx(normalizeTx, account)
}

export const getGlobalAuditor = () => {
  return aptos.veiledCoin.getGlobalAuditor()
}

export const depositVeiledBalance = async (
  privateKey: string,
  amount: number,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKey)

  const depositTx = await aptos.veiledCoin.deposit({
    sender: account.accountAddress,
    tokenAddress: tokenAddress,
    amount: amount,
  })
  return sendAndWaitTx(depositTx, account)
}

export const getIsAccountRegisteredWithToken = async (
  privateKey: string,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKey)

  const isRegistered = await aptos.veiledCoin.hasUserRegistered({
    accountAddress: account.accountAddress,
    tokenAddress: tokenAddress,
  })

  return isRegistered
}

export const getIsBalanceNormalized = async (
  privateKey: string,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKey)

  const isNormalized = await aptos.veiledCoin.isUserBalanceNormalized({
    accountAddress: account.accountAddress,
    tokenAddress: tokenAddress,
  })

  return isNormalized
}

export const getIsBalanceFrozen = async (
  privateKey: string,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKey)

  const isFrozen = await aptos.veiledCoin.isBalanceFrozen({
    accountAddress: account.accountAddress,
    tokenAddress,
  })

  return isFrozen
}

export const getAptBalance = async (privateKey: string) => {
  const account = accountFromPrivateKey(privateKey)

  const aptBalance = await aptos.getAccountAPTAmount({
    accountAddress: account.accountAddress,
  })

  return aptBalance
}

export const getVeiledBalances = async (
  privateKey: string,
  decryptionKeyHex: string,
  tokenAddress = Config.DEFAULT_VEILED_TOKEN_ADDRESS,
) => {
  const account = accountFromPrivateKey(privateKey)
  const decryptionKey = new TwistedEd25519PrivateKey(decryptionKeyHex)

  const { pending, actual } = await aptos.veiledCoin.getBalance({
    accountAddress: account.accountAddress,
    tokenAddress,
  })

  const veiledAmountPending = await VeiledAmount.fromEncrypted(pending, decryptionKey)
  const veiledAmountActual = await VeiledAmount.fromEncrypted(actual, decryptionKey)

  return {
    pending: veiledAmountPending,
    actual: veiledAmountActual,
  }
}

export const generatePrivateKey = () => {
  const account = Account.generate()

  return account.privateKey.toString()
}

export const generateDecryptionKey = () => {
  return TwistedEd25519PrivateKey.generate().toString()
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
