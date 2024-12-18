import { BottomSheetView } from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler, useSoftKeyboardEffect } from '@/core'
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
  onSubmit: (amount: number) => Promise<void>
}

type WithdrawBottomSheetRef = {
  openWithPrefill: (amount: number) => void
  present: () => void
  dismiss: () => void
}

export const useWithdrawBottomSheet = () => {
  const ref = useRef<WithdrawBottomSheetRef>(null)

  const openWithPrefill = (amount: number) => {
    ref.current?.openWithPrefill(amount)
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

export const WithdrawBottomSheet = forwardRef<WithdrawBottomSheetRef, Props>(
  ({ onSubmit }, ref) => {
    const { palette } = useAppTheme()
    const insets = useSafeAreaInsets()
    const appPaddings = useAppPaddings()

    const bottomSheet = useUiBottomSheet()

    const { isFormDisabled, handleSubmit, disableForm, enableForm, control, setValue } = useForm(
      {
        amount: '',
      },
      yup =>
        yup.object().shape({
          amount: yup.number().required('Enter amount'),
        }),
    )

    const clearForm = useCallback(() => {
      setValue('amount', '')
    }, [setValue])

    const submit = useCallback(
      () =>
        handleSubmit(async formData => {
          disableForm()
          try {
            await onSubmit(Number(formData.amount))
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
        openWithPrefill: (amount: number) => {
          setValue('amount', String(amount))
          bottomSheet.present()
        },
      }),
      [bottomSheet, setValue],
    )

    const { softInputKeyboardHeight } = useSoftKeyboardEffect()

    return (
      <UiBottomSheet
        ref={bottomSheet.ref}
        title='Withdraw'
        backgroundStyle={{
          backgroundColor: palette.backgroundContainer,
          borderRadius: 20,
        }}
        enableDynamicSizing
        isCloseDisabled={isFormDisabled}
      >
        <BottomSheetView
          style={{
            paddingLeft: appPaddings.left,
            paddingRight: appPaddings.right,
            paddingBottom: insets.bottom,
          }}
        >
          <UiHorizontalDivider className='my-4' />

          <View className='flex gap-4'>
            <ControlledUiTextField
              control={control}
              name='amount'
              label='Amount'
              placeholder='Enter amount'
              keyboardType='numeric'
              disabled={isFormDisabled}
            />
          </View>

          <View
            className='mt-[100] pt-4'
            style={{
              marginBottom: softInputKeyboardHeight / 2,
            }}
          >
            <UiHorizontalDivider className='mb-4' />
            <UiButton title='Withdraw' onPress={submit} disabled={isFormDisabled} />
          </View>
        </BottomSheetView>
      </UiBottomSheet>
    )
  },
)
