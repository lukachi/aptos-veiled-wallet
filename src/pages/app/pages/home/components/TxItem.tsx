import { Text, TouchableOpacity, View, type ViewProps } from 'react-native'

import { formatDateDMYT } from '@/helpers'
import { useCopyWithHaptics } from '@/hooks'
import { type TxHistoryItem } from '@/store'
import { cn } from '@/theme'
import { UiIcon } from '@/ui'

type Props = TxHistoryItem & ViewProps

export default function TxItem({ createdAt, txType, txHash, ...rest }: Props) {
  const message = {
    transfer: 'Transfer',
    ['transfer-native']: 'Send APT',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    rollover: 'Rollover',
    'key-rotation': 'Key rotation',
    freeze: 'Freeze',
    unfreeze: 'Unfreeze',
    register: 'Register',
    normalize: 'Normalize',
    mint: 'Mint',
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
    ['transfer-native']: (
      <UiIcon
        libIcon={'FontAwesome6'}
        name={'angle-right'}
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
    register: (
      <UiIcon libIcon={'AntDesign'} name={'idcard'} size={24} className={cn('text-textPrimary')} />
    ),
    normalize: (
      <UiIcon libIcon={'AntDesign'} name={'edit'} size={24} className={cn('text-textPrimary')} />
    ),
    mint: (
      <UiIcon
        libIcon={'MaterialCommunityIcons'}
        name={'hand-coin'}
        size={24}
        className={cn('text-textPrimary')}
      />
    ),
  }[txType]

  const { isCopied, copy } = useCopyWithHaptics()

  return (
    <View {...rest} className={cn('flex flex-row items-center gap-4', rest.className)}>
      <View className='flex size-[48] items-center justify-center rounded-full bg-componentSelected'>
        {icon}
      </View>
      <View className='flex gap-2'>
        {createdAt && <Text className='text-textPrimary'>{formatDateDMYT(createdAt)}</Text>}
        <Text className='text-textPrimary'>{message}</Text>
      </View>

      <TouchableOpacity className='ml-auto p-4' onPress={() => copy(txHash)}>
        <UiIcon
          libIcon={'AntDesign'}
          name={isCopied ? 'check' : 'copy1'}
          size={18}
          className='text-textPrimary'
        />
      </TouchableOpacity>
    </View>
  )
}
