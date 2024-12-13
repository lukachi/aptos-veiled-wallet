import { type ReactElement, useCallback, useState } from 'react'
import { Text, TouchableOpacity, type TouchableOpacityProps, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler } from '@/core'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import type { AppTabScreenProps } from '@/route-types'
import { cn, useAppPaddings, useBottomBarOffset } from '@/theme'
import { UiHorizontalDivider, UiIcon, UiScreenScrollable } from '@/ui'

import {
  ActionCircleButton,
  TransferBottomSheet,
  TxItem,
  useTransferBottomSheet,
  VBCard,
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

    loadSelectedDecryptionKeyState,

    txHistory,
  } = useVeiledCoinContext()

  const transferBottomSheet = useTransferBottomSheet()

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
    async (receiverAddress: string, amount: string) => {
      try {
        await transfer(receiverAddress, amount)
        await loadSelectedDecryptionKeyState()
      } catch (error) {
        ErrorHandler.process(error)
      }
    },
    [loadSelectedDecryptionKeyState, transfer],
  )

  return (
    <UiScreenScrollable>
      <View
        className='flex flex-1'
        style={{
          paddingTop: insets.top,
        }}
      >
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
          <ActionCircleButton caption='Withdraw' disabled={isActionsDisabled}>
            <UiIcon
              libIcon={'AntDesign'}
              name={'arrowup'}
              size={32}
              className={'text-textPrimary'}
            />
          </ActionCircleButton>
          <ActionCircleButton caption='Deposit' disabled={isActionsDisabled}>
            <UiIcon
              libIcon={'AntDesign'}
              name={'arrowdown'}
              size={32}
              className={'text-textPrimary'}
            />
          </ActionCircleButton>
          <ActionCircleButton
            caption='Transfer'
            // disabled={isActionsDisabled}
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
