// 讲解版的配乐：浏览器里现场合成（Web Audio），不下载、不放别人的音乐，没有版权问题。
// 安静的纪录片式铺底：长长的和弦（几把稍微走音的锯齿波叠在一起，过一个慢慢呼吸的低通滤波），底下一点低音，
// 上面偶尔落几个像钢琴、钟琴的单音（和弦里的音，五声音阶，不会刺耳），都过一层长混响和一点回声。
// 讲话时音乐压低（duck），讲完抬回来；暂停时整个声音停住；每天开头抬一下（swell），像换章。
// 和弦每 9 秒换一个：Dmaj9 → Bm9 → Gmaj9 → Asus2，四个一轮。

const CHORDS = [
  { root: 38, pad: [50, 54, 57, 61, 64] }, // D：D F# A C# E
  { root: 35, pad: [50, 54, 57, 59, 61] }, // Bm9：D F# A B C#
  { root: 31, pad: [50, 54, 55, 59, 62] }, // Gmaj9：D F# G B D
  { root: 33, pad: [52, 57, 59, 61, 64] }, // Asus2：E A B C# E
];
/** 上面落单音用的：D 大调五声音阶，高两个八度 */
const BELLS = [74, 76, 78, 81, 83, 86, 88];
const CHORD_S = 9;
const LEVEL = 0.22;
const DUCKED = 0.08;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/**
 * 混响的冲激响应：两声道各一段按指数衰减的白噪声。衰减每 32 个采样算一次（听不出区别）：
 * 每个采样都算一次乘方的话，5.5 秒的双声道要算五十多万次，点开讲解版时主线程会卡 0.3 秒
 */
function impulse(context: BaseAudioContext, seconds: number, decay: number) {
  const length = Math.round(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  const STEP = 32;
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let start = 0; start < length; start += STEP) {
      const envelope = (1 - start / length) ** decay;
      const end = Math.min(length, start + STEP);
      for (let i = start; i < end; i++) data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }
  return buffer;
}

export class Score {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private wet: ConvolverNode | null = null;
  private echo: DelayNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** 下一个和弦什么时候开始（AudioContext 的时间） */
  private nextChord = 0;
  private chord = 0;
  private nextBell = 0;
  private speaking = false;
  muted = false;

  /** 要在点击（用户手势）里调用：浏览器只允许这时候开始放声音 */
  start() {
    if (typeof window === "undefined" || this.context) return;
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    this.context = context;
    const master = context.createGain();
    master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 4;
    master.connect(limiter).connect(context.destination);
    this.master = master;

    const music = context.createGain();
    music.gain.value = this.muted ? 0 : LEVEL;
    music.connect(master);
    this.music = music;

    // 长混响 + 一点回声：声音像在山谷里散开
    const wet = context.createConvolver();
    // 混响的冲激响应等点击处理完再算（十几毫秒），点开讲解版的那一下不卡；开头 4 秒是淡入，混响晚这一点点听不出来
    setTimeout(() => {
      if (this.context === context) wet.buffer = impulse(context, 5.5, 2.6);
    }, 0);
    const wetGain = context.createGain();
    wetGain.gain.value = 0.55;
    wet.connect(wetGain).connect(music);
    this.wet = wet;
    const echo = context.createDelay(2);
    echo.delayTime.value = 0.55;
    const feedback = context.createGain();
    feedback.gain.value = 0.32;
    echo.connect(feedback).connect(echo);
    echo.connect(wet);
    this.echo = echo;

    // 铺底的低通滤波，慢慢呼吸（0.05 Hz）
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.05;
    const depth = context.createGain();
    depth.gain.value = 350;
    lfo.connect(depth).connect(filter.frequency);
    lfo.start();
    filter.connect(music);
    filter.connect(wet);
    this.filter = filter;

    const now = context.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(1, now + 4);
    this.nextChord = now + 0.05;
    this.nextBell = now + 3;
    // 往前排 1.5 秒的音：标签页在后台时计时器会变慢，排得远一点不断
    this.timer = setInterval(() => this.schedule(), 300);
    this.schedule();
  }

  private schedule() {
    const context = this.context;
    if (!context || context.state !== "running") return;
    const horizon = context.currentTime + 1.5;
    while (this.nextChord < horizon) {
      this.playChord(this.nextChord, CHORDS[this.chord % CHORDS.length]);
      this.chord += 1;
      this.nextChord += CHORD_S;
    }
    while (this.nextBell < horizon) {
      this.playBell(this.nextBell);
      // 2.5–6 秒落一个，讲话时少一点
      this.nextBell += (this.speaking ? 4 : 2.5) + Math.random() * 3.5;
    }
  }

  private playChord(at: number, chord: (typeof CHORDS)[number]) {
    const context = this.context!;
    const fadeIn = 3.5;
    const hold = CHORD_S - 1;
    const fadeOut = 5;
    for (const note of chord.pad) {
      const voice = context.createGain();
      voice.gain.setValueAtTime(0, at);
      voice.gain.linearRampToValueAtTime(0.045, at + fadeIn);
      voice.gain.setValueAtTime(0.045, at + hold);
      voice.gain.linearRampToValueAtTime(0, at + hold + fadeOut);
      voice.connect(this.filter!);
      for (const cents of [-7, 6]) {
        const osc = context.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = hz(note);
        osc.detune.value = cents;
        osc.connect(voice);
        osc.start(at);
        osc.stop(at + hold + fadeOut + 0.1);
      }
    }
    // 低音：正弦波，根音
    const bass = context.createGain();
    bass.gain.setValueAtTime(0, at);
    bass.gain.linearRampToValueAtTime(0.11, at + fadeIn);
    bass.gain.setValueAtTime(0.11, at + hold);
    bass.gain.linearRampToValueAtTime(0, at + hold + fadeOut);
    bass.connect(this.music!);
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = hz(chord.root);
    osc.connect(bass);
    osc.start(at);
    osc.stop(at + hold + fadeOut + 0.1);
  }

  /** 一个像钢琴、钟琴的单音：正弦波加一点高一个八度的泛音，敲一下慢慢衰减 */
  private playBell(at: number) {
    const context = this.context!;
    const note = BELLS[Math.floor(Math.random() * BELLS.length)];
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.05, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
    gain.connect(this.wet!);
    gain.connect(this.echo!);
    const dry = context.createGain();
    dry.gain.value = 0.35;
    gain.connect(dry).connect(this.music!);
    for (const [ratio, level] of [
      [1, 1],
      [2, 0.25],
      [3, 0.08],
    ]) {
      const partial = context.createGain();
      partial.gain.value = level;
      partial.connect(gain);
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = hz(note) * ratio;
      osc.connect(partial);
      osc.start(at);
      osc.stop(at + 3.4);
    }
  }

  private level() {
    return this.muted ? 0 : this.speaking ? DUCKED : LEVEL;
  }

  /** 讲话时压低，讲完慢慢抬回来 */
  duck(speaking: boolean) {
    this.speaking = speaking;
    const context = this.context;
    if (!context || !this.music) return;
    const now = context.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setValueAtTime(this.music.gain.value, now);
    this.music.gain.linearRampToValueAtTime(this.level(), now + (speaking ? 0.35 : 1.6));
  }

  /** 每天开头：滤波打开一点、声音抬一下，像换章 */
  swell() {
    const context = this.context;
    if (!context || !this.filter || !this.master) return;
    const now = context.currentTime;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    this.filter.frequency.linearRampToValueAtTime(1700, now + 2.5);
    this.filter.frequency.linearRampToValueAtTime(900, now + 9);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.duck(this.speaking);
  }

  pause() {
    void this.context?.suspend();
  }

  resume() {
    void this.context?.resume();
  }

  /** 慢慢收掉再关 */
  stop() {
    const context = this.context;
    if (!context || !this.master) return;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const now = context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 1.5);
    this.context = null;
    setTimeout(() => void context.close(), 1700);
  }
}
