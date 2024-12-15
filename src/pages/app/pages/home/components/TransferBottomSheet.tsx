import { BottomSheetView } from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import type { Control } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import type { ViewProps } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Reanimated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { validateEncryptionKeyHex } from '@/api/modules/aptos'
import { ErrorHandler, useSoftKeyboardEffect } from '@/core'
import { useForm } from '@/hooks'
import { cn, useAppPaddings } from '@/theme'
import {
  ControlledUiTextField,
  UiBottomSheet,
  UiButton,
  UiHorizontalDivider,
  UiIcon,
  useUiBottomSheet,
} from '@/ui'

type Props = {
  onSubmit: (
    receiverEncryptionKeyHex: string,
    amount: number,
    auditorsEncryptionKeyHexList?: string[],
  ) => Promise<void>
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
    const insets = useSafeAreaInsets()
    const appPaddings = useAppPaddings()

    const bottomSheet = useUiBottomSheet()

    const { isFormDisabled, handleSubmit, disableForm, enableForm, control, setValue } = useForm(
      {
        receiverEncryptionKey: '',
        amount: '',
        auditorsEncryptionKeysHex: [] as string[],
      },
      yup =>
        yup.object().shape({
          receiverEncryptionKey: yup.string().required('Enter receiver'),
          amount: yup.number().required('Enter amount'),
          auditorsEncryptionKeysHex: yup.array().of(
            yup.string().test('Invalid encryption key', v => {
              if (!v) return false

              return validateEncryptionKeyHex(v)
            }),
          ),
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
            await onSubmit(
              formData.receiverEncryptionKey,
              Number(formData.amount),
              formData.auditorsEncryptionKeysHex,
            )
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

    const { softInputKeyboardHeight } = useSoftKeyboardEffect()

    return (
      <UiBottomSheet
        ref={bottomSheet.ref}
        title='Transfer'
        isCloseDisabled={isFormDisabled}
        enableDynamicSizing={false}
      >
        <BottomSheetView
          style={{
            display: 'flex',
            flex: 1,
            gap: 12,
            paddingLeft: appPaddings.right,
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

          <AuditorsList
            className='mt-3 flex-1 rounded-3xl bg-backgroundPure p-4 shadow-md'
            control={control}
          />

          <View
            className='mt-auto pt-4'
            style={{
              marginBottom: Math.max(softInputKeyboardHeight, insets.bottom),
            }}
          >
            <UiHorizontalDivider className='mb-4' />
            <UiButton
              className='transition-all duration-200'
              title='Send'
              onPress={submit}
              disabled={isFormDisabled}
            />
          </View>
        </BottomSheetView>
      </UiBottomSheet>
    )
  },
)

const AuditorsList = ({
  control,
  ...rest
}: {
  control: Control<{
    receiverEncryptionKey: string
    amount: string
    auditorsEncryptionKeysHex: string[]
  }>
} & ViewProps) => {
  const { fields, append, remove } = useFieldArray({
    control: control!,
    // @ts-ignore
    name: 'auditorsEncryptionKeysHex',
  })

  const addAuditor = () => {
    append('')
  }

  const removeAuditor = (index: number) => {
    remove(index)
  }

  return (
    <View {...rest} className={cn('flex gap-2', rest.className)}>
      <Text className='uppercase text-textPrimary typography-caption2'>Add auditors</Text>

      <ScrollView style={[rest.style, { maxHeight: 500 }]}>
        <View className='flex gap-3'>
          {fields.map((field, index) => (
            <Swipeable
              key={field.id}
              friction={2}
              enableTrackpadTwoFingerGesture
              rightThreshold={40}
              leftThreshold={40}
              renderRightActions={() => (
                <Reanimated.View>
                  <View className='flex h-full flex-row items-center'>
                    <TouchableOpacity
                      className='flex min-w-[60] items-center justify-center self-stretch bg-errorMain'
                      onPress={() => removeAuditor(index)}
                    >
                      <UiIcon
                        libIcon={'FontAwesome'}
                        name='trash'
                        size={24}
                        className='text-baseWhite'
                      />
                    </TouchableOpacity>
                  </View>
                </Reanimated.View>
              )}
            >
              <View className='min-h-[60] bg-backgroundPure'>
                <ControlledUiTextField
                  {...field}
                  control={control}
                  name={`auditorsEncryptionKeysHex.${index}`}
                  label={`Auditor ${index + 1}`}
                  placeholder='Enter auditor encryption key'
                />
              </View>
            </Swipeable>
          ))}
          <UiButton
            title='Add Auditor'
            onPress={addAuditor}
            className='mt-3'
            size='small'
            variant='outlined'
          />
        </View>
      </ScrollView>
    </View>
  )
}
