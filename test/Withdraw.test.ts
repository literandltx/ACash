import { ethers } from "hardhat";
import { Depositor } from "@ethers-v6";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { expect } from "chai";

import {
  CommitmentFields,
  generateSecrets,
  getBytes32PoseidonHash,
  getCommitment,
  getPoseidon,
  getZKP,
  Reverter
} from "@test-helpers";
import * as fs from "node:fs";

const treeHeight = 32;
const eth_value = "1"

describe("Withdraw", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;

  let depositor: Depositor;

  before(async () => {
    [OWNER, USER1] = await ethers.getSigners();

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

  it("should create deposit", async () => {
    const commitment = getCommitment(generateSecrets());

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    const node = await depositor.getNodeByKey(getBytes32PoseidonHash(commitment));

    expect(node.value).to.equal(commitment);
    expect(await depositor.commitments(commitment)).to.be.true;
    expect(await ethers.provider.getBalance(await depositor.getAddress())).to.equal(ethers.parseEther(eth_value));
  });

  it("should not create zero value deposit", async () => {
    const commitment = getCommitment(generateSecrets());
    const zero_eth_value = "0";

    await expect(
      depositor.deposit(commitment as any, { value: ethers.parseEther(zero_eth_value) } as any),
    ).to.be.revertedWithCustomError(depositor, "InvalidDepositAmount").withArgs(zero_eth_value, "1000000000000000000");
  });

  it("should not create one deposit twice", async () => {
    const commitment = getCommitment(generateSecrets());

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    await expect(
      depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any),
    ).to.be.revertedWithCustomError(depositor, "CommitmentAlreadyExists").withArgs(commitment);
  });

  it("should withdraw deposit", async () => {
    const pair = generateSecrets();
    const commitment = getCommitment(pair);

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    let to = await OWNER.getAddress();

    const proof = await getZKP(depositor, pair, to);

    await depositor.withdraw(proof.nullifierHash, to, await depositor.getRoot(), proof.formattedProof);
  });

  it("should not withdrawal deposit twice", async () => {
    const pair = generateSecrets();
    const commitment = getCommitment(pair);

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    let to = await OWNER.getAddress();

    const proof = await getZKP(depositor, pair, to);

    await depositor.withdraw(proof.nullifierHash, to, await depositor.getRoot(), proof.formattedProof);
    await expect(
      depositor.withdraw(proof.nullifierHash, to, await depositor.getRoot(), proof.formattedProof),
    ).to.be.revertedWithCustomError(depositor, "NullifierAlreadyExists").withArgs(proof.nullifierHash);
  });

  it("should not withdrawal deposit with not existing root", async () => {
    const pair = generateSecrets();
    const commitment = getCommitment(pair);

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    let to = await OWNER.getAddress();

    const proof = await getZKP(depositor, pair, to);
    const root: BytesLike = ethers.randomBytes(32);

    await expect(depositor.withdraw(proof.nullifierHash, to, root, proof.formattedProof)
    ).to.be.revertedWithCustomError(depositor, "RootDoesNotExist").withArgs(root);
  });

  it("deposit load test", async () => {
    for (let i = 0; i < 2; i++) {
      const commitment = getCommitment(generateSecrets());

      await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);
    }
  });

  it.skip("should not execute if withdraw fail", async () => {
    const pair = generateSecrets();
    const commitment = getCommitment(pair);

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    let to = await OWNER.getAddress();

    const proof = await getZKP(depositor, pair, to);

    await expect(
      depositor.withdraw(proof.nullifierHash, to, await depositor.getRoot(), proof.formattedProof),
    ).to.be.revertedWithCustomError(depositor, "WithdrawFailed");
  });
});

describe("Transfer", () => {
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

  it("should defend from front-running attack", async () => {
    // A: create deposit
    const pairA: CommitmentFields = generateSecrets();
    const commitmentA = getCommitment(pairA);
    await depositor.deposit(commitmentA as any, { value: ethers.parseEther(eth_value) } as any);

    // B: prepare new commitment
    const pairB: CommitmentFields = generateSecrets();
    const commitmentB = getCommitment(pairB);

    // A: ask B for new commitment
    /* B: sending... */
    /* A: receive commitmentB */

    // A: prepare for transfer (generate proof)
    const proof = await getZKP(depositor, pairA, commitmentB);
    const root = await depositor.getRoot();

    // M: try to use front-running attack
    const pairC: CommitmentFields = generateSecrets();
    const commitmentC = getCommitment(pairC);

    await expect(
      depositor.transfer(proof.nullifierHash, commitmentC, root, proof.formattedProof)
    ).to.be.revertedWithCustomError(depositor, "InvalidWithdrawProof");
    // M: attack failed if test passing

    // A: transfer deposit
    await depositor.transfer(proof.nullifierHash, commitmentB, root, proof.formattedProof);
  })

  function calculateExpectation(arr: number[]): number {
    if (arr.length === 0) {
      throw new Error("Array is empty. Cannot calculate expectation.");
    }

    return arr.reduce((acc, curr) => acc + curr, Number(0)) / Number(arr.length);
  }

  async function sum(arr: number[]): Promise<number> {
    return arr.reduce((acc, curr) => acc + curr, Number(0));
  }

  async function singleBunchTransfer(bunch: number): Promise<{ gasUsedSum: number; timeSpentSum: number }> {
    const gasUsed: number[] = [];
    const timeAmount: number[] = [];

    for (let i = 0; i < bunch; i++) {
      const pairA: CommitmentFields = generateSecrets();
      const commitmentA = getCommitment(pairA);
      await depositor.deposit(commitmentA as any, { value: ethers.parseEther(eth_value) } as any);

      const pairB: CommitmentFields = generateSecrets();
      const commitmentB = getCommitment(pairB);

      const proof = await getZKP(depositor, pairA, commitmentB);

      const start = performance.now();

      const txResponse = await depositor.transfer(proof.nullifierHash, commitmentB, await depositor.getRoot(), proof.formattedProof);
      const txReceipt = await txResponse.wait();
      const gas = txReceipt?.gasUsed;

      const end = performance.now();

      if (gas) {
        gasUsed.push(Number(gas));
      }
      timeAmount.push(end - start);
    }

    const gasUsedSum = await sum(gasUsed);
    const timeSpentSum = await sum(timeAmount);

    return {gasUsedSum, timeSpentSum};
  }

  function findMaxMinAndIndexes(arr: number[]): { max: { value: number, index: number }, min: { value: number, index: number } } {
    if (arr.length === 0) {
      throw new Error('Array cannot be empty');
    }

    let max = arr[0];
    let min = arr[0];
    let maxIndex = 0;
    let minIndex = 0;

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i];
        maxIndex = i;
      }
      if (arr[i] < min) {
        min = arr[i];
        minIndex = i;
      }
    }

    return {
      max: { value: max, index: maxIndex },
      min: { value: min, index: minIndex }
    };
  }

  async function transferMetrics(bunch: number, counter: number): Promise<{gasExpectation: number[], timeExpectation: number[]}> {
    const gasExpectation: number[] = [];
    const timeExpectation: number[] = [];

    for (let i = 0; i < counter; i++) {
      const result = await singleBunchTransfer(bunch);
      const expectation1 = result.gasUsedSum;
      const expectation2 = result.timeSpentSum;

      console.log(`Gas simple bunch:  ${expectation1.toString()}`);
      console.log(`Time simple bunch: ${expectation2.toString()}\n`);

      gasExpectation.push(expectation1);
      timeExpectation.push(expectation2);
    }

    return {gasExpectation, timeExpectation}
  }

  function saveResults(gasExpectation: number[], timeExpectation: number[], bunch: number, count: number): void {
    try {
      const data = {
        gasExpectation,
        timeExpectation
      };

      const jsonData = JSON.stringify(data, null, 2);

      const date = new Date();
      const timestamp = date.getDay().toString() + "_" + date.getHours().toString() + "_" + date.getMinutes().toString();
      const filename = `${bunch}_${count}_results_${timestamp}.json`;

      fs.writeFileSync(filename, jsonData);

      console.log(`Results saved to ${filename}`);
    } catch (error) {
      console.error('Error saving results:', error);
    }
  }

  it.skip("transfer (batch) metrics", async () => {
    const bunch = 10;
    const count = 10;
    const result = await transferMetrics(bunch, count);
    console.log("All transactions are complete");

    const gasExpectation = calculateExpectation(result.gasExpectation);
    const timeExpectation = calculateExpectation(result.timeExpectation);

    console.log('\nfinal results')
    console.log(`Gas expectation:  ${gasExpectation.toString()}`);
    console.log(`Time expectation: ${timeExpectation.toString()}`);

    saveResults(result.gasExpectation, result.timeExpectation, bunch, count);

    const gasRange = findMaxMinAndIndexes(result.gasExpectation);
    const timeRange = findMaxMinAndIndexes(result.timeExpectation);

    console.log('Max gas value: ', gasRange.max.value, 'at index:', gasRange.max.index);
    console.log('Min gas value: ', gasRange.min.value, 'at index:', gasRange.min.index);

    console.log('Max time value:', timeRange.max.value, 'at index:', timeRange.max.index);
    console.log('Min time value:', timeRange.min.value, 'at index:', timeRange.min.index);
  })
})
