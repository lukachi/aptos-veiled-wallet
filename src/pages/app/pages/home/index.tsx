import { BottomSheetView } from '@gorhom/bottom-sheet'
import { type ReactElement, useCallback, useState } from 'react'
import { Text, TouchableOpacity, type TouchableOpacityProps, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler } from '@/core'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import type { AppTabScreenProps } from '@/route-types'
import { cn, useAppPaddings, useAppTheme, useBottomBarOffset } from '@/theme'
import {
  UiBottomSheet,
  UiButton,
  UiCard,
  UiHorizontalDivider,
  UiIcon,
  UiScreenScrollable,
  UiTextField,
  useUiBottomSheet,
} from '@/ui'

import { TxItem, VBCard } from './components'

export default function HomeScreen({}: AppTabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets()
  const offset = useBottomBarOffset()
  const appPaddings = useAppPaddings()

  const {
    selectedAccountDecryptionKeyStatus,
    selectedAccountEncryptionKeyHex,
    selectedAccountDecryptionKeyHex,
    txHistory,
  } = useVeiledCoinContext()

  const isActionsDisabled =
    !selectedAccountDecryptionKeyHex || !selectedAccountDecryptionKeyStatus.isRegistered

  const tryUnfreeze = useCallback(async () => {}, [])
  const tryRegister = useCallback(async () => {}, [])
  const tryNormalize = useCallback(async () => {}, [])

  return (
    <UiScreenScrollable>
      <View
        className='flex flex-1'
        style={{
          paddingTop: insets.top,
        }}
      >
        {selectedAccountDecryptionKeyHex && selectedAccountEncryptionKeyHex ? (
          <VBCard
            className='flex gap-4'
            encryptionKey={selectedAccountEncryptionKeyHex}
            pendingAmount={selectedAccountDecryptionKeyStatus.pendingAmount}
            actualAmount={selectedAccountDecryptionKeyStatus.actualAmount}
            isNormalized={selectedAccountDecryptionKeyStatus.isNormalized}
            isFrozen={selectedAccountDecryptionKeyStatus.isFrozen}
            isRegistered={selectedAccountDecryptionKeyStatus.isRegistered}
          />
        ) : (
          <View
            style={{
              paddingLeft: appPaddings.left,
              paddingRight: appPaddings.right,
            }}
          >
            <CreateDecryptionKeyView />
          </View>
        )}
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
          <ActionCircleButton caption='Transfer' disabled={isActionsDisabled}>
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
            {selectedAccountDecryptionKeyHex && (
              <>
                <View className='flex gap-4'>
                  <Text className='uppercase text-textPrimary typography-caption3'>
                    Don't forget
                  </Text>

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
                          desc={
                            'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'
                          }
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
                          desc={
                            'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'
                          }
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
              </>
            )}

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
      </View>
    </UiScreenScrollable>
  )
}

function ActionCircleButton({
  children,
  caption,
  disabled,
  ...rest
}: TouchableOpacityProps & { caption?: string }) {
  return (
    <TouchableOpacity
      {...rest}
      className={cn('flex items-center gap-2', rest.className, disabled && 'opacity-50')}
      disabled={disabled}
    >
      <View className='flex size-[56] items-center justify-center rounded-full bg-componentPrimary'>
        {children}
      </View>
      {caption && <Text className='text-textPrimary'>{caption}</Text>}
    </TouchableOpacity>
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

function CreateDecryptionKeyView() {
  const { palette } = useAppTheme()

  const insets = useSafeAreaInsets()

  const [importedDecryptionKey, setImportedDecryptionKey] = useState('')

  const { setAccountDecryptionKey } = useVeiledCoinContext()

  const { ref, present } = useUiBottomSheet()

  const tryImport = useCallback(async () => {
    try {
      setAccountDecryptionKey(importedDecryptionKey)
    } catch (error) {
      ErrorHandler.process(error)
    }
  }, [importedDecryptionKey, setAccountDecryptionKey])

  return (
    <UiCard className='flex items-center'>
      <UiIcon libIcon='FontAwesome' name='key' size={64} className='text-primaryMain' />

      <Text className='mt-4 max-w-[75%] text-center text-textPrimary typography-subtitle1'>
        You haven't created Veiled Balance yet
      </Text>

      <Text className='mt-2 max-w-[75%] text-center text-textSecondary typography-body3'>
        Let's create and register Veiled Balance
      </Text>

      <UiButton className='mt-4 w-full' title='Create Veiled Balance' onPress={present} />

      <UiBottomSheet
        ref={ref}
        enableDynamicSizing
        backgroundStyle={{
          backgroundColor: palette.backgroundContainer,
        }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom }}>
          <View className={cn('py-0, flex flex-col gap-4 p-5 pt-0')}>
            <Text className='text-textPrimary typography-h5'>New Veiled Balance</Text>

            <UiHorizontalDivider />

            <UiTextField
              label='import existing'
              placeholder={'Decryption key'}
              onChangeText={v => setImportedDecryptionKey(v)}
            />

            <UiButton
              className='mt-6 w-full'
              title='Import'
              onPress={tryImport}
              disabled={!importedDecryptionKey}
            />

            <TouchableOpacity className='w-full' onPress={() => setAccountDecryptionKey()}>
              <Text className='mt-2 w-full self-center text-center uppercase text-primaryMain typography-caption2'>
                Generate new
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </UiBottomSheet>
    </UiCard>
  )
}
