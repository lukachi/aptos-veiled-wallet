package expo.modules.rangeproof

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.example.rangeproof.rangeProof
import com.example.rangeproof.verifyProof
import java.nio.ByteOrder

fun ByteArray.toULong(endianess: ByteOrder = ByteOrder.BIG_ENDIAN): ULong {
  require(size == 8) { "ByteArray must have size 8" }

  return when (endianess) {
    ByteOrder.BIG_ENDIAN ->
      (this[7].toULong() and 0xFFu) shl 56 or
        (this[6].toULong() and 0xFFu) shl 48 or
        (this[5].toULong() and 0xFFu) shl 40 or
        (this[4].toULong() and 0xFFu) shl 32 or
        (this[3].toULong() and 0xFFu) shl 24 or
        (this[2].toULong() and 0xFFu) shl 16 or
        (this[1].toULong() and 0xFFu) shl 8 or
        (this[0].toULong() and 0xFFu)

    ByteOrder.LITTLE_ENDIAN ->
      (this[0].toULong() and 0xFFu) shl 56 or
        (this[1].toULong() and 0xFFu) shl 48 or
        (this[2].toULong() and 0xFFu) shl 40 or
        (this[3].toULong() and 0xFFu) shl 32 or
        (this[4].toULong() and 0xFFu) shl 24 or
        (this[5].toULong() and 0xFFu) shl 16 or
        (this[6].toULong() and 0xFFu) shl 8 or
        (this[7].toULong() and 0xFFu)

    else -> {
      throw IllegalArgumentException("Unsupported ByteOrder: $endianess")
    }
  }
}

class RangeProofModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('RangeProof')` in JavaScript.
    Name("RangeProof")

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("genRangeProof") { v: Long, r: ByteArray, valBase: ByteArray, randBase: ByteArray, bits: Long ->
      val result = rangeProof(v.toULong(), r, valBase, randBase, bits.toULong())

      val commitmentBytes = result.comm()

      val proofBytes = result.proof()

      return@AsyncFunction mapOf(
        "commitment" to commitmentBytes,
        "proof" to proofBytes
      )
    }

    AsyncFunction("verifyRangeProof") { proof: ByteArray, commitment: ByteArray, valBase: ByteArray, randBase: ByteArray, bits: Long ->
      val result = verifyProof(proof, commitment, valBase, randBase, bits.toULong())

      return@AsyncFunction result
    }
  }
}
