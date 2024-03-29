import type { Agent } from 'alice-bob'
import { getSharedWorkerPort, MonoParam } from 'monolang'
import { SchedulerTargetNode } from 'scheduler-node/target-node'
import type { MonoProcessor } from './mono-processor'
export { MonoParam }

export type MonoNodeOptions = AudioWorkletNodeOptions & {
  numberOfInputs: number
  numberOfOutputs: number
  outputChannelCount: number[]
  channelCount: number
}

export class MonoNode extends SchedulerTargetNode {
  static registeredContexts = new Set<BaseAudioContext>()

  state: 'disabled' | 'suspended' | 'running' = 'running'

  static async register(context: BaseAudioContext) {
    if (this.registeredContexts.has(context)) return
    await context.audioWorklet.addModule(
      // TODO: this doesn't show in network tab wtf
      // related:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1073295
      // https://bugs.chromium.org/p/chromium/issues/detail?id=880784

      // @ts-ignore
      new URL('./mono-processor.js', import.meta.url).href //+ '?' + location.hash.slice(1)
    )
    this.registeredContexts.add(context)
  }

  static async create(
    context: BaseAudioContext,
    options: MonoNodeOptions,
  ) {
    await this.register(context)
    const node = new this(context, options)
    await node.init()
    return node
  }

  vmParams?: MonoParam[]
  vmParamsMap: Map<MonoParam, AudioParam> = new Map()
  params: Map<string, { monoParam: MonoParam, audioParam: AudioParam }> = new Map()
  private sortedParams: [string, AudioParam][]

  declare worklet: Agent<MonoProcessor, MonoNode>

  constructor(
    public context: BaseAudioContext,
    public options: MonoNodeOptions,
  ) {
    super(context, 'mono', options)

    this.sortedParams = [...this.parameters.entries()].sort(
      ([a], [b]) => (a > b ? 1 : -1)
    )

    const port = getSharedWorkerPort()
    this.worklet.setPort(port)
  }

  disable() {
    this.state = 'disabled'
    this.worklet.disable()
    this.dispatchEvent(new CustomEvent('disable'))
  }

  async setSampleBuffer(index: number, buffer: Float32Array[], range: [number, number]) {
    return await this.worklet.setSampleBuffer(index, buffer, range)
  }

  async setSampleBufferRange(index: number, range: [number, number]) {
    return await this.worklet.setSampleBufferRange(index, range)
  }

  public code?: string

  async setCode(code: string, reset = false) {
    this.code = code

    try {
      if (reset) {
        this.schedulerTarget.midiQueue.clear()
      }

      const {
        params,
        inputChannels,
        outputChannels
      } = await this.worklet.setCode(code, reset)

      if (reset) {
        this.schedulerTarget.midiQueue.clear()
      }

      this.vmParams = params.map((x: MonoParam) => new MonoParam(x))
      this.vmParamsMap.clear()

      for (const [i, x] of this.vmParams.entries()) {
        const param = this.sortedParams[i][1]

        // TODO: use error.cause with param index
        const paramValue = x.normalValue * 2 - 1
        if (paramValue > param.maxValue || paramValue < param.minValue)
          throw new Error(`Default value "${x.defaultValue}" not in range [${x.minValue}..${x.maxValue}]`)

        param.value = paramValue
        this.vmParamsMap.set(x, param)
        this.params.set(x.id.toString(), { monoParam: x, audioParam: param })
      }

      await this.worklet.initParams()

      return {
        inputChannels,
        outputChannels
      }
    } catch (error) {
      this.vmParams = void 0
      this.vmParamsMap.clear()
      throw error
    }
  }

  setClockBuffer(clockBuffer: Float64Array) {
    return this.worklet.setClockBuffer(clockBuffer)
  }

  restartMem() {
    return this.worklet.restartMem()
  }

  suspend() {
    this.state = 'suspended'
    this.worklet.suspend()
    this.dispatchEvent(new CustomEvent('suspend'))
  }

  resume() {
    this.state = 'running'
    this.worklet.resume()
    this.dispatchEvent(new CustomEvent('resume'))
  }

  async createVM() {
    await this.worklet.resetError()
    return this.worklet.createVM()
  }

  async test(frame: number, length: number, ...params: any[]) {
    return this.worklet.test(frame, length)
  }
}
