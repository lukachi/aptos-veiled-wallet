import { time } from '@distributedlab/tools'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps } from 'react'
import { forwardRef, type ReactElement, useCallback, useImperativeHandle, useState } from 'react'
import type { ViewProps } from 'react-native'
import {
  KeyboardAvoidingView,
  RefreshControl,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { generatePrivateKeyHex, validatePrivateKeyHex } from '@/api/modules/aptos'
import { ErrorHandler, useSoftKeyboardEffect } from '@/core'
import { formatAmount } from '@/helpers'
import { useCopyToClipboard, useForm } from '@/hooks'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import type { AppTabScreenProps } from '@/route-types'
import { cn, useAppPaddings, useAppTheme, useBottomBarOffset } from '@/theme'
import {
  ControlledUiTextField,
  UiBottomSheet,
  UiButton,
  UiHorizontalDivider,
  UiIcon,
  UiScreenScrollable,
  useUiBottomSheet,
} from '@/ui'
import UiSkeleton from '@/ui/UiSkeleton'

import {
  ActionCircleButton,
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
      await rolloverAccount()
      addTxHistoryItem({
        txType: 'rollover',
        createdAt: time().timestamp,
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
      await unfreezeAccount()
      addTxHistoryItem({
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
      await registerAccountEncryptionKey(selectedToken.address)
      addTxHistoryItem({
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
      await normalizeAccount()
      addTxHistoryItem({
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
        await transfer(receiverAddress, amount, auditorsEncryptionKeyHexList)
        addTxHistoryItem({
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
        await withdraw(amount)
        addTxHistoryItem({
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
      await testMintTokens()
      addTxHistoryItem({
        txType: 'mint',
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
            progressBackgroundColor={'yellow'}
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

        {/*<VBCard*/}
        {/*  className='flex gap-4'*/}
        {/*  token={selectedToken}*/}
        {/*  isLoading={decryptionKeyStatusLoadingState === 'loading' || isRefreshing}*/}
        {/*  encryptionKey={selectedAccountDecryptionKey.publicKey().toString()}*/}
        {/*  pendingAmount={selectedAccountDecryptionKeyStatus.pendingAmount}*/}
        {/*  actualAmount={selectedAccountDecryptionKeyStatus.actualAmount}*/}
        {/*  isNormalized={selectedAccountDecryptionKeyStatus.isNormalized}*/}
        {/*  isFrozen={selectedAccountDecryptionKeyStatus.isFrozen}*/}
        {/*  isRegistered={selectedAccountDecryptionKeyStatus.isRegistered}*/}
        {/*  onRollover={tryRollover}*/}
        {/*/>*/}
        <UiHorizontalDivider className='my-4' />

        <View className='flex w-full flex-row items-center justify-center gap-8'>
          <ActionCircleButton
            caption='Token Info'
            disabled={isActionsDisabled}
            onPress={() => tokenInfoBottomSheet.present()}
          >
            <UiIcon libIcon={'AntDesign'} name={'info'} size={32} className={'text-textPrimary'} />
          </ActionCircleButton>
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
                  disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
        <UiIcon libIcon='AntDesign' name='caretright' size={12} className='text-baseWhite' />
      </View>
    </TouchableOpacity>
  )
}

function HomeHeader({ className, ...rest }: ViewProps) {
  const insets = useSafeAreaInsets()
  const appPaddings = useAppPaddings()
  const {
    accountsList,
    selectedAccount,
    setSelectedAccount,
    addNewAccount,
    removeAccount,
    aptBalance,
  } = useVeiledCoinContext()

  const accountsBottomSheet = useUiBottomSheet()
  const addAccountBottomSheet = useUiBottomSheet()

  const handleAddNewAccount = useCallback(
    (privateKeyHex: string) => {
      addNewAccount(privateKeyHex)
      addAccountBottomSheet.dismiss()
      accountsBottomSheet.dismiss()
    },
    [accountsBottomSheet, addAccountBottomSheet, addNewAccount],
  )

  return (
    <View
      {...rest}
      className={cn('flex flex-row items-center', className)}
      style={{
        paddingLeft: appPaddings.left,
        paddingRight: appPaddings.right,
      }}
    >
      <UiIcon
        libIcon={'MaterialCommunityIcons'}
        name={'format-letter-starts-with'}
        size={24}
        className={'text-textPrimary'}
      />

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

      <View className='flex flex-row items-center gap-2'>
        <Text className='uppercase text-textPrimary typography-caption1'>
          {formatAmount(aptBalance, 8)}
        </Text>

        <UiIcon
          libIcon={'MaterialCommunityIcons'}
          name={'format-letter-matches'}
          className='text-textPrimary'
          size={18}
        />
      </View>

      <UiBottomSheet title='Accounts' ref={accountsBottomSheet.ref} snapPoints={['75%']}>
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

            <BottomSheetScrollView style={{ flex: 1 }}>
              <View className='flex flex-1 gap-3'>
                {accountsList.map(el => (
                  <AccountListItem
                    key={el.accountAddress.toString()}
                    privateKeyHex={el.privateKey.toString()}
                    accountAddress={el.accountAddress.toString()}
                    isActive={
                      selectedAccount.accountAddress.toString().toLowerCase() ===
                      el.accountAddress.toString().toLowerCase()
                    }
                    isRemovable={accountsList.length > 1}
                    onRemove={() => removeAccount(el.accountAddress.toString())}
                    onSelect={() => {
                      setSelectedAccount(el.accountAddress.toString())
                      accountsBottomSheet.dismiss()
                    }}
                  />
                ))}
              </View>
            </BottomSheetScrollView>

            <UiHorizontalDivider className='my-4' />

            <UiButton
              title='Add Account'
              onPress={() => {
                accountsBottomSheet.dismiss()
                addAccountBottomSheet.present()
              }}
            />
          </View>
        </BottomSheetView>
      </UiBottomSheet>

      <AddNewAccountBottomSheet ref={addAccountBottomSheet.ref} onSubmit={handleAddNewAccount} />
    </View>
  )
}

type AccountListItemProps = {
  privateKeyHex: string
  accountAddress: string
  isActive: boolean
  isRemovable: boolean
  onRemove: () => void
  onSelect: () => void
} & ViewProps

function AccountListItem({
  privateKeyHex,
  accountAddress,
  className,
  isActive,
  onRemove,
  onSelect,
  isRemovable,
  ...rest
}: AccountListItemProps) {
  const { palette } = useAppTheme()

  const styleAnimation = useAnimatedStyle(() => {
    return {
      // transform: [{ translateX: drag.value + 50 }],
    }
  })

  const addrCopyManager = useCopyToClipboard()
  const pkCopyManager = useCopyToClipboard()

  return (
    <Swipeable
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      leftThreshold={40}
      // renderLeftActions={LeftAction}
      renderRightActions={() => (
        <Reanimated.View style={styleAnimation}>
          <View className='flex h-full flex-row items-center'>
            {isRemovable && (
              <TouchableOpacity
                className='flex min-w-[60] items-center justify-center self-stretch bg-errorMain'
                onPress={onRemove}
              >
                <UiIcon libIcon={'FontAwesome'} name='trash' size={24} color={palette.baseWhite} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className='flex min-w-[60] items-center justify-center self-stretch bg-textSecondary'
              onPress={() => addrCopyManager.copy(accountAddress)}
            >
              <UiIcon
                libIcon={'AntDesign'}
                name={addrCopyManager.isCopied ? 'check' : 'copy1'}
                size={18}
                className={'text-baseWhite'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className='flex min-w-[60] items-center justify-center self-stretch bg-warningMain'
              onPress={() => pkCopyManager.copy(privateKeyHex)}
            >
              <UiIcon
                libIcon={'AntDesign'}
                name={pkCopyManager.isCopied ? 'check' : 'key'}
                size={18}
                className={'text-baseWhite'}
              />
            </TouchableOpacity>
          </View>
        </Reanimated.View>
      )}
    >
      <View
        {...rest}
        className={cn(
          'flex h-[60] flex-row items-center bg-backgroundPure py-2',
          // isActive && 'rounded-md bg-backgroundPrimary',
          className,
        )}
      >
        {isActive && (
          <UiIcon
            libIcon={'FontAwesome'}
            name='check-circle'
            size={20}
            className={'text-textPrimary'}
          />
        )}

        <TouchableOpacity onPress={onSelect} className='flex h-full flex-1 justify-center px-4'>
          <Text className='line-clamp-1 text-center uppercase text-textPrimary'>
            {accountAddress}
          </Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  )
}

type AddNewAccountBottomSheetProps = {
  onSubmit: (privateKeyHex: string) => void
} & Omit<ComponentProps<typeof UiBottomSheet>, 'children'>

const AddNewAccountBottomSheet = forwardRef<BottomSheetModal, AddNewAccountBottomSheetProps>(
  ({ onSubmit, ...rest }, ref) => {
    const insets = useSafeAreaInsets()
    const appPaddings = useAppPaddings()

    const bottomSheet = useUiBottomSheet()

    const { isFormDisabled, handleSubmit, disableForm, enableForm, control } = useForm(
      {
        privateKeyHex: '',
      },
      yup =>
        yup.object().shape({
          privateKeyHex: yup
            .string()
            .required('Enter private key')
            .test('The key is not valid', value => {
              return validatePrivateKeyHex(value)
            }),
        }),
    )

    const submit = useCallback(
      () =>
        handleSubmit(formData => {
          disableForm()
          try {
            onSubmit(formData.privateKeyHex)
          } catch (error) {
            ErrorHandler.process(error)
          }
          enableForm()
        })(),
      [disableForm, enableForm, handleSubmit, onSubmit],
    )

    useImperativeHandle(ref, () => (bottomSheet.ref.current as BottomSheetModal) || null, [
      bottomSheet,
    ])

    useSoftKeyboardEffect()

    return (
      <UiBottomSheet
        {...rest}
        ref={bottomSheet.ref}
        title='Add Account'
        snapPoints={['50%', '75%']}
      >
        <BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom }}>
          <KeyboardAvoidingView>
            <View
              className='flex'
              style={{
                paddingLeft: appPaddings.left,
                paddingRight: appPaddings.right,
              }}
            >
              <UiHorizontalDivider className='my-4' />

              <View className='flex gap-4'>
                <ControlledUiTextField
                  control={control}
                  name={'privateKeyHex'}
                  label='Private Key'
                  placeholder='Enter private key'
                  disabled={isFormDisabled}
                />
              </View>

              <View className='mt-[50] pt-4'>
                <UiHorizontalDivider className='mb-4' />
                <View className='flex gap-3'>
                  <UiButton title='Import' onPress={submit} disabled={isFormDisabled} />
                  <UiButton
                    title='Create New'
                    variant='outlined'
                    onPress={() => onSubmit(generatePrivateKeyHex())}
                    disabled={isFormDisabled}
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </BottomSheetView>
      </UiBottomSheet>
    )
  },
)
