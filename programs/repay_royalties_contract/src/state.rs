use anchor_lang::{
    prelude::*,
    solana_program::{program_memory::sol_memcmp, pubkey::PUBKEY_BYTES}
};
use crate::errors::ErrorCode;

pub const NFT_STATE_SIZE: usize = 8 + 32 + 16;
pub const NFT_STATE_PREFIX: &str = "nft-state";

#[account]
pub struct NftState {
    pub mint: Pubkey,
    pub repay_timestamp: i64
}

pub fn assert_keys_equal(key1: Pubkey, key2: Pubkey) -> Result<()> {
    if sol_memcmp(key1.as_ref(), key2.as_ref(), PUBKEY_BYTES) != 0 {
        return Err(error!(ErrorCode::PublickeyMissmatch))
    } else {
        Ok(())
    }
}