import type { TouchableOpacityProps } from 'react-native'
import { Text, TouchableOpacity, View } from 'react-native'

import { cn } from '@/theme'

export default function ActionCircleButton({
  children,
  caption,
  disabled,
  ...rest
}: TouchableOpacityProps & { caption?: string }) {
  return (
    <TouchableOpacity
      {...rest}
      className={cn('flex items-center gap-2', disabled && 'opacity-50', rest.className)}
      disabled={disabled}
    >
      <View className='flex size-[56] items-center justify-center rounded-full bg-componentPrimary'>
        {children}
      </View>

      {caption && (
        <Text className='line-clamp-1 text-textPrimary typography-caption3'>{caption}</Text>
      )}
    </TouchableOpacity>
  )
}
