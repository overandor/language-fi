import { ethers } from "ethers"

export async function mintLGU(params: {
  cid: string
  amount: number
  signature: string
}) {
  if (typeof window === "undefined") {
    throw new Error("Browser environment required")
  }
  
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_LGU_CONTRACT!,
    ["function mintFromArtifact(bytes32,uint256,bytes)"],
    signer
  )
  
  return contract.mintFromArtifact(
    params.cid,
    ethers.parseUnits(params.amount.toString(), 18),
    params.signature
  )
}

export async function stakeSentence(sentenceId: string) {
  if (typeof window === "undefined") {
    throw new Error("Browser environment required")
  }
  
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_STAKING_CONTRACT!,
    ["function stake(uint256)"],
    signer
  )
  
  return contract.stake(sentenceId)
}

export async function signMint(wallet: string, cid: string, amount: number) {
  const signer = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!)
  const msg = ethers.solidityPackedKeccak256(
    ["address", "bytes32", "uint256"],
    [wallet, cid, amount]
  )
  return signer.signMessage(ethers.getBytes(msg))
}
