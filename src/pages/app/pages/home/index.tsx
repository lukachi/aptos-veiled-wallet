import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { AppTabScreenProps } from '@/route-types'
import { useAppPaddings, useBottomBarOffset } from '@/theme'
import { UiScreenScrollable } from '@/ui'

export default function HomeScreen({}: AppTabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets()
  const offset = useBottomBarOffset()
  const appPaddings = useAppPaddings()

  return (
    <UiScreenScrollable>
      <View
        className='flex flex-1'
        style={{
          paddingTop: insets.top,
          paddingRight: appPaddings.right,
          paddingBottom: offset,
          paddingLeft: appPaddings.left,
        }}
      >
        <Text className='text-textPrimary typography-body3' />
        <Text className='text-textPrimary typography-body3' />
      </View>
    </UiScreenScrollable>
  )
}
