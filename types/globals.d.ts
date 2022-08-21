/* when needed to enable jsx */

// declare namespace JSX {
//   declare interface IntrinsicElements {
//     [k: string]: any
//   }
// }

declare class MIDIMessageEvent extends Event implements WebMidi.MIDIMessageEvent {
  data: Uint8Array
  receivedTime: number
  constructor(kind: string, payload?: { data: Uint8Array })
}

// declare global {
//   class MIDIMessageEvent extends Event {
//     data: Uint8Array
//     receivedTime: number
//     constructor(kind: string, payload?: { data: Uint8Array })
//   }

//   const currentFrame: number
//   const currentTime: number
//   const sampleRate: number

//   const AudioWorkletProcessor: {
//     prototype: AudioWorkletProcessor
//     new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor
//   }

//   interface AudioParamDescriptor {
//     name: string
//     defaultValue?: number
//     minValue?: number
//     maxValue?: number
//     automationRate?: 'a-rate' | 'k-rate'
//     slope?: number
//     select?: string[]
//     symmetric?: boolean
//     stringValue?: string
//   }

//   interface AudioWorkletProcessor {
//     readonly port: MessagePort
//     process(
//       inputs: Float32Array[][],
//       outputs: Float32Array[][],
//       parameters: Record<string, Float32Array>
//     ): boolean
//   }

//   function registerProcessor(
//     name: string,
//     processorCtor: (new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor) & {
//       parameterDescriptors?: AudioParamDescriptor[]
//     }
//   ): void
// }

// export {}
