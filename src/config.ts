import { Env } from '@env'

export const Config = {
  DEFAULT_TOKEN: {
    address: Env.DEFAULT_VEILED_TOKEN_ADDRESS,
    name: 'Mocked token',
    symbol: 'MTK',
    decimals: 0,
    iconUri: '',
  },
}
