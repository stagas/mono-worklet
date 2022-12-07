/** @jsxImportSource sigl */
import $ from 'sigl'

import { CodeEditElement } from 'code-edit'
import { SchedulerEventGroupNode, SchedulerNode } from 'scheduler-node'

import { MonoNode } from '..' // <- we use the dist/ files for the worklet to work

const sampleRate = 44100

const code = `\
#:1,2;
write_note(x)=(
  #=(t,note_to_hz(x));
  0
);
midi_in(op=0,x=0,y=0)=(
  op==144 && write_note(x);drop;
  0
);
f()=((nt,y)=#(-1);saw(y)*env(nt))

`
// a=300.0;
// play(x=300.0)=(
//   a=x;
//   a
// );

// midi_in(x=1,y=1,z=1)=
//  (a=note_to_hz(y);0);

// f()=sine(a)
// `

const ctx = new AudioContext({ sampleRate, latencyHint: 0.06 })

const main = async () => {
  const mainSchedulerNode = await SchedulerNode.create(ctx)
  const midiEvent = new MIDIMessageEvent('midimessage', {
    data: new Uint8Array([0x90, 40, 127]),
  }) as WebMidi.MIDIMessageEvent
  midiEvent.receivedTime = 0
  const schedulerGroupNode = new SchedulerEventGroupNode(mainSchedulerNode)
  schedulerGroupNode.eventGroup.replaceAllWithNotes([[0, 40, 127, .1]])
  schedulerGroupNode.eventGroup.loopEnd = 1
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
      oninput={function (this: CodeEditElement) {
        monoNode.setCode(this.value)
      }}
    />,
    document.body
  )
}

main()
