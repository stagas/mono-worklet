export const copyBuffers = (
  from: (Float32Array | null)[],
  to: Float32Array[],
  channelCount: number,
  vm: any,
) => {
  for (let channel = 0; channel < channelCount; channel++) {
    const target = to[channel]
    const source = from[channel]
    if (!target) {
      console.warn('Target channel not found:', channel, channelCount, to)
      console.warn(vm.code)
    } else if (!source) {
      target.fill(0)
    } else {
      target.set(source)
    }
  }
}
