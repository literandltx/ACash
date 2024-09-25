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
import { expect } from "chai";

const treeHeight = 8; // 32 default
const eth_value = "1"

describe.only("MultiProof", () => {
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

  it("should gen multiproof for two pairs, only two leaf in tree scenario 1", async () => {
    /**
     * root
     * ├── p1
     * └── p2
     */
    const pairs: CommitmentFields[] =
      [
        {
          secret: '0x00000000572c05630baa29dbb30a8d8c96a362b054b443d3155354d282d23f69',
          nullifier: '0x0000000014c47f1bbf7418d8798264a9c4073b175f1e54b5da0890778c14eb22'
        },
        {
          secret: '0x00000000919249b48088b75045915bfb71d83f96f64157f41f3d5eaffd2171fc',
          nullifier: '0x00000000b4b632b1e490488938c5ac2352cc5dc7d6e7639fe0dd34be808466ef'
        }
      ];
    await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

    const smtMultiProof = await getMultiProof(depositor, pairs);

    expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
    expect(smtMultiProof.proof.length).to.equal(0);
    expect(smtMultiProof.proof).to.deep.be.eq([]);
    expect(smtMultiProof.pairs).to.deep.be.eq(pairs);
  });

  // not works
  it("should gen multiproof for two pairs, only two leaf in tree scenario 2", async () => {
    /**
     * root
     * ├── p1
     * └── p2
     */
    const pairs: CommitmentFields[] =
      [
        {
          secret: '0x000000004ea5ae2fc9bfa24b0b4e3c43d2d11f18404b69efe35477c6f86ab899',
          nullifier: '0x000000005be9fbfdddd4197dcfc7235e77aa1daf72008f9ac47997eded10e443'
        },
        {
          secret: '0x00000000e03d579dbf882389e607163de243ba67e24eb5c4485679a972e8c3a5',
          nullifier: '0x0000000081682627e20754f21b8449b665ba984728ce7af08b5a674ac24be959'
        }
      ];
    await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

    const smtMultiProof = await getMultiProof(depositor, pairs);

    expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
    expect(smtMultiProof.proof.length).to.equal(0);
    expect(smtMultiProof.proof).to.deep.be.eq([]);
    expect(smtMultiProof.pairs).to.deep.be.eq(pairs);
  });

  describe("tree with 3 leaf, without empty nodes", async () => {
    /**
     * root
     * ├── p2
     * └── H1
     *     ├── p0
     *     └── p1
     */
    const pairs: CommitmentFields[] =
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
      ];

    it("should gen multiproof for 1 pair [0]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
      expect(smtMultiProof.proof.length).to.eq(2);
      expect(smtMultiProof.proof).to.deep.be.eq([
        12748283128798949185497204024914921980675247531964740729871257389465893721813n,
        10401289719923273288719354902437864238973624066578753843061632312152429627977n
      ])
    });

    it("should gen multiproof for 1 pair [1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[1]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
      expect(smtMultiProof.proof.length).to.eq(2);
      expect(smtMultiProof.proof).to.deep.be.eq([
        19795540555795918889281222843290998947573179790706433071253042629056343006344n,
        10401289719923273288719354902437864238973624066578753843061632312152429627977n
      ])
    });

    it("should gen multiproof for 1 pair [2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[2]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
      expect(smtMultiProof.proof.length).to.eq(1);
      expect(smtMultiProof.proof).to.deep.be.eq([
        18786466683985473537218911826997259326705104878964995772945461149280543201286n
      ])
    });

    it("should gen multiproof for 2 pairs [0, 1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[1]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
      expect(smtMultiProof.proof.length).to.eq(1);
      expect(smtMultiProof.proof).to.deep.be.eq([
        10401289719923273288719354902437864238973624066578753843061632312152429627977n
      ])
    });

    it("should gen multiproof for 2 pairs [0, 2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[2]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
      expect(smtMultiProof.proof.length).to.eq(1);
      expect(smtMultiProof.proof).to.deep.be.eq([
        12748283128798949185497204024914921980675247531964740729871257389465893721813n,
      ])
    });

    it("should gen multiproof for 2 pairs [1, 2]", async () => {
      const pairs: CommitmentFields[] =
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
        ];
      const pairToProof: CommitmentFields[] = [pairs[1], pairs[2]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
      expect(smtMultiProof.proof.length).to.eq(1);
      expect(smtMultiProof.proof).to.deep.be.eq([
        19795540555795918889281222843290998947573179790706433071253042629056343006344n
      ])
    });

    it("should gen multiproof for 3 pairs [0, 1, 2]", async () => {
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairs);

      expect(smtMultiProof.root).to.be.eq(await depositor.getRoot());
      expect(smtMultiProof.proof.length).to.equal(0);
      expect(smtMultiProof.pairs).to.deep.be.eq(pairs);
    });
  })

  it("should test for gen test cases", async () => {
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
    const numberToGen   = 2;
    const numberToProof = 2;
    const pairs: CommitmentFields[] = Array.from({ length: numberToGen }, () => generateSecrets());
    await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

    // console.log(pairs);

    const smtMultiProof = await getMultiProof(depositor, pickRandomElements(pairs, numberToProof));
  });

  async function getMultiProof(contract: Depositor, pairs: CommitmentFields[]): Promise<{ pairs: CommitmentFields[], proof: bigint[], root: bigint }> {
    type NodeInfo = {
      currentNodeHash: bigint
      currentNodeKey: bigint
      siblings: string[]
      siblingIndex: number
      toRemove: boolean
    };
    let nodeInfos: NodeInfo[] = [];
    const M: bigint[] = [];

    const middleHash = (left: bigint, right: bigint) => Poseidon.hash([left, right]);
    const leafHash = (left: bigint, right: bigint) => Poseidon.hash([left, right, 1n]);

    for (let i = 0; i < pairs.length; i++) {
      const commitment = getCommitment(pairs[i]);
      const key = getBytes32PoseidonHash(commitment);
      const smtp = await contract.getProof(key as any);

      nodeInfos.push({
        /*  leaf hash H(K || V || 1)  */
        currentNodeHash: leafHash(BigInt(key), BigInt(commitment)),
        currentNodeKey: BigInt(key),
        siblings: smtp.siblings,
        siblingIndex: findDeepestNonZeroPosition(smtp.siblings),
        toRemove: false
      });
    }

    // console.log();
    // nodeInfos.forEach(node => {
    //   console.log(node.siblings);
    //   console.log(node.siblingIndex);
    // })

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

    // console.log();
    // console.log(nodeInfos[0].currentNodeHash + " root");
    // console.log(M);

    return {
      pairs: pairs,
      proof: M,
      root: nodeInfos[0].currentNodeHash
    }
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

  function pickRandomElements<T>(arr: T[], count: number): T[] {
    if (count > arr.length) {
      throw new Error("Count exceeds the number of available elements.");
    }

    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function swapIfZero(arr: [bigint, bigint]): [bigint, bigint] {
    if (arr[0] === 0n || arr[1] === 0n) {
      return [arr[1], arr[0]];
    }

    return arr;
  }

});
