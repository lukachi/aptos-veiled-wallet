import { useNavigation } from '@react-navigation/native'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useMemo } from 'react'
import type { ViewProps } from 'react-native'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler, useSoftKeyboardEffect } from '@/core'
import { useCopyWithHaptics, useForm } from '@/hooks'
import type { AuthStackScreenProps } from '@/route-types'
import { authStore, walletStore } from '@/store'
import { cn } from '@/theme'
import {
  ControlledUiTextField,
  UiButton,
  UiCard,
  UiHorizontalDivider,
  UiScreenScrollable,
} from '@/ui'

type Props = ViewProps & AuthStackScreenProps<'CreateWallet'>

export default function CreateWallet({ route }: Props) {
  const addAndSetPrivateKey = walletStore.useWalletStore(state => state.addAndSetPrivateKey)
  const login = authStore.useLogin()

  const isImporting = useMemo(() => {
    return route?.params?.isImporting
  }, [route])

  const navigation = useNavigation()

  const insets = useSafeAreaInsets()

  const { isCopied, copy, fetchFromClipboard } = useCopyWithHaptics()

  const { formState, isFormDisabled, handleSubmit, disableForm, enableForm, control, setValue } =
    useForm(
      {
        privateKey: '',
      },
      yup =>
        yup.object().shape({
          privateKey: yup.string().required(),
        }),
    )

  const submit = useCallback(async () => {
    disableForm()
    try {
      addAndSetPrivateKey(formState.privateKey)
      await login(formState.privateKey)
    } catch (error) {
      // TODO: network inspector
      ErrorHandler.process(error)
    }
    enableForm()
  }, [addAndSetPrivateKey, disableForm, enableForm, formState.privateKey, login])

  const pasteFromClipboard = useCallback(
    async (fieldName: keyof typeof formState) => {
      const res = await fetchFromClipboard()
      setValue(fieldName, res)
    },
    [fetchFromClipboard, setValue],
  )

  useSoftKeyboardEffect()

  useEffect(() => {
    if (isImporting) return

    const privateKey = walletStore.generatePrivateKeyHex()

    setValue('privateKey', privateKey)

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return (
    <UiScreenScrollable>
      <View
        className='flex flex-1'
        style={{ paddingBottom: insets.bottom, paddingTop: insets.top }}
      >
        <View className='flex w-full flex-row'>
          <UiButton
            leadingIconProps={{
              customIcon: 'arrowLeftIcon',
            }}
            variant='text'
            onPress={() => {
              navigation.goBack()
            }}
          />
        </View>
        <View className='flex flex-1 flex-col px-5'>
          <View className='my-auto flex flex-col items-center gap-4'>
            <View className='size-[300]'>
              <LottieView
                source={require('@assets/images/crypto-2-animation.json')}
                style={{ width: '100%', height: '100%' }}
                autoPlay
                loop
              />
            </View>
            {/*<UiIcon customIcon='starFillIcon' className='size-[140] text-primaryMain' />*/}
            <Text className='text-textPrimary typography-h4'>Your keys</Text>
          </View>
          <UiCard className={cn('mt-5 flex gap-4')}>
            {isImporting ? (
              <>
                <ControlledUiTextField
                  name={'privateKey'}
                  placeholder={'Your private key'}
                  control={control}
                  disabled={isFormDisabled}
                />

                <UiButton
                  variant='text'
                  color='text'
                  leadingIconProps={{
                    customIcon: isCopied ? 'checkIcon' : 'copySimpleIcon',
                  }}
                  title='Paste From Clipboard'
                  onPress={() => pasteFromClipboard('privateKey')}
                />
              </>
            ) : (
              <>
                <View className='flex gap-2'>
                  <Text className='pl-4 text-textPrimary typography-body3'>Private Key:</Text>
                  <UiCard className='bg-backgroundPrimary'>
                    <Text className='text-textPrimary typography-body3'>
                      {formState.privateKey}
                    </Text>
                  </UiCard>
                </View>

                <UiButton
                  variant='text'
                  color='text'
                  leadingIconProps={{
                    customIcon: isCopied ? 'checkIcon' : 'copySimpleIcon',
                  }}
                  title='Copy to Clipboard'
                  onPress={() => copy(formState.privateKey)}
                />
              </>
            )}
          </UiCard>
        </View>
        <View className='mt-auto p-5'>
          <UiHorizontalDivider />
        </View>
        <View className='flex w-full flex-row px-5'>
          <UiButton
            title={isImporting ? 'Import Key' : 'Create Key'}
            className='mt-auto w-full'
            onPress={handleSubmit(submit)}
            disabled={isFormDisabled}
          />
        </View>
      </View>
    </UiScreenScrollable>
  )
}
