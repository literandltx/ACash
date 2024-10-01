# Repository description
This implementation serves as a proof of concept (PoC) project to explore and understand how zero-knowledge proofs (ZKP) function in practice, specifically with Sparse Merkle Trees. It also aims to implement multi-proofs using Sparse Merkle Trees.

### System Functionality Overview

This smart contract supports a variety of financial operations:

- **Deposit**: Users can deposit a specified amount (equal to a defined tier). Each deposit is linked to a unique commitment, ensuring no duplicates.

- **Withdraw**: Users can withdraw funds by providing a valid nullifier hash, recipient address, and appropriate proof without revealing any additional info. The system verifies it.

- **Transfer**: Users can transfer funds to new "owner" using a nullifier hash and a new commitment. This function also checks for existing commitments and valid roots to ensure secure transfers.

- **Simple Batch Transfers**: Users can transfer many funds as one function. But main the idea of this function is to understand concept of butch of payments and compare to other implementations.

### Limitation (todo)

### Problem
Imagine a situation where Alice wants to transfer 5 ETH to Bob anonymously, but system support only 1 ETH tier transfer, in that case how Alice can do it. The obvious way is transfer 5 times in row, but in that case it seems ineffective.

### Solution
One of the possible approach to solve this problem is support Sparse Merkle Tree (SMT) inclusion multiproof to improve time and/or memory proof generation complexity.

### What is done yet (todo)

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
