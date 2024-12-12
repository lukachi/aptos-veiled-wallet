import { type ReactElement, useCallback } from 'react'
import { Text, TouchableOpacity, type TouchableOpacityProps, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { AppTabScreenProps } from '@/route-types'
import { cn, useAppPaddings, useBottomBarOffset } from '@/theme'
import { UiHorizontalDivider, UiIcon, UiScreenScrollable } from '@/ui'

import { VBCard } from './components'

export default function HomeScreen({}: AppTabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets()
  const offset = useBottomBarOffset()
  const appPaddings = useAppPaddings()

  const isNormalized = true
  const isFrozen = false
  const isRegistered = false

  const tryUnfreeze = useCallback(async () => {}, [])
  const tryRegister = useCallback(async () => {}, [])
  const tryNormalize = useCallback(async () => {}, [])

  return (
    <UiScreenScrollable>
      <View
        className='flex flex-1'
        style={{
          paddingTop: insets.top,
        }}
      >
        <VBCard
          className='flex gap-4'
          pendingAmount={'15'}
          actualAmount={'250'}
          isNormalized={isNormalized}
          isFrozen={isFrozen}
          isRegistered={isRegistered}
        />
        <UiHorizontalDivider className='my-4' />

        <View className='flex w-full flex-row items-center justify-center gap-8'>
          <ActionCircleButton caption='Withdraw'>
            <UiIcon
              libIcon={'AntDesign'}
              name={'arrowup'}
              size={32}
              className={'text-textPrimary'}
            />
          </ActionCircleButton>
          <ActionCircleButton caption='Deposit'>
            <UiIcon
              libIcon={'AntDesign'}
              name={'arrowdown'}
              size={32}
              className={'text-textPrimary'}
            />
          </ActionCircleButton>
          <ActionCircleButton caption='Transfer'>
            <UiIcon
              libIcon={'AntDesign'}
              name={'arrowright'}
              size={32}
              className={'text-textPrimary'}
            />
          </ActionCircleButton>
        </View>

        <View
          className='mt-10 flex w-full flex-1 overflow-hidden rounded-t-[24] bg-componentPrimary'
          style={{
            paddingTop: insets.top / 3,
            paddingBottom: offset,
            paddingRight: appPaddings.right,
            paddingLeft: appPaddings.left,
          }}
        >
          <View className='flex w-full flex-1'>
            <View className='flex gap-4'>
              <Text className='uppercase text-textPrimary typography-caption3'>Don't forget</Text>

              {!isRegistered && (
                <ActionCard
                  title={'Register Balance'}
                  desc={'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'}
                  leadingContent={
                    <UiIcon
                      libIcon={'FontAwesome'}
                      name={'id-card'}
                      size={32}
                      className={'self-center text-textPrimary'}
                    />
                  }
                  onPress={tryRegister}
                />
              )}

              {isFrozen && (
                <ActionCard
                  title={'Unfreeze Balance'}
                  desc={'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'}
                  leadingContent={
                    <UiIcon
                      libIcon={'FontAwesome'}
                      name={'snowflake-o'}
                      size={32}
                      className={'self-center text-textPrimary'}
                    />
                  }
                  onPress={tryUnfreeze}
                />
              )}

              {!isNormalized && (
                <ActionCard
                  title={'Normalize Balance'}
                  desc={'Lorem ipsum dolor sit amet concestetur! Lorem ipsum dolor sit amet!'}
                  leadingContent={
                    <UiIcon
                      libIcon={'FontAwesome'}
                      name={'exclamation-triangle'}
                      size={32}
                      className={'self-center text-textPrimary'}
                    />
                  }
                  onPress={tryNormalize}
                />
              )}
            </View>

            <UiHorizontalDivider className='my-4' />
          </View>
        </View>
      </View>
    </UiScreenScrollable>
  )
}

function ActionCircleButton({
  children,
  caption,
  disabled,
  ...rest
}: TouchableOpacityProps & { caption?: string }) {
  return (
    <TouchableOpacity
      {...rest}
      className={cn('flex items-center gap-2', rest.className, disabled && 'opacity-50')}
    >
      <View className='flex size-[56] items-center justify-center rounded-full bg-componentPrimary'>
        {children}
      </View>
      {caption && <Text className='text-textPrimary'>{caption}</Text>}
    </TouchableOpacity>
  )
}

function ActionCard({
  title,
  desc,
  leadingContent,
  ...rest
}: { title: string; desc?: string; leadingContent?: ReactElement } & TouchableOpacityProps) {
  return (
    <TouchableOpacity
      {...rest}
      className={cn('flex flex-row gap-4 rounded-2xl bg-componentPrimary p-4', rest.className)}
    >
      {leadingContent}
      <View className='flex-1'>
        <Text className='text-textPrimary typography-subtitle2'>{title}</Text>
        {desc && <Text className='text-textSecondary typography-body3'>{desc}</Text>}
      </View>
      <View className='flex size-[36] items-center justify-center self-center rounded-full bg-componentSelected'>
        <UiIcon libIcon='AntDesign' name='caretright' size={12} className='text-baseWhite' />
      </View>
    </TouchableOpacity>
  )
}
