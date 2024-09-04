import { ethers } from "hardhat";
import { Depositor } from "@ethers-v6";
import { BytesLike } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { expect } from "chai";

import {
  getPoseidon,
  getCommitment,
  generateSecrets,
  Reverter,
  getBytes32PoseidonHash,
  getZKP
} from "@test-helpers";

describe("Withdraw", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;

  let depositor: Depositor;

  let treeHeight = 6;

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
    depositor = await Depositor.deploy(treeHeight, await verifier.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  it("should create deposit", async () => {
    const commitment = getCommitment(generateSecrets());
    const eth_value = "1";

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    const node = await depositor.getNodeByKey(getBytes32PoseidonHash(commitment));

    expect(node.value).to.equal(commitment);
    expect(await depositor.commitments(commitment)).to.be.true;
    expect(await ethers.provider.getBalance(await depositor.getAddress())).to.equal(ethers.parseEther(eth_value));
  });

  it("should not create zero value deposit", async () => {
    const commitment = getCommitment(generateSecrets());
    const eth_value = "0";

    await expect(
      depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any),
    ).to.be.revertedWithCustomError(depositor, "InvalidDepositAmount").withArgs(eth_value, "1000000000000000000");
  });

  it("should not create one deposit twice", async () => {
    const commitment = getCommitment(generateSecrets());
    const eth_value = "1";

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    await expect(
      depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any),
    ).to.be.revertedWithCustomError(depositor, "CommitmentAlreadyExists").withArgs(commitment);
  });

  it("should withdraw deposit", async () => {
    const pair = generateSecrets();
    const commitment = getCommitment(pair);
    const eth_value = "1";

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    let to = await OWNER.getAddress();

    const proof = await getZKP(depositor, pair, to);

    await depositor.withdraw(proof.nullifierHash, to, await depositor.getRoot(), proof.formattedProof);
  });

  it("should not withdrawal deposit twice", async () => {
    const pair = generateSecrets();
    const commitment = getCommitment(pair);
    const eth_value = "1";

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
    const eth_value = "1";

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
      const eth_value = "1";

      await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);
    }
  });

  it.skip("should not execute if withdraw fail", async () => {
    const pair = generateSecrets();
    const commitment = getCommitment(pair);
    const eth_value = "1";

    await depositor.deposit(commitment as any, { value: ethers.parseEther(eth_value) } as any);

    // let to = await OWNER.getAddress(); // contract
    let to = await OWNER.getAddress(); // contract
    // front running attack

    const proof = await getZKP(depositor, pair, to);

    await expect(
      depositor.withdraw(proof.nullifierHash, to, await depositor.getRoot(), proof.formattedProof),
    // ).to.be.revertedWith("Depositor: withdraw failed");
    ).to.be.revertedWithCustomError(depositor, "WithdrawFailed");
  });
});
