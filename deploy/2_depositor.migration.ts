import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { Depositor__factory, WithdrawVerifier__factory } from "@ethers-v6";
import { deployPoseidons } from "@/deploy/helpers/poseidon";

export = async (deployer: Deployer) => {
  const verifier = await deployer.deploy(WithdrawVerifier__factory);

  await deployPoseidons(deployer, [1, 2, 3]); // helper fun

  const depositor = await deployer.deploy(Depositor__factory, [80, await verifier.getAddress()]);

  Reporter.reportContracts(["Depositor", await depositor.getAddress()]); // verifier
};
