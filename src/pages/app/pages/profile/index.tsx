import { useCallback, useMemo } from 'react'
import type { ViewProps } from 'react-native'
import { Button, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSelectedLanguage } from '@/core'
import { type Language, resources } from '@/core/localization/resources'
import { useCopyWithHaptics } from '@/hooks'
import type { AppTabScreenProps } from '@/route-types'
import {
  authStore,
  BiometricStatuses,
  localAuthStore,
  PasscodeStatuses,
  walletStore,
} from '@/store'
import { cn, useAppPaddings, useBottomBarOffset, useSelectedTheme } from '@/theme'
import { UiButton, UiCard, UiIcon, UiScreenScrollable, UiSwitcher } from '@/ui'

import AppContainer from '../../components/AppContainer'

export default function ProfileScreen({}: AppTabScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets()
  const appPaddings = useAppPaddings()
  const offset = useBottomBarOffset()

  return (
    <AppContainer>
      <UiScreenScrollable
        style={{
          paddingTop: insets.top,
          paddingLeft: appPaddings.left,
          paddingRight: appPaddings.right,
          paddingBottom: offset,
        }}
        className='gap-3'
      >
        <View className='flex flex-1 flex-col gap-4'>
          <LangCard />
          <ThemeCard />
          <LocalAuthMethodCard />
          <PrivateKeysOverview />
          <LogoutCard />
        </View>
      </UiScreenScrollable>
    </AppContainer>
  )
}

function PrivateKeysOverview() {
  const privateKeyHexList = walletStore.useWalletStore(state => state.privateKeyHexList)

  return (
    <UiCard className={cn('flex items-center gap-1')}>
      <Text className='uppercase text-textPrimary typography-caption1'>Private keys</Text>
      {privateKeyHexList.map(el => (
        <PrivateKeysOverviewItem key={el} privateKeyHex={el} />
      ))}
    </UiCard>
  )
}

function PrivateKeysOverviewItem({
  privateKeyHex,
  className,
  ...rest
}: { privateKeyHex: string } & ViewProps) {
  const { isCopied, copy } = useCopyWithHaptics()

  return (
    <View {...rest} className={cn('flex flex-row items-center rounded-md px-4 py-2', className)}>
      <Text className='line-clamp-1 flex-1 text-textPrimary typography-body2'>{privateKeyHex}</Text>
      <TouchableOpacity onPress={() => copy(privateKeyHex)}>
        <UiIcon
          libIcon='AntDesign'
          name={isCopied ? 'check' : 'copy1'}
          size={20}
          className='p-4 text-textPrimary'
        />
      </TouchableOpacity>
    </View>
  )
}

function LangCard() {
  // TODO: reload app after change language
  const { language, setLanguage } = useSelectedLanguage()

  return (
    <UiCard className={cn('flex flex-col items-center gap-4')}>
      <Text className={cn('uppercase text-textPrimary typography-caption1')}>
        current lang: {language}
      </Text>

      <View className={cn('flex flex-row gap-2')}>
        {Object.keys(resources).map(el => (
          <Button
            key={el}
            title={el}
            onPress={() => {
              setLanguage(el as Language)
            }}
          />
        ))}
      </View>
    </UiCard>
  )
}

function ThemeCard() {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme()

  return (
    <UiCard className={cn('flex items-center gap-4')}>
      <Text className={cn('uppercase text-textPrimary typography-caption1')}>{selectedTheme}</Text>

      <View className={cn('flex flex-row gap-4')}>
        <Button title='Light' onPress={() => setSelectedTheme('light')} />
        <Button title='Dark' onPress={() => setSelectedTheme('dark')} />
        <Button title='System' onPress={() => setSelectedTheme('system')} />
      </View>
    </UiCard>
  )
}

function LocalAuthMethodCard() {
  const passcodeStatus = localAuthStore.useLocalAuthStore(state => state.passcodeStatus)
  const biometricStatus = localAuthStore.useLocalAuthStore(state => state.biometricStatus)
  const disablePasscode = localAuthStore.useLocalAuthStore(state => state.disablePasscode)
  const disableBiometric = localAuthStore.useLocalAuthStore(state => state.disableBiometrics)

  const setPasscodeStatus = localAuthStore.useLocalAuthStore(state => state.setPasscodeStatus)
  const setBiometricsStatus = localAuthStore.useLocalAuthStore(state => state.setBiometricsStatus)

  const isPasscodeEnabled = useMemo(
    () => passcodeStatus === PasscodeStatuses.Enabled,
    [passcodeStatus],
  )

  const isBiometricsEnrolled = useMemo(() => {
    return ![BiometricStatuses.NotSupported, BiometricStatuses.NotEnrolled].includes(
      biometricStatus,
    )
  }, [biometricStatus])

  const isBiometricsEnabled = useMemo(
    () => biometricStatus === BiometricStatuses.Enabled,
    [biometricStatus],
  )

  const handleChangePasscodeStatus = useCallback(() => {
    if (isPasscodeEnabled) {
      disablePasscode()

      return
    }

    setPasscodeStatus(PasscodeStatuses.NotSet)
  }, [disablePasscode, isPasscodeEnabled, setPasscodeStatus])

  const handleChangeBiometricStatus = useCallback(() => {
    if (biometricStatus === BiometricStatuses.Enabled) {
      disableBiometric()

      return
    }

    setBiometricsStatus(BiometricStatuses.NotSet)
  }, [biometricStatus, disableBiometric, setBiometricsStatus])

  return (
    <UiCard className='flex flex-col gap-4'>
      <Text className='mb-4 text-center uppercase text-textPrimary typography-caption1'>
        Auth methods
      </Text>

      <View className='flex flex-row items-center justify-around'>
        <UiSwitcher
          label='Passcode'
          value={isPasscodeEnabled}
          onValueChange={handleChangePasscodeStatus}
        />
        {isBiometricsEnrolled && (
          <UiSwitcher
            label='Biometric'
            value={isBiometricsEnabled}
            onValueChange={handleChangeBiometricStatus}
            disabled={!isPasscodeEnabled}
          />
        )}
      </View>
    </UiCard>
  )
}

function LogoutCard() {
  const logout = authStore.useLogout()

  return (
    <UiCard className='mt-auto'>
      <UiButton
        color='error'
        title='delete account'
        trailingIconProps={{
          customIcon: 'trashSimpleIcon',
        }}
        onPress={logout}
      />
    </UiCard>
  )
}
