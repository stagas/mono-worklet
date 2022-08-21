import { LinkerConfig, VM } from 'monolang'
import { MIDIMessageEvent, SchedulerTargetProcessor } from 'scheduler-node/target-processor'
import { copyBuffers } from './util'

// @ts-ignore
// eslint-disable-next-line
let count = 0

const MidiOp = {
  0x90: 'note_on',
  0x89: 'note_off',
}

export class MonoProcessor extends SchedulerTargetProcessor {
  static processorName = 'mono'

  static inputChannelCount = [0]
  static outputChannelCount = [1]

  private static parametersMap = 'abcdefghijklmnopqrstuvwxyz'

  static get parameterDescriptors() {
    return this.parametersMap.split('').map(
      name => ({
        name,
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate',
      })
    )
  }

  blockSize = 128

  private vm: VM

  private initial = false
  private suspended = true
  private disabled = false

  private lastMidiEventTime = 0
  private timeToSuspend = 5

  constructor(options: AudioWorkletNodeOptions & { processorOptions?: Partial<LinkerConfig> }) {
    super()
    this.vm = new VM(options.processorOptions ?? { metrics: 2 })
  }

  async setCode(code: string) {
    await this.vm.setCode(code)

    if (this.initial) {
      this.initial = false
      this.vm.exports.sampleRate.value = sampleRate
    }

    return { params: this.vm.params }
  }

  test(frame: number, end: number, params: any[]) {
    this.vm.exports.fill(frame, 0, end, ...params)
    return this.vm.outputs[0].slice(0, length)
  }

  suspend() {
    this.suspended = true
  }

  disable() {
    this.disabled = true
  }

  handleMidiEvent(payload: MIDIMessageEvent['data']) {
    // @ts-ignore
    this.vm.exports[MidiOp[payload[0]]]?.(payload[1], payload[2])
  }

  processMidiEvents() {
    if (this.vm.exports) {
      this.vm.exports.currentTime.value = currentFrame / sampleRate
    }
    this.suspended = false
  }

  processWithMidi(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
    events: MIDIMessageEvent[],
  ) {
    const { inputChannelCount, outputChannelCount, parametersMap } = MonoProcessor
    const { blockSize, vm } = this

    if (this.disabled) return false
    if (!vm.isReady || this.suspended) return true

    //!> count++
    //!> if (count % 500 === 0)
    //!time 'fill'

    copyBuffers(blockSize, inputs, inputChannelCount, vm.inputs[0])

    vm.params.map((x, i) => {
      const value = parameters[parametersMap[i]][0] * x.scaleValue + x.minValue
      vm.exports[x.name].value = value
    })

    let frame = currentFrame
    let totalFrames = 0

    if (events.length) {
      //!? events
      this.lastMidiEventTime = currentTime
      for (const event of events) {
        if (event.deltaFrame) {
          vm.exports.fill(frame, totalFrames, totalFrames + event.deltaFrame)
          frame += event.deltaFrame
          totalFrames += event.deltaFrame
        }
        this.handleMidiEvent(event.data)
      }
    } else {
      if (currentTime - this.lastMidiEventTime > this.timeToSuspend) {
        //!? 'suspended'
        this.suspended = true
      }
    }

    if (totalFrames < blockSize)
      vm.exports.fill(frame, totalFrames, blockSize)

    //!> if (count % 500 === 0)
    //!timeEnd 'fill'

    copyBuffers(blockSize, outputs, outputChannelCount, vm.outputs[0], true)

    return true
  }
}

registerProcessor(MonoProcessor.processorName, MonoProcessor)
