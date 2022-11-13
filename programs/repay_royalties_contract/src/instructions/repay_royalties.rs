use {
    anchor_lang::{prelude::*, solana_program::{program::invoke, system_instruction::transfer}},
    crate::{state::*, errors::ErrorCode},
    anchor_spl::token::Mint,
    mpl_token_metadata::state::{Metadata, TokenMetadataAccount},
};

#[derive(Accounts)]
pub struct RepayRoyaltiesCtx<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = NFT_STATE_SIZE,
        seeds = [NFT_STATE_PREFIX.as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    nft_state: Account<'info, NftState>,
    nft_mint: Account<'info, Mint>,
    /// CHECK: We're not reading or writing from this file
    nft_mint_metadata: AccountInfo<'info>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, RepayRoyaltiesCtx<'info>>, latest_sale_lamports: u64) -> Result<()> {
    let nft_state = &mut ctx.accounts.nft_state;
    
    nft_state.bump = *ctx.bumps.get(NFT_STATE_PREFIX).unwrap();
    nft_state.mint = ctx.accounts.nft_mint.key();

    if ctx.accounts.nft_mint_metadata.data_is_empty() {
        return Err(error!(ErrorCode::NoMintMetadata))
    }

    let nft_mint_metadata = Metadata::from_account_info(&ctx.accounts.nft_mint_metadata.to_account_info())?;

    let creators = nft_mint_metadata.data.creators.unwrap();
    let sfbp = nft_mint_metadata.data.seller_fee_basis_points;

    let repay_amount = latest_sale_lamports
        .checked_mul(sfbp.into())
        .unwrap()
        .checked_div(10000)
        .unwrap();

    let remaining_accounts = &mut ctx.remaining_accounts.iter();

    for creator in creators {
        let pct = creator.share as u64;
        let creator_fee = pct
            .checked_mul(repay_amount)
            .unwrap()
            .checked_div(100)
            .unwrap();

        let current_creator_info = next_account_info(remaining_accounts)?;
        assert_keys_equal(creator.address, *current_creator_info.key)?;

        if creator_fee > 0 {
            invoke(&transfer(&ctx.accounts.user.key(), &current_creator_info.key(), creator_fee),
                &[
                ctx.accounts.user.to_account_info(),
                current_creator_info.clone(),
                ctx.accounts.system_program.to_account_info()
                ]
            )?;
        }
    }

    Ok(())
}