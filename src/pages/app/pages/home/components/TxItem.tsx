import type { TimeDate } from '@distributedlab/tools'
import { Text, View, type ViewProps } from 'react-native'

import { formatDateDMYT } from '@/helpers'
import { cn } from '@/theme'
import { UiIcon } from '@/ui'

type Props = {
  createdAt: TimeDate
  txType: 'transfer' | 'deposit' | 'withdraw' | 'rollover' | 'key-rotation' | 'freeze' | 'unfreeze'
} & ViewProps

export default function TxItem({ createdAt, txType, ...rest }: Props) {
  const message = {
    transfer: 'Transfer',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    rollover: 'Rollover',
    'key-rotation': 'Key rotation',
    freeze: 'Freeze',
    unfreeze: 'Unfreeze',
  }[txType]

  const icon = {
    transfer: (
      <UiIcon
        libIcon={'AntDesign'}
        name={'arrowright'}
        size={24}
        className={cn('text-textPrimary')}
      />
    ),
    deposit: (
      <UiIcon
        libIcon={'AntDesign'}
        name={'arrowdown'}
        size={24}
        className={cn('text-textPrimary')}
      />
    ),
    withdraw: (
      <UiIcon libIcon={'AntDesign'} name={'arrowup'} size={24} className={cn('text-textPrimary')} />
    ),
    rollover: (
      <UiIcon libIcon={'AntDesign'} name={'sync'} size={24} className={cn('text-textPrimary')} />
    ),
    'key-rotation': (
      <UiIcon libIcon={'AntDesign'} name={'key'} size={24} className={cn('text-textPrimary')} />
    ),
    freeze: (
      <UiIcon libIcon={'AntDesign'} name={'lock'} size={24} className={cn('text-textPrimary')} />
    ),
    unfreeze: (
      <UiIcon libIcon={'AntDesign'} name={'unlock'} size={24} className={cn('text-textPrimary')} />
    ),
  }[txType]

  return (
    <View {...rest} className={cn('flex flex-row gap-4', rest.className)}>
      <View className='flex size-[48] items-center justify-center rounded-full bg-componentSelected'>
        {icon}
      </View>
      <View className='flex gap-2'>
        {createdAt && <Text className='text-textPrimary'>{formatDateDMYT(createdAt)}</Text>}
        <Text className='text-textPrimary'>{message}</Text>
      </View>
    </View>
  )
}
