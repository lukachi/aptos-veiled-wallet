import { Text, View } from 'react-native'

import type { AppTabScreenProps } from '@/route-types'

export default function HomeScreen({}: AppTabScreenProps<'Home'>) {
  return (
    <View>
      <Text>Home screen</Text>
    </View>
  )
}
