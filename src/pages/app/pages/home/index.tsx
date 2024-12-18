import { time } from '@distributedlab/tools'
import { type ReactElement, useCallback, useState } from 'react'
import {
  RefreshControl,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler } from '@/core'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import type { AppTabScreenProps } from '@/route-types'
import { cn, useAppPaddings, useBottomBarOffset } from '@/theme'
import { UiHorizontalDivider, UiIcon, UiScreenScrollable, useUiBottomSheet } from '@/ui'
import UiSkeleton from '@/ui/UiSkeleton'

import {
  ActionCircleButton,
  HomeHeader,
  TokenInfoBottomSheet,
  TransferBottomSheet,
  TxItem,
  useTransferBottomSheet,
  useWithdrawBottomSheet,
  WithdrawBottomSheet,
} from './components'
import VBCardsList from './components/VBCardsList'

export default function HomeScreen({}: AppTabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets()
  const offset = useBottomBarOffset()
  const appPaddings = useAppPaddings()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    selectedToken,

    // selectedAccountDecryptionKey,
    selectedAccountDecryptionKeyStatus,

    registerAccountEncryptionKey,
    unfreezeAccount,
    normalizeAccount,
    rolloverAccount,
    transfer,
    withdraw,

    loadSelectedDecryptionKeyState,
    // decryptionKeyStatusLoadingState,

    txHistory,
    addTxHistoryItem,

    testMintTokens,

    reloadAptBalance,
  } = useVeiledCoinContext()

  const transferBottomSheet = useTransferBottomSheet()
  const withdrawBottomSheet = useWithdrawBottomSheet()
  const tokenInfoBottomSheet = useUiBottomSheet()

  const isActionsDisabled = !selectedAccountDecryptionKeyStatus.isRegistered || isSubmitting

  const [isRefreshing, setIsRefreshing] = useState(false)

  const tryRefresh = useCallback(async () => {
    setIsSubmitting(true)
    setIsRefreshing(true)
    try {
      await Promise.all([loadSelectedDecryptionKeyState(), reloadAptBalance()])
    } catch (error) {
      ErrorHandler.processWithoutFeedback(error)
    }
    setIsRefreshing(false)
    setIsSubmitting(false)
  }, [loadSelectedDecryptionKeyState, reloadAptBalance])

  const tryRollover = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const rolloverAccountTxReceipts = await rolloverAccount()

      rolloverAccountTxReceipts.forEach(el => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (el.payload.function.includes('rollover')) {
          addTxHistoryItem({
            txHash: el.hash,
            txType: 'rollover',
            createdAt: time().timestamp,
          })

          return
        }

        addTxHistoryItem({
          txHash: el.hash,
          txType: 'normalize',
          createdAt: time().timestamp,
        })
      })
      await tryRefresh()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [addTxHistoryItem, rolloverAccount, tryRefresh])

  const tryUnfreeze = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const txReceipt = await unfreezeAccount()
      addTxHistoryItem({
        txHash: txReceipt.hash,
        txType: 'unfreeze',
        createdAt: time().timestamp,
      })
      await tryRefresh()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [addTxHistoryItem, tryRefresh, unfreezeAccount])

  const tryRegister = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const txReceipt = await registerAccountEncryptionKey(selectedToken.address)
      addTxHistoryItem({
        txHash: txReceipt.hash,
        txType: 'register',
        createdAt: time().timestamp,
      })
      await tryRefresh()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [addTxHistoryItem, registerAccountEncryptionKey, selectedToken.address, tryRefresh])

  const tryNormalize = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const txReceipt = await normalizeAccount()
      addTxHistoryItem({
        txHash: txReceipt.hash,
        txType: 'normalize',
        createdAt: time().timestamp,
      })
      await tryRefresh()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [addTxHistoryItem, normalizeAccount, tryRefresh])

  const tryTransfer = useCallback(
    async (receiverAddress: string, amount: number, auditorsEncryptionKeyHexList?: string[]) => {
      setIsSubmitting(true)
      try {
        const txReceipt = await transfer(receiverAddress, amount, auditorsEncryptionKeyHexList)
        addTxHistoryItem({
          txHash: txReceipt.hash,
          txType: 'transfer',
          createdAt: time().timestamp,
        })
        await tryRefresh()
        transferBottomSheet.dismiss()
      } catch (error) {
        ErrorHandler.process(error)
      }
      setIsSubmitting(false)
    },
    [addTxHistoryItem, transfer, transferBottomSheet, tryRefresh],
  )

  const tryWithdraw = useCallback(
    async (amount: number) => {
      setIsSubmitting(true)
      try {
        const txReceipt = await withdraw(amount)
        addTxHistoryItem({
          txHash: txReceipt.hash,
          txType: 'withdraw',
          createdAt: time().timestamp,
        })
        await tryRefresh()
        withdrawBottomSheet.dismiss()
      } catch (error) {
        ErrorHandler.process(error)
      }
      setIsSubmitting(false)
    },
    [addTxHistoryItem, tryRefresh, withdraw, withdrawBottomSheet],
  )

  const tryTestMint = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const [mintTxReceipt, depositTxReceipt] = await testMintTokens()
      addTxHistoryItem({
        txHash: mintTxReceipt.hash,
        txType: 'mint',
        createdAt: time().timestamp,
      })
      addTxHistoryItem({
        txHash: depositTxReceipt.hash,
        txType: 'deposit',
        createdAt: time().timestamp,
      })
      await tryRefresh()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [addTxHistoryItem, testMintTokens, tryRefresh])

  return (
    <UiScreenScrollable
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={tryRefresh}
            enabled={!isSubmitting}
            colors={['red']}
            progressBackgroundColor='yellow'
            size={10}
          />
        ),
      }}
    >
      <View
        className='flex flex-1'
        style={{
          paddingTop: insets.top,
        }}
      >
        {isRefreshing && (
          <UiSkeleton className='mx-auto mb-4 h-[16] w-[80%] rounded-2xl bg-componentPressed' />
        )}
        <HomeHeader className='mb-6' />

        <VBCardsList isRefreshing={isRefreshing} onRollover={tryRollover} />

        <UiHorizontalDivider className='my-4' />

        <View className='flex w-full flex-row items-center justify-center gap-8'>
          <ActionCircleButton
            caption='Token Info'
            disabled={isActionsDisabled}
            onPress={() => tokenInfoBottomSheet.present()}
          >
            <UiIcon libIcon='AntDesign' name='info' size={32} className='text-textPrimary' />
          </ActionCircleButton>
          <ActionCircleButton
            caption='Withdraw'
            disabled={isActionsDisabled}
            onPress={() => withdrawBottomSheet.present()}
          >
            <UiIcon libIcon='AntDesign' name='arrowup' size={32} className='text-textPrimary' />
          </ActionCircleButton>
          <ActionCircleButton
            caption='Transfer'
            disabled={isActionsDisabled}
            onPress={() => transferBottomSheet.present()}
          >
            <UiIcon libIcon='AntDesign' name='arrowright' size={32} className='text-textPrimary' />
          </ActionCircleButton>
        </View>

        <View
          className='mt-10 flex w-full flex-1 overflow-hidden rounded-t-[24] bg-componentPrimary'
          style={{
            paddingTop: insets.top / 3,
            paddingBottom: offset,
            paddingRight: appPaddings.right,
            paddingLeft: appPaddings.left,
          }}
        >
          <View className='flex w-full flex-1'>
            <View className='flex gap-4'>
              <Text className='uppercase text-textPrimary typography-caption3'>Don't forget</Text>

              {!selectedAccountDecryptionKeyStatus.isRegistered ? (
                <ActionCard
                  title='Register Balance'
                  desc='Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'
                  leadingContent={
                    <UiIcon
                      libIcon='FontAwesome'
                      name='id-card'
                      size={32}
                      className='self-center text-textPrimary'
                    />
                  }
                  onPress={tryRegister}
                  disabled={isSubmitting}
                />
              ) : (
                <>
                  {selectedAccountDecryptionKeyStatus.isFrozen && (
                    <ActionCard
                      title='Unfreeze Balance'
                      desc='Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'
                      leadingContent={
                        <UiIcon
                          libIcon='FontAwesome'
                          name='snowflake-o'
                          size={32}
                          className='self-center text-textPrimary'
                        />
                      }
                      onPress={tryUnfreeze}
                      disabled={isSubmitting}
                    />
                  )}

                  {!selectedAccountDecryptionKeyStatus.isNormalized && (
                    <ActionCard
                      title='Normalize Balance'
                      desc='Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'
                      leadingContent={
                        <UiIcon
                          libIcon='FontAwesome'
                          name='exclamation-triangle'
                          size={32}
                          className='self-center text-textPrimary'
                        />
                      }
                      onPress={tryNormalize}
                      disabled={isSubmitting}
                    />
                  )}

                  <ActionCard
                    title='Test Mint'
                    desc='Mint 10 test tokens'
                    leadingContent={
                      <UiIcon
                        libIcon='MaterialCommunityIcons'
                        name='hand-coin'
                        size={32}
                        className='self-center text-textPrimary'
                      />
                    }
                    onPress={tryTestMint}
                    disabled={isSubmitting}
                  />
                </>
              )}
            </View>

            <UiHorizontalDivider className='my-4' />

            {txHistory.length ? (
              <View className='flex gap-6'>
                {txHistory.reverse().map((el, idx) => (
                  <TxItem key={idx} {...el} />
                ))}
              </View>
            ) : (
              <UiIcon
                libIcon='FontAwesome'
                name='folder-open'
                size={128}
                className='my-auto self-center text-componentHovered'
              />
            )}
          </View>
        </View>

        <WithdrawBottomSheet ref={withdrawBottomSheet.ref} onSubmit={tryWithdraw} />
        <TransferBottomSheet ref={transferBottomSheet.ref} onSubmit={tryTransfer} />
        <TokenInfoBottomSheet ref={tokenInfoBottomSheet.ref} token={selectedToken} />
      </View>
    </UiScreenScrollable>
  )
}

function ActionCard({
  title,
  desc,
  leadingContent,
  disabled,
  ...rest
}: { title: string; desc?: string; leadingContent?: ReactElement } & TouchableOpacityProps) {
  return (
    <TouchableOpacity
      {...rest}
      className={cn(
        'flex flex-row gap-4 rounded-2xl bg-componentPrimary p-4',
        disabled && 'opacity-50',
        rest.className,
      )}
      disabled={disabled}
    >
      {leadingContent}
      <View className='flex-1'>
        <Text className='text-textPrimary typography-subtitle2'>{title}</Text>
        {desc && <Text className='text-textSecondary typography-body3'>{desc}</Text>}
      </View>
      <View className='flex size-[36] items-center justify-center self-center rounded-full bg-componentSelected'>
        <UiIcon libIcon='FontAwesome' name='angle-right' size={18} className='text-baseWhite' />
      </View>
    </TouchableOpacity>
  )
}
