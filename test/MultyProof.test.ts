import {
  CommitmentFields,
  generateSecrets,
  getBytes32PoseidonHash,
  getCommitment,
  getPoseidon,
  Reverter
} from "@test-helpers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Depositor } from "@ethers-v6";
import { ethers } from "hardhat";
import { Poseidon } from "@iden3/js-crypto";

const treeHeight = 8; // 32 default
const eth_value = "1"

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

  function pickRandomElements<T>(arr: T[], count: number): T[] {
    if (count > arr.length) {
      throw new Error("Count exceeds the number of available elements.");
    }

    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }


  /* only 2 node scenario, to test isRight(...) and find current hash
  [
    {
      secret: '0x00000000572c05630baa29dbb30a8d8c96a362b054b443d3155354d282d23f69',
      nullifier: '0x0000000014c47f1bbf7418d8798264a9c4073b175f1e54b5da0890778c14eb22'
    },
    {
      secret: '0x00000000919249b48088b75045915bfb71d83f96f64157f41f3d5eaffd2171fc',
      nullifier: '0x00000000b4b632b1e490488938c5ac2352cc5dc7d6e7639fe0dd34be808466ef'
    }
  ]
   */

  /* one empty node and two none empty node scenario
  [
    {
      secret: '0x00000000551e9caba346265ab896e145a3d3d6359dad756b2b998a5fe1e82b6b',
      nullifier: '0x000000008660e62918c45569bfc87a180019d029f8257b662d8797f0a4b2e443'
    },
    {
      secret: '0x000000001a51692da01c96034e670c471bffa3899e3b452ac6669abdc57dffe4',
      nullifier: '0x00000000aa3eb6b01d78d2dc512621301a62ca845066703b3396e94d32659797'
    }
  ]
   */

  /* like previous but 3 leafs
  [
    {
      secret: '0x00000000f1ce6c627c1dd83599842a08899acb929480d39be8d98b1f10f1c20f',
      nullifier: '0x00000000bf4ce6f519179b3835a9b81e662c696e46fa376a7dba6544ab6eb8f1'
    },
    {
      secret: '0x000000007cbc88e3ad8ded8749a70eac76735f42b3d16662bde0d15c6c09cf5b',
      nullifier: '0x0000000011ff27260e1d055a97ae3b69a5dc717fef1718590055d5a75711d697'
    },
    {
      secret: '0x00000000ed1b4bbd5565a99005e07e6f26444fefe26a4e0375bb552a22df2c1f',
      nullifier: '0x00000000eab2105c1da1be89554f8aff0ae9093de565b67c799129f8768b089a'
    }
  ]
   */

  /* 3 leaf node with min tree without empty nodes
  [
    {
      secret: '0x00000000a32ddf42d18c8ced8c630a683601a4512192cffd4501cd3275b6513e',
      nullifier: '0x000000009d12aa1a605621170c339f47927ef11119ba0c400d2ad2818b2dc96f'
    },
    {
      secret: '0x0000000077db0ba60d2f1a003c60d380913309d772d944361d79d0e5f1a48aae',
      nullifier: '0x0000000046a27e84778bf4feb2656c6bc9adbd4a91c3b9f36a902dccae53ebd9'
    },
    {
      secret: '0x0000000060316572fa53ccc32746ec66c15ea1de40845867b177745458cc96df',
      nullifier: '0x00000000ac1ae64802e1d9be299c06aaa74e051a07357ac8230ab6a376ea1b56'
    }
  ]
   */
  // const pairs: CommitmentFields[] = Array.from({ length: 3 }, () => generateSecrets());

  it.only("should test merkle tree (saved) multiProof", async () => {
    // const pairs =
    //   [
    //     {
    //       secret: '0x00000000551e9caba346265ab896e145a3d3d6359dad756b2b998a5fe1e82b6b',
    //       nullifier: '0x000000008660e62918c45569bfc87a180019d029f8257b662d8797f0a4b2e443'
    //     },
    //     {
    //       secret: '0x000000001a51692da01c96034e670c471bffa3899e3b452ac6669abdc57dffe4',
    //       nullifier: '0x00000000aa3eb6b01d78d2dc512621301a62ca845066703b3396e94d32659797'
    //     }
    //   ];
    const pairs: CommitmentFields[] = Array.from({ length: 3 }, () => generateSecrets());
    await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

    const smtMultiProof = await getMultiProof(depositor, pickRandomElements(pairs, 3));
  });

  async function getMultiProof(contract: Depositor, pairs: CommitmentFields[]) {
    type NodeInfo = {
      currentNodeHash: bigint
      currentNodeKey: bigint
      siblings: string[]
      siblingIndex: number
      toRemove: boolean
    };
    let nodeInfos: NodeInfo[] = [];
    const M: bigint[] = [];
    const ONE = 1n;

    const middleHash = (left: bigint, right: bigint) => Poseidon.hash([left, right]);
    const leafHash = (left: bigint, right: bigint) => Poseidon.hash([left, right, ONE]);

    for (let i = 0; i < pairs.length; i++) {
      const commitment = getCommitment(pairs[i]);
      const key = getBytes32PoseidonHash(commitment);
      const smtp = await contract.getProof(key as any);

      console.log(BigInt(smtp.root));

      nodeInfos.push({
        /*  leaf hash H(K || V || 1)  */
        currentNodeHash: leafHash(BigInt(key), BigInt(commitment)),
        currentNodeKey: BigInt(key),
        siblings: smtp.siblings,
        siblingIndex: findDeepestNonZeroPosition(smtp.siblings),
        toRemove: false
      });
    }

    console.log();
    nodeInfos.forEach(node => {
      console.log(node.siblings);
      console.log(node.siblingIndex);
    })

    while (nodeInfos[0].siblingIndex !== -1) {
      const maxIndex = Math.max(...nodeInfos.map(node => node.siblingIndex));
      const B: bigint[][] = [];
      const A: bigint[] = [];

      nodeInfos.forEach(node => {
        if (node.siblingIndex === maxIndex) {
          let pairNextNodeHash: bigint[];

          if (isRight(node.currentNodeHash, node.siblingIndex + 1)) {
            pairNextNodeHash = [BigInt(node.siblings[node.siblingIndex]), node.currentNodeHash];
          } else {
            pairNextNodeHash = [node.currentNodeHash, BigInt(node.siblings[node.siblingIndex])];
          }

          // pairNextNodeHash = swapIfZero(pairNextNodeHash) // ?

          const elementExists = B.some(existingElement => existingElement[0] === pairNextNodeHash[0] && existingElement[1] === pairNextNodeHash[1]);

          A.push(node.currentNodeHash)
          B.push(pairNextNodeHash);

          if (!elementExists) {
            const hash = middleHash(pairNextNodeHash[0], pairNextNodeHash[1]);
            node.currentNodeHash = hash;
            node.currentNodeKey = BigInt(getBytes32PoseidonHash(BigInt(hash).toString()));
            node.siblingIndex = node.siblingIndex - 1;
          } else {
            node.toRemove = true;
          }
        }
      });

      M.push(...Array.from(new Set([...new Set(B.flat())].filter(item => !Array.from(A).includes(BigInt(item))))));
      nodeInfos = nodeInfos.filter(node => !node.toRemove);
    }

    console.log();
    console.log(nodeInfos[0].currentNodeHash + " root");
    console.log(M);
  }

  function isRight(value: BigInt, currentDepth: number): boolean {
    return !(((value >> BigInt(currentDepth)) & BigInt(1)) === BigInt(1));
  }

  function findDeepestNonZeroPosition(array: string[]): number {
    for (let i = array.length - 1; i >= 0; i--) {
      if (array[i] !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return i;
      }
    }

    return 0;
  }

  function toHex(bigInt: BigInt): string {
    return bigInt.toString(16).padStart(64, ' ');
  }

  async function proceedCertainDeposit(pair: CommitmentFields) {
    await depositor.deposit(getCommitment(pair) as any, { value: ethers.parseEther(eth_value) } as any);
  }

  async function mockRandomDeposit() {
    await depositor.deposit(getCommitment(generateSecrets()) as any, { value: ethers.parseEther(eth_value) } as any);
  }

  async function runMockDeposits(n: number): Promise<void> {
    await Promise.all(Array.from({ length: n }, () => mockRandomDeposit()));
  }

  function swapIfZero(arr: [bigint, bigint]): [bigint, bigint] {
    if (arr[0] === 0n || arr[1] === 0n) {
      return [arr[1], arr[0]];
    }

    return arr;
  }

});
