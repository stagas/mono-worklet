// @env browser

import { SchedulerEventGroupNode, SchedulerNode } from 'scheduler-node'
import { MonoNode } from '..' // <- we have to use the dist (which is under root, not ../src)

jest.setTimeout(10000)

describe('MonoNode', () => {
  it('renders', async () => {
    const ctx = new OfflineAudioContext({ length: 128 * 2, numberOfChannels: 6, sampleRate: 44100 })
    const schedulerNode = await SchedulerNode.create(ctx)
    expect(schedulerNode).toBeInstanceOf(SchedulerNode)
    expect(await schedulerNode.start()).toBe(0)

    const scheduler = new SchedulerEventGroupNode(schedulerNode)

    const m = await MonoNode.create(ctx)
    await m.setCode(`f()=42f`)

    scheduler.connect(m)

    // [time, note, velocity, length]
    const events = scheduler.eventGroup.replaceAllWithNotes([[0, 5, 127, 0]])
    expect(events.length).toBe(2)

    const dest = new ChannelMergerNode(ctx, {
      numberOfInputs: 6,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
    })

    dest.connect(ctx.destination)
    m.output.connect(dest)

    // events get sent at the microtask queue
    await Promise.resolve()

    const result = await ctx.startRendering()

    {
      const data = result.getChannelData(0)
      expect(data[128 * 0]).toEqual(42)
      expect(data[128 * 1]).toEqual(42)
    }

    {
      const data = result.getChannelData(1)
      expect(data[128 * 0]).toEqual(0)
      expect(data[128 * 1]).toEqual(0)
    }
  })

  it('2 input channels', async () => {
    const ctx = new OfflineAudioContext({ length: 128 * 2, numberOfChannels: 6, sampleRate: 44100 })
    const schedulerNode = await SchedulerNode.create(ctx)
    expect(schedulerNode).toBeInstanceOf(SchedulerNode)
    expect(await schedulerNode.start()).toBe(0)

    const scheduler = new SchedulerEventGroupNode(schedulerNode)

    const a = await MonoNode.create(ctx)
    await a.setCode(`f()=42f`)

    const b = await MonoNode.create(ctx)
    await b.setCode(`f()=33f`)

    const c = await MonoNode.create(ctx)
    await c.setCode(`f()=$x*2`)

    scheduler.connect(a)
    scheduler.connect(b)

    // [time, note, velocity, length]
    const events = scheduler.eventGroup.replaceAllWithNotes([[0, 5, 127, 0]])
    expect(events.length).toBe(2)

    a.output.connect(c.input, 0, 0)
    b.output.connect(c.input, 0, 1)

    const dest = new ChannelMergerNode(ctx, {
      numberOfInputs: 6,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
    })

    dest.connect(ctx.destination)
    c.output.connect(dest, 0, 0)
    c.output.connect(dest, 1, 1)

    // events get sent at the microtask queue
    await Promise.resolve()

    const result = await ctx.startRendering()

    {
      const data = result.getChannelData(0)
      expect(data[128 * 0]).toEqual(84)
      expect(data[128 * 1]).toEqual(84)
    }

    {
      const data = result.getChannelData(1)
      expect(data[128 * 0]).toEqual(66)
      expect(data[128 * 1]).toEqual(66)
    }
  })

  it('3 input channels', async () => {
    const ctx = new OfflineAudioContext({ length: 128 * 2, numberOfChannels: 6, sampleRate: 44100 })
    const schedulerNode = await SchedulerNode.create(ctx)
    expect(schedulerNode).toBeInstanceOf(SchedulerNode)
    expect(await schedulerNode.start()).toBe(0)

    const scheduler = new SchedulerEventGroupNode(schedulerNode)

    const a = await MonoNode.create(ctx)
    await a.setCode(`f()=42f`)

    const b = await MonoNode.create(ctx)
    await b.setCode(`f()=33f`)

    const c = await MonoNode.create(ctx)
    await c.setCode(`f()=22f`)

    const z = await MonoNode.create(ctx)
    await z.setCode(`f()=$x*2`)

    scheduler.connect(a)
    scheduler.connect(b)
    scheduler.connect(c)

    // [time, note, velocity, length]
    const events = scheduler.eventGroup.replaceAllWithNotes([[0, 5, 127, 0]])
    expect(events.length).toBe(2)

    a.output.connect(z.input, 0, 0)
    b.output.connect(z.input, 0, 1)
    c.output.connect(z.input, 0, 2)

    const dest = new ChannelMergerNode(ctx, {
      numberOfInputs: 6,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
    })

    dest.connect(ctx.destination)
    z.output.connect(dest, 0, 0)
    z.output.connect(dest, 1, 1)
    z.output.connect(dest, 2, 2)

    // events get sent at the microtask queue
    await Promise.resolve()

    const result = await ctx.startRendering()

    {
      const data = result.getChannelData(0)
      expect(data[128 * 0]).toEqual(84)
      expect(data[128 * 1]).toEqual(84)
    }

    {
      const data = result.getChannelData(1)
      expect(data[128 * 0]).toEqual(66)
      expect(data[128 * 1]).toEqual(66)
    }

    {
      const data = result.getChannelData(2)
      expect(data[128 * 0]).toEqual(44)
      expect(data[128 * 1]).toEqual(44)
    }
  })

  it('quirky', async () => {
    const ctx = new OfflineAudioContext({ length: 128 * 2, numberOfChannels: 1, sampleRate: 44100 })
    const schedulerNode = await SchedulerNode.create(ctx)
    expect(schedulerNode).toBeInstanceOf(SchedulerNode)
    expect(await schedulerNode.start()).toBe(0)

    const scheduler = new SchedulerEventGroupNode(schedulerNode)

    const a = await MonoNode.create(ctx)
    await a.setCode(`f()=42f`)

    const b = await MonoNode.create(ctx)
    await b.setCode(`f()=33f`)

    const z = await MonoNode.create(ctx)
    await z.setCode(`f()=$x*2`)

    scheduler.connect(a)
    scheduler.connect(b)

    // [time, note, velocity, length]
    const events = scheduler.eventGroup.replaceAllWithNotes([[0, 5, 127, 0]])
    expect(events.length).toBe(2)

    a.output.connect(z.input, 0, 0)
    b.output.connect(z.input, 0, 1)

    const dest = new GainNode(ctx, {
      channelCount: 1,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
    })
    // const dest = new ChannelMergerNode(ctx, {
    //   numberOfInputs: 6,
    //   channelCountMode: 'explicit',
    //   channelInterpretation: 'discrete',
    // })

    dest.connect(ctx.destination)
    z.output.connect(dest, 0, 0)
    z.output.connect(dest, 1, 0)

    // events get sent at the microtask queue
    await Promise.resolve()

    const result = await ctx.startRendering()

    {
      const data = result.getChannelData(0)
      expect(data[128 * 0]).toEqual(150)
      expect(data[128 * 1]).toEqual(150)
    }
  })

  it('2 quirky', async () => {
    const ctx = new OfflineAudioContext({ length: 128 * 2, numberOfChannels: 2, sampleRate: 44100 })
    const schedulerNode = await SchedulerNode.create(ctx)
    expect(schedulerNode).toBeInstanceOf(SchedulerNode)
    expect(await schedulerNode.start()).toBe(0)

    const scheduler = new SchedulerEventGroupNode(schedulerNode)

    const a = await MonoNode.create(ctx)
    await a.setCode(`f()=33f`)

    const b = await MonoNode.create(ctx)
    await b.setCode(`f()=33f`)

    const z = await MonoNode.create(ctx)
    await z.setCode(`f()=$x+inc(1)`)

    scheduler.connect(a)
    scheduler.connect(b)

    // [time, note, velocity, length]
    const events = scheduler.eventGroup.replaceAllWithNotes([[0, 5, 127, 0]])
    expect(events.length).toBe(2)

    a.output.connect(z.input, 0, 0)
    b.output.connect(z.input, 0, 1)

    // const dest = new GainNode(ctx, {
    //   channelCount: 2,
    //   channelCountMode: 'explicit',
    //   channelInterpretation: 'discrete',
    // })
    const dest = new ChannelMergerNode(ctx, {
      numberOfInputs: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
    })

    dest.connect(ctx.destination)
    z.output.connect(dest, 0, 0)
    z.output.connect(dest, 1, 1)

    // events get sent at the microtask queue
    await Promise.resolve()

    const result = await ctx.startRendering()

    {
      const data = result.getChannelData(0)
      expect(data[0]).toEqual(33)
      expect(data[1]).toEqual(34)
    }

    {
      const data = result.getChannelData(1)
      expect(data[0]).toEqual(33)
      expect(data[1]).toEqual(34)
    }
  })

  it('3 quirky', async () => {
    const ctx = new OfflineAudioContext({ length: 1280 * 2, numberOfChannels: 2, sampleRate: 44100 })
    const schedulerNode = await SchedulerNode.create(ctx)
    expect(schedulerNode).toBeInstanceOf(SchedulerNode)
    expect(await schedulerNode.start()).toBe(0)

    const scheduler = new SchedulerEventGroupNode(schedulerNode)

    const a = await MonoNode.create(ctx)
    await a.setCode(`f()=sine(33f)`)

    const b = await MonoNode.create(ctx)
    await b.setCode(`f()=sine(33f)`)

    const z = await MonoNode.create(ctx)
    await z.setCode(`f()=freeverb($x)`)

    scheduler.connect(a)
    scheduler.connect(b)

    // [time, note, velocity, length]
    const events = scheduler.eventGroup.replaceAllWithNotes([[0, 5, 127, 0]])
    expect(events.length).toBe(2)

    a.output.connect(z.input, 0, 0)
    b.output.connect(z.input, 0, 1)

    const dest = new ChannelMergerNode(ctx, {
      numberOfInputs: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
    })

    dest.connect(ctx.destination)
    z.output.connect(dest, 0, 0)
    z.output.connect(dest, 1, 1)

    // events get sent at the microtask queue
    await Promise.resolve()

    const result = await ctx.startRendering()

    let slice
    {
      const data = result.getChannelData(0)
      slice = data.slice(1117, 1200)
      expect(slice).toMatchSnapshot()
    }

    {
      const data = result.getChannelData(1)
      expect(slice).toEqual(data.slice(1117, 1200))
    }
  })
})
