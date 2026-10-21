// 路线讲解的朗读：用浏览器自带的语音合成（Web Speech API，免费、不联网、不传任何东西出去），一句一句念、一句一句出字幕。
// 浏览器不支持、或者用户关了声音，就按每句的阅读时间（narration.ts 的 readingMs）只出字幕。
// Chrome 偶尔不触发 onend：每句另有一个兜底的计时，念不完也会往下走

import { readingMs, sentences } from "./narration";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/** 按语言挑一个声音：完全对上的（zh-CN）优先，其次同一种语言的（zh）。浏览器要过一会儿才把声音列表准备好（Chrome 第一次是空的） */
function voiceFor(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang === lang) ?? voices.find((voice) => voice.lang.startsWith(lang.split("-")[0]));
}

export class Narrator {
  private queue: string[] = [];
  private index = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private resolve: (() => void) | null = null;
  private token = 0;
  paused = false;

  constructor(
    private lang: string,
    /** 换到第几句（-1 是念完了），给字幕用 */
    private onSentence: (sentence: string | null) => void,
    public muted = false,
  ) {}

  /** 念这几句，念完（或者被 stop）时 resolve */
  play(lines: string[]): Promise<void> {
    this.stop();
    // 太长的句子在逗号处再拆，字幕一次不超过两行
    this.queue = lines.flatMap((line) => sentences(line));
    this.index = 0;
    this.paused = false;
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.next();
    });
  }

  private next() {
    const token = ++this.token;
    if (this.index >= this.queue.length) {
      this.onSentence(null);
      const resolve = this.resolve;
      this.resolve = null;
      resolve?.();
      return;
    }
    const sentence = this.queue[this.index];
    this.onSentence(sentence);
    const advance = () => {
      if (token !== this.token || this.paused) return;
      if (this.timer) clearTimeout(this.timer);
      this.index += 1;
      this.next();
    };
    const budget = readingMs(sentence);
    // 这台设备没有这种语言的声音（有的浏览器一个都没有）：只出字幕、按阅读时间走，不干等
    if (this.muted || !canSpeak() || !voiceFor(this.lang)) {
      this.timer = setTimeout(advance, budget);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = this.lang;
    const voice = voiceFor(this.lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    utterance.onend = advance;
    utterance.onerror = advance;
    window.speechSynthesis.speak(utterance);
    // 兜底：语音一直不回 onend（Chrome 的老毛病）也按时往下走
    this.timer = setTimeout(advance, budget * 2.5 + 2000);
  }

  pause() {
    this.paused = true;
    this.token += 1;
    if (this.timer) clearTimeout(this.timer);
    if (canSpeak()) window.speechSynthesis.cancel();
  }

  /** 从被打断的那一句重新念 */
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.next();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && canSpeak()) {
      // 正在念的这句改成按时间往下走
      this.token += 1;
      window.speechSynthesis.cancel();
      if (!this.paused && this.resolve) this.next();
    }
  }

  stop() {
    this.token += 1;
    if (this.timer) clearTimeout(this.timer);
    if (canSpeak()) window.speechSynthesis.cancel();
    this.onSentence(null);
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.();
  }
}
