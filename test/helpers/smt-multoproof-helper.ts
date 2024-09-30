import { Depositor } from "@ethers-v6";
import { CommitmentFields } from "@/test/helpers/zkp-helper";
import { Poseidon } from "@iden3/js-crypto";
import { ethers } from "hardhat";

export async function getMultiProof(contract: Depositor, pairs: CommitmentFields[]): Promise<{
  pairs: CommitmentFields[],
  siblings: bigint[],
  root: bigint
}> {
  type NodeInfo = {
    currentNodeHash: bigint
    currentNodeKey: bigint
    siblings: string[]
    siblingIndex: number
  };
  let nodeInfos: NodeInfo[] = [];
  const M: Set<bigint> = new Set<bigint>();

  const middleHash = (left: bigint, right: bigint) => Poseidon.hash([left, right]);
  const leafHash = (left: bigint, right: bigint) => Poseidon.hash([left, right, 1n]);

  for (let i = 0; i < pairs.length; i++) {
    const value: bigint = Poseidon.hash([BigInt(pairs[i].secret), BigInt(pairs[i].nullifier)]);
    const key: bigint = Poseidon.hash([value]);
    const smtp = await contract.getProof(ethers.toBeHex(key, 32) as any);

    nodeInfos.push({
      currentNodeHash: leafHash(key, value),
      currentNodeKey: key,
      siblings: smtp.siblings,
      siblingIndex: findDeepestNonZeroPosition(smtp.siblings)
    });
  }

  while (nodeInfos.length !== 0 && nodeInfos[0].siblingIndex !== -1) {
    const maxIndex = Math.max(...nodeInfos.map(node => node.siblingIndex));
    const B: bigint[][] = [];
    const A: bigint[] = [];

    nodeInfos
      .filter(node => node.siblingIndex === maxIndex)
      .forEach(node => {
          const pairNextNodeHash: bigint[] = isRight(node.currentNodeKey, node.siblingIndex) ?
            [BigInt(node.siblings[node.siblingIndex]), node.currentNodeHash] : [node.currentNodeHash, BigInt(node.siblings[node.siblingIndex])];

          A.push(node.currentNodeHash);
          B.push(pairNextNodeHash);

          node.currentNodeHash = middleHash(pairNextNodeHash[0], pairNextNodeHash[1]);
          node.siblingIndex--;
        }
      );

    [...new Set(B.flat())]
      .filter(item => !Array.from(A).includes(BigInt(item)))
      .forEach(item => M.add(item));

    nodeInfos = distinctNodeInfos(nodeInfos);

    A.length = 0;
    B.length = 0;
  }

  return {
    pairs: pairs,
    siblings: [...M],
    root: nodeInfos[0].currentNodeHash
  }
}

function isRight(value: BigInt, currentDepth: number): boolean {
  return ((value >> BigInt(currentDepth)) & BigInt(1)) === BigInt(1);
}

function findDeepestNonZeroPosition(array: string[]): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return i;
    }
  }

  return 0;
}

function distinctNodeInfos<T extends { currentNodeHash: bigint }>(nodeInfos: T[]): T[] {
  const uniqueMap: Map<bigint, T> = new Map();

  for (const nodeInfo of nodeInfos) {
    if (!uniqueMap.has(nodeInfo.currentNodeHash)) {
      uniqueMap.set(nodeInfo.currentNodeHash, nodeInfo);
    }
  }

  return Array.from(uniqueMap.values());
}
