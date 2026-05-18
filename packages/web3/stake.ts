import { ethers } from "ethers"

export async function stakeSentence(sentenceId: string) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet connected")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_STAKING_CONTRACT!,
    ["function stake(uint256)"],
    signer
  )
  return contract.stake(sentenceId)
}
