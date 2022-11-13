require('dotenv').config()
import * as anchor from "@project-serum/anchor";
import { Program, Wallet } from "@project-serum/anchor";
import { RepayRoyaltiesContract } from "../target/types/repay_royalties_contract";
import { Metaplex } from "@metaplex-foundation/js"
import { readFileSync } from "fs";
 
import { createRepayRoyaltiesInstruction, NftState, PROGRAM_ID } from "../src/generated";

describe("repay_royalties_contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RepayRoyaltiesContract as Program<RepayRoyaltiesContract>;

  const { Transaction, PublicKey, Keypair } = anchor.web3;
  const { connection } = program.provider;

  const kp = Keypair.fromSecretKey(
      Uint8Array.from(
        JSON.parse(process.env.KP)
      )
  );
  const wallet = new Wallet(kp)

  it("Is initialized!", async () => {

    // NFTs
    const mintListRaw = readFileSync("./3AVVU8NE28yhpZwrLv615kEP28i8t4buLfocAhhR7qQ5_mint_accounts.json", { encoding: "utf-8" })
    const mintList: Array<string> = JSON.parse(mintListRaw);
    const mintListPubkeys = mintList.map((mint: string) => new PublicKey(mint));
    
    const metaplex = new Metaplex(connection);

    const nfts = await metaplex.nfts().findAllByMintList({ mints: mintListPubkeys });    

    const testNFT = nfts[0]

    const creators = testNFT.creators;
    const remainingAccounts = [];
    creators.forEach(creator => {
      remainingAccounts.push({
        pubkey: creator.address,
        isWritable: false,
        isSigner: false,
      })
    })
    console.log(remainingAccounts);
    
    
    // Program action

    const [nftStateAddress] = PublicKey.findProgramAddressSync(
      // @ts-ignore
      [Buffer.from("nft-state"), nfts[0].mintAddress.toBuffer()],
      PROGRAM_ID
    )
    
    const tryGetAccount = async() => {
      try {
        return await NftState.fromAccountAddress(connection, nftStateAddress)
      } catch (error) {
        return null
      }
    }

    let nftStateAccount = await tryGetAccount();

    console.log(nftStateAccount);
    
    const tx = new Transaction;

    tx.add(createRepayRoyaltiesInstruction({
      nftState: nftStateAddress,
      // @ts-ignore
      nftMint: testNFT.mintAddress,
      nftMintMetadata: testNFT.address,
      user: kp.publicKey,
      anchorRemainingAccounts: remainingAccounts,
    }, {
      latestSaleLamports: 100000
    }))

    const blockhash = await connection.getLatestBlockhash();

    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = blockhash.blockhash;
    wallet.signTransaction(tx);

    const sig = await connection.sendRawTransaction(tx.serialize());

    const confirmation = connection.confirmTransaction({
      signature: sig,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight
    });

    console.log(confirmation);

    nftStateAccount = await tryGetAccount();

    console.log(nftStateAccount);

  });
});
