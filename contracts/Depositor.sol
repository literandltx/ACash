// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {PoseidonSMT} from "./PoseidonSMT.sol";

contract Depositor is PoseidonSMT {
    using TypeCaster for *;

    using VerifierHelper for address;

    address public verifier;

    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifies;

    mapping(bytes32 => bool) public rootsHistory;

    error InvalidDepositAmount(uint256 actual, uint256 expected);

    /**
     * @notice Depositor contract constructor
     *
     * @param treeHeight_ Incremental Merkle Tree height
     * @param verifier_ Verifier contract address
     *
     * Tree height used to generate verify contract MUST be the same as {treeHeight_}
     */
    constructor(uint256 treeHeight_, address verifier_) {
        __PoseidonSMT_init(treeHeight_);

        verifier = verifier_;
    }

    function deposit(bytes32 commitment_) public payable {
        if (msg.value != 1 ether) {
            revert InvalidDepositAmount(msg.value, 1 ether);
        }

        require(!commitments[commitment_], "Depositor: commitment already exists");

        _add(commitment_);
        commitments[commitment_] = true;
        rootsHistory[getRoot()] = true;
    }

    // man in the middle
    function withdraw(
        bytes32 nullifierHash_,
        address recipient_,
        bytes32 root_,
        VerifierHelper.ProofPoints calldata proof_
    ) public {
        require(!nullifies[nullifierHash_], "Depositor: nullifier already exists");
        require(rootsHistory[root_], "Depositor: root does not exist");

        require(
            verifier.verifyProofSafe(
                [uint256(root_), uint256(nullifierHash_), uint256(uint160(recipient_))]
                    .asDynamic(),
                proof_,
                3
            ),
            "Depositor: Invalid withdraw proof"
        );

        nullifies[nullifierHash_] = true;

        (bool success_, ) = payable(recipient_).call{value: 1 ether}("");
        require(success_, "Depositor: withdraw failed");
    }
}
