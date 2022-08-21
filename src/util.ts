export const copyBuffers = (
  blockSize: number,
  tree: Float32Array[][],
  count: number[],
  floats: Float32Array,
  reverse = false,
) => {
  if (count.length > 0) {
    let buffer: Float32Array

    let pos = 0

    for (let x = 0; x < count.length; x++) {
      if (!tree[x]) break

      for (let y = 0; y < count[x]; y++) {
        if (!tree[x][y]) break

        buffer = floats.subarray(pos * blockSize, (pos + 1) * blockSize)

        if (reverse)
          tree[x][y].set(buffer)
        else
          buffer.set(tree[x][y])

        pos++
      }
    }
  }
}
