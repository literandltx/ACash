import { expect } from "chai";
import { ethers, zkit } from "hardhat";

import { PrivateMultiplier2 } from "@/generated-types/zkit";

import { VerifierHelper } from "@/generated-types/ethers/contracts/mock/tokens/ERC20Mock";

describe("Multipler2", () => {
  it("should verifier proof on chain", async () => {
    const circuit = await zkit.getCircuit("Multiplier2");

    const inputs: PrivateMultiplier2 = {
      in1: 3,
      in2: 4,
    };

    const proof = await circuit.generateProof(inputs);

    const VerifierFactory = await ethers.getContractFactory("Multiplier2Verifier");
    const verifier = await VerifierFactory.deploy();

    const TokenFactory = await ethers.getContractFactory("ERC20Mock");
    const token = await TokenFactory.deploy("Token", "TT", 18, await verifier.getAddress());

    expect(await circuit.verifyProof(proof)).to.be.true;

    swap(proof.proof.pi_b[0], 0, 1);
    swap(proof.proof.pi_b[1], 0, 1);

    const result = await verifier.verifyProof(
      [proof.proof.pi_a[0], proof.proof.pi_a[1]] as any,
      [
        [proof.proof.pi_b[0][0], proof.proof.pi_b[0][1]] as any,
        [proof.proof.pi_b[1][0], proof.proof.pi_b[1][1]] as any,
      ] as any,
      [proof.proof.pi_c[0], proof.proof.pi_c[1]] as any,
      [proof.publicSignals.out, proof.publicSignals.in1] as any,
    );

    expect(result).to.be.true;

    const formattedProof: VerifierHelper.ProofPointsStruct = {
      a: proof.proof.pi_a.slice(0, 2).map((x: any) => padElement(BigInt(x))) as any,
      b: proof.proof.pi_b.slice(0, 2).map((x: any[]) => x.map((y: any) => padElement(BigInt(y)))) as any,
      c: proof.proof.pi_c.slice(0, 2).map((x: any) => padElement(BigInt(x))) as any,
    };

    await token.doSmth(formattedProof, proof.publicSignals.in1, proof.publicSignals.out);
  });
});

// Function to swap two elements in an array
function swap(arr: any, i: number, j: number) {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}

function padElement(element: any) {
  return ethers.toBeHex(element, 32);
}
