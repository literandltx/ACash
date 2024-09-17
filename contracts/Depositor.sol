// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {PoseidonSMT} from "./PoseidonSMT.sol";

contract Depositor is PoseidonSMT {
    using TypeCaster for *;

    using VerifierHelper for address;

    address public verifier;
    uint256 public tier;

    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifies;

    mapping(bytes32 => bool) public rootsHistory;

    error InvalidDepositAmount(uint256 actual, uint256 expected);
    error CommitmentAlreadyExists(bytes32 commitment_);

    error NullifierAlreadyExists(bytes32 nullifierHash_);
    error RootDoesNotExist(bytes32 root_);
    error InvalidWithdrawProof();
    error WithdrawFailed();
    error InputArraysNotEqual(uint256 nullifierHashes, uint256 commitment, uint256 proofs);

    /**
     * @notice Depositor contract constructor
     *
     * @param treeHeight_ Incremental Merkle Tree height
     * @param verifier_ Verifier contract address
     *
     * Tree height used to generate verify contract MUST be the same as {treeHeight_}
     */
    constructor(uint256 treeHeight_, address verifier_, uint256 tier_) {
        __PoseidonSMT_init(treeHeight_);

        verifier = verifier_;
        tier = tier_;
    }

    function deposit(bytes32 commitment_) public payable {
        if (msg.value != tier) {
            revert InvalidDepositAmount(msg.value, tier);
        }

        if (commitments[commitment_]) {
            revert CommitmentAlreadyExists(commitment_);
        }

        _add(commitment_);
        commitments[commitment_] = true;
        rootsHistory[getRoot()] = true;
    }

    function withdraw(
        bytes32 nullifierHash_,
        address recipient_,
        bytes32 root_,
        VerifierHelper.ProofPoints calldata proof_
    ) public {
        if (nullifies[nullifierHash_]) {
            revert NullifierAlreadyExists(nullifierHash_);
        }

        if (!rootsHistory[root_]) {
            revert RootDoesNotExist(root_);
        }

        if (
            !verifier.verifyProofSafe(
            [uint256(root_), uint256(nullifierHash_), uint256(uint160(recipient_))]
            .asDynamic(),
            proof_,
            3
        )) {
            revert InvalidWithdrawProof();
        }

        nullifies[nullifierHash_] = true;

        (bool success_, ) = payable(recipient_).call{value: tier}("");
        if (!success_) {
            revert WithdrawFailed();
        }
    }

    function transfer(
        bytes32 nullifierHash_,
        bytes32 commitment_,
        bytes32 root_,
        VerifierHelper.ProofPoints calldata proof_
    ) public {
        if (nullifies[nullifierHash_]) {
            revert NullifierAlreadyExists(nullifierHash_);
        }

        if (commitments[commitment_]) {
            revert CommitmentAlreadyExists(commitment_);
        }

        if (!rootsHistory[root_]) {
            revert RootDoesNotExist(root_);
        }

        if (
            !verifier.verifyProofSafe(
            [uint256(root_), uint256(nullifierHash_), uint256(commitment_)]
            .asDynamic(),
            proof_,
            3
        )) {
            revert InvalidWithdrawProof();
        }

        nullifies[nullifierHash_] = true;

        _add(commitment_);
        commitments[commitment_] = true;
        rootsHistory[getRoot()] = true;
    }

    function simpleBatchPayment(
        bytes32[] calldata nullifierHash_,
        bytes32[] calldata commitment_,
        bytes32 root_,
        VerifierHelper.ProofPoints[] calldata proof_
    ) public {
        if (nullifierHash_.length != commitment_.length || commitment_.length != proof_.length) {
            revert InputArraysNotEqual(nullifierHash_.length, commitment_.length, proof_.length);
        }

        for (uint i = 0; i < nullifierHash_.length; i++) {
            transfer(nullifierHash_[i], commitment_[i], root_, proof_[i]);
        }
    }
}
