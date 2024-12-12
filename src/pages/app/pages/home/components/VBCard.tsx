import { useMemo } from 'react'
import { Text, TouchableOpacity, View, type ViewProps } from 'react-native'

import { useCopyToClipboard } from '@/hooks'
import { cn } from '@/theme'
import { UiCard, UiIcon } from '@/ui'

type Props = {
  encryptionKey: string

  pendingAmount: string
  actualAmount: string

  isNormalized: boolean
  isFrozen: boolean
  isRegistered: boolean
} & ViewProps

export default function VBCard({
  encryptionKey,
  pendingAmount,
  actualAmount,
  isNormalized,
  isFrozen,
  isRegistered,
  ...rest
}: Props) {
  const VBStatusContent = useMemo(() => {
    const commonClasses =
      'z-10 -mb-8 flex flex-row justify-center items-center gap-2 overflow-hidden rounded-2xl bg-errorMain pb-10 pt-1'

    if (!isRegistered) {
      return (
        <View className={cn(commonClasses, 'bg-textSecondary')}>
          <Text className='text-textPrimary typography-body2'>Balance is not registered</Text>
          <UiIcon libIcon='FontAwesome' name='credit-card' size={18} className='text-baseWhite' />
        </View>
      )
    }

    if (isFrozen) {
      return (
        <View className={cn(commonClasses, 'bg-componentDisabled')}>
          <Text className='text-textPrimary typography-body2'>Balance is Frozen</Text>
          <UiIcon libIcon='FontAwesome' name='snowflake-o' size={18} className='text-baseWhite' />
        </View>
      )
    }

    if (!isNormalized) {
      return (
        <View className={cn(commonClasses, 'bg-warningDarker')}>
          <Text className='text-textPrimary typography-body2'>Balance is unnormalized</Text>
          <UiIcon
            libIcon='FontAwesome'
            name='exclamation-triangle'
            size={18}
            className='text-baseWhite'
          />
        </View>
      )
    }

    return
  }, [isFrozen, isNormalized, isRegistered])

  return (
    <View className='relative'>
      {VBStatusContent}
      <UiCard {...rest} className={cn('z-20', rest.className)}>
        <View className='flex items-center gap-1 self-center'>
          <Text className='text-textSecondary typography-caption1'>
            Pending / <Text className='text-textPrimary'>Actual</Text>
          </Text>
          <Text className='text-textPrimary typography-subtitle1'>
            <Text className='text-textSecondary'>{pendingAmount}</Text> / {actualAmount}
          </Text>
        </View>

        <CopyField label='Encryption Key' text={encryptionKey} className='' />
      </UiCard>
    </View>
  )
}

function CopyField({ text, label, ...rest }: ViewProps & { text: string; label?: string }) {
  const { isCopied, copy } = useCopyToClipboard()

  return (
    <View {...rest} className={cn('flex gap-1', rest.className)}>
      {label && <Text className='ml-4 text-textSecondary typography-body3'>{label}</Text>}
      <View className={cn('flex flex-row rounded-2xl bg-componentPrimary p-4')}>
        <Text className='line-clamp-1 flex-1 text-textPrimary typography-body2'>{text}</Text>
        <TouchableOpacity onPress={() => copy(text)}>
          <UiIcon
            libIcon='AntDesign'
            name={isCopied ? 'check' : 'copy1'}
            size={16}
            className='pl-2 text-textSecondary'
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}
