/**
 * 从景点说明里认出“信号不好”。只认否定句，避免把“信号山”“信号较好”算进去。
 * 中文是原文，英文是翻译后的句子，两种都认。
 */
const POOR =
  /没有[^。；.]*信号|没信号|信号差|信号很差|信号时有时无|no cell|without cell|poor gps|cell signal is (?:poor|spotty|unreliable|weak)|almost no cell|limited cell/i;
const GOOD = /信号较好|信号很好|信号不错|good cell|reliable cell|strong cell/i;

export function poorSignal(text: string): boolean {
  if (GOOD.test(text) && !/没有[^。；.]*信号|没信号|no cell|without cell/i.test(text)) return false;
  return POOR.test(text);
}
