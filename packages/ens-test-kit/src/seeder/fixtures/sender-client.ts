import type { SeederContext, SeederSender } from "../types";

export function getSenderClient(
  ctx: SeederContext,
  sender: SeederSender | undefined,
): SeederContext["clients"][SeederSender] {
  return ctx.clients[sender ?? "owner"];
}
