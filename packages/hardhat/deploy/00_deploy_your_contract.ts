import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("BettingContract", {
    from: deployer,
    args: [], // без передачи аргументов
    log: true,
    autoMine: true,
  });

  const yourContract = await hre.ethers.getContract<Contract>("BettingContract", deployer);
  console.log(await yourContract.greeting());
};

export default deployYourContract;
deployYourContract.tags = ["BettingContract"];
