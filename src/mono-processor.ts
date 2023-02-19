import { eventsPtr, VM } from 'monolang'
import { Clock, MIDIMessageEvent, SchedulerTargetProcessor } from 'scheduler-node/target-processor'
import { copyBuffers } from './util'

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
        minValue: -1,
        maxValue: 1,
        automationRate: 'k-rate',
      })
    )
  }

  private startVmMem!: Float32Array

  private vm!: VM
  private initial = false
  private suspended = false
  private disabled = false

  private lastInputsLength = 0

  private lastMidiEventTime = 0
  private timeToSuspend = 15

  private didPlay = false
  private didInitParams = false

  clock = new Clock()

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

  async initParams() {
    this.didInitParams = true
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

    this.didInitParams = false
    const res = await this.vm.setCode(code)

    if (this.initial || reset) {
      this.initial = false
      this.vm.exports.sampleRate.value = sampleRate
      this.vm.exports.currentTime.value = currentTime
      this.isReady = true
      this.resume()
      this.lastMidiEventTime = currentTime
    }

    return {
      params: this.vm.params,
      inputChannels: res.inputChannels,
      outputChannels: res.outputChannels,
    }
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

  test(frame: number, end: number) {
    this.vm.exports.fill(frame, 0, end)
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
    // @ts-ignore
    this.vm = this.workerPort = this.startVmMem = this.clock = null
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
      this.vm.exports.fill(currentFrame - this.clock.offsetFrame, 0, 0)
    }

    this.suspended = false
    // @ts-ignore
    this.vm.exports[MidiOp[payload[0]]]?.(payload[1], payload[2])
  }

  processMidiEvents(midiEvents: MIDIMessageEvent[]) {
    // wake-up
    this.suspended = false
    this.lastMidiEventTime = currentTime
  }

  processWithMidi(
    inputs: Float32Array[][],
    [outputs]: Float32Array[][],
    parameters: Record<string, Float32Array>,
    events: MIDIMessageEvent[],
  ) {
    if (this.disabled) return false

    if (this.suspended) return true

    const { vm, isReady } = this
    if (!vm.isReady || !isReady) return true

    let frame = currentFrame - this.clock.offsetFrame
    if (frame + 128 < 0) {
      return true
    }

    vm.exports.coeff.value = this.clock.coeff

    const { parametersMap } = MonoProcessor

    if (inputs.length > 1) {
      // makes sure that leftover input channels are filled with 0
      if (inputs[0].length > this.lastInputsLength) {
        this.lastInputsLength = inputs[0].length
      }
      if (this.lastInputsLength) {
        copyBuffers(inputs[0], vm.inputs, this.lastInputsLength, vm)
      }
      this.lastInputsLength = inputs[0].length
    }

    // copy params to exports
    if (this.didInitParams) vm.params.forEach((x, i) => {
      if (!(x.name in vm.exports)) return
      const paramFloats = parameters[parametersMap[i]]
      const value =
        // normalize -1..1 to 0..1
        (
          paramFloats[0]
          * 0.5 + 0.5
        )
        // scale to vm domain full value
        * x.scaleValue
        + x.minValue

      vm.exports[x.name].value = value
    })

    let totalFrames = 0

    // either:
    // midi_in event: [1, x, y, z]
    // fill command: [0, frame, start, end]
    const processEvents: [number, number, number, number][] = []

    processEvents.push([0, frame, 0, 0])

    if (events.length) {
      this.lastMidiEventTime = currentTime
      // TODO: saturate number of events to a maximum
      for (const event of events) {
        if (event.deltaFrame) {
          processEvents.push([0, frame, totalFrames, totalFrames + event.deltaFrame])
          // console.log(processEvents.at(-1))
          frame += event.deltaFrame
          totalFrames += event.deltaFrame
        }
        processEvents.push([1, event.data[0], event.data[1], event.data[2]])
        // console.log(processEvents.at(-1))
      }
    } else {
      if (currentTime - this.lastMidiEventTime > this.timeToSuspend) {
        this.suspended = true
      }
    }

    const blockSize = outputs[0].length

    if (totalFrames < blockSize) {
      processEvents.push([0, frame, totalFrames, blockSize])
    }

    vm.ints.set(processEvents.slice(0, 128).flat(), eventsPtr >> 2)

    vm.exports.process(Math.min(128, processEvents.length))

    copyBuffers(vm.outputs, outputs, outputs.length, vm)

    this.didPlay = true

    return true
  }
}

registerProcessor(MonoProcessor.processorName, MonoProcessor)
