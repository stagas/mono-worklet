<h1>
mono-worklet <a href="https://npmjs.org/package/mono-worklet"><img src="https://img.shields.io/badge/npm-v1.0.0-F00.svg?colorA=000"/></a> <a href="src"><img src="https://img.shields.io/badge/loc-181-FFF.svg?colorA=000"/></a> <a href="https://cdn.jsdelivr.net/npm/mono-worklet@1.0.0/dist/mono-worklet.min.js"><img src="https://img.shields.io/badge/brotli-5.4K-333.svg?colorA=000"/></a> <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-F0B.svg?colorA=000"/></a>
</h1>

<p></p>

mono lang AudioWorkletNode

<h4>
<table><tr><td title="Triple click to select and copy paste">
<code>npm i mono-worklet </code>
</td><td title="Triple click to select and copy paste">
<code>pnpm add mono-worklet </code>
</td><td title="Triple click to select and copy paste">
<code>yarn add mono-worklet</code>
</td></tr></table>
</h4>

## Examples

<details id="example$web" title="web" open><summary><span><a href="#example$web">#</a></span>  <code><strong>web</strong></code></summary>  <ul>    <details id="source$web" title="web source code" ><summary><span><a href="#source$web">#</a></span>  <code><strong>view source</strong></code></summary>  <a href="example/web.tsx">example/web.tsx</a>  <p>

```tsx
/** @jsxImportSource sigl */
import $ from 'sigl'

import { CodeEditElement } from 'code-edit'
import { SchedulerEventGroupNode, SchedulerNode } from 'scheduler-node'

import { MonoNode } from 'mono-worklet' // <- we use the dist/ files for the worklet to work

const sampleRate = 44100

const code = `\
#voices:(4,2); \\ voices (time,hz)
note_to_hz(x)=440*2**((x-33)/12);
note_on(x)=(hz=note_to_hz(x);#voices=(t,hz);0);
sine(hz=330.0)=({p};{p}+=(pi2*hz/sr)+(p>pi2?-pi2:0);sin(p));
sqr(hz=330.0)=(sine(hz)>0?1:-1);
play(vt,hz,.a[0.5mono-worklet100]=100,.r[0.5mono-worklet20]=10.0,.v[1mono-worklet40.0]=5.0,.va[5mono-worklet50.0]=10)=(
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
  //   monoProcessor.setCode(`f(x[1mono-worklet100]=52.4,	y[1mono-worklet400]=158.1,
  //      z[1mono-worklet500]=56,	c[40mono-worklet400]=147.7,
  //      r[0.001mono-worklet4]=1.32,	p[0.1mono-worklet100]=24.5)=
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
```

</p>
</details></ul></details>

## API

<p>  <details id="MonoNode$25" title="Class" open><summary><span><a href="#MonoNode$25">#</a></span>  <code><strong>MonoNode</strong></code>    </summary>  <a href="src/mono-node.ts#L7">src/mono-node.ts#L7</a>  <ul>        <p>  <details id="constructor$36" title="Constructor" ><summary><span><a href="#constructor$36">#</a></span>  <code><strong>constructor</strong></code><em>(context, options)</em>    </summary>  <a href="src/mono-node.ts#L42">src/mono-node.ts#L42</a>  <ul>    <p>  <details id="new MonoNode$37" title="ConstructorSignature" ><summary><span><a href="#new MonoNode$37">#</a></span>  <code><strong>new MonoNode</strong></code><em>()</em>    </summary>    <ul><p><a href="#MonoNode$25">MonoNode</a></p>      <p>  <details id="context$38" title="Parameter" ><summary><span><a href="#context$38">#</a></span>  <code><strong>context</strong></code>    </summary>    <ul><p><span>BaseAudioContext</span></p>        </ul></details><details id="options$39" title="Parameter" ><summary><span><a href="#options$39">#</a></span>  <code><strong>options</strong></code>    </summary>    <ul><p><span>AudioWorkletNodeOptions</span> &amp; {<p>  <details id="processorOptions$41" title="Property" ><summary><span><a href="#processorOptions$41">#</a></span>  <code><strong>processorOptions</strong></code>    </summary>  <a href="src/mono-node.ts#L44">src/mono-node.ts#L44</a>  <ul><p><span>Partial</span>&lt;<span>LinkerConfig</span>&gt;</p>        </ul></details></p>}</p>        </ul></details></p>  </ul></details></p>    </ul></details><details id="id$56" title="Property" ><summary><span><a href="#id$56">#</a></span>  <code><strong>id</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="schedulerTarget$57" title="Property" ><summary><span><a href="#schedulerTarget$57">#</a></span>  <code><strong>schedulerTarget</strong></code>    </summary>  <a href=""></a>  <ul><p><span>SchedulerTarget</span></p>        </ul></details><details id="vmParams$42" title="Property" ><summary><span><a href="#vmParams$42">#</a></span>  <code><strong>vmParams</strong></code>    </summary>  <a href="src/mono-node.ts#L36">src/mono-node.ts#L36</a>  <ul><p><a href="#MonoParam$1">MonoParam</a>  []</p>        </ul></details><details id="vmParamsMap$43" title="Property" ><summary><span><a href="#vmParamsMap$43">#</a></span>  <code><strong>vmParamsMap</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href="src/mono-node.ts#L37">src/mono-node.ts#L37</a>  <ul><p><span>Map</span>&lt;<a href="#MonoParam$1">MonoParam</a>, <span>AudioParam</span>&gt;</p>        </ul></details><details id="worklet$45" title="Property" ><summary><span><a href="#worklet$45">#</a></span>  <code><strong>worklet</strong></code>    </summary>  <a href="src/mono-node.ts#L40">src/mono-node.ts#L40</a>  <ul><p><span>Agent</span>&lt;<span>MonoProcessor</span>, <a href="#MonoNode$25">MonoNode</a>&gt;</p>        </ul></details><details id="hasRegistered$26" title="Property" ><summary><span><a href="#hasRegistered$26">#</a></span>  <code><strong>hasRegistered</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>false</code></span>  </summary>  <a href="src/mono-node.ts#L8">src/mono-node.ts#L8</a>  <ul><p>boolean</p>        </ul></details><details id="disable$46" title="Method" ><summary><span><a href="#disable$46">#</a></span>  <code><strong>disable</strong></code><em>()</em>    </summary>  <a href="src/mono-node.ts#L50">src/mono-node.ts#L50</a>  <ul>    <p>      <p><strong>disable</strong><em>()</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="init$58" title="Method" ><summary><span><a href="#init$58">#</a></span>  <code><strong>init</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>init</strong><em>()</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;void&gt;</ul></p></p>    </ul></details><details id="processMidiEvent$60" title="Method" ><summary><span><a href="#processMidiEvent$60">#</a></span>  <code><strong>processMidiEvent</strong></code><em>(midiEvent)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="midiEvent$62" title="Parameter" ><summary><span><a href="#midiEvent$62">#</a></span>  <code><strong>midiEvent</strong></code>    </summary>    <ul><p><span>MIDIMessageEvent</span></p>        </ul></details>  <p><strong>processMidiEvent</strong><em>(midiEvent)</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="setCode$48" title="Method" ><summary><span><a href="#setCode$48">#</a></span>  <code><strong>setCode</strong></code><em>(code)</em>    </summary>  <a href="src/mono-node.ts#L54">src/mono-node.ts#L54</a>  <ul>    <p>    <details id="code$50" title="Parameter" ><summary><span><a href="#code$50">#</a></span>  <code><strong>code</strong></code>    </summary>    <ul><p>string</p>        </ul></details>  <p><strong>setCode</strong><em>(code)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;void&gt;</ul></p></p>    </ul></details><details id="test$51" title="Method" ><summary><span><a href="#test$51">#</a></span>  <code><strong>test</strong></code><em>(frame, length, params)</em>    </summary>  <a href="src/mono-node.ts#L72">src/mono-node.ts#L72</a>  <ul>    <p>    <details id="frame$53" title="Parameter" ><summary><span><a href="#frame$53">#</a></span>  <code><strong>frame</strong></code>    </summary>    <ul><p>number</p>        </ul></details><details id="length$54" title="Parameter" ><summary><span><a href="#length$54">#</a></span>  <code><strong>length</strong></code>    </summary>    <ul><p>number</p>        </ul></details><details id="params$55" title="Parameter" ><summary><span><a href="#params$55">#</a></span>  <code><strong>params</strong></code>    </summary>    <ul><p>any  []</p>        </ul></details>  <p><strong>test</strong><em>(frame, length, params)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;<span>Float32Array</span>&gt;</ul></p></p>    </ul></details><details id="create$30" title="Method" ><summary><span><a href="#create$30">#</a></span>  <code><strong>create</strong></code><em>(context, options)</em>    </summary>  <a href="src/mono-node.ts#L24">src/mono-node.ts#L24</a>  <ul>    <p>    <details id="context$32" title="Parameter" ><summary><span><a href="#context$32">#</a></span>  <code><strong>context</strong></code>    </summary>    <ul><p><span>BaseAudioContext</span></p>        </ul></details><details id="options$33" title="Parameter" ><summary><span><a href="#options$33">#</a></span>  <code><strong>options</strong></code>    </summary>    <ul><p><span>AudioWorkletNodeOptions</span> &amp; {<p>  <details id="processorOptions$35" title="Property" ><summary><span><a href="#processorOptions$35">#</a></span>  <code><strong>processorOptions</strong></code>    </summary>  <a href="src/mono-node.ts#L27">src/mono-node.ts#L27</a>  <ul><p><span>Partial</span>&lt;<span>LinkerConfig</span>&gt;</p>        </ul></details></p>}</p>        </ul></details>  <p><strong>create</strong><em>(context, options)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;<a href="#MonoNode$25">MonoNode</a>&gt;</ul></p></p>    </ul></details><details id="register$27" title="Method" ><summary><span><a href="#register$27">#</a></span>  <code><strong>register</strong></code><em>(context)</em>    </summary>  <a href="src/mono-node.ts#L10">src/mono-node.ts#L10</a>  <ul>    <p>    <details id="context$29" title="Parameter" ><summary><span><a href="#context$29">#</a></span>  <code><strong>context</strong></code>    </summary>    <ul><p><span>BaseAudioContext</span></p>        </ul></details>  <p><strong>register</strong><em>(context)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;void&gt;</ul></p></p>    </ul></details></p></ul></details><details id="MonoParam$1" title="Class" open><summary><span><a href="#MonoParam$1">#</a></span>  <code><strong>MonoParam</strong></code>    </summary>  <a href=""></a>  <ul>        <p>  <details id="constructor$2" title="Constructor" ><summary><span><a href="#constructor$2">#</a></span>  <code><strong>constructor</strong></code><em>(data)</em>    </summary>  <a href=""></a>  <ul>    <p>  <details id="new MonoParam$3" title="ConstructorSignature" ><summary><span><a href="#new MonoParam$3">#</a></span>  <code><strong>new MonoParam</strong></code><em>()</em>    </summary>    <ul><p><a href="#MonoParam$1">MonoParam</a></p>      <p>  <details id="data$4" title="Parameter" ><summary><span><a href="#data$4">#</a></span>  <code><strong>data</strong></code>    </summary>    <ul><p><span>Partial</span>&lt;<a href="#MonoParam$1">MonoParam</a>&gt;</p>        </ul></details></p>  </ul></details></p>    </ul></details><details id="defaultValue$16" title="Property" ><summary><span><a href="#defaultValue$16">#</a></span>  <code><strong>defaultValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="id$5" title="Property" ><summary><span><a href="#id$5">#</a></span>  <code><strong>id</strong></code>    </summary>  <a href=""></a>  <ul><p><span>Token</span></p>        </ul></details><details id="maxValue$15" title="Property" ><summary><span><a href="#maxValue$15">#</a></span>  <code><strong>maxValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="minValue$14" title="Property" ><summary><span><a href="#minValue$14">#</a></span>  <code><strong>minValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="name$13" title="Property" ><summary><span><a href="#name$13">#</a></span>  <code><strong>name</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="normalValue$17" title="Property" ><summary><span><a href="#normalValue$17">#</a></span>  <code><strong>normalValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="scaleValue$18" title="Property" ><summary><span><a href="#scaleValue$18">#</a></span>  <code><strong>scaleValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="source$7" title="Property" ><summary><span><a href="#source$7">#</a></span>  <code><strong>source</strong></code>    </summary>  <a href=""></a>  <ul><p>{<p>  <details id="arg$9" title="Property" ><summary><span><a href="#arg$9">#</a></span>  <code><strong>arg</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="default$12" title="Property" ><summary><span><a href="#default$12">#</a></span>  <code><strong>default</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="id$10" title="Property" ><summary><span><a href="#id$10">#</a></span>  <code><strong>id</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="range$11" title="Property" ><summary><span><a href="#range$11">#</a></span>  <code><strong>range</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details></p>}</p>        </ul></details><details id="sourceIndex$6" title="Property" ><summary><span><a href="#sourceIndex$6">#</a></span>  <code><strong>sourceIndex</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="normalize$19" title="Method" ><summary><span><a href="#normalize$19">#</a></span>  <code><strong>normalize</strong></code><em>(value)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="value$21" title="Parameter" ><summary><span><a href="#value$21">#</a></span>  <code><strong>value</strong></code>    </summary>    <ul><p>number</p>        </ul></details>  <p><strong>normalize</strong><em>(value)</em>  &nbsp;=&gt;  <ul>number</ul></p></p>    </ul></details><details id="scale$22" title="Method" ><summary><span><a href="#scale$22">#</a></span>  <code><strong>scale</strong></code><em>(normal)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="normal$24" title="Parameter" ><summary><span><a href="#normal$24">#</a></span>  <code><strong>normal</strong></code>    </summary>    <ul><p>number</p>        </ul></details>  <p><strong>scale</strong><em>(normal)</em>  &nbsp;=&gt;  <ul>number</ul></p></p>    </ul></details></p></ul></details></p>

## Credits

- [alice-bob](https://npmjs.org/package/alice-bob) by [stagas](https://github.com/stagas) &ndash; transport agnostic strongly typed duplex rpc interfaces
- [better-console-time](https://npmjs.org/package/better-console-time) by [stagas](https://github.com/stagas) &ndash; console.time that optionally warns when above a threshold.
- [monolang](https://npmjs.org/package/monolang) by [stagas](https://github.com/stagas) &ndash; mono is a low level language for audio expressions that compiles to wasm
- [scheduler-node](https://npmjs.org/package/scheduler-node) by [stagas](https://github.com/stagas) &ndash; Sample perfect Audioworklet MIDI Scheduler Node

## Contributing

[Fork](https://github.com/stagas/mono-worklet/fork) or [edit](https://github.dev/stagas/mono-worklet) and submit a PR.

All contributions are welcome!

## License

<a href="LICENSE">MIT</a> &copy; 2022 [stagas](https://github.com/stagas)
