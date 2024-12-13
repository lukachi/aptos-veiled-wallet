import { BottomSheetView } from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler } from '@/core'
import { useForm } from '@/hooks'
import { useAppPaddings, useAppTheme } from '@/theme'
import {
  ControlledUiTextField,
  UiBottomSheet,
  UiButton,
  UiHorizontalDivider,
  useUiBottomSheet,
} from '@/ui'

type Props = {
  onSubmit: (receiverEncryptionKeyHex: string, amount: number) => Promise<void>
}

type TransferBottomSheetRef = {
  openWithPrefill: (receiverEncryptionKeyHex: string, amount: number) => void
  present: () => void
  dismiss: () => void
}

export const useTransferBottomSheet = () => {
  const ref = useRef<TransferBottomSheetRef>(null)

  const openWithPrefill = (receiverEncryptionKeyHex: string, amount: number) => {
    ref.current?.openWithPrefill(receiverEncryptionKeyHex, amount)
  }

  const present = () => {
    ref.current?.present()
  }

  const dismiss = () => {
    ref.current?.dismiss()
  }

  return {
    ref,
    present,
    dismiss,
    openWithPrefill,
  }
}

export const TransferBottomSheet = forwardRef<TransferBottomSheetRef, Props>(
  ({ onSubmit }, ref) => {
    const { palette } = useAppTheme()
    const insets = useSafeAreaInsets()
    const appPaddings = useAppPaddings()

    const bottomSheet = useUiBottomSheet()

    const { isFormDisabled, handleSubmit, disableForm, enableForm, control, setValue } = useForm(
      {
        receiverEncryptionKey: '',
        amount: '',
      },
      yup =>
        yup.object().shape({
          receiverEncryptionKey: yup.string().required('Enter receiver'),
          amount: yup.number().required('Enter amount'),
        }),
    )

    const clearForm = useCallback(() => {
      setValue('receiverEncryptionKey', '')
      setValue('amount', '')
    }, [setValue])

    const submit = useCallback(
      () =>
        handleSubmit(async formData => {
          disableForm()
          try {
            await onSubmit(formData.receiverEncryptionKey, Number(formData.amount))
            clearForm()
          } catch (error) {
            ErrorHandler.process(error)
          }
          enableForm()
        })(),
      [clearForm, disableForm, enableForm, handleSubmit, onSubmit],
    )

    useImperativeHandle(
      ref,
      () => ({
        present: () => {
          bottomSheet.present()
        },
        dismiss: () => {
          bottomSheet.dismiss()
        },
        openWithPrefill: (receiverEncryptionKeyHex: string, amount: number) => {
          setValue('receiverEncryptionKey', receiverEncryptionKeyHex)
          setValue('amount', String(amount))
          bottomSheet.present()
        },
      }),
      [bottomSheet, setValue],
    )

    return (
      <UiBottomSheet
        ref={bottomSheet.ref}
        title='Transfer'
        backgroundStyle={{
          backgroundColor: palette.backgroundContainer,
          borderRadius: 20,
        }}
        snapPoints={['50%']}
      >
        <BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom }}>
          <View
            className='flex flex-1'
            style={{
              paddingLeft: appPaddings.left,
              paddingRight: appPaddings.right,
            }}
          >
            <UiHorizontalDivider className='my-4' />

            <View className='flex gap-4'>
              <ControlledUiTextField
                control={control}
                name={'receiverEncryptionKey'}
                label='Receiver'
                placeholder='Enter encryption key'
                disabled={isFormDisabled}
              />

              <ControlledUiTextField
                control={control}
                name={'amount'}
                label='Amount'
                placeholder='Enter amount'
                keyboardType='numeric'
                disabled={isFormDisabled}
              />
            </View>

            {/*TODO: add auditors*/}

            <View className='mt-auto pt-4'>
              <UiHorizontalDivider className='mb-4' />
              <UiButton title='Send' onPress={submit} disabled={isFormDisabled} />
            </View>
          </View>
        </BottomSheetView>
      </UiBottomSheet>
    )
  },
)
