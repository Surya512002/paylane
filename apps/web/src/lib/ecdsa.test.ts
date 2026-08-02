import { describe, expect, it } from "vitest";
import { Signature, verifyMessage, Wallet } from "ethers";
import { toCanonicalEcdsaSignature } from "./ecdsa";

describe("toCanonicalEcdsaSignature", () => {
  it("leaves already-canonical signatures unchanged (aside from casing)", () => {
    const lowS =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
      "39a324a7ace1fc76cf37dceb7e806e332d20397c83780039de9e16ef79babbac" +
      "1b";
    const out = toCanonicalEcdsaSignature(lowS);
    expect(out).toBe(lowS.toLowerCase());
    expect(Signature.from(out).isValid()).toBe(true);
  });

  it("normalizes high-s signatures that ethers would reject", () => {
    // High-s value from the Vercel anomaly (starts with 0xc6 > half-n)
    const highS =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
      "c65cdb58531e038930c82314817f91cb8d8ea36a2bd0a001e134479d567b8595" +
      "1c";

    expect(() => Signature.from(highS).s).toThrow(/non-canonical s/);

    const canonical = toCanonicalEcdsaSignature(highS);
    expect(Signature.from(canonical).isValid()).toBe(true);
    expect(Signature.from(canonical).serialized.toLowerCase()).toBe(canonical);

    // Matches ethers' own EIP-2 normalization
    expect(canonical).toBe(Signature.from(highS).getCanonical().serialized.toLowerCase());
  });

  it("handles yParity 0/1 v values", () => {
    const highS =
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" +
      "c65cdb58531e038930c82314817f91cb8d8ea36a2bd0a001e134479d567b8595" +
      "01";
    const canonical = toCanonicalEcdsaSignature(highS);
    expect(Signature.from(canonical).isValid()).toBe(true);
  });

  it("passes through unexpected formats", () => {
    expect(toCanonicalEcdsaSignature("not-a-sig")).toBe("not-a-sig");
  });

  it("preserves recovered signer after high-s normalization", async () => {
    const wallet = Wallet.createRandom();
    const message = "Sign in to Paylane";
    const signed = await wallet.signMessage(message);
    const canon = Signature.from(signed);

    const highS = (
      BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141") - BigInt(canon._s)
    )
      .toString(16)
      .padStart(64, "0");
    const highV = (55 - canon.v).toString(16).padStart(2, "0");
    const highSig = `0x${canon.r.slice(2)}${highS}${highV}`;

    expect(Signature.from(highSig).isValid()).toBe(false);
    const normalized = toCanonicalEcdsaSignature(highSig);
    expect(verifyMessage(message, normalized).toLowerCase()).toBe(wallet.address.toLowerCase());
  });
});
