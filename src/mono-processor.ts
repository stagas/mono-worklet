import { VM } from 'monolang'
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

  private vm!: VM
  private initial = false
  private suspended = true
  private disabled = false

  private offsetFrame = 0

  private lastMidiEventTime = 0
  private timeToSuspend = 5

  private didPlay = false

  constructor(public options: AudioWorkletNodeOptions) {
    super()
    this.createVM()
  }

  workerPort?: MessagePort

  async setPort(port: MessagePort) {
    this.workerPort = port
    this.vm.setPort(port)
  }

  setTimeToSuspend(ms: number) {
    this.timeToSuspend = ms
  }

  async setCode(code: string) {
    await this.vm.setCode(code)

    // console.log(this.vm.exports.note_on)
    // console.log(this.vm.exports.note_on?.length)
    if (this.initial) {
      this.initial = false
      this.vm.exports.sampleRate.value = sampleRate
      this.vm.exports.currentTime.value = 1
    }

    return { params: this.vm.params }
  }

  async setSampleBuffer(index: number, buffer: Float32Array[], range: [number, number]) {
    return this.vm.setSampleBuffer(index, buffer, range)
  }

  async setSampleBufferRange(index: number, range: [number, number]) {
    return this.vm.setSampleBufferRange(index, range)
  }

  async createVM() {
    this.initial = true
    this.didPlay = false
    const code = this.vm?.code
    const sampleBuffers = this.vm?.sampleBuffers
    this.vm = new VM()
    if (this.workerPort) {
      this.vm.setPort(this.workerPort)
      if (code) {
        this.vm.sampleBuffers = sampleBuffers
        return this.setCode(code)
      }
    }
  }

  test(frame: number, end: number, params: any[]) {
    this.vm.exports.fill(0, frame, 0, end, ...params)
    return this.vm.floats.slice(0, length)
  }

  resume() {
    this.suspended = false
  }

  suspend() {
    this.suspended = true
  }

  disable() {
    this.disabled = true
  }

  handleMidiEvent(payload: MIDIMessageEvent['data'], noFill = false) {
    // this fixes an issue where note_on is fired before
    // there was time for fill to do __begin__, so the pointers
    // haven't been setup yet.
    // TODO: move queue consuming inside the fill() function
    if (!this.didPlay) return

    // run sync timers and inits by filling 0 frames when the
    // midi event arrives
    // TODO: what about other channels?
    if (!noFill) {
      this.vm.exports.fill(0, currentFrame - this.offsetFrame, 0, 0)
    }

    // @ts-ignore
    this.vm.exports[MidiOp[payload[0]]]?.(payload[1], payload[2])
  }

  resetTime() {
    this.offsetFrame = currentFrame
  }

  resetTimeAndWakeup() {
    this.resetTime()
    this.suspended = false
    this.vm.exports.fill(0, currentFrame - this.offsetFrame, 0, 0)
  }

  processMidiEvents() {
    // if (this.vm.exports) {
    //   this.vm.exports.currentTime.value = currentFrame / sampleRate
    // }

    // wake-up
    this.suspended = false
  }

  processWithMidi(
    [possibleInputs]: Float32Array[][],
    [outputs]: Float32Array[][],
    parameters: Record<string, Float32Array>,
    events: MIDIMessageEvent[],
  ) {
    if (this.disabled) return false

    const { vm } = this
    if (!vm.isReady) return true

    const { parametersMap } = MonoProcessor

    const inputs: (Float32Array | null)[] = []
    let activeInputChannelCount = 0

    for (let i = 0; i < possibleInputs.length; i++) {
      const x = possibleInputs[i]
      const hasSound = x[0] !== 0 || x.at(-1) !== 0
      if (i < vm.config.channels || hasSound) {
        if (hasSound) {
          inputs.push(x)
          activeInputChannelCount++
        } else {
          inputs.push(null)
        }
      }
    }

    if (this.suspended) {
      // wake-up on input
      if (activeInputChannelCount) {
        this.lastMidiEventTime = currentTime
        this.suspended = false
      } else return true
    }

    const channelCount = inputs.length || 1

    vm.setNumberOfChannels(channelCount)

    //!> count++
    //!> if (count % 500 === 0)
    //!time 'fill'

    if (channelCount) copyBuffers(inputs, vm.inputs, channelCount, vm)

    vm.params.forEach((x, i) => {
      if (!(x.name in vm.exports)) return
      const value = parameters[parametersMap[i]][0] * x.scaleValue + x.minValue
      vm.exports[x.name].value = value
    })

    let frame = currentFrame - this.offsetFrame
    let totalFrames = 0

    const processEvents = []

    if (events.length) {
      //!? events
      this.lastMidiEventTime = currentTime
      // let i = 0
      // TODO: saturate number of events to a maximum
      for (const event of events) {
        if (event.deltaFrame) {
          processEvents.push([0, frame, totalFrames, totalFrames + event.deltaFrame])
          // for (let channel = 0; channel < channelCount; channel++) {
          // vm.exports.fill(channel, frame, totalFrames, totalFrames + event.deltaFrame)
          // }
          // i++
          frame += event.deltaFrame
          totalFrames += event.deltaFrame
        }
        // TODO: we should probably handle the events in wasm side
        //  and instead pass all of the events at once by writing to a shared buffer
        //  which will then be consumed by the wasm vm, because calling functions
        //  (crossing boundaries) is expensive. though they're usually not that many
        //  so it should be fine for now.
        processEvents.push([1, event.data[0], event.data[1], event.data[2]])
        // this.handleMidiEvent(event.data, i > 0)
        // i++
      }
    } else {
      if (currentTime - this.lastMidiEventTime > this.timeToSuspend) {
        //!? 'suspended'
        this.suspended = true
      }
    }

    if (totalFrames < vm.config.blockSize) {
      processEvents.push([0, frame, totalFrames, vm.config.blockSize])
      // for (let channel = 0; channel < channelCount; channel++) {
      //   vm.exports.fill(channel, frame, totalFrames, vm.config.blockSize)
      // }
    }

    vm.ints.set(processEvents.slice(0, 128).flat(), vm.config.eventsPointer >> 2)

    // const ints = new DataView(vm.memory.buffer, ptr + 20, processEvents.length << 2)
    // for (let i = 0; i < processEvents.length; i++) {
    //   ints.setInt32(i << 2, processEvents[i], true)
    // }
    // if (processEvents.length) {
    //   console.log(processEvents)
    // }
    // ints.(processEvents)
    // vm.ints.set(processEvents, ptr + 20)
    vm.exports.process(1, Math.min(128, processEvents.length))

    //!> if (count % 500 === 0)
    //!timeEnd 'fill'

    copyBuffers(vm.outputs, outputs, channelCount, vm)
    // if (channelCount > 1) {
    //   console.log('what')
    //   debugger
    // }
    // if (outputs[1][0] !== 0) {
    //   debugger
    // }

    this.didPlay = true

    return true
  }
}

registerProcessor(MonoProcessor.processorName, MonoProcessor)
