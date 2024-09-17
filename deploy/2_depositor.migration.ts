import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { Depositor__factory, WithdrawVerifier__factory } from "@ethers-v6";
import { deployPoseidons } from "@/deploy/helpers/poseidon";
import { ethers } from "hardhat";

export = async (deployer: Deployer) => {
  const verifier = await deployer.deploy(WithdrawVerifier__factory);

  await deployPoseidons(deployer, [1, 2, 3]);

  const tier1  = ethers.parseEther("1");
  const tier5  = ethers.parseEther("5");
  const tier10 = ethers.parseEther("10");

  const depositorTier1 = await deployer.deploy(Depositor__factory, [80, await verifier.getAddress(), tier1]);
  const depositorTier5 = await deployer.deploy(Depositor__factory, [80, await verifier.getAddress(), tier5]);
  const depositorTier10 = await deployer.deploy(Depositor__factory, [80, await verifier.getAddress(), tier10]);

  Reporter.reportContracts(["Depositor tier 1", await depositorTier1.getAddress()]);
  Reporter.reportContracts(["Depositor tier 5", await depositorTier5.getAddress()]);
  Reporter.reportContracts(["Depositor tier 10", await depositorTier10.getAddress()]);
};
