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

  describe("Tree with two leaf at level 0 only", () => {
    it("should gen multiproof for two pairs, case 1", async () => {
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

      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(0);
      expect(smtMultiProof.siblings).to.deep.be.equal([]);
      expect(smtMultiProof.pairs).to.deep.be.equal(pairs);
    });

    it("should gen multiproof for two pairs, case 2", async () => {
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

      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(0);
      expect(smtMultiProof.siblings).to.deep.be.equal([]);
      expect(smtMultiProof.pairs).to.deep.be.equal(pairs);
    });

    it("should gen multiproof for two pairs, case 3", async () => {
      /**
       * root
       * ├── p1
       * └── p2
       */
      const pairs: CommitmentFields[] =
        [
          {
            secret: '0x0000000028d4bf96ed3abb2a23a8cc77ddba658e6d6e9c18c758d893d987db26',
            nullifier: '0x000000004e3c8a30c6e38f2fd359adb64084280ac7dbd63cd51a34a03015c92b'
          },
          {
            secret: '0x000000001519714685473470bc576e12dfa3819bb3ebd6405b590a242a6a618b',
            nullifier: '0x00000000712b55938a7db64c6d06a01899446c9aa474866550a972a926c0c4b5'
          }
        ];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairs);

      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(0);
      expect(smtMultiProof.siblings).to.deep.be.equal([]);
      expect(smtMultiProof.pairs).to.deep.be.equal(pairs);
    });

    it("should gen multiproof for two pairs, case 4", async () => {
      /**
       * root
       * ├── p1
       * └── p2
       */
      const pairs: CommitmentFields[] =
        [
          {
            secret: '0x0000000032848c856dbbf0523edc821a414f4a4ca39377207e4c3116cf76e9e3',
            nullifier: '0x00000000f53aab3b94e2aa94f400e3c931583e5b1d233721e08d35f83c189fb4'
          },
          {
            secret: '0x00000000abc7822e35461ecbdc747da6c1a258331124cd787bda929d61dc418c',
            nullifier: '0x00000000ec5e300a2df03788ebf43b2e45e8d46600bf398404cce4d82c6a57ef'
          }
        ];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairs);

      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(0);
      expect(smtMultiProof.siblings).to.deep.be.equal([]);
      expect(smtMultiProof.pairs).to.deep.be.equal(pairs);
    });

    it("should gen multiproof for two pairs, case 5", async () => {
      /**
       * root
       * ├── p1
       * └── p2
       */
      const pairs: CommitmentFields[] =
        [
          {
            secret: '0x000000001e125eaf6d6d0973773098c314e2d47dcb0bd78c8ed1844a84149e86',
            nullifier: '0x00000000a1ed6ada4aa61f528889db4650973d3fe20bb0ca20fcdfe8e787f528'
          },
          {
            secret: '0x00000000cef64361b85a2bff8ef721237ba895b8c65fa32d4372af92925fb4a7',
            nullifier: '0x0000000056318e6bd4c64a57892b251c1c554552ba8c65dbced4d602ab504a1a'
          }
        ];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairs);

      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(0);
      expect(smtMultiProof.siblings).to.deep.be.equal([]);
      expect(smtMultiProof.pairs).to.deep.be.equal(pairs);
    });
  })

  describe("Tree with 3 leaf without empty nodes", () => {
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
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(2);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        12748283128798949185497204024914921980675247531964740729871257389465893721813n,
        10401289719923273288719354902437864238973624066578753843061632312152429627977n
      ])
    });

    it("should gen multiproof for 1 pair [1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[1]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(2);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        19795540555795918889281222843290998947573179790706433071253042629056343006344n,
        10401289719923273288719354902437864238973624066578753843061632312152429627977n
      ])
    });

    it("should gen multiproof for 1 pair [2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[2]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(1);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        18786466683985473537218911826997259326705104878964995772945461149280543201286n
      ])
    });

    it("should gen multiproof for 2 pairs [0, 1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[1]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(1);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        10401289719923273288719354902437864238973624066578753843061632312152429627977n
      ])
    });

    it("should gen multiproof for 2 pairs [0, 2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[2]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(1);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        12748283128798949185497204024914921980675247531964740729871257389465893721813n,
      ])
    });

    it("should gen multiproof for 2 pairs [1, 2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[1], pairs[2]]
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(1);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        19795540555795918889281222843290998947573179790706433071253042629056343006344n
      ])
    });

    it("should gen multiproof for 3 pairs [0, 1, 2]", async () => {
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairs);

      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(0);
      expect(smtMultiProof.pairs).to.deep.be.equal(pairs);
    });

    Array.from({ length: 10 }, () => {
      it("should gen multiproof for 1/2/3 pairs (random)", async () => {
        const randomNumber = Math.floor(Math.random() * 3) + 1;
        await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));
        const chosenPairs = pickRandomElements(pairs, randomNumber);

        const smtMultiProof = await getMultiProof(depositor, chosenPairs);

        expect(smtMultiProof.pairs).to.deep.be.equal(chosenPairs);
        expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      });
    })
  })

  describe("Tree with 2 leaf node and 1 zero node at level 0", () => {
    /**
     * root
     * ├── 0
     * └── H1
     *     ├── p1
     *     └── p2
     */
    const pairs: CommitmentFields[] =
      [
        {
          secret: '0x00000000551e9caba346265ab896e145a3d3d6359dad756b2b998a5fe1e82b6b',
          nullifier: '0x000000008660e62918c45569bfc87a180019d029f8257b662d8797f0a4b2e443'
        },
        {
          secret: '0x000000001a51692da01c96034e670c471bffa3899e3b452ac6669abdc57dffe4',
          nullifier: '0x00000000aa3eb6b01d78d2dc512621301a62ca845066703b3396e94d32659797'
        }
      ];

    it("should gen multiproof for 1 pair [0]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(2);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        11698066978440879307731542498806639515314676391710952633176759786942704433234n,
        0n
      ]);
    });

    it("should gen multiproof for 1 pair [1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[1]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(2);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        19220061746928465694122033967036362989603650648550216829320470455944585932118n,
        0n
      ]);
    });

    it("should gen multiproof for 1 pair [0, 1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[1]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(1);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        0n
      ]);
    });

    it("should gen multiproof for 1 pair [1, 0]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[1], pairs[0]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      expect(smtMultiProof.siblings.length).to.equal(1);
      expect(smtMultiProof.siblings).to.deep.be.equal([
        0n
      ]);
    });
  })

  describe("Tree with 3 leaf node node and 1 zero node at level 0", () => {
    /**
     * root
     * ├── 0
     * └── H1
     *     ├── p1
     *     └── H2
     *         ├── p2
     *         └── p3
     */
    const pairs: CommitmentFields[] = [
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
    ];

    it("should gen multiproof for 1 pair [0]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
    });

    it("should gen multiproof for 1 pair [1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[1]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
    });

    it("should gen multiproof for 1 pair [2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[2]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
    });

    it("should gen multiproof for 2 pairs [0, 1]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[1]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
    });

    it("should gen multiproof for 2 pairs [0, 2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[2]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
    });

    it("should gen multiproof for 2 pairs [1, 2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[1], pairs[2]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
    });

    it("should gen multiproof for 3 pairs [0, 1, 2]", async () => {
      const pairToProof: CommitmentFields[] = [pairs[0], pairs[1], pairs[2]];
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      const smtMultiProof = await getMultiProof(depositor, pairToProof);

      expect(smtMultiProof.pairs).to.deep.equal(pairToProof);
      expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
    });
  })

  describe("Tree with large random input", () => {
    Array.from({ length: 12 }, () => {
      it("should gen proof for 5 random leaf from 50", async () => {
        const pairNumberToGen = 50;
        const pairNumberToProof = 5;
        const pairs: CommitmentFields[] = Array.from({ length: pairNumberToGen }, () => generateSecrets());

        await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));
        const chosenPairs = pickRandomElements(pairs, pairNumberToProof);

        const smtMultiProof = await getMultiProof(depositor, chosenPairs);

        expect(smtMultiProof.pairs).to.deep.be.equal(chosenPairs);
        expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      });
    });

    Array.from({ length: 1 }, async () => {
      const pairNumberToGen = 400;
      const pairNumberToProof = 5;
      const pairs: CommitmentFields[] = Array.from({ length: pairNumberToGen }, () => generateSecrets());
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      it("should gen proof for 5 random leaf from 400", async () => {
        const chosenPairs = pickRandomElements(pairs, pairNumberToProof);
        const smtMultiProof = await getMultiProof(depositor, chosenPairs);

        expect(smtMultiProof.pairs).to.deep.be.equal(chosenPairs);
        expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
      });
    });

    Array.from({ length: 1 }, async () => {
      const pairNumberToGen = 1200;
      const pairNumberToProof = 5;
      const pairs: CommitmentFields[] = Array.from({ length: pairNumberToGen }, () => generateSecrets());
      await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));

      it.skip("should gen proof for 5 random leaf from 1200", async () => {
        const smtMultiProof = await getMultiProof(depositor, pickRandomElements(pairs, pairNumberToProof));

        expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
        expect(smtMultiProof.pairs).to.deep.be.equal(pairs);
      });
    });
  })

  it.skip("should test for gen test cases", async () => {
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

    // const pairs: CommitmentFields[] = Array.from({ length: 7 }, () => generateSecrets());
    await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));
    // console.log(pairs);

    // const smtMultiProof = await getMultiProof(depositor, [pairs[0]]);
    // const smtMultiProof = await getMultiProof(depositor, [pairs[1]]);
    // const smtMultiProof = await getMultiProof(depositor, [pairs[2]]);
    // const smtMultiProof = await getMultiProof(depositor, [pairs[0], pairs[1]]);
    // const smtMultiProof = await getMultiProof(depositor, [pairs[1], pairs[2]]);
    const smtMultiProof = await getMultiProof(depositor, pairs);

    const actualRoot = BigInt(await depositor.getRoot());
    console.log("\nResults: ");
    console.log(actualRoot + " root expected");
    console.log(smtMultiProof.root + " root actual");
    console.log(smtMultiProof.root === actualRoot);
    console.log(smtMultiProof.siblings.length + " proof len");
    console.log(smtMultiProof.siblings);
  });

  it.skip("should gen proof for 5 random leaf from 100", async () => {
    const pairNumberToGen = 100;
    const pairNumberToProof = 5;
    const pairs: CommitmentFields[] = Array.from({ length: pairNumberToGen }, () => generateSecrets());

    await Promise.all(pairs.map(pair => proceedCertainDeposit(pair)));
    const chosenPairs = pickRandomElements(pairs, pairNumberToProof);

    const smtMultiProof = await getMultiProof(depositor, chosenPairs);

    expect(smtMultiProof.pairs).to.deep.be.equal(chosenPairs);
    expect(smtMultiProof.root).to.be.equal(await depositor.getRoot());
  });


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
