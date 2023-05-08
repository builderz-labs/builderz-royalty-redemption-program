require("dotenv").config();
import * as anchor from "@project-serum/anchor";
import { Program, Wallet } from "@project-serum/anchor";
import { RepayRoyaltiesContract } from "../target/types/repay_royalties_contract";
import { Metaplex } from "@metaplex-foundation/js";
import { readFileSync } from "fs";

import { createRepayRoyaltiesInstruction, NftState, PROGRAM_ID } from "../sdk/";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import {
  ROYALTY_REDEMPTIONS_PROGRAM_ID,
  redeemRoyalties,
} from "../clients/js/royalty-redemptions/src";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  some,
  publicKey,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { findMetadataPda } from "@metaplex-foundation/mpl-token-metadata";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { createRedeemRoyaltiesInstruction } from "../sdk-repay-royalties/src/generated";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";

describe("repay_royalties_contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .RepayRoyaltiesContract as Program<RepayRoyaltiesContract>;

  const { Transaction, PublicKey, Keypair } = anchor.web3;
  const { connection } = program.provider;

  const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.KP)));
  const wallet = new Wallet(kp);

  // it("Is initialized!", async () => {
  //   // NFTs
  //   const mintListRaw = readFileSync(
  //     "./3AVVU8NE28yhpZwrLv615kEP28i8t4buLfocAhhR7qQ5_mint_accounts.json",
  //     { encoding: "utf-8" }
  //   );
  //   const mintList: Array<string> = JSON.parse(mintListRaw);
  //   const mintListPubkeys = mintList.map((mint: string) => new PublicKey(mint));

  //   const metaplex = new Metaplex(connection);

  //   const nfts = await metaplex
  //     .nfts()
  //     .findAllByMintList({ mints: mintListPubkeys });

  //   const testNFT = nfts[2];

  //   // const testNFT = await metaplex.nfts().findByMint({ mintAddress: new PublicKey("J9MGK8Lns8qiFRLRPb2RhPQn5kfLWzbqXsdNaHTWw61K") })

  //   console.log(testNFT);

  //   const creators = testNFT.creators;
  //   const remainingAccounts = [];
  //   creators.forEach((creator) => {
  //     remainingAccounts.push({
  //       pubkey: creator.address,
  //       isWritable: true,
  //       isSigner: false,
  //     });
  //   });

  //   // Program action

  //   const [nftStateAddress] = PublicKey.findProgramAddressSync(
  //     // @ts-ignore
  //     [Buffer.from("nft-state"), testNFT.mintAddress.toBuffer()], //  testNFT.mint.address.toBuffer()
  //     PROGRAM_ID
  //   );

  //   const tryGetAccount = async () => {
  //     try {
  //       return await NftState.fromAccountAddress(connection, nftStateAddress);
  //     } catch (error) {
  //       return null;
  //     }
  //   };

  //   let nftStateAccount = await tryGetAccount();

  //   console.log(nftStateAccount);

  //   const tx = new Transaction();

  //   tx.add(
  //     createRepayRoyaltiesInstruction(
  //       {
  //         nftState: nftStateAddress,
  //         // @ts-ignore
  //         nftMint: testNFT.mintAddress, // testNFT.mint.address,
  //         nftMintMetadata: testNFT.address, // testNFT.metadataAddress,
  //         user: kp.publicKey,
  //         anchorRemainingAccounts: remainingAccounts,
  //       },
  //       {
  //         royaltiesToPay: 0.5 * LAMPORTS_PER_SOL,
  //       }
  //     )
  //   );

  //   const blockhash = await connection.getLatestBlockhash();

  //   tx.feePayer = kp.publicKey;
  //   tx.recentBlockhash = blockhash.blockhash;
  //   await wallet.signTransaction(tx);

  //   const sig = await connection.sendRawTransaction(tx.serialize());
  //   console.log(sig);

  //   const confirmation = await connection.confirmTransaction({
  //     signature: sig,
  //     blockhash: blockhash.blockhash,
  //     lastValidBlockHeight: blockhash.lastValidBlockHeight,
  //   });

  //   confirmation.value.err !== null &&
  //     console.log(confirmation.value.err.toString());

  //   nftStateAccount = await tryGetAccount();

  //   console.log(nftStateAccount);
  // });

  it("Is redeemed!", async () => {
    // With Kinobi & UMI

    const umi = createUmi(
      "https://helius-rpc-proxy-devnet.builderzlabs.workers.dev"
    );

    const kp = umi.eddsa.createKeypairFromSecretKey(
      Uint8Array.from(JSON.parse(process.env.KP))
    );

    umi.use(keypairIdentity(kp));

    // NFT
    const metaplex = new Metaplex(connection);

    const nftMint = publicKey("FBsoTgEeDmcftgoa9fwQ8pxxai4KYAAq7YEsjgYsjZRf");
    const nft = await metaplex
      .nfts()
      .findByMint({ mintAddress: toWeb3JsPublicKey(nftMint) });
    console.log(nft);

    const creators = nft.creators;
    const remainingAccounts = [];
    creators.forEach((creator) => {
      remainingAccounts.push({
        pubkey: creator.address,
        isWritable: true,
        isSigner: false,
      });
    });

    const nftMintMetadata = findMetadataPda(umi, { mint: nftMint });

    const redemptionPda = umi.eddsa.findPda(ROYALTY_REDEMPTIONS_PROGRAM_ID, [
      umi.serializer.string({ size: "variable" }).serialize("redemption"),
      umi.serializer.publicKey().serialize(nftMint),
    ]);

    const signatureString =
      "45Wi51ZBxQ25EQzQR3FHq7NQ81mEuxhvzKsnGYDcCQbdiamGZCMmYkeeNyFHd2UkL9DkwuikFDedjNYvCffVcJHC";
    const encodedTxSig = Uint8Array.from(bs58.decode(signatureString));

    // const tx = transactionBuilder().add(
    //   redeemRoyalties(umi, {
    //     redemption: redemptionPda,
    //     nftMint,
    //     nftMintMetadata,
    //     user: umi.identity,
    //     amount: 0.5 * LAMPORTS_PER_SOL,
    //     saleSig: some(encodedTxSig),
    //   })
    // );

    // Old sdk

    const tx = new Transaction().add(
      createRedeemRoyaltiesInstruction(
        {
          redemption: toWeb3JsPublicKey(redemptionPda),
          nftMint: toWeb3JsPublicKey(nftMint),
          nftMintMetadata: toWeb3JsPublicKey(nftMintMetadata),
          user: toWeb3JsPublicKey(kp.publicKey),
          anchorRemainingAccounts: remainingAccounts,
        },
        {
          ix: {
            amount: 0.5 * LAMPORTS_PER_SOL,
            saleSig: Array.from(encodedTxSig),
          },
        }
      )
    );

    try {
      // const res = await tx.sendAndConfirm(umi, {
      //   confirm: { commitment: "confirmed" },
      //   send: { skipPreflight: true },
      // });
      // console.log(bs58.encode(res.signature));

      // Old sdk

      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;
      tx.feePayer = toWeb3JsPublicKey(kp.publicKey);
      await wallet.signTransaction(tx);

      const sig = await connection.sendRawTransaction(tx.serialize(), {
        // skipPreflight: true,
      });

      console.log(sig);
    } catch (error) {
      console.log(error);
    }
  });
});
