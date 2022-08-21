/** @jsxImportSource sigl */
import $ from 'sigl'

import { CodeEditElement } from 'code-edit'
import { SchedulerEventGroupNode, SchedulerNode } from 'scheduler-node'

import { MonoNode } from '..' // <- we use the dist/ files for the worklet to work

const sampleRate = 44100

const code = `\
#voices:(4,2); \\ voices (time,hz)
note_to_hz(x)=440*2**((x-33)/12);
note_on(x)=(hz=note_to_hz(x);#voices=(t,hz);0);
sine(hz=330.0)=({p};{p}+=(pi2*hz/sr)+(p>pi2?-pi2:0);sin(p));
sqr(hz=330.0)=(sine(hz)>0?1:-1);
play(vt,hz,.a[0.5..100]=100,.r[0.5..20]=10.0,.v[1..40.0]=5.0,.va[5..50.0]=10)=(
  dt=t-vt;
  A=1-exp(-dt*a);
  R=exp(-dt*r);
  s=sine(hz+sqr(v)*va)*A*R;
  s
);
f()=tanh((#voices::play)*1.0)
`

const ctx = new AudioContext({ sampleRate, latencyHint: 0.06 })

const main = async () => {
  const mainSchedulerNode = await SchedulerNode.create(ctx)
  const midiEvent = new MIDIMessageEvent('midimessage', {
    data: new Uint8Array([0x90, 40, 127]),
  }) as WebMidi.MIDIMessageEvent
  midiEvent.receivedTime = 0
  const schedulerGroupNode = new SchedulerEventGroupNode(mainSchedulerNode)
  schedulerGroupNode.eventGroup.replaceAllWithNotes([[0, 40, 127, .1]])
  schedulerGroupNode.eventGroup.loopEnd = 1 / 5
  schedulerGroupNode.eventGroup.loop = true

  const monoNode = await MonoNode.create(ctx, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    processorOptions: {
      metrics: 0,
    },
  })
  console.log(monoNode)

  schedulerGroupNode.connect(monoNode)

  // monoNode.setCode(`f()=sin(pi2*440.0*t)`)
  await monoNode.setCode(code)
  monoNode.connect(ctx.destination)
  mainSchedulerNode.start()

  // setInterval(() => {
  //   const midiEvent = new MIDIMessageEvent('midimessage', { data: new Uint8Array([0x90, 40, 127]) })
  //   midiEvent.receivedTime = ctx.currentTime * 1000
  //   monoNode.processMidiEvent(midiEvent)
  // }, 1000)

  // setTimeout(() => {
  //   monoProcessor.setCode(`f(x[1..100]=52.4,	y[1..400]=158.1,
  //      z[1..500]=56,	c[40..400]=147.7,
  //      r[0.001..4]=1.32,	p[0.1..100]=24.5)=
  //      lp(sin(pi2*(x+(exp((-t%0.5)*z)*y))*(t%0.5))
  //      * exp(-t%0.5*p), c, r)
  //    `)
  // }, 2000)

  const CodeEdit = $.element(CodeEditElement)

  $.render(
    <CodeEdit
      style="display: block; width:300px; height:300px; color: black; font-family: monospace;"
      value={code}
      language="js"
      theme="monokai"
      oninput={function(this: CodeEditElement) {
        monoNode.setCode(this.value)
      }}
    />,
    document.body
  )
}

main()
