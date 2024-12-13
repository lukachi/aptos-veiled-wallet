import { Buffer } from 'buffer'
import { Platform } from 'react-native'

import RangeProofModule from './src/RangeProofModule'

export async function genRangeProof(opts: {
  v: bigint
  r: Uint8Array
  valBase: Uint8Array
  randBase: Uint8Array
  bits?: number
}): Promise<{
  proof: Uint8Array
  commitment: Uint8Array
}> {
  const result = await RangeProofModule.genRangeProof(
    +opts.v.toString(),
    new Uint8Array(opts.r),
    new Uint8Array(opts.valBase),
    new Uint8Array(opts.randBase),
    opts.bits || 32,
  )

  if (Platform.OS === 'ios') {
    const jsonStringified = Buffer.from(result).toString()

    return JSON.parse(jsonStringified)
  }

  return result
}

export async function verifyRangeProof(opts: {
  proof: Uint8Array
  commitment: Uint8Array
  valBase: Uint8Array
  randBase: Uint8Array
  bits?: number
}): Promise<boolean> {
  return await RangeProofModule.verifyRangeProof(
    new Uint8Array(opts.proof),
    new Uint8Array(opts.commitment),
    new Uint8Array(opts.valBase),
    new Uint8Array(opts.randBase),
    opts.bits || 32,
  )
}
