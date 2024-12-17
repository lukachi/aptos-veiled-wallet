import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import debounce from 'lodash/debounce'
import { type ComponentProps, useEffect, useState } from 'react'
import { useCallback } from 'react'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { ViewProps } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { Dimensions, Text, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import type { ICarouselInstance } from 'react-native-reanimated-carousel'
import Carousel from 'react-native-reanimated-carousel'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getFungibleAssetMetadata, validateEncryptionKeyHex } from '@/api/modules/aptos'
import { ErrorHandler, useSoftKeyboardEffect } from '@/core'
import { useForm } from '@/hooks'
import { VBCard } from '@/pages/app/pages/home/components/index'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import { type TokenBaseInfo } from '@/store'
import { cn, useAppPaddings } from '@/theme'
import {
  ControlledUiTextField,
  UiBottomSheet,
  UiButton,
  UiCard,
  UiHorizontalDivider,
  UiIcon,
  UiImage,
  useUiBottomSheet,
} from '@/ui'

const screenWidth = Dimensions.get('window').width

type Props = {
  isRefreshing: boolean
  onRollover: () => Promise<void>
} & ViewProps

export default function VBCardsList({ isRefreshing, className, onRollover, ...rest }: Props) {
  const appPaddings = useAppPaddings()

  const {
    perTokenStatuses,
    selectedAccountDecryptionKey,
    tokens,
    selectedToken,
    setSelectedTokenAddress,
    decryptionKeyStatusLoadingState,
    addToken,
  } = useVeiledCoinContext()

  const ref = useRef<ICarouselInstance>(null)

  const progress = useSharedValue(0)

  const bottomSheet = useUiBottomSheet()

  const findCarouselIndexOfCurrentToken = useCallback(() => {
    const currentTokenIndex = tokens.findIndex(
      token => token?.address.toLowerCase() === selectedToken.address.toLowerCase(),
    )
    return currentTokenIndex >= 0 ? currentTokenIndex : 0
  }, [selectedToken.address, tokens])

  useEffect(() => {
    const carouselStartPoint = findCarouselIndexOfCurrentToken()

    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: carouselStartPoint - progress.value,
      animated: true,
    })

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return (
    <View {...rest} className={cn('w-full flex-1 overflow-hidden pb-6', className)}>
      <Carousel
        ref={ref}
        vertical={undefined}
        width={screenWidth}
        height={250}
        data={[...tokens, null]}
        onProgressChange={progress}
        loop={false}
        autoPlay={false}
        onSnapToItem={index => {
          if (!tokens[index]) return

          if (selectedToken.address.toLowerCase() === tokens[index]?.address) return

          setSelectedTokenAddress(tokens[index].address)
        }}
        autoPlayInterval={5_000}
        style={{
          paddingLeft: appPaddings.left,
          paddingRight: appPaddings.right,
        }}
        renderItem={({ index }) => {
          if (!tokens[index]) {
            return (
              <UiCard className='mx-auto my-auto flex h-[200] w-[90%] items-center justify-center bg-backgroundPure'>
                <TouchableOpacity
                  className='flex items-center justify-center gap-4'
                  onPress={() => bottomSheet.present()}
                >
                  <View className='flex size-[48] items-center justify-center rounded-full bg-componentPrimary'>
                    <UiIcon
                      libIcon={'FontAwesome6'}
                      name={'plus'}
                      size={24}
                      className='text-textPrimary'
                    />
                  </View>
                  <Text className='uppercase text-textPrimary typography-caption1'>Add Token</Text>
                </TouchableOpacity>
              </UiCard>
            )
          }

          const currTokenStatuses = perTokenStatuses[tokens[index].address]

          return (
            <View
              className='flex flex-1 items-stretch justify-center'
              style={{
                paddingLeft: appPaddings.left,
                paddingRight: appPaddings.right,
              }}
            >
              <VBCard
                className='w-full'
                token={tokens[index]}
                isLoading={decryptionKeyStatusLoadingState === 'loading' || isRefreshing}
                encryptionKey={selectedAccountDecryptionKey.publicKey().toString()}
                pendingAmount={currTokenStatuses.pendingAmount}
                actualAmount={currTokenStatuses.actualAmount}
                isNormalized={currTokenStatuses.isNormalized}
                isFrozen={currTokenStatuses.isFrozen}
                isRegistered={currTokenStatuses.isRegistered}
                onRollover={onRollover}
              />
            </View>
          )
        }}
      />

      <AddTokenBottomSheet ref={bottomSheet.ref} onSubmit={async v => addToken(v)} />
    </View>
  )
}

const debouncedSearchToken = debounce(
  async (tokenAddressHex: string): Promise<TokenBaseInfo | undefined> => {
    try {
      return getFungibleAssetMetadata(tokenAddressHex)
    } catch (error) {
      return undefined
    }
  },
  300,
)

type AddTokenBottomSheetProps = {
  onSubmit: (token: TokenBaseInfo) => Promise<void>
} & Omit<ComponentProps<typeof UiBottomSheet>, 'children'>

const AddTokenBottomSheet = forwardRef<BottomSheetModal, AddTokenBottomSheetProps>(
  ({ onSubmit, ...rest }, ref) => {
    const insets = useSafeAreaInsets()
    const appPaddings = useAppPaddings()

    const [isSearching, setIsSearching] = useState(false)

    const { formState, isFormDisabled, handleSubmit, disableForm, enableForm, control, setValue } =
      useForm(
        {
          tokenAddress: '',
          tokenInfo: undefined as TokenBaseInfo | undefined,
        },
        yup =>
          yup.object().shape({
            tokenAddress: yup.string().test('Invalid token address', v => {
              if (!v) return false

              return validateEncryptionKeyHex(v)
            }),
            tokenInfo: yup.object().shape({
              address: yup.string().required(),
            }),
          }),
      )

    const isDisabled = isSearching || isFormDisabled

    const clearForm = useCallback(() => {
      setValue('tokenAddress', '')
    }, [setValue])

    const submit = useCallback(
      () =>
        handleSubmit(async formData => {
          disableForm()
          try {
            await onSubmit(formData.tokenInfo!)
            clearForm()
          } catch (error) {
            ErrorHandler.process(error)
          }
          enableForm()
        })(),
      [clearForm, disableForm, enableForm, handleSubmit, onSubmit],
    )

    const bottomSheet = useUiBottomSheet()

    useImperativeHandle(ref, () => bottomSheet.ref.current as BottomSheetModal, [bottomSheet])

    const { softInputKeyboardHeight } = useSoftKeyboardEffect(50)

    const searchToken = useCallback(
      async (tokenAddress: string) => {
        setIsSearching(true)
        const token = await debouncedSearchToken(tokenAddress)

        if (token) {
          setValue('tokenInfo', token)
        }
        setIsSearching(false)
      },
      [setValue],
    )

    const renderTokenInfoItem = useCallback((label: string, value: string) => {
      return (
        <View className='flex flex-row items-center justify-between'>
          <Text className='uppercase text-textPrimary typography-caption2'>{label}</Text>
          <Text className='text-right text-textPrimary typography-body2'>{value}</Text>
        </View>
      )
    }, [])

    useEffect(() => {
      if (!formState.tokenAddress) return

      searchToken(formState.tokenAddress)

      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [formState.tokenAddress])

    return (
      <UiBottomSheet
        {...rest}
        ref={bottomSheet.ref}
        title='Add Token'
        isCloseDisabled={isDisabled}
        snapPoints={['75%']}
      >
        <View className='flex-1' style={{ paddingBottom: insets.bottom }}>
          <BottomSheetScrollView>
            <View
              className='flex gap-3'
              style={{
                paddingLeft: appPaddings.left,
                paddingRight: appPaddings.right,
              }}
            >
              <UiHorizontalDivider className='my-4' />

              <View className='flex gap-4'>
                <ControlledUiTextField
                  name='tokenAddress'
                  control={control}
                  label='Address'
                  placeholder='Enter token address'
                />
              </View>

              {formState.tokenInfo && (
                <View className='mt-3 flex gap-3'>
                  {formState.tokenInfo.iconUri && (
                    <UiImage
                      source={{ uri: formState.tokenInfo.iconUri }}
                      className='size-[75] rounded-full'
                    />
                  )}
                  {renderTokenInfoItem('Name', formState.tokenInfo.name)}
                  {renderTokenInfoItem('Symbol', formState.tokenInfo.symbol)}
                  {renderTokenInfoItem('Decimals', String(formState.tokenInfo.decimals))}
                </View>
              )}
            </View>
          </BottomSheetScrollView>
          <View
            className='mt-auto pt-4'
            style={{
              paddingLeft: appPaddings.left,
              paddingRight: appPaddings.right,
              marginBottom: softInputKeyboardHeight,
            }}
          >
            <UiHorizontalDivider className='mb-4' />
            <UiButton
              className='transition-all duration-200'
              title='Add'
              onPress={submit}
              disabled={isDisabled}
            />
          </View>
        </View>
      </UiBottomSheet>
    )
  },
)
