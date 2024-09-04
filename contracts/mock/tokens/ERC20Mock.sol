// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

contract ERC20Mock is ERC20 {
    using TypeCaster for *; // TypeCaster library for type conversions.

    using VerifierHelper for address; // VerifierHelper library for zk-SNARK proof verification.

    uint8 internal _decimals;

    address public verifier;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimalPlaces_,
        address verifier_
    ) ERC20(name_, symbol_) {
        _decimals = decimalPlaces_;

        verifier = verifier_;
    }

    function doSmth(
        VerifierHelper.ProofPoints calldata proof_,
        uint256 in1,
        uint256 out
    ) external {
        require(
            VerifierHelper.verifyProof(verifier, [out, in1].asDynamic(), proof_),
            "Invalid proof"
        );
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to_, uint256 amount_) external {
        _mint(to_, amount_);
    }

    function burn(address to_, uint256 amount_) external {
        _burn(to_, amount_);
    }
}
