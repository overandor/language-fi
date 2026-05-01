import { ethers } from "ethers"

export async function mintLGU({ cid, amount, signature }: {
  cid: string
  amount: string
  signature: string
}) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet connected")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_LGU_CONTRACT!,
    ["function mintFromArtifact(bytes32,uint256,bytes)"],
    signer
  )
  return contract.mintFromArtifact(
    cid,
    ethers.parseUnits(amount, 18),
    signature
  )
}
