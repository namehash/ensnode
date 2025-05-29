import { resolveForward } from "@/api/lib/forward-resolution";
import { ETH_COIN_TYPE, evmCoinTypeForChainId } from "@ensnode/ensnode-sdk";
import { Hono } from "hono";
import { base } from "viem/chains";

const app = new Hono();

// TODO: some api endpoints

const JESSE_NAME = "jesse.base.eth";

console.log(
  await resolveForward(JESSE_NAME, {
    name: true,
    addresses: [BigInt(ETH_COIN_TYPE), BigInt(evmCoinTypeForChainId(base.id))],
    texts: ["name", "description", "avatar", "com.twitter"],
  }),
);

export default app;
