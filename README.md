

<h1>
mono-worklet <a href="https://npmjs.org/package/mono-worklet"><img src="https://img.shields.io/badge/npm-v2.3.0-F00.svg?colorA=000"/></a> <a href="src"><img src="https://img.shields.io/badge/loc-330-FFF.svg?colorA=000"/></a> <a href="https://cdn.jsdelivr.net/npm/mono-worklet@2.3.0/dist/mono-worklet.min.js"><img src="https://img.shields.io/badge/brotli-2.9K-333.svg?colorA=000"/></a> <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-F0B.svg?colorA=000"/></a>
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
      oninput={function (this: CodeEditElement) {
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

<p>  <details id="MonoNode$34" title="Class" ><summary><span><a href="#MonoNode$34">#</a></span>  <code><strong>MonoNode</strong></code>    </summary>  <a href=""></a>  <ul>        <p>  <details id="constructor$43" title="Constructor" ><summary><span><a href="#constructor$43">#</a></span>  <code><strong>constructor</strong></code><em>(context, options)</em>    </summary>  <a href=""></a>  <ul>    <p>  <details id="new MonoNode$44" title="ConstructorSignature" ><summary><span><a href="#new MonoNode$44">#</a></span>  <code><strong>new MonoNode</strong></code><em>()</em>    </summary>    <ul><p><a href="#MonoNode$34">MonoNode</a></p>      <p>  <details id="context$45" title="Parameter" ><summary><span><a href="#context$45">#</a></span>  <code><strong>context</strong></code>    </summary>    <ul><p><span>BaseAudioContext</span></p>        </ul></details><details id="options$46" title="Parameter" ><summary><span><a href="#options$46">#</a></span>  <code><strong>options</strong></code>    </summary>    <ul><p><a href="#MonoNodeOptions$28">MonoNodeOptions</a></p>        </ul></details></p>  </ul></details></p>    </ul></details><details id="code$69" title="Property" ><summary><span><a href="#code$69">#</a></span>  <code><strong>code</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="context$56" title="Property" ><summary><span><a href="#context$56">#</a></span>  <code><strong>context</strong></code>    </summary>  <a href=""></a>  <ul><p><span>BaseAudioContext</span></p>        </ul></details><details id="id$97" title="Property" ><summary><span><a href="#id$97">#</a></span>  <code><strong>id</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="options$57" title="Property" ><summary><span><a href="#options$57">#</a></span>  <code><strong>options</strong></code>    </summary>  <a href=""></a>  <ul><p><a href="#MonoNodeOptions$28">MonoNodeOptions</a></p>        </ul></details><details id="params$50" title="Property" ><summary><span><a href="#params$50">#</a></span>  <code><strong>params</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href=""></a>  <ul><p><span>Map</span>&lt;string, {<p>  <details id="audioParam$53" title="Property" ><summary><span><a href="#audioParam$53">#</a></span>  <code><strong>audioParam</strong></code>    </summary>  <a href=""></a>  <ul><p><span>AudioParam</span></p>        </ul></details><details id="monoParam$52" title="Property" ><summary><span><a href="#monoParam$52">#</a></span>  <code><strong>monoParam</strong></code>    </summary>  <a href=""></a>  <ul><p><a href="#MonoParam$1">MonoParam</a></p>        </ul></details></p>}&gt;</p>        </ul></details><details id="schedulerTarget$98" title="Property" ><summary><span><a href="#schedulerTarget$98">#</a></span>  <code><strong>schedulerTarget</strong></code>    </summary>  <a href=""></a>  <ul><p><span>SchedulerTarget</span></p>        </ul></details><details id="state$47" title="Property" ><summary><span><a href="#state$47">#</a></span>  <code><strong>state</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>'running'</code></span>  </summary>  <a href=""></a>  <ul><p><code>"disabled"</code> | <code>"suspended"</code> | <code>"running"</code></p>        </ul></details><details id="vmParams$48" title="Property" ><summary><span><a href="#vmParams$48">#</a></span>  <code><strong>vmParams</strong></code>    </summary>  <a href=""></a>  <ul><p><a href="#MonoParam$1">MonoParam</a>  []</p>        </ul></details><details id="vmParamsMap$49" title="Property" ><summary><span><a href="#vmParamsMap$49">#</a></span>  <code><strong>vmParamsMap</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href=""></a>  <ul><p><span>Map</span>&lt;<a href="#MonoParam$1">MonoParam</a>, <span>AudioParam</span>&gt;</p>        </ul></details><details id="worklet$55" title="Property" ><summary><span><a href="#worklet$55">#</a></span>  <code><strong>worklet</strong></code>    </summary>  <a href=""></a>  <ul><p><span>Agent</span>&lt;<span>MonoProcessor</span>, <a href="#MonoNode$34">MonoNode</a>&gt;</p>        </ul></details><details id="registeredContexts$35" title="Property" ><summary><span><a href="#registeredContexts$35">#</a></span>  <code><strong>registeredContexts</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href=""></a>  <ul><p><span>Set</span>&lt;<span>BaseAudioContext</span>&gt;</p>        </ul></details><details id="createVM$86" title="Method" ><summary><span><a href="#createVM$86">#</a></span>  <code><strong>createVM</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>createVM</strong><em>()</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;undefined | {<p>  <details id="inputChannels$90" title="Property" ><summary><span><a href="#inputChannels$90">#</a></span>  <code><strong>inputChannels</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>res.inputChannels</code></span>  </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="outputChannels$91" title="Property" ><summary><span><a href="#outputChannels$91">#</a></span>  <code><strong>outputChannels</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>res.outputChannels</code></span>  </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="params$89" title="Property" ><summary><span><a href="#params$89">#</a></span>  <code><strong>params</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href=""></a>  <ul><p><a href="#MonoParam$1">MonoParam</a>  []</p>        </ul></details></p>}&gt;</ul></p></p>    </ul></details><details id="disable$58" title="Method" ><summary><span><a href="#disable$58">#</a></span>  <code><strong>disable</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>disable</strong><em>()</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="init$99" title="Method" ><summary><span><a href="#init$99">#</a></span>  <code><strong>init</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>init</strong><em>()</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;void&gt;</ul></p></p>    </ul></details><details id="processMidiEvent$101" title="Method" ><summary><span><a href="#processMidiEvent$101">#</a></span>  <code><strong>processMidiEvent</strong></code><em>(midiEvent)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="midiEvent$103" title="Parameter" ><summary><span><a href="#midiEvent$103">#</a></span>  <code><strong>midiEvent</strong></code>    </summary>    <ul><p><span>MIDIMessageEvent</span></p>        </ul></details>  <p><strong>processMidiEvent</strong><em>(midiEvent)</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="restartMem$80" title="Method" ><summary><span><a href="#restartMem$80">#</a></span>  <code><strong>restartMem</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>restartMem</strong><em>()</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="resume$84" title="Method" ><summary><span><a href="#resume$84">#</a></span>  <code><strong>resume</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>resume</strong><em>()</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="setClockBuffer$77" title="Method" ><summary><span><a href="#setClockBuffer$77">#</a></span>  <code><strong>setClockBuffer</strong></code><em>(clockBuffer)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="clockBuffer$79" title="Parameter" ><summary><span><a href="#clockBuffer$79">#</a></span>  <code><strong>clockBuffer</strong></code>    </summary>    <ul><p><span>Float64Array</span></p>        </ul></details>  <p><strong>setClockBuffer</strong><em>(clockBuffer)</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="setCode$70" title="Method" ><summary><span><a href="#setCode$70">#</a></span>  <code><strong>setCode</strong></code><em>(code, reset)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="code$72" title="Parameter" ><summary><span><a href="#code$72">#</a></span>  <code><strong>code</strong></code>    </summary>    <ul><p>string</p>        </ul></details><details id="reset$73" title="Parameter" ><summary><span><a href="#reset$73">#</a></span>  <code><strong>reset</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>false</code></span>  </summary>    <ul><p>boolean</p>        </ul></details>  <p><strong>setCode</strong><em>(code, reset)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;{<p>  <details id="inputChannels$75" title="Property" ><summary><span><a href="#inputChannels$75">#</a></span>  <code><strong>inputChannels</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="outputChannels$76" title="Property" ><summary><span><a href="#outputChannels$76">#</a></span>  <code><strong>outputChannels</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details></p>}&gt;</ul></p></p>    </ul></details><details id="setSampleBuffer$60" title="Method" ><summary><span><a href="#setSampleBuffer$60">#</a></span>  <code><strong>setSampleBuffer</strong></code><em>(index, buffer, range)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="index$62" title="Parameter" ><summary><span><a href="#index$62">#</a></span>  <code><strong>index</strong></code>    </summary>    <ul><p>number</p>        </ul></details><details id="buffer$63" title="Parameter" ><summary><span><a href="#buffer$63">#</a></span>  <code><strong>buffer</strong></code>    </summary>    <ul><p><span>Float32Array</span>  []</p>        </ul></details><details id="range$64" title="Parameter" ><summary><span><a href="#range$64">#</a></span>  <code><strong>range</strong></code>    </summary>    <ul><p>[  number, number  ]</p>        </ul></details>  <p><strong>setSampleBuffer</strong><em>(index, buffer, range)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;void&gt;</ul></p></p>    </ul></details><details id="setSampleBufferRange$65" title="Method" ><summary><span><a href="#setSampleBufferRange$65">#</a></span>  <code><strong>setSampleBufferRange</strong></code><em>(index, range)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="index$67" title="Parameter" ><summary><span><a href="#index$67">#</a></span>  <code><strong>index</strong></code>    </summary>    <ul><p>number</p>        </ul></details><details id="range$68" title="Parameter" ><summary><span><a href="#range$68">#</a></span>  <code><strong>range</strong></code>    </summary>    <ul><p>[  number, number  ]</p>        </ul></details>  <p><strong>setSampleBufferRange</strong><em>(index, range)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;void&gt;</ul></p></p>    </ul></details><details id="suspend$82" title="Method" ><summary><span><a href="#suspend$82">#</a></span>  <code><strong>suspend</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>suspend</strong><em>()</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="test$92" title="Method" ><summary><span><a href="#test$92">#</a></span>  <code><strong>test</strong></code><em>(frame, length, params)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="frame$94" title="Parameter" ><summary><span><a href="#frame$94">#</a></span>  <code><strong>frame</strong></code>    </summary>    <ul><p>number</p>        </ul></details><details id="length$95" title="Parameter" ><summary><span><a href="#length$95">#</a></span>  <code><strong>length</strong></code>    </summary>    <ul><p>number</p>        </ul></details><details id="params$96" title="Parameter" ><summary><span><a href="#params$96">#</a></span>  <code><strong>params</strong></code>    </summary>    <ul><p>any  []</p>        </ul></details>  <p><strong>test</strong><em>(frame, length, params)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;<span>Float32Array</span>&gt;</ul></p></p>    </ul></details><details id="create$39" title="Method" ><summary><span><a href="#create$39">#</a></span>  <code><strong>create</strong></code><em>(context, options)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="context$41" title="Parameter" ><summary><span><a href="#context$41">#</a></span>  <code><strong>context</strong></code>    </summary>    <ul><p><span>BaseAudioContext</span></p>        </ul></details><details id="options$42" title="Parameter" ><summary><span><a href="#options$42">#</a></span>  <code><strong>options</strong></code>    </summary>    <ul><p><a href="#MonoNodeOptions$28">MonoNodeOptions</a></p>        </ul></details>  <p><strong>create</strong><em>(context, options)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;<a href="#MonoNode$34">MonoNode</a>&gt;</ul></p></p>    </ul></details><details id="register$36" title="Method" ><summary><span><a href="#register$36">#</a></span>  <code><strong>register</strong></code><em>(context)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="context$38" title="Parameter" ><summary><span><a href="#context$38">#</a></span>  <code><strong>context</strong></code>    </summary>    <ul><p><span>BaseAudioContext</span></p>        </ul></details>  <p><strong>register</strong><em>(context)</em>  &nbsp;=&gt;  <ul><span>Promise</span>&lt;void&gt;</ul></p></p>    </ul></details></p></ul></details><details id="MonoParam$1" title="Class" ><summary><span><a href="#MonoParam$1">#</a></span>  <code><strong>MonoParam</strong></code>    </summary>  <a href=""></a>  <ul>        <p>  <details id="constructor$2" title="Constructor" ><summary><span><a href="#constructor$2">#</a></span>  <code><strong>constructor</strong></code><em>(data)</em>    </summary>  <a href=""></a>  <ul>    <p>  <details id="new MonoParam$3" title="ConstructorSignature" ><summary><span><a href="#new MonoParam$3">#</a></span>  <code><strong>new MonoParam</strong></code><em>()</em>    </summary>    <ul><p><a href="#MonoParam$1">MonoParam</a></p>      <p>  <details id="data$4" title="Parameter" ><summary><span><a href="#data$4">#</a></span>  <code><strong>data</strong></code>    </summary>    <ul><p><span>Partial</span>&lt;<a href="#MonoParam$1">MonoParam</a>&gt;</p>        </ul></details></p>  </ul></details></p>    </ul></details><details id="code$15" title="Property" ><summary><span><a href="#code$15">#</a></span>  <code><strong>code</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="defaultValue$19" title="Property" ><summary><span><a href="#defaultValue$19">#</a></span>  <code><strong>defaultValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="fnId$6" title="Property" ><summary><span><a href="#fnId$6">#</a></span>  <code><strong>fnId</strong></code>    </summary>  <a href=""></a>  <ul><p><span>Token</span> &amp; string</p>        </ul></details><details id="id$5" title="Property" ><summary><span><a href="#id$5">#</a></span>  <code><strong>id</strong></code>    </summary>  <a href=""></a>  <ul><p><span>Token</span> &amp; string</p>        </ul></details><details id="maxValue$18" title="Property" ><summary><span><a href="#maxValue$18">#</a></span>  <code><strong>maxValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="minValue$17" title="Property" ><summary><span><a href="#minValue$17">#</a></span>  <code><strong>minValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="name$16" title="Property" ><summary><span><a href="#name$16">#</a></span>  <code><strong>name</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="normalValue$20" title="Property" ><summary><span><a href="#normalValue$20">#</a></span>  <code><strong>normalValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="paramId$7" title="Property" ><summary><span><a href="#paramId$7">#</a></span>  <code><strong>paramId</strong></code>    </summary>  <a href=""></a>  <ul><p><span>Token</span> &amp; string</p>        </ul></details><details id="scaleValue$21" title="Property" ><summary><span><a href="#scaleValue$21">#</a></span>  <code><strong>scaleValue</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="source$9" title="Property" ><summary><span><a href="#source$9">#</a></span>  <code><strong>source</strong></code>    </summary>  <a href=""></a>  <ul><p>{<p>  <details id="arg$11" title="Property" ><summary><span><a href="#arg$11">#</a></span>  <code><strong>arg</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="default$14" title="Property" ><summary><span><a href="#default$14">#</a></span>  <code><strong>default</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="id$12" title="Property" ><summary><span><a href="#id$12">#</a></span>  <code><strong>id</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details><details id="range$13" title="Property" ><summary><span><a href="#range$13">#</a></span>  <code><strong>range</strong></code>    </summary>  <a href=""></a>  <ul><p>string</p>        </ul></details></p>}</p>        </ul></details><details id="sourceIndex$8" title="Property" ><summary><span><a href="#sourceIndex$8">#</a></span>  <code><strong>sourceIndex</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="normalize$22" title="Method" ><summary><span><a href="#normalize$22">#</a></span>  <code><strong>normalize</strong></code><em>(value)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="value$24" title="Parameter" ><summary><span><a href="#value$24">#</a></span>  <code><strong>value</strong></code>    </summary>    <ul><p>number</p>        </ul></details>  <p><strong>normalize</strong><em>(value)</em>  &nbsp;=&gt;  <ul>number</ul></p></p>    </ul></details><details id="scale$25" title="Method" ><summary><span><a href="#scale$25">#</a></span>  <code><strong>scale</strong></code><em>(normal)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="normal$27" title="Parameter" ><summary><span><a href="#normal$27">#</a></span>  <code><strong>normal</strong></code>    </summary>    <ul><p>number</p>        </ul></details>  <p><strong>scale</strong><em>(normal)</em>  &nbsp;=&gt;  <ul>number</ul></p></p>    </ul></details></p></ul></details><details id="MonoNodeOptions$28" title="TypeAlias" ><summary><span><a href="#MonoNodeOptions$28">#</a></span>  <code><strong>MonoNodeOptions</strong></code>    </summary>  <a href=""></a>  <ul><p><span>AudioWorkletNodeOptions</span> &amp; {<p>  <details id="channelCount$33" title="Property" ><summary><span><a href="#channelCount$33">#</a></span>  <code><strong>channelCount</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="numberOfInputs$30" title="Property" ><summary><span><a href="#numberOfInputs$30">#</a></span>  <code><strong>numberOfInputs</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="numberOfOutputs$31" title="Property" ><summary><span><a href="#numberOfOutputs$31">#</a></span>  <code><strong>numberOfOutputs</strong></code>    </summary>  <a href=""></a>  <ul><p>number</p>        </ul></details><details id="outputChannelCount$32" title="Property" ><summary><span><a href="#outputChannelCount$32">#</a></span>  <code><strong>outputChannelCount</strong></code>    </summary>  <a href=""></a>  <ul><p>number  []</p>        </ul></details></p>}</p>        </ul></details></p>

## Credits
- [alice-bob](https://npmjs.org/package/alice-bob) by [stagas](https://github.com/stagas) &ndash; transport agnostic strongly typed duplex rpc interfaces
- [better-console-time](https://npmjs.org/package/better-console-time) by [stagas](https://github.com/stagas) &ndash; console.time that optionally warns when above a threshold.
- [monolang](https://npmjs.org/package/monolang) by [stagas](https://github.com/stagas) &ndash; mono is a low level language for audio expressions that compiles to wasm
- [scheduler-node](https://npmjs.org/package/scheduler-node) by [stagas](https://github.com/stagas) &ndash; Sample perfect Audioworklet MIDI Scheduler Node

## Contributing

[Fork](https://github.com/stagas/mono-worklet/fork) or [edit](https://github.dev/stagas/mono-worklet) and submit a PR.

All contributions are welcome!

## License

<a href="LICENSE">MIT</a> &copy; 2023 [stagas](https://github.com/stagas)
