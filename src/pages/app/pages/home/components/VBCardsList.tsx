import { useRef } from 'react'
import type { ViewProps } from 'react-native'
import { Dimensions, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import type { ICarouselInstance } from 'react-native-reanimated-carousel'
import Carousel from 'react-native-reanimated-carousel'

import { VBCard } from '@/pages/app/pages/home/components/index'
import { useVeiledCoinContext } from '@/pages/app/VeiledCoinContextProvider'
import { cn, useAppPaddings } from '@/theme'

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
  } = useVeiledCoinContext()

  console.log('tokens', tokens)

  const ref = useRef<ICarouselInstance>(null)

  const progress = useSharedValue(0)

  return (
    <View {...rest} className={cn('w-full flex-1 overflow-hidden pb-6', className)}>
      <Carousel
        ref={ref}
        vertical={undefined}
        width={screenWidth}
        height={300}
        data={tokens}
        onProgressChange={progress}
        loop={false}
        autoPlay={false}
        onSnapToItem={index => {
          if (selectedToken.address.toLowerCase() === tokens[index].address) return

          setSelectedTokenAddress(tokens[index].address)
        }}
        autoPlayInterval={5_000}
        style={{
          paddingLeft: appPaddings.left,
          paddingRight: appPaddings.right,
        }}
        renderItem={({ index }) => {
          const currTokenStatuses = perTokenStatuses[tokens[index].address]

          console.log('currTokenStatuses', currTokenStatuses)

          return (
            <VBCard
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
          )
        }}
      />
    </View>
  )
}
