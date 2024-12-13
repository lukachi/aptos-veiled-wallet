import { BottomSheetView } from '@gorhom/bottom-sheet'
import { type ReactElement, useCallback, useState } from 'react'
import type { ViewProps } from 'react-native'
import { Text, TouchableOpacity, type TouchableOpacityProps, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler } from '@/core'
import { useCopyToClipboard } from '@/hooks'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import type { AppTabScreenProps } from '@/route-types'
import { cn, useAppPaddings, useBottomBarOffset } from '@/theme'
import {
  UiBottomSheet,
  UiHorizontalDivider,
  UiIcon,
  UiScreenScrollable,
  useUiBottomSheet,
} from '@/ui'

import {
  ActionCircleButton,
  TransferBottomSheet,
  TxItem,
  useTransferBottomSheet,
  useWithdrawBottomSheet,
  VBCard,
  WithdrawBottomSheet,
} from './components'

export default function HomeScreen({}: AppTabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets()
  const offset = useBottomBarOffset()
  const appPaddings = useAppPaddings()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    selectedToken,

    selectedAccountDecryptionKey,
    selectedAccountDecryptionKeyStatus,

    registerAccountEncryptionKey,
    unfreezeAccount,
    normalizeAccount,
    rolloverAccount,
    transfer,
    withdraw,

    loadSelectedDecryptionKeyState,

    txHistory,

    testMintTokens,
  } = useVeiledCoinContext()

  const transferBottomSheet = useTransferBottomSheet()
  const withdrawBottomSheet = useWithdrawBottomSheet()

  const isActionsDisabled = !selectedAccountDecryptionKeyStatus.isRegistered || isSubmitting

  const tryRollover = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await rolloverAccount()
      await loadSelectedDecryptionKeyState()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [loadSelectedDecryptionKeyState, rolloverAccount])

  const tryUnfreeze = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await unfreezeAccount()
      await loadSelectedDecryptionKeyState()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [loadSelectedDecryptionKeyState, unfreezeAccount])

  const tryRegister = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await registerAccountEncryptionKey(selectedToken.address)
      await loadSelectedDecryptionKeyState()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [loadSelectedDecryptionKeyState, registerAccountEncryptionKey, selectedToken])

  const tryNormalize = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await normalizeAccount()
      await loadSelectedDecryptionKeyState()
    } catch (error) {
      ErrorHandler.process(error)
    }
    setIsSubmitting(false)
  }, [loadSelectedDecryptionKeyState, normalizeAccount])

  const tryTransfer = useCallback(
    async (receiverAddress: string, amount: number) => {
      try {
        await transfer(receiverAddress, amount)
        await loadSelectedDecryptionKeyState()
      } catch (error) {
        ErrorHandler.process(error)
      }
    },
    [loadSelectedDecryptionKeyState, transfer],
  )

  const tryWithdraw = useCallback(
    async (amount: number) => {
      try {
        await withdraw(amount)
        await loadSelectedDecryptionKeyState()
      } catch (error) {
        ErrorHandler.process(error)
      }
    },
    [loadSelectedDecryptionKeyState, withdraw],
  )

  const tryTestMint = useCallback(async () => {
    try {
      await testMintTokens()
    } catch (error) {
      ErrorHandler.process(error)
    }
  }, [testMintTokens])

  return (
    <UiScreenScrollable>
      <View
        className='flex flex-1'
        style={{
          paddingTop: insets.top,
        }}
      >
        <HomeHeader className='mb-6' />
        <VBCard
          className='flex gap-4'
          token={selectedToken}
          encryptionKey={selectedAccountDecryptionKey.publicKey().toString()}
          pendingAmount={selectedAccountDecryptionKeyStatus.pendingAmount}
          actualAmount={selectedAccountDecryptionKeyStatus.actualAmount}
          isNormalized={selectedAccountDecryptionKeyStatus.isNormalized}
          isFrozen={selectedAccountDecryptionKeyStatus.isFrozen}
          isRegistered={selectedAccountDecryptionKeyStatus.isRegistered}
          onRollover={tryRollover}
        />
        <UiHorizontalDivider className='my-4' />

        <View className='flex w-full flex-row items-center justify-center gap-8'>
          <ActionCircleButton
            caption='Withdraw'
            disabled={isActionsDisabled}
            onPress={() => withdrawBottomSheet.present()}
          >
            <UiIcon
              libIcon={'AntDesign'}
              name={'arrowup'}
              size={32}
              className={'text-textPrimary'}
            />
          </ActionCircleButton>
          <ActionCircleButton
            caption='Transfer'
            disabled={isActionsDisabled}
            onPress={() => transferBottomSheet.present()}
          >
            <UiIcon
              libIcon={'AntDesign'}
              name={'arrowright'}
              size={32}
              className={'text-textPrimary'}
            />
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
                  title={'Register Balance'}
                  desc={'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'}
                  leadingContent={
                    <UiIcon
                      libIcon={'FontAwesome'}
                      name={'id-card'}
                      size={32}
                      className={'self-center text-textPrimary'}
                    />
                  }
                  onPress={tryRegister}
                />
              ) : (
                <>
                  {selectedAccountDecryptionKeyStatus.isFrozen && (
                    <ActionCard
                      title={'Unfreeze Balance'}
                      desc={'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'}
                      leadingContent={
                        <UiIcon
                          libIcon={'FontAwesome'}
                          name={'snowflake-o'}
                          size={32}
                          className={'self-center text-textPrimary'}
                        />
                      }
                      onPress={tryUnfreeze}
                    />
                  )}

                  {!selectedAccountDecryptionKeyStatus.isNormalized && (
                    <ActionCard
                      title={'Normalize Balance'}
                      desc={'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'}
                      leadingContent={
                        <UiIcon
                          libIcon={'FontAwesome'}
                          name={'exclamation-triangle'}
                          size={32}
                          className={'self-center text-textPrimary'}
                        />
                      }
                      onPress={tryNormalize}
                    />
                  )}

                  <ActionCard
                    title={'Test Mint'}
                    desc={'Mint 10 test tokens'}
                    leadingContent={
                      <UiIcon
                        libIcon={'MaterialCommunityIcons'}
                        name={'hand-coin'}
                        size={32}
                        className={'self-center text-textPrimary'}
                      />
                    }
                    onPress={tryTestMint}
                  />
                </>
              )}
            </View>

            <UiHorizontalDivider className='my-4' />

            {txHistory.length ? (
              <View className='flex gap-6'>
                {txHistory.map((el, idx) => (
                  <TxItem key={idx} txType={el.txType} createdAt={el.createdAt} />
                ))}
              </View>
            ) : (
              <UiIcon
                libIcon={'FontAwesome'}
                name={'folder-open'}
                size={128}
                className={'my-auto self-center text-componentHovered'}
              />
            )}
          </View>
        </View>

        <WithdrawBottomSheet ref={withdrawBottomSheet.ref} onSubmit={tryWithdraw} />
        <TransferBottomSheet ref={transferBottomSheet.ref} onSubmit={tryTransfer} />
      </View>
    </UiScreenScrollable>
  )
}

function ActionCard({
  title,
  desc,
  leadingContent,
  ...rest
}: { title: string; desc?: string; leadingContent?: ReactElement } & TouchableOpacityProps) {
  return (
    <TouchableOpacity
      {...rest}
      className={cn('flex flex-row gap-4 rounded-2xl bg-componentPrimary p-4', rest.className)}
    >
      {leadingContent}
      <View className='flex-1'>
        <Text className='text-textPrimary typography-subtitle2'>{title}</Text>
        {desc && <Text className='text-textSecondary typography-body3'>{desc}</Text>}
      </View>
      <View className='flex size-[36] items-center justify-center self-center rounded-full bg-componentSelected'>
        <UiIcon libIcon='AntDesign' name='caretright' size={12} className='text-baseWhite' />
      </View>
    </TouchableOpacity>
  )
}

function HomeHeader({ className, ...rest }: ViewProps) {
  const insets = useSafeAreaInsets()
  const appPaddings = useAppPaddings()
  const { accountsList, addNewAccount, selectedAccount } = useVeiledCoinContext()

  const accountsBottomSheet = useUiBottomSheet()

  const { isCopied, copy } = useCopyToClipboard()

  return (
    <View {...rest} className={cn('flex flex-row items-center', className)}>
      <TouchableOpacity className='mx-auto' onPress={() => accountsBottomSheet.present()}>
        <View className='flex flex-row items-center gap-2'>
          <Text className='line-clamp-1 max-w-[150] text-center uppercase text-textPrimary'>
            {selectedAccount.accountAddress.toString()}
          </Text>

          <UiIcon
            libIcon={'FontAwesome'}
            name={'caret-down'}
            size={24}
            className={'text-textPrimary'}
          />
        </View>
      </TouchableOpacity>

      <UiBottomSheet title='Accounts' ref={accountsBottomSheet.ref} snapPoints={['50%']}>
        <BottomSheetView
          style={{
            flex: 1,
            paddingLeft: appPaddings.left,
            paddingRight: appPaddings.right,
            paddingBottom: insets.bottom,
          }}
        >
          <View className='flex flex-1'>
            <UiHorizontalDivider className='my-4' />
            {accountsList.map(el => (
              <View key={el.accountAddress.toString()} className='flex flex-row items-center'>
                <TouchableOpacity className='px-4 py-2'>
                  <UiIcon
                    libIcon={'FontAwesome'}
                    name='trash'
                    size={20}
                    className={'text-errorMain'}
                  />
                </TouchableOpacity>

                <Text className='line-clamp-1 flex-1 text-center uppercase text-textPrimary'>
                  {el.accountAddress.toString()}
                </Text>

                <TouchableOpacity
                  className='px-4 py-2'
                  onPress={() => copy(el.accountAddress.toString())}
                >
                  <UiIcon
                    libIcon={'AntDesign'}
                    name={isCopied ? 'check' : 'copy1'}
                    size={18}
                    className={'text-textPrimary'}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </BottomSheetView>
      </UiBottomSheet>
    </View>
  )
}
