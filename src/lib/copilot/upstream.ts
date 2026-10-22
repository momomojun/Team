/**
 * 网站的中转（src/app/api/copilot/*）请求 Copilot 服务时要带的请求头：
 * - 设了 COPILOT_TOKEN（Copilot 放到公网，比如 Hugging Face Spaces）就带上 X-Copilot-Token，Copilot 那边核对（guard.py）；
 * - 把用户的地址透传成 X-Forwarded-For，Copilot 按它限流（不然所有人都算成网站服务器一个人）。
 */
export function copilotHeaders(request?: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = process.env.COPILOT_TOKEN;
  if (token) headers["X-Copilot-Token"] = token;
  const forwarded = request?.headers.get("x-forwarded-for") ?? request?.headers.get("x-real-ip");
  if (forwarded) headers["X-Forwarded-For"] = forwarded.split(",")[0].trim();
  return headers;
}
