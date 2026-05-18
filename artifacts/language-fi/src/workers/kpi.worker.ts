import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

type MsgIn = { type: "generate"; letter: string; price: number; momentum: number; volatility: string } | { type: "market_narrative"; regime: string; topLetter: string; flux: number };
type MsgOut = { type: "ready" } | { type: "result"; id: string; text: string } | { type: "error"; message: string } | { type: "progress"; file: string; progress: number };

let generator: Awaited<ReturnType<typeof pipeline>> | null = null;

async function loadModel() {
  self.postMessage({ type: "progress", file: "Loading model…", progress: 0 });
  generator = await pipeline("text2text-generation", "Xenova/LaMini-Flan-T5-248M", {
    progress_callback: (p: { file: string; progress?: number }) => {
      self.postMessage({ type: "progress", file: p.file, progress: p.progress ?? 0 });
    },
  });
  self.postMessage({ type: "ready" });
}

loadModel().catch((e) => self.postMessage({ type: "error", message: String(e) }));

self.addEventListener("message", async (e: MessageEvent<MsgIn>) => {
  if (!generator) return;
  const msg = e.data;
  try {
    if (msg.type === "generate") {
      const { letter, price, momentum, volatility } = msg;
      const prompt = `Analyze letter "${letter}" as a DeFi primitive asset. Price: ${price.toFixed(4)} LGU. Momentum: ${momentum > 0 ? "+" : ""}${momentum.toFixed(1)}%. Volatility: ${volatility}. Write one short financial insight sentence.`;
      const out = await (generator as (prompt: string, opts: object) => Promise<Array<{generated_text: string}>>)(prompt, { max_new_tokens: 60 });
      self.postMessage({ type: "result", id: letter, text: out[0]?.generated_text?.trim() ?? "" });
    } else if (msg.type === "market_narrative") {
      const { regime, topLetter, flux } = msg;
      const prompt = `Write a one-sentence market narrative for the MEMBRA semantic liquidity oracle. Market regime: ${regime}. Top letter: ${topLetter}. Oracle flux density: ${flux.toFixed(6)}. Use financial and cryptographic terminology.`;
      const out = await (generator as (prompt: string, opts: object) => Promise<Array<{generated_text: string}>>)(prompt, { max_new_tokens: 70 });
      self.postMessage({ type: "result", id: "market", text: out[0]?.generated_text?.trim() ?? "" });
    }
  } catch (err) {
    self.postMessage({ type: "error", message: String(err) });
  }
});
