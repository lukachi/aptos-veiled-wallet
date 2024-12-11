import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getAptBalance, getVeiledBalances } from '@/api/modules/aptos'
import { useLoading } from '@/hooks'
import type { AppTabScreenProps } from '@/route-types'
import { walletStore } from '@/store'
import { useAppPaddings, useBottomBarOffset } from '@/theme'
import { UiScreenScrollable } from '@/ui'

export default function HomeScreen({}: AppTabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets()
  const offset = useBottomBarOffset()
  const appPaddings = useAppPaddings()

  const privateKey = walletStore.useWalletStore(state => state.privateKey)
  const decryptionKey = walletStore.useWalletStore(state => state.decryptionKey)

  const {
    data: [aptBalance, veiledBalance],
  } = useLoading(
    [0, undefined],
    () => {
      return Promise.all([getAptBalance(privateKey), getVeiledBalances(privateKey, decryptionKey)])
    },
    {
      loadArgs: [privateKey, decryptionKey],
    },
  )

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
        <Text className='text-textPrimary typography-body3'>{aptBalance}</Text>
        <Text className='text-textPrimary typography-body3'>
          {veiledBalance?.actual?.amount?.toString()}
        </Text>
      </View>
    </UiScreenScrollable>
  )
}
