pragma circom 2.0.0;

include "../node_modules/@solarity/circom-lib/data-structures/SparseMerkleTree.circom";

// computes Poseidon(nullifier + secret)
template CommitmentHasher() {
    signal input secret;
    signal input nullifier;

    signal output commitment;
    signal output nullifierHash;

    component commitmentHasher = Poseidon(2);
    component nullifierHasher = Poseidon(1);

    nullifierHasher.inputs[0] <== nullifier;

    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifier;

    commitment <== commitmentHasher.out;
    nullifierHash <== nullifierHasher.out;
}

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
template Withdraw(levels) {
    signal input root;
    signal input nullifierHash;

    signal input recipient; // not taking part in any computations

    signal input secret;
    signal input nullifier;

    signal input siblings[levels];

    signal input auxKey;
    signal input auxValue;
    // 1 if the aux node is empty, 0 otherwise
    signal input auxIsEmpty;

    // 1 if we are checking for exclusion, 0 if we are checking for inclusion
    signal input isExclusion;

    component hasher = CommitmentHasher();

    hasher.secret <== secret;
    hasher.nullifier <== nullifier;
    hasher.nullifierHash === nullifierHash;

    component leafHasher = Poseidon(1);
    leafHasher.inputs[0] <== hasher.commitment;

    component smtVerifier = SparseMerkleTreeVerifier(levels);
    smtVerifier.siblings <== siblings;

    smtVerifier.key <== leafHasher.out;
    smtVerifier.value <== hasher.commitment;

    smtVerifier.auxKey <== auxKey;
    smtVerifier.auxValue <== auxValue;
    smtVerifier.auxIsEmpty <== auxIsEmpty;

    smtVerifier.isExclusion <== isExclusion;

    smtVerifier.root <== root;
    // Add hidden signals to make sure that tampering with recipient or fee will invalidate the snark proof
    // Most likely it is not required, but it's better to stay on the safe side and it only takes 2 constraints
    // Squares are used to prevent optimizer from removing those constraints
    signal recipientSquare <== recipient * recipient;
}

component main {public [root, nullifierHash, recipient]} = Withdraw(32);
