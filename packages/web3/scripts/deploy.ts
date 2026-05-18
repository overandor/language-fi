import { ethers } from "hardhat"

async function main() {
  console.log("Deploying LGU token and StakingRewards...")

  const [deployer] = await ethers.getSigners()
  console.log("Deploying with account:", deployer.address)

  // Deploy LGU
  const LGU = await ethers.deployContract("LGU")
  await LGU.waitForDeployment()
  console.log("LGU deployed to:", LGU.target)

  // Deploy StakingRewards
  const StakingRewards = await ethers.deployContract("StakingRewards", [LGU.target])
  await StakingRewards.waitForDeployment()
  console.log("StakingRewards deployed to:", StakingRewards.target)

  // Set oracle in LGU (staking contract as oracle)
  const setOracleTx = await LGU.setOracle(StakingRewards.target)
  await setOracleTx.wait()
  console.log("Oracle set in LGU")

  // Set epoch emission (example: 1000 LGU per epoch)
  const setEmissionTx = await LGU.setEpochEmission(ethers.parseEther("1000"))
  await setEmissionTx.wait()
  console.log("Epoch emission set")

  console.log("\nDeployment Summary:")
  console.log("==================")
  console.log("LGU:", LGU.target)
  console.log("StakingRewards:", StakingRewards.target)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
