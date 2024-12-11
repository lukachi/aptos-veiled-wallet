import { useNavigation } from '@react-navigation/native'
import { useCallback, useMemo } from 'react'
import type { ViewProps } from 'react-native'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorHandler } from '@/core'
import { useCopyToClipboard, useForm, useLoading } from '@/hooks'
import type { AuthStackScreenProps } from '@/route-types'
import { authStore, walletStore } from '@/store'
import { cn } from '@/theme'
import {
  ControlledUiTextField,
  UiButton,
  UiCard,
  UiHorizontalDivider,
  UiIcon,
  UiScreenScrollable,
} from '@/ui'

type Props = ViewProps & AuthStackScreenProps<'CreateWallet'>

export default function CreateWallet({ route }: Props) {
  const generateWalletKeys = walletStore.useGenerateWalletKeys()
  const setWalletKeys = walletStore.useWalletStore(state => state.setWalletKeys)
  const login = authStore.useLogin()

  const isImporting = useMemo(() => {
    return route?.params?.isImporting
  }, [route])

  const navigation = useNavigation()

  const insets = useSafeAreaInsets()

  const { isCopied, copy, fetchFromClipboard } = useCopyToClipboard()

  const { formState, isFormDisabled, handleSubmit, disableForm, enableForm, control, setValue } =
    useForm(
      {
        privateKey: '',
        decryptionKey: '',
      },
      yup =>
        yup.object().shape({
          privateKey: yup.string().required(),
          decryptionKey: yup.string().required(),
        }),
    )

  const submit = useCallback(async () => {
    disableForm()
    try {
      setWalletKeys({
        privateKey: formState.privateKey,
        decryptionKey: formState.decryptionKey,
      })
      await login(formState.privateKey)
    } catch (error) {
      // TODO: network inspector
      ErrorHandler.process(error)
    }
    enableForm()
  }, [disableForm, enableForm, formState, login, setWalletKeys])

  const pasteFromClipboard = useCallback(
    async (fieldName: keyof typeof formState) => {
      const res = await fetchFromClipboard()
      setValue(fieldName, res)
    },
    [fetchFromClipboard, setValue],
  )

  useLoading(
    false,
    async () => {
      if (isImporting) {
        return true
      }

      const { privateKey, decryptionKey } = await generateWalletKeys()

      setValue('privateKey', privateKey)
      setValue('decryptionKey', decryptionKey)

      return true
    },
    {
      loadOnMount: true,
    },
  )

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
            <UiIcon customIcon='starFillIcon' className='size-[140] text-primaryMain' />
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

                <ControlledUiTextField
                  name={'decryptionKey'}
                  placeholder={'Your decryption key'}
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
                  onPress={() => pasteFromClipboard('decryptionKey')}
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

                <View className='flex gap-2'>
                  <Text className='pl-4 text-textPrimary typography-body3'>Decryption Key:</Text>
                  <UiCard className='bg-backgroundPrimary'>
                    <Text className='text-textPrimary typography-body3'>
                      {formState.decryptionKey}
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
                  onPress={() => copy(formState.decryptionKey)}
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
