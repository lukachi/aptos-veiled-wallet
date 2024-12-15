import { ComponentProps } from 'react'
import UiImage from '@/ui/UiImage'
import { useAppTheme } from '@/theme'

type Props = ComponentProps<typeof UiImage>

export default function UiLogo(props: Props) {
  const { selectedTheme, colorScheme } = useAppTheme()

  const DarkLogo = (
    <UiImage
      {...props}
      style={[{ width: 24, height: 24 }, props.style]}
      source={require('@assets/icon-dark.png')}
    />
  )
  const LightLogo = (
    <UiImage
      {...props}
      style={[{ width: 24, height: 24 }, props.style]}
      source={require('@assets/icon.png')}
    />
  )

  if (selectedTheme === 'system') {
    if (colorScheme === 'dark') {
      return DarkLogo
    }

    return LightLogo
  }

  if (selectedTheme === 'dark') {
    return DarkLogo
  }

  return LightLogo
}
