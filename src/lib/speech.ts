// 路线讲解的朗读：用浏览器自带的语音合成（Web Speech API，免费、不联网、不传任何东西出去），一句一句念、一句一句出字幕。
// 浏览器不支持、或者用户关了声音，就按每句的阅读时间（narration.ts 的 readingMs）只出字幕。
// Chrome 偶尔不触发 onend：每句另有一个兜底的计时，念不完也会往下走

import { readingMs, sentences } from "./narration";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/** 先要一次声音列表：浏览器要过一会儿才准备好（Chrome 第一次是空的），打开讲解版之前先叫它准备 */
export function warmVoices() {
  if (canSpeak()) window.speechSynthesis.getVoices();
}

// 听起来自然的声音：Edge 的“Natural”、Chrome 的 Google 在线声音、苹果的增强版
const NATURAL = /natural|neural|online|google|premium|enhanced/i;

/**
 * 按语言挑一个声音：完全对上的（zh-CN）优先，其次同一种语言的（zh）；同一档里自然的声音优先，
 * 都没有就用系统默认的那个（Windows 自带的“Huihui”这种比较机械）
 */
export function pickVoice(voices: Pick<SpeechSynthesisVoice, "lang" | "name" | "default">[], lang: string) {
  const base = lang.split("-")[0];
  const rank = (voice: (typeof voices)[number]) =>
    (voice.lang.replace("_", "-") === lang ? 0 : voice.lang.startsWith(base) ? 2 : 9) + (NATURAL.test(voice.name) ? 0 : 1);
  const best = voices.filter((voice) => rank(voice) < 9).sort((a, b) => rank(a) - rank(b) || Number(b.default) - Number(a.default))[0];
  return best;
}

function voiceFor(lang: string): SpeechSynthesisVoice | undefined {
  return pickVoice(window.speechSynthesis.getVoices(), lang) as SpeechSynthesisVoice | undefined;
}

export class Narrator {
  private queue: string[] = [];
  private index = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private resolve: (() => void) | null = null;
  private token = 0;
  paused = false;
  /** 倍速：念的快慢（Web Speech 的 rate），没有声音时按阅读时间也一样快；改了从下一句起生效 */
  rate = 1;

  private lang: string;
  /** 换到哪一句（null 是念完了），给字幕用 */
  private onSentence: (sentence: string | null) => void;
  muted: boolean;

  constructor(lang: string, onSentence: (sentence: string | null) => void, muted = false) {
    this.lang = lang;
    this.onSentence = onSentence;
    this.muted = muted;
  }

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

  /** 这一段念到百分之几（进度条用） */
  get progress(): number {
    return this.queue.length ? Math.min(1, this.index / this.queue.length) : 0;
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
    const budget = readingMs(sentence) / this.rate;
    // 这台设备没有这种语言的声音（有的浏览器一个都没有）：只出字幕、按阅读时间走，不干等
    if (this.muted || !canSpeak() || !voiceFor(this.lang)) {
      this.timer = setTimeout(advance, budget);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = this.lang;
    const voice = voiceFor(this.lang);
    if (voice) utterance.voice = voice;
    utterance.rate = this.rate;
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
