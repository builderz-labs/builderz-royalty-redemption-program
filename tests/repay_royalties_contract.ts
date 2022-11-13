import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RepayRoyaltiesContract } from "../target/types/repay_royalties_contract";

describe("repay_royalties_contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RepayRoyaltiesContract as Program<RepayRoyaltiesContract>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.repayRoyalties().rpc();
    console.log("Your transaction signature", tx);
  });
});
