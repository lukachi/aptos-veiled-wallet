import { BN, time } from '@distributedlab/tools'
import { type BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import { type ComponentProps, forwardRef, useCallback, useImperativeHandle } from 'react'
import type { ViewProps } from 'react-native'
import { Text, TouchableOpacity, View } from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { generatePrivateKeyHex, sendApt, validatePrivateKeyHex } from '@/api/modules/aptos'
import { ErrorHandler, useSoftKeyboardEffect } from '@/core'
import { formatBalance } from '@/helpers'
import { useCopyWithHaptics, useForm } from '@/hooks'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import { cn, useAppPaddings, useAppTheme } from '@/theme'
import {
  ControlledUiTextField,
  UiBottomSheet,
  UiButton,
  UiHorizontalDivider,
  UiIcon,
  UiLogo,
  useUiBottomSheet,
} from '@/ui'

export default function HomeHeader({ className, ...rest }: ViewProps) {
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
  const transferNativeBottomSheet = useUiBottomSheet()

  const handleAddNewAccount = useCallback(
    (privateKeyHex: string) => {
      addNewAccount(privateKeyHex)
      addAccountBottomSheet.dismiss()
      accountsBottomSheet.dismiss()
    },
    [accountsBottomSheet, addAccountBottomSheet, addNewAccount],
  )

  const handleTransferNative = useCallback(async () => {
    transferNativeBottomSheet.dismiss()
  }, [transferNativeBottomSheet])

  return (
    <View
      {...rest}
      className={cn('flex flex-row items-center', className)}
      style={{
        paddingLeft: appPaddings.left,
        paddingRight: appPaddings.right,
      }}
    >
      <UiLogo />

      <TouchableOpacity className='mx-auto' onPress={() => accountsBottomSheet.present()}>
        <View className='flex flex-row items-center gap-2'>
          <Text className='line-clamp-1 max-w-[150] text-center uppercase text-textPrimary'>
            {selectedAccount.accountAddress.toString()}
          </Text>

          <UiIcon libIcon='FontAwesome' name='caret-down' size={24} className='text-textPrimary' />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className='p-4 pr-0'
        onPress={() => {
          transferNativeBottomSheet.present()
        }}
      >
        <View className='flex flex-row items-center gap-2'>
          <Text className='uppercase text-textPrimary typography-caption1'>
            {formatBalance(aptBalance, 8)}
          </Text>
          <Text className='uppercase text-textPrimary typography-caption1'>APT</Text>
        </View>
      </TouchableOpacity>

      <UiBottomSheet
        title='Accounts'
        ref={accountsBottomSheet.ref}
        enableDynamicSizing={false}
        snapPoints={['75%']}
      >
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

      <TransferNativeBottomSheet
        ref={transferNativeBottomSheet.ref}
        onSubmit={handleTransferNative}
      />
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

  const addrCopyManager = useCopyWithHaptics()
  const pkCopyManager = useCopyWithHaptics()

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
                <UiIcon libIcon='FontAwesome' name='trash' size={24} color={palette.baseWhite} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className='flex min-w-[60] items-center justify-center self-stretch bg-textSecondary'
              onPress={() => addrCopyManager.copy(accountAddress)}
            >
              <UiIcon
                libIcon='AntDesign'
                name={addrCopyManager.isCopied ? 'check' : 'copy1'}
                size={18}
                className='text-baseWhite'
              />
            </TouchableOpacity>
            <TouchableOpacity
              className='flex min-w-[60] items-center justify-center self-stretch bg-warningMain'
              onPress={() => pkCopyManager.copy(privateKeyHex)}
            >
              <UiIcon
                libIcon='AntDesign'
                name={pkCopyManager.isCopied ? 'check' : 'key'}
                size={18}
                className='text-baseWhite'
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
            libIcon='FontAwesome'
            name='check-circle'
            size={20}
            className='text-textPrimary'
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

    const { softInputKeyboardHeight } = useSoftKeyboardEffect()

    return (
      <UiBottomSheet {...rest} ref={bottomSheet.ref} title='Add Account'>
        <BottomSheetView
          style={{
            display: 'flex',
            paddingLeft: appPaddings.left,
            paddingRight: appPaddings.right,
            paddingBottom: insets.bottom,
          }}
        >
          <UiHorizontalDivider className='my-4' />

          <ControlledUiTextField
            control={control}
            name='privateKeyHex'
            label='Private Key'
            placeholder='Enter private key'
            disabled={isFormDisabled}
          />

          <View
            className='mt-[50] pt-4'
            style={{
              marginBottom: Math.max(softInputKeyboardHeight / 1.65, insets.bottom),
            }}
          >
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
        </BottomSheetView>
      </UiBottomSheet>
    )
  },
)

type TransferNativeBottomSheetProps = {
  onSubmit: () => void
} & Omit<ComponentProps<typeof UiBottomSheet>, 'children'>

const TransferNativeBottomSheet = forwardRef<BottomSheetModal, TransferNativeBottomSheetProps>(
  ({ onSubmit, ...rest }, ref) => {
    const insets = useSafeAreaInsets()
    const appPaddings = useAppPaddings()

    const bottomSheet = useUiBottomSheet()

    const { selectedAccount, aptBalance, addTxHistoryItem, reloadAptBalance } =
      useVeiledCoinContext()

    const { isFormDisabled, handleSubmit, disableForm, enableForm, control, setValue } = useForm(
      {
        receiverAccountAddress: '',
        amount: '',
      },
      yup =>
        yup.object().shape({
          receiverAccountAddress: yup.string().required('Enter receiver address'),
          amount: yup
            .number()
            .required('Enter amount')
            .max(Number(BN.fromBigInt(aptBalance, 8).toString())),
        }),
    )

    const clearForm = useCallback(() => {
      setValue('receiverAccountAddress', '')
      setValue('amount', '')
    }, [setValue])

    const submit = useCallback(
      () =>
        handleSubmit(async formData => {
          disableForm()
          try {
            const txReceipt = await sendApt(
              selectedAccount.privateKey.toString(),
              formData.receiverAccountAddress,
              formData.amount,
            )
            addTxHistoryItem({
              txHash: txReceipt.hash,
              txType: 'transfer-native',
              createdAt: time().timestamp,
            })
            await reloadAptBalance()
            onSubmit()
            clearForm()
          } catch (error) {
            ErrorHandler.process(error)
          }
          enableForm()
        })(),
      [
        addTxHistoryItem,
        clearForm,
        disableForm,
        enableForm,
        handleSubmit,
        onSubmit,
        reloadAptBalance,
        selectedAccount.privateKey,
      ],
    )

    useImperativeHandle(ref, () => (bottomSheet.ref.current as BottomSheetModal) || null, [
      bottomSheet,
    ])

    const { softInputKeyboardHeight } = useSoftKeyboardEffect()

    return (
      <UiBottomSheet {...rest} ref={bottomSheet.ref} title='Send APT'>
        <BottomSheetView
          style={{
            display: 'flex',
            gap: 12,
            paddingLeft: appPaddings.left,
            paddingRight: appPaddings.right,
            paddingBottom: insets.bottom,
          }}
        >
          <UiHorizontalDivider className='my-4' />

          <ControlledUiTextField
            control={control}
            name='receiverAccountAddress'
            label='Account address'
            placeholder='Enter account address'
            disabled={isFormDisabled}
          />

          <ControlledUiTextField
            control={control}
            name='amount'
            label='amount'
            placeholder='Enter amount'
            keyboardType='numbers-and-punctuation'
            disabled={isFormDisabled}
          />

          <View
            className='mt-[50] pt-4'
            style={{
              marginBottom: Math.max(softInputKeyboardHeight / 1.65, insets.bottom),
            }}
          >
            <UiHorizontalDivider className='mb-4' />
            <View className='flex gap-3'>
              <UiButton title='Send' onPress={submit} disabled={isFormDisabled} />
            </View>
          </View>
        </BottomSheetView>
      </UiBottomSheet>
    )
  },
)
