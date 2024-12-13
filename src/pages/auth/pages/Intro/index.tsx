import { BottomSheetView } from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import LottieView from 'lottie-react-native'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Dimensions, Text, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import Carousel, { type ICarouselInstance, Pagination } from 'react-native-reanimated-carousel'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { translate } from '@/core'
import { sleep } from '@/helpers'
import { type AuthStackScreenProps } from '@/route-types'
import { cn, useAppPaddings, useAppTheme } from '@/theme'
import {
  UiBottomSheet,
  UiButton,
  UiHorizontalDivider,
  UiImage,
  UiScreenScrollable,
  useUiBottomSheet,
} from '@/ui'
import { BottomSheetHeader } from '@/ui/UiBottomSheet'

import { StepLayout } from './components'

const screenWidth = Dimensions.get('window').width

export default function Intro({}: AuthStackScreenProps<'Intro'>) {
  const insets = useSafeAreaInsets()
  const appPaddings = useAppPaddings()

  const { palette } = useAppTheme()

  const ref = useRef<ICarouselInstance>(null)

  const steps = useMemo(() => {
    return [
      {
        title: (
          <Text className='text-center text-textPrimary typography-h4'>
            Step 1 <Text className='text-center text-primaryMain'>accent</Text>
          </Text>
        ),
        subtitle: translate('auth.intro.step-1.subtitle'),
        media: (
          <View className='size-[300]'>
            <LottieView
              source={require('@assets/images/crypto-1-animation.json')}
              style={{ width: '100%', height: '100%' }}
              autoPlay
              loop
            />
          </View>
        ),
      },
      {
        title: translate('auth.intro.step-2.title'),
        subtitle: translate('auth.intro.step-2.subtitle'),
        media: (
          <View className='size-[300]'>
            <LottieView
              source={require('@assets/images/crypto-2-animation.json')}
              style={{ width: '100%', height: '100%' }}
              autoPlay
              loop
            />
          </View>
        ),
      },
      {
        title: translate('auth.intro.step-3.title'),
        subtitle: translate('auth.intro.step-3.subtitle'),
        media: (
          <UiImage
            source={{ uri: 'https://picsum.photos/500' }}
            className='h-[300px] w-[300px]'
            contentFit={'contain'}
          />
        ),
      },
    ]
  }, [])

  const navigation = useNavigation()

  const bottomSheet = useUiBottomSheet()

  const progress = useSharedValue(0)
  const [isLastSlide, setIsLastSlide] = useState(false)

  const nextSlide = useCallback(() => {
    ref.current?.next()
    setIsLastSlide(ref.current?.getCurrentIndex() === steps.length - 2)
  }, [steps.length])

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    })
  }

  const handleCreatePK = useCallback(async () => {
    bottomSheet.dismiss()
    await sleep(500) // time for animation finish
    navigation.navigate('Auth', {
      screen: 'CreateWallet',
    })
  }, [bottomSheet, navigation])

  const handleImportPK = useCallback(async () => {
    bottomSheet.dismiss()
    await sleep(500) // time for animation finish
    navigation.navigate('Auth', {
      screen: 'CreateWallet',
      params: {
        isImporting: true,
      },
    })
  }, [bottomSheet, navigation])

  return (
    <UiScreenScrollable
      style={{
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
      }}
    >
      <View className='flex flex-1 flex-col items-center justify-center'>
        <View className='w-full flex-1 overflow-hidden pb-6'>
          <Carousel
            ref={ref}
            vertical={undefined}
            width={screenWidth}
            height={undefined}
            data={steps}
            onProgressChange={progress}
            loop={false}
            autoPlay={false}
            onSnapToItem={index => {
              setIsLastSlide(index === steps.length - 1)
            }}
            autoPlayInterval={5_000}
            style={{
              paddingLeft: appPaddings.left,
              paddingRight: appPaddings.right,
            }}
            renderItem={({ index }) => (
              <StepLayout
                className='flex-1'
                title={steps[index].title}
                subtitle={steps[index].subtitle}
                media={steps[index].media}
              />
            )}
          />
        </View>

        <View className='mt-auto h-[4] w-full pb-6'>
          <Pagination.Basic
            progress={progress}
            data={steps}
            dotStyle={{
              width: 32,
              height: 4,
              backgroundColor: palette.textSecondary, // FIXME: color
              borderRadius: 2,
            }}
            activeDotStyle={{ backgroundColor: palette.primaryMain }}
            containerStyle={{
              gap: 4,
            }}
            onPress={onPressPagination}
          />
        </View>

        <UiHorizontalDivider />

        <View
          className='mt-auto w-full pt-6'
          style={{
            paddingLeft: appPaddings.left,
            paddingRight: appPaddings.right,
          }}
        >
          {isLastSlide ? (
            <UiButton
              className='w-full'
              onPress={() => {
                bottomSheet.present()
              }}
            >
              Get Started
            </UiButton>
          ) : (
            <UiButton className='w-full' onPress={nextSlide}>
              Next
            </UiButton>
          )}
        </View>

        <UiBottomSheet
          headerComponent={
            <BottomSheetHeader
              title={'Authorization'}
              dismiss={bottomSheet.dismiss}
              className={'px-5 text-center'}
            />
          }
          ref={bottomSheet.ref}
          enableDynamicSizing={true}
          backgroundStyle={{
            backgroundColor: palette.backgroundContainer,
          }}
        >
          <BottomSheetView style={{ paddingBottom: insets.bottom }}>
            <View className={cn('flex flex-col items-center gap-4 p-5 py-0')}>
              <UiHorizontalDivider />

              <Text className='text-textSecondary typography-body2'>Choose a preferred method</Text>

              <View className='mt-auto flex w-full flex-col gap-2'>
                <UiButton size='large' title='Create a new profile' onPress={handleCreatePK} />
                <UiButton size='large' title='Re-activate old profile' onPress={handleImportPK} />
              </View>
            </View>
          </BottomSheetView>
        </UiBottomSheet>
      </View>
    </UiScreenScrollable>
  )
}
