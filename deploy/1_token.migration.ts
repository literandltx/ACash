import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { ERC20Mock__factory } from "@ethers-v6";
import { ethers } from "ethers";

export = async (deployer: Deployer) => {
  const erc20 = await deployer.deploy(ERC20Mock__factory, ["Mock", "Mock", 18, ethers.ZeroAddress]);

  Reporter.reportContracts(["ERC20Mock", await erc20.getAddress()]);
};
