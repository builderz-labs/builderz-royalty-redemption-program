require("dotenv").config();
import * as anchor from "@project-serum/anchor";
import { Program, Wallet } from "@project-serum/anchor";
import { RepayRoyaltiesContract } from "../target/types/repay_royalties_contract";
import { Metaplex } from "@metaplex-foundation/js";
import { readFileSync } from "fs";

import {
  createRepayRoyaltiesInstruction,
  NftState,
  PROGRAM_ID,
} from "../sdk/generated";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("repay_royalties_contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .RepayRoyaltiesContract as Program<RepayRoyaltiesContract>;

  const { Transaction, PublicKey, Keypair } = anchor.web3;
  const { connection } = program.provider;

  const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.KP)));
  const wallet = new Wallet(kp);

  it("Is initialized!", async () => {
    // NFTs
    const mintListRaw = readFileSync(
      "./3AVVU8NE28yhpZwrLv615kEP28i8t4buLfocAhhR7qQ5_mint_accounts.json",
      { encoding: "utf-8" }
    );
    const mintList: Array<string> = JSON.parse(mintListRaw);
    const mintListPubkeys = mintList.map((mint: string) => new PublicKey(mint));

    const metaplex = new Metaplex(connection);

    const nfts = await metaplex
      .nfts()
      .findAllByMintList({ mints: mintListPubkeys });

    const testNFT = nfts[2];

    // const testNFT = await metaplex.nfts().findByMint({ mintAddress: new PublicKey("J9MGK8Lns8qiFRLRPb2RhPQn5kfLWzbqXsdNaHTWw61K") })

    console.log(testNFT);

    const creators = testNFT.creators;
    const remainingAccounts = [];
    creators.forEach((creator) => {
      remainingAccounts.push({
        pubkey: creator.address,
        isWritable: true,
        isSigner: false,
      });
    });

    // Program action

    const [nftStateAddress] = PublicKey.findProgramAddressSync(
      // @ts-ignore
      [Buffer.from("nft-state"), testNFT.mintAddress.toBuffer()], //  testNFT.mint.address.toBuffer()
      PROGRAM_ID
    );

    const tryGetAccount = async () => {
      try {
        return await NftState.fromAccountAddress(connection, nftStateAddress);
      } catch (error) {
        return null;
      }
    };

    let nftStateAccount = await tryGetAccount();

    console.log(nftStateAccount);

    const tx = new Transaction();

    tx.add(
      createRepayRoyaltiesInstruction(
        {
          nftState: nftStateAddress,
          // @ts-ignore
          nftMint: testNFT.mintAddress, // testNFT.mint.address,
          nftMintMetadata: testNFT.address, // testNFT.metadataAddress,
          user: kp.publicKey,
          anchorRemainingAccounts: remainingAccounts,
        },
        {
          latestSaleLamports: 0.5 * LAMPORTS_PER_SOL,
        }
      )
    );

    const blockhash = await connection.getLatestBlockhash();

    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = blockhash.blockhash;
    await wallet.signTransaction(tx);

    const sig = await connection.sendRawTransaction(tx.serialize());
    console.log(sig);

    const confirmation = await connection.confirmTransaction({
      signature: sig,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    });

    confirmation.value.err !== null &&
      console.log(confirmation.value.err.toString());

    nftStateAccount = await tryGetAccount();

    console.log(nftStateAccount);
  });
});
