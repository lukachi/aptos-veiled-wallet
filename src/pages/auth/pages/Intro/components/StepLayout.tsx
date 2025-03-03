import type { ReactElement } from 'react'
import type { ViewProps } from 'react-native'
import { Text, View } from 'react-native'

import { cn } from '@/theme'

type StepLayoutProps = ViewProps & {
  title: string | ReactElement
  subtitle: string | ReactElement
  media: ReactElement
}

export default function StepLayout({
  title,
  subtitle,
  media,
  className,
  ...rest
}: StepLayoutProps) {
  return (
    <View {...rest} className={cn('flex flex-col items-center justify-end gap-10', className)}>
      <View className={cn('my-auto')}>{media}</View>
      <View className={cn('flex flex-col gap-4')}>
        {typeof title === 'string' ? (
          <Text className={cn('text-center text-textPrimary typography-h5')}>{title}</Text>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <Text className={cn('text-center text-textPrimary typography-body2')}>{subtitle}</Text>
        ) : (
          subtitle
        )}
      </View>
    </View>
  )
}
