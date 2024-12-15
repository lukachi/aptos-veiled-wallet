import { useMemo } from 'react'
import { Text, TouchableOpacity, View, type ViewProps } from 'react-native'

import { formatBalance } from '@/helpers'
import { useCopyToClipboard } from '@/hooks'
import { ActionCircleButton } from '@/pages/app/pages/home/components/index'
import type { TokenBaseInfo } from '@/store'
import { cn } from '@/theme'
import { UiCard, UiIcon } from '@/ui'

type Props = {
  token: TokenBaseInfo
  encryptionKey: string

  pendingAmount: string
  actualAmount: string

  isLoading?: boolean

  isNormalized: boolean
  isFrozen: boolean
  isRegistered: boolean

  onRollover: () => Promise<void>
} & ViewProps

export default function VBCard({
  token,
  encryptionKey,
  pendingAmount,
  actualAmount,

  isLoading,

  isNormalized,
  isFrozen,
  isRegistered,

  onRollover,

  ...rest
}: Props) {
  const VBStatusContent = useMemo(() => {
    if (isLoading) return

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
  }, [isFrozen, isLoading, isNormalized, isRegistered])

  const { copy, isCopied } = useCopyToClipboard()

  return (
    <View className='relative'>
      {VBStatusContent}
      <UiCard {...rest} className={cn('z-20 flex gap-4', rest.className)}>
        <View className='flex flex-row items-center gap-2'>
          <Text className='text-textPrimary typography-subtitle2'>{token.name}</Text>

          <TouchableOpacity onPress={() => copy(token.address)}>
            <UiIcon
              libIcon='AntDesign'
              name={isCopied ? 'check' : 'copy1'}
              size={16}
              className='pl-2 text-textSecondary'
            />
          </TouchableOpacity>
        </View>

        <View className='flex flex-row items-center'>
          <View className='flex gap-1'>
            <Text className='text-textSecondary typography-caption1'>
              Pending / <Text className='text-textPrimary'>Actual</Text>
            </Text>
            <Text className='text-textPrimary typography-subtitle1'>
              <Text className='text-textSecondary'>
                {formatBalance(pendingAmount, token.decimals)}
              </Text>{' '}
              / {formatBalance(actualAmount, token.decimals)}
            </Text>
          </View>

          {/*TODO: isNaN*/}
          {Boolean(+pendingAmount) && (
            <ActionCircleButton caption='rollover' className='ml-auto' onPress={onRollover}>
              <UiIcon
                libIcon={'AntDesign'}
                name={'sync'}
                size={16}
                className={'text-textPrimary'}
              />
            </ActionCircleButton>
          )}
        </View>

        <CopyField label='Encryption Key' text={encryptionKey} className='' />
      </UiCard>
    </View>
  )
}

function CopyField({ text, label, ...rest }: ViewProps & { text: string; label?: string }) {
  const { isCopied, copy } = useCopyToClipboard()

  return (
    <View {...rest} className={cn('flex gap-2', rest.className)}>
      {label && <Text className='ml-4 text-textSecondary typography-body3'>{label}</Text>}
      <View className={cn('flex flex-row items-center rounded-2xl bg-componentPrimary px-4')}>
        <Text className='line-clamp-1 flex-1 text-textPrimary typography-body2'>{text}</Text>
        <TouchableOpacity onPress={() => copy(text)}>
          <UiIcon
            libIcon='AntDesign'
            name={isCopied ? 'check' : 'copy1'}
            size={16}
            className='p-4 pr-0 text-textSecondary'
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}
