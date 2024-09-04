// @ts-ignore
import * as snarkjs from "snarkjs";

import { ethers, zkit } from "hardhat";

import { getBytes32PoseidonHash, poseidonHash } from "@/test/helpers/poseidon-hash";
import { Depositor } from "@ethers-v6";
import { VerifierHelper } from "@/generated-types/ethers/contracts/Depositor";
import { PrivateWithdraw, ProofWithdraw } from "@/generated-types/zkit";
import { NumberLike } from "@solarity/zkit";
import { expect } from "chai";

export interface CommitmentFields {
  secret: string;
  nullifier: string;
}

export function generateSecrets(): CommitmentFields {
  const secret = ethers.randomBytes(28);
  const nullifier = ethers.randomBytes(28);

  return {
    secret: padElement(ethers.hexlify(secret)),
    nullifier: padElement(ethers.hexlify(nullifier)),
  };
}

export function getCommitment(pair: CommitmentFields): string {
  return poseidonHash(pair.secret + pair.nullifier.replace("0x", ""));
}

export function getNullifierHash(pair: CommitmentFields): string {
  return poseidonHash(pair.nullifier);
}

export async function getZKP(contract: Depositor, pair: CommitmentFields, _recipient: string) {
  const leaf = getBytes32PoseidonHash(getCommitment(pair));
  const nullifierHash = getNullifierHash(pair);
  const circuit = await zkit.getCircuit("Withdraw");

  const smtProof = await contract.getProof(leaf);

  const inputs: PrivateWithdraw = {
    root: (await contract.getRoot()) as NumberLike,
    nullifierHash: nullifierHash as NumberLike,
    recipient: _recipient as NumberLike,
    secret: pair.secret as NumberLike,
    nullifier: pair.nullifier as NumberLike,
    siblings: smtProof.siblings as NumberLike[],
    auxKey: smtProof.auxKey as NumberLike,
    auxValue: smtProof.auxValue as NumberLike,
    auxIsEmpty: smtProof.auxExistence as NumberLike,
    isExclusion: 0 as NumberLike,
  };

  const proof: ProofWithdraw = await circuit.generateProof(inputs);

  expect(await circuit.verifyProof(proof)).to.be.true;

  swap(proof.proof.pi_b[0], 0, 1);
  swap(proof.proof.pi_b[1], 0, 1);

  const formattedProof: VerifierHelper.ProofPointsStruct = {
    a: proof.proof.pi_a.slice(0, 2).map((x: any) => padElement(BigInt(x))),
    b: proof.proof.pi_b.slice(0, 2).map((x: any[]) => x.map((y: any) => padElement(BigInt(y)))),
    c: proof.proof.pi_c.slice(0, 2).map((x: any) => padElement(BigInt(x))),
  };

  return {
    formattedProof,
    nullifierHash,
  };
}

export function checkMerkleProof(leaf: string, pathIndices: number[], pathElements: string[], _root: string) {
  for (let i = 0; i < pathIndices.length; i++) {
    const pathElement = pathElements[i];
    const pathIndex = pathIndices[i];

    if (pathIndex === 0) {
      padElement;
      leaf = poseidonHash(pathElement + leaf.replace("0x", ""));
    } else {
      leaf = poseidonHash(leaf + pathElement.replace("0x", ""));
    }
  }
}

function swap(arr: any, i: number, j: number) {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}

function padElement(element: any) {
  return ethers.toBeHex(element, 32);
}
