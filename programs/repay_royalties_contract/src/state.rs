use anchor_lang::{
    prelude::*,
    solana_program::{program_memory::sol_memcmp, pubkey::PUBKEY_BYTES},
};
use crate::errors::ErrorCode;

pub const NFT_STATE_SIZE: usize = 8 + 32 + 16;
pub const NFT_STATE_PREFIX: &str = "nft-state";

pub const REDEMPTION_SIZE: usize = 32 + 8 + 8 + 64 + 32 + 1 + 1;
pub const REDEMPTION_PREFIX: &str = "redemption";

#[account]
pub struct NftState {
    pub mint: Pubkey,
    pub repay_timestamp: i64
}

#[account]
pub struct Redemption {
    pub mint: Pubkey, // 32
    pub repay_timestamp: i64, // 8
    pub amount: u64, // 8
    pub sale_sig: Option<[u8; 64]>, // 64 + 1
    pub co_signer: Option<Pubkey>, // 32 + 1
}

pub fn assert_keys_equal(key1: Pubkey, key2: Pubkey) -> Result<()> {
    if sol_memcmp(key1.as_ref(), key2.as_ref(), PUBKEY_BYTES) != 0 {
        return Err(error!(ErrorCode::PublickeyMissmatch))
    } else {
        Ok(())
    }
}