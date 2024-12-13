import { NativeModule, requireNativeModule } from 'expo';

import { RangeProofModuleEvents } from './RangeProof.types';

declare class RangeProofModule extends NativeModule<RangeProofModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<RangeProofModule>('RangeProof');
