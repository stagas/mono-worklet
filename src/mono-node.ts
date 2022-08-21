import type { Agent } from 'alice-bob'
import { LinkerConfig, MonoParam } from 'monolang'
import { SchedulerTargetNode } from 'scheduler-node/target-node'
import type { MonoProcessor } from './mono-processor'
export { MonoParam }

export class MonoNode extends SchedulerTargetNode {
  static hasRegistered = false

  static async register(context: BaseAudioContext) {
    if (this.hasRegistered) return
    await context.audioWorklet.addModule(
      // TODO: this doesn't show in network tab wtf
      // related:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1073295
      // https://bugs.chromium.org/p/chromium/issues/detail?id=880784

      // @ts-ignore
      new URL('./mono-processor.js', import.meta.url).href //+ '?' + location.hash.slice(1)
    )
    this.hasRegistered = true
  }

  static async create(
    context: BaseAudioContext,
    options: AudioWorkletNodeOptions & {
      processorOptions?: Partial<LinkerConfig>
    },
  ) {
    await this.register(context)
    const node = new this(context, options)
    await node.init()
    return node
  }

  vmParams?: MonoParam[]
  vmParamsMap: Map<MonoParam, AudioParam> = new Map()
  private sortedParams: [string, AudioParam][]

  declare worklet: Agent<MonoProcessor, MonoNode>

  constructor(
    context: BaseAudioContext,
    options: AudioWorkletNodeOptions & { processorOptions?: Partial<LinkerConfig> },
  ) {
    super(context, 'mono', options)
    this.sortedParams = [...this.parameters.entries()].sort((a, b) => (a[0] > b[0] ? 1 : -1))
  }

  disable() {
    this.worklet.disable()
  }

  async setCode(code: string) {
    const { params } = await this.worklet.setCode(code)

    this.vmParams = params.map((x: MonoParam) => new MonoParam(x))
    this.vmParamsMap.clear()

    for (const [i, x] of this.vmParams.entries()) {
      const param = this.sortedParams[i][1]

      // TODO: use error.cause with param index
      if (x.normalValue > param.maxValue || x.normalValue < param.minValue)
        throw new Error(`Default value "${x.defaultValue}" not in range [${x.minValue}..${x.maxValue}]`)

      this.sortedParams[i][1].value = x.normalValue
      this.vmParamsMap.set(x, this.sortedParams[i][1])
    }
  }

  async test(frame: number, length: number, ...params: any[]) {
    return this.worklet.test(frame, length, params)
  }
}
