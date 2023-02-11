import { VM } from 'monolang'
import { Clock, MIDIMessageEvent, SchedulerTargetProcessor } from 'scheduler-node/target-processor'
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

  private startVmMem!: Float32Array

  private vm!: VM
  private initial = false
  private suspended = true
  private disabled = false

  private lastMidiEventTime = 0
  private timeToSuspend = 15

  private didPlay = false

  clock = new Clock()

  // private prevFrame = 0

  constructor(public options: AudioWorkletNodeOptions) {
    super()
    this.createVM()
  }

  workerPort?: MessagePort

  async setPort(port: MessagePort) {
    this.workerPort = port
    this.vm.setPort(port)
  }

  setClockBuffer(clockBuffer: Float64Array) {
    this.clock.buffer = clockBuffer
  }

  setTimeToSuspend(ms: number) {
    this.timeToSuspend = ms
  }

  restartMem() {
    this.vm.floats.set(this.startVmMem)
  }

  async setCode(code: string, reset = false) {
    if (this.startVmMem) {
      if (reset) {
        this.vm.floats.set(this.startVmMem)
        this.vm.isReady = false
        this.isReady = false
      }
    } else {
      this.startVmMem = this.vm.floats.slice()
    }

    await this.vm.setCode(code)

    if (this.initial || reset) {
      this.initial = false
      this.vm.exports.sampleRate.value = sampleRate
      this.vm.exports.currentTime.value = currentTime
      this.isReady = true
      this.resume()
      this.lastMidiEventTime = currentTime
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
      this.vm.exports.fill(0, currentFrame - this.clock.offsetFrame, 0, 0)
    }

    this.suspended = false
    // @ts-ignore
    this.vm.exports[MidiOp[payload[0]]]?.(payload[1], payload[2])
  }

  // wakeup() {
  //   this.suspended = false
  //   this.vm.exports.fill(0, currentFrame - this.offsetFrame, 0, 0)
  // }

  processMidiEvents(midiEvents: MIDIMessageEvent[]) {
    // if (this.vm.exports) {
    //   this.vm.exports.currentTime.value = currentFrame / sampleRate
    // }

    // wake-up
    this.suspended = false
    this.lastMidiEventTime = currentTime
  }

  processWithMidi(
    [possibleInputs]: Float32Array[][],
    [outputs]: Float32Array[][],
    parameters: Record<string, Float32Array>,
    events: MIDIMessageEvent[],
  ) {
    if (this.disabled) return false

    if (this.suspended) return true

    const { vm, isReady } = this
    if (!vm.isReady || !isReady) return true

    vm.exports.coeff.value = this.clock.coeff

    let frame = currentFrame - this.clock.offsetFrame
    if (frame + 128 < 0) {
      return true
    }

    const { parametersMap } = MonoProcessor

    const inputs: (Float32Array | null)[] = []
    // let activeInputChannelCount = 0

    for (let i = 0; i < possibleInputs.length; i++) {
      const x = possibleInputs[i]
      const hasSound = x[0] !== 0 || x.at(-1) !== 0
      if (i < vm.config.channels || hasSound) {
        if (hasSound) {
          inputs.push(x)
          // activeInputChannelCount++
        } else {
          inputs.push(null)
        }
      }
    }

    // if (this.suspended) {
    //   // wake-up on input
    //   if (activeInputChannelCount) {
    //     this.lastMidiEventTime = currentTime
    //     this.suspended = false
    //   } else return true
    // }

    const channelCount = inputs.length || 1

    vm.setNumberOfChannels(channelCount)

    if (channelCount) copyBuffers(inputs, vm.inputs, channelCount, vm)

    vm.params.forEach((x, i) => {
      if (!(x.name in vm.exports)) return
      const value = parameters[parametersMap[i]][0] * x.scaleValue + x.minValue
      vm.exports[x.name].value = value
    })

    let totalFrames = 0

    const processEvents = []

    processEvents.push([0, frame, 0, 0])

    if (events.length) {
      this.lastMidiEventTime = currentTime
      // TODO: saturate number of events to a maximum
      for (const event of events) {
        if (event.deltaFrame) {
          processEvents.push([0, frame, totalFrames, totalFrames + event.deltaFrame])
          frame += event.deltaFrame
          totalFrames += event.deltaFrame
        }
        processEvents.push([1, event.data[0], event.data[1], event.data[2]])
      }
    } else {
      if (currentTime - this.lastMidiEventTime > this.timeToSuspend) {
        this.suspended = true
      }
    }

    if (totalFrames < vm.config.blockSize) {
      processEvents.push([0, frame, totalFrames, vm.config.blockSize])
    }

    vm.ints.set(processEvents.slice(0, 128).flat(), vm.config.eventsPointer >> 2)

    vm.exports.process(1, Math.min(128, processEvents.length))

    copyBuffers(vm.outputs, outputs, channelCount, vm)

    this.didPlay = true

    return true
  }
}

registerProcessor(MonoProcessor.processorName, MonoProcessor)
