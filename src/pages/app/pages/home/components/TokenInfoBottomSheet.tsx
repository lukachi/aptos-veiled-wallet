import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { type ComponentProps, forwardRef, useImperativeHandle } from 'react'
import type { ViewProps } from 'react-native'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { TokenBaseInfo } from '@/store'
import { cn, useAppPaddings } from '@/theme'
import { UiBottomSheet, UiHorizontalDivider, UiImage, useUiBottomSheet } from '@/ui'

type Props = { token: TokenBaseInfo } & Omit<ComponentProps<typeof UiBottomSheet>, 'children'>

export const TokenInfoBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ token, ...rest }, ref) => {
    const insets = useSafeAreaInsets()
    const appPaddings = useAppPaddings()

    const bottomSheet = useUiBottomSheet()

    useImperativeHandle(ref, () => bottomSheet.ref.current as BottomSheetModal, [bottomSheet])

    return (
      <UiBottomSheet {...rest} ref={bottomSheet.ref} title='Add Token' snapPoints={['50%']}>
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

              {token && (
                <View className='mt-3 flex gap-3'>
                  {token.iconUri && (
                    <UiImage source={{ uri: token.iconUri }} className='size-[75] rounded-full' />
                  )}
                  <TokenInfoItem label={'Name'} value={token.name} />
                  <TokenInfoItem label={'Symbol'} value={token.symbol} />
                  <TokenInfoItem label={'Decimals'} value={String(token.decimals)} />
                </View>
              )}
            </View>
          </BottomSheetScrollView>
        </View>
      </UiBottomSheet>
    )
  },
)

function TokenInfoItem({
  label,
  value,
  className,
  ...rest
}: { label: string; value: string } & ViewProps) {
  return (
    <View {...rest} className={cn('flex flex-row items-center justify-between', className)}>
      <Text className='uppercase text-textPrimary typography-caption2'>{label}</Text>
      <Text className='text-right text-textPrimary typography-body2'>{value}</Text>
    </View>
  )
}
