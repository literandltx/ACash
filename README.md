# How multiproof works

This function retrieves multi-proofs for a set of commitment pairs using a smart contract.
This repository implements an off-chain solution for retrieving multi-proofs using Sparse Merkle Trees (SMTs). 
It allows efficient batch querying of multiple commitment pairs, that may significantly reducing computation costs and 
improving performance compared to on-chain methods.

### Key Features
- **Scalability**: Supports any number of input leafs to generate multi proof.
- **Efficiency**: Generates multi-proofs off-chain, might minimize gas fees and execution time of ZKP.

### References
- [Compact merkle multiproof](https://arxiv.org/pdf/2002.07648)
- Code implementation [here](test/helpers/smt-multoproof-helper.ts)

### Inputs
- **contract**: Instance of the `Depositor` contract.
- **pairs**: Array of `CommitmentFields`.

### Outputs
An object containing:
- **pairs**: Original input pairs.
- **siblings**: Array of sibling hashes.
- **root**: Root hash of the Merkle tree.

### Process Overview
1. **Generate Node Info**:
    - For each pair form input pairs, compute `value`, `key`, and retrieve proof from contract
    - Find `siblingIndex` - the deepest non-zero position from the siblings
    - Store `currentNodeHash`, `currentNodeKey`, `siblings`, and `siblingIndex` as new struct

2. **Process Nodes Info**
    - Find the maximum `siblingIndex` in `nodeInfos`
    - Initialize two empty lists: `A` and `B`
    - For each node in `nodeInfos` where `siblingIndex` equals the maximum:
        - Find immediate neighbor and create pair [L, R]
        - Store currentNodeHash in A[] and pair in B[][]
        - Update currentNodeHash from pair
        - siblingIndex--
    - For each unique item in `B` that is not in `A`, add it to list `M`
    - Update `nodeInfos` to remove duplicates
    - Clear lists `A` and `B`

3. **Return the original pairs, collected siblings, and the root hash**

## MultiProof Metrics

This section provides an overview of the performance metrics collected during the MultiProof metrics test. Merkle tree param

### Metrics Tests Summary

- **Metrics tests M in N**: Generate multiproof for M inputs from tree with N leafs.

| Test Configuration | Average Generation Time (sec) | Average Siblings Length |
|--------------------|-------------------------------|-------------------------|
| 5 in 200           | 0.0561                        | 25.80                   |
| 5 in 500           | 0.0620                        | 32.40                   |
| 5 in 1000          | 1.4757                        | 37.36                   |
| 10 in 200          | 0.0668                        | 39.91                   |
| 10 in 500          | 0.1332                        | 53.49                   |
| 10 in 1000         | 1.7310                        | 62.42                   |

# Hardhat template 

Template hardhat repository for ad-hoc smart contracts development.

### How to use

The template works out of the box. To clean up the repo, you may need to delete the mock contracts, tests and migration files.

#### Compilation

To compile the contracts, use the next script:

```bash
npm run compile
```

#### Test

To run the tests, execute the following command:

```bash
npm run test
```

Or to see the coverage, run:

```bash
npm run coverage
```

#### Local deployment

To deploy the contracts locally, run the following commands (in the different terminals):

```bash
npm run private-network
npm run deploy-localhost
```

#### Bindings

The command to generate the bindings is as follows:

```bash
npm run generate-types
```

> See the full list of available commands in the `package.json` file.

### Integrated plugins

- Hardhat official `ethers` + `ethers-v6`
- [`Typechain`](https://www.npmjs.com/package/@typechain/hardhat)
- [`hardhat-migrate`](https://www.npmjs.com/package/@solarity/hardhat-migrate), [`hardhat-markup`](https://www.npmjs.com/package/@solarity/hardhat-markup), [`hardhat-gobind`](https://www.npmjs.com/package/@solarity/hardhat-gobind)
- [`hardhat-contract-sizer`](https://www.npmjs.com/package/hardhat-contract-sizer)
- [`hardhat-gas-reporter`](https://www.npmjs.com/package/hardhat-gas-reporter)
- [`solidity-coverage`](https://www.npmjs.com/package/solidity-coverage)

### Other niceties

- The template comes with presetup `prettier` and `solhint` that lint the project via `husky` before compilation hook.
- The `.env.example` file is provided to check what is required as ENVs
- Preinstalled `@openzeppelin/contracts` and `@solarity/solidity-lib`
