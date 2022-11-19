use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("No Mint Metadata")]
    NoMintMetadata,
    #[msg("Publickey Missmatch")]
    PublickeyMissmatch
}