pub mod instructions;
pub mod state;
pub mod errors;

use {anchor_lang::prelude::*, instructions::*};

declare_id!("9ZskGH9wtdwM9UXjBq1KDwuaLfrZyPChz41Hx7NWhTFf");

#[program]
pub mod repay_royalties_contract {
    use super::*;

    pub fn repay_royalties<'info>(ctx: Context<'_, '_, '_, 'info, RepayRoyaltiesCtx<'info>>, latest_sale_lamports: u64) -> Result<()> {
        repay_royalties::handler(ctx, latest_sale_lamports)
    }
}