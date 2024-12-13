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
  onSubmit: (amount: number) => void
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

    const submit = useCallback(
      () =>
        handleSubmit(formData => {
          disableForm()
          try {
            console.log('here')
            onSubmit(Number(formData.amount))
          } catch (error) {
            ErrorHandler.process(error)
          }
          enableForm()
        })(),
      [disableForm, enableForm, handleSubmit, onSubmit],
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

    return (
      <UiBottomSheet
        ref={bottomSheet.ref}
        title='Withdraw'
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
                name={'amount'}
                label='Amount'
                placeholder='Enter amount'
                keyboardType='numeric'
                disabled={isFormDisabled}
              />
            </View>

            <View className='mt-auto pt-4'>
              <UiHorizontalDivider className='mb-4' />
              <UiButton title='Withdraw' onPress={submit} disabled={isFormDisabled} />
            </View>
          </View>
        </BottomSheetView>
      </UiBottomSheet>
    )
  },
)
