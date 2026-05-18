import { ethers } from "ethers"

export async function signMint(wallet: string, cid: string, amount: number) {
  if (!process.env.ORACLE_PRIVATE_KEY) {
    throw new Error("ORACLE_PRIVATE_KEY not configured")
  }

  const signer = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY)
  const msg = ethers.solidityPackedKeccak256(
    ["address", "bytes32", "uint256"],
    [wallet, cid, amount]
  )
  return signer.signMessage(ethers.getBytes(msg))
}
