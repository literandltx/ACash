import {
  CommitmentFields,
  generateSecrets,
  getCommitment,
  getPoseidon,
  getMultiProof,
  Reverter
} from "@test-helpers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Depositor } from "@ethers-v6";
import { ethers } from "hardhat";
import { expect } from "chai";

const treeHeight = 32; // default
const eth_value = "1"

describe("MultiProof metrics", async () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;
  let USER2: SignerWithAddress;

  let depositor: Depositor;

  before(async () => {
    [OWNER, USER1, USER2] = await ethers.getSigners();

    const verifierFactory = await ethers.getContractFactory("WithdrawVerifier");
    const verifier = await verifierFactory.deploy();

    const Depositor = await ethers.getContractFactory("Depositor", {
      libraries: {
        PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    depositor = await Depositor.deploy(treeHeight, await verifier.getAddress(), ethers.parseEther(eth_value));

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  function metricsTest(pairNumberToGen, pairNumberToProof, numberOfProofsToGen) {
    describe(`Metrics tests ${pairNumberToProof} in ${pairNumberToGen}`, () => {

      it("should generate and validate performance metrics", async () => {
        const pairs: CommitmentFields[] = Array.from({ length: pairNumberToGen }, () => generateSecrets());
        await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

        const startTime = performance.now();

        let totalSiblingsLength = 0;

        const metricsPromises = Array.from({ length: numberOfProofsToGen }, async () => {
          const smtmp = await getMultiProof(depositor, pickRandomElements(pairs, pairNumberToProof));
          expect(smtmp.root).to.be.equal(await depositor.getRoot());

          totalSiblingsLength += smtmp.siblings.length;
        });
        await Promise.all(metricsPromises);

        const avgExecutionTimeSec = ((performance.now() - startTime) / 1000) / numberOfProofsToGen;
        const avgSiblingsLen = totalSiblingsLength / numberOfProofsToGen;

        console.log(`Avg gen time (sec):  ${avgExecutionTimeSec}`);
        console.log(`Avg siblings length: ${avgSiblingsLen}`);
      });
    });
  }

  // metricsTest(200, 5, 100);
  // metricsTest(500, 5, 100);
  // metricsTest(1000, 5, 100);
  // metricsTest(10000, 5, 100);

  console.log();

  // metricsTest(200, 10, 100);
  // metricsTest(500, 10, 100);
  // metricsTest(1000, 10, 100);
  // metricsTest(10000, 10, 100);

  async function proceedCertainDeposit(pair: CommitmentFields): Promise<void> {
    await depositor.deposit(getCommitment(pair) as any, { value: ethers.parseEther(eth_value) } as any);
  }

  function pickRandomElements<T>(arr: T[], count: number): T[] {
    if (count > arr.length) {
      throw new Error("Count exceeds the number of available elements.");
    }

    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

});
