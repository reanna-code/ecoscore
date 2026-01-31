use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::program::invoke_signed;

declare_id!("Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv");

// =============================================================================
// CONSTANTS
// =============================================================================

/// Maximum number of NGOs that can be whitelisted
const MAX_NGOS: usize = 50;

/// Maximum number of sponsors that can be registered
const MAX_SPONSORS: usize = 50;

/// Maximum NGOs per batch (to fit in transaction size limits)
const MAX_BATCH_SIZE: usize = 10;

/// Minimum points required for a pledge (500 points = $5)
const MIN_PLEDGE_POINTS: u64 = 500;

/// Conversion rate: 100 points = $1 ≈ 0.01 SOL (at $100/SOL)
/// 1000 points = 0.1 SOL = 100_000_000 lamports
const LAMPORTS_PER_1000_POINTS: u64 = 100_000_000;

/// Seeds for PDA derivation (v2 for fresh devnet deployment)
const ESCROW_SEED: &[u8] = b"escrow_v2";
const CONFIG_SEED: &[u8] = b"config_v2";
const NGO_REGISTRY_SEED: &[u8] = b"ngo_registry_v2";
const SPONSOR_REGISTRY_SEED: &[u8] = b"sponsor_registry_v2";

// =============================================================================
// PROGRAM INSTRUCTIONS
// =============================================================================

#[program]
pub mod ecoscore_donation {
    use super::*;

    /// Initialize the escrow system
    ///
    /// This creates:
    /// - A Config account to store admin and totals
    /// - An NGO Registry to track whitelisted recipients
    /// - A Sponsor Registry to track verified brand partners
    /// - An Escrow Vault PDA to hold funds
    ///
    /// Only needs to be called once when setting up the system.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.total_deposited = 0;
        config.total_disbursed = 0;
        config.total_points_redeemed = 0;
        config.last_batch_week = 0;
        config.bump = ctx.bumps.config;
        config.vault_bump = ctx.bumps.escrow_vault;

        let ngo_registry = &mut ctx.accounts.ngo_registry;
        ngo_registry.ngos = Vec::new();
        ngo_registry.bump = ctx.bumps.ngo_registry;

        let sponsor_registry = &mut ctx.accounts.sponsor_registry;
        sponsor_registry.sponsors = Vec::new();
        sponsor_registry.bump = ctx.bumps.sponsor_registry;

        emit!(InitializeEvent {
            admin: ctx.accounts.admin.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Ecoscore escrow initialized. Admin: {}", ctx.accounts.admin.key());
        Ok(())
    }

    /// Deposit SOL into the escrow vault
    ///
    /// Any sponsor (brand partner) can deposit funds.
    /// Funds are held in the vault PDA until disbursed to NGOs.
    /// If the sponsor is registered, their totals are updated.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, EscrowError::InvalidAmount);

        // Transfer SOL from sponsor to escrow vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.sponsor.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        // Update config totals
        let config = &mut ctx.accounts.config;
        config.total_deposited = config
            .total_deposited
            .checked_add(amount)
            .ok_or(EscrowError::Overflow)?;

        // Update sponsor totals if registered
        let sponsor_registry = &mut ctx.accounts.sponsor_registry;
        let sponsor_pubkey = ctx.accounts.sponsor.key();
        let sponsor_name = if let Some(sponsor) = sponsor_registry
            .sponsors
            .iter_mut()
            .find(|s| s.pubkey == sponsor_pubkey)
        {
            sponsor.total_deposited = sponsor
                .total_deposited
                .checked_add(amount)
                .ok_or(EscrowError::Overflow)?;
            sponsor.deposit_count = sponsor
                .deposit_count
                .checked_add(1)
                .ok_or(EscrowError::Overflow)?;
            sponsor.last_deposit = Clock::get()?.unix_timestamp;
            Some(sponsor.name.clone())
        } else {
            None
        };

        emit!(DepositEvent {
            sponsor: sponsor_pubkey,
            sponsor_name,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "Deposit received: {} lamports from {}",
            amount,
            sponsor_pubkey
        );
        Ok(())
    }

    /// Register a sponsor (brand partner)
    ///
    /// Only the admin can register sponsors.
    /// Registered sponsors have their deposits tracked publicly.
    pub fn register_sponsor(ctx: Context<RegisterSponsor>, sponsor_pubkey: Pubkey, name: String) -> Result<()> {
        let sponsor_registry = &mut ctx.accounts.sponsor_registry;

        // Check if sponsor already exists
        require!(
            !sponsor_registry.sponsors.iter().any(|s| s.pubkey == sponsor_pubkey),
            EscrowError::SponsorAlreadyExists
        );

        // Check capacity
        require!(
            sponsor_registry.sponsors.len() < MAX_SPONSORS,
            EscrowError::SponsorRegistryFull
        );

        // Validate name length
        require!(name.len() <= 64, EscrowError::NameTooLong);

        sponsor_registry.sponsors.push(SponsorEntry {
            pubkey: sponsor_pubkey,
            name: name.clone(),
            total_deposited: 0,
            deposit_count: 0,
            last_deposit: 0,
            is_verified: true,
        });

        emit!(SponsorRegisteredEvent {
            sponsor: sponsor_pubkey,
            name,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Sponsor registered: {}", sponsor_pubkey);
        Ok(())
    }

    /// Remove a sponsor from verified status
    ///
    /// Only the admin can unverify sponsors.
    /// Unverified sponsors can still deposit but won't show as verified partners.
    pub fn remove_sponsor(ctx: Context<RemoveSponsor>, sponsor_pubkey: Pubkey) -> Result<()> {
        let sponsor_registry = &mut ctx.accounts.sponsor_registry;

        let sponsor = sponsor_registry
            .sponsors
            .iter_mut()
            .find(|s| s.pubkey == sponsor_pubkey)
            .ok_or(EscrowError::SponsorNotFound)?;

        sponsor.is_verified = false;

        emit!(SponsorRemovedEvent {
            sponsor: sponsor_pubkey,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Sponsor unverified: {}", sponsor_pubkey);
        Ok(())
    }

    /// Add an NGO to the whitelist
    ///
    /// Only the admin can add NGOs.
    /// NGOs must be whitelisted before they can receive disbursements.
    pub fn add_ngo(ctx: Context<AddNgo>, ngo_pubkey: Pubkey, name: String) -> Result<()> {
        let ngo_registry = &mut ctx.accounts.ngo_registry;

        // Check if NGO already exists
        require!(
            !ngo_registry.ngos.iter().any(|n| n.pubkey == ngo_pubkey),
            EscrowError::NgoAlreadyExists
        );

        // Check capacity
        require!(
            ngo_registry.ngos.len() < MAX_NGOS,
            EscrowError::NgoRegistryFull
        );

        // Validate name length
        require!(name.len() <= 64, EscrowError::NameTooLong);

        ngo_registry.ngos.push(NgoEntry {
            pubkey: ngo_pubkey,
            name: name.clone(),
            total_received: 0,
            is_active: true,
        });

        emit!(NgoAddedEvent {
            ngo: ngo_pubkey,
            name,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("NGO added to whitelist: {}", ngo_pubkey);
        Ok(())
    }

    /// Remove an NGO from active status
    ///
    /// Only the admin can deactivate NGOs.
    /// Deactivated NGOs cannot receive new disbursements.
    pub fn remove_ngo(ctx: Context<RemoveNgo>, ngo_pubkey: Pubkey) -> Result<()> {
        let ngo_registry = &mut ctx.accounts.ngo_registry;

        let ngo = ngo_registry
            .ngos
            .iter_mut()
            .find(|n| n.pubkey == ngo_pubkey)
            .ok_or(EscrowError::NgoNotFound)?;

        ngo.is_active = false;

        emit!(NgoRemovedEvent {
            ngo: ngo_pubkey,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("NGO deactivated: {}", ngo_pubkey);
        Ok(())
    }

    /// Disburse funds from the escrow vault to a whitelisted NGO (single)
    ///
    /// Only the admin can trigger disbursements.
    /// The NGO must be active in the whitelist.
    /// Emits a verifiable on-chain receipt with optional memo.
    pub fn disburse(ctx: Context<Disburse>, amount: u64, memo: String) -> Result<()> {
        require!(amount > 0, EscrowError::InvalidAmount);
        require!(memo.len() <= 256, EscrowError::MemoTooLong);

        let ngo_registry = &mut ctx.accounts.ngo_registry;
        let ngo_pubkey = ctx.accounts.ngo.key();

        // Find and validate NGO
        let ngo = ngo_registry
            .ngos
            .iter_mut()
            .find(|n| n.pubkey == ngo_pubkey)
            .ok_or(EscrowError::NgoNotFound)?;

        require!(ngo.is_active, EscrowError::NgoNotActive);

        // Check vault has sufficient funds
        let vault_balance = ctx.accounts.escrow_vault.lamports();
        require!(vault_balance >= amount, EscrowError::InsufficientFunds);

        // Transfer from vault PDA to NGO using invoke_signed
        let vault_bump = ctx.accounts.config.vault_bump;
        let seeds = &[ESCROW_SEED, &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.escrow_vault.key(),
                &ctx.accounts.ngo.key(),
                amount,
            ),
            &[
                ctx.accounts.escrow_vault.to_account_info(),
                ctx.accounts.ngo.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        // Update totals
        ngo.total_received = ngo
            .total_received
            .checked_add(amount)
            .ok_or(EscrowError::Overflow)?;

        let config = &mut ctx.accounts.config;
        config.total_disbursed = config
            .total_disbursed
            .checked_add(amount)
            .ok_or(EscrowError::Overflow)?;

        emit!(DisburseEvent {
            ngo: ngo_pubkey,
            amount,
            memo,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Disbursed {} lamports to NGO: {}", amount, ngo_pubkey);
        Ok(())
    }

    /// Batch disburse funds to multiple NGOs based on user pledges
    ///
    /// This is the weekly batch operation that:
    /// 1. Takes aggregated pledge data from off-chain
    /// 2. Applies pro-rata scaling if pledges exceed vault balance
    /// 3. Transfers to all NGOs in one transaction
    /// 4. Emits a comprehensive receipt for verification
    ///
    /// NGO accounts must be passed as remaining_accounts in the same order as allocations.
    pub fn batch_disburse<'info>(
        ctx: Context<'_, '_, 'info, 'info, BatchDisburse<'info>>,
        week_id: u64,
        allocations: Vec<BatchAllocation>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let ngo_registry = &mut ctx.accounts.ngo_registry;

        // Validate week_id hasn't been processed
        require!(
            week_id > config.last_batch_week,
            EscrowError::WeekAlreadyProcessed
        );

        // Validate batch size
        require!(
            allocations.len() <= MAX_BATCH_SIZE,
            EscrowError::BatchTooLarge
        );
        require!(!allocations.is_empty(), EscrowError::EmptyBatch);

        // Validate remaining accounts match allocations
        require!(
            ctx.remaining_accounts.len() == allocations.len(),
            EscrowError::AccountMismatch
        );

        // Calculate total points pledged
        let total_points: u64 = allocations
            .iter()
            .map(|a| a.points_pledged)
            .try_fold(0u64, |acc, p| acc.checked_add(p))
            .ok_or(EscrowError::Overflow)?;

        require!(total_points > 0, EscrowError::InvalidAmount);

        // Calculate total lamports requested
        let total_lamports_requested = points_to_lamports(total_points)?;

        // Get vault balance
        let vault_balance = ctx.accounts.escrow_vault.lamports();

        // Calculate pro-rata multiplier if vault is underfunded
        // We use basis points (10000 = 100%) for precision
        let pro_rata_bps: u16 = if total_lamports_requested > vault_balance {
            // Pro-rata: everyone gets proportionally less
            (vault_balance
                .checked_mul(10000)
                .ok_or(EscrowError::Overflow)?
                .checked_div(total_lamports_requested)
                .ok_or(EscrowError::Overflow)?) as u16
        } else {
            10000u16 // 100%
        };

        // Prepare for transfers
        let vault_bump = config.vault_bump;
        let seeds = &[ESCROW_SEED, &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let mut disbursement_details: Vec<DisbursementDetail> = Vec::new();
        let mut total_disbursed_this_batch: u64 = 0;

        // Process each allocation
        for (i, allocation) in allocations.iter().enumerate() {
            let ngo_account = &ctx.remaining_accounts[i];

            // Validate NGO is in registry and active
            let ngo_entry = ngo_registry
                .ngos
                .iter_mut()
                .find(|n| n.pubkey == allocation.ngo)
                .ok_or(EscrowError::NgoNotFound)?;

            require!(ngo_entry.is_active, EscrowError::NgoNotActive);

            // Validate account matches allocation
            require!(
                ngo_account.key() == allocation.ngo,
                EscrowError::AccountMismatch
            );

            // Calculate actual amount (applying pro-rata if needed)
            let base_amount = points_to_lamports(allocation.points_pledged)?;
            let actual_amount = if pro_rata_bps < 10000 {
                base_amount
                    .checked_mul(pro_rata_bps as u64)
                    .ok_or(EscrowError::Overflow)?
                    .checked_div(10000)
                    .ok_or(EscrowError::Overflow)?
            } else {
                base_amount
            };

            if actual_amount > 0 {
                // Transfer to NGO
                invoke_signed(
                    &anchor_lang::solana_program::system_instruction::transfer(
                        &ctx.accounts.escrow_vault.key(),
                        &ngo_account.key(),
                        actual_amount,
                    ),
                    &[
                        ctx.accounts.escrow_vault.to_account_info(),
                        ngo_account.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ],
                    signer_seeds,
                )?;

                // Update NGO totals
                ngo_entry.total_received = ngo_entry
                    .total_received
                    .checked_add(actual_amount)
                    .ok_or(EscrowError::Overflow)?;

                total_disbursed_this_batch = total_disbursed_this_batch
                    .checked_add(actual_amount)
                    .ok_or(EscrowError::Overflow)?;

                disbursement_details.push(DisbursementDetail {
                    ngo: allocation.ngo,
                    points_pledged: allocation.points_pledged,
                    amount_disbursed: actual_amount,
                });

                msg!(
                    "Disbursed {} lamports to {} ({} points)",
                    actual_amount,
                    allocation.ngo,
                    allocation.points_pledged
                );
            }
        }

        // Update config totals
        config.total_disbursed = config
            .total_disbursed
            .checked_add(total_disbursed_this_batch)
            .ok_or(EscrowError::Overflow)?;

        config.total_points_redeemed = config
            .total_points_redeemed
            .checked_add(total_points)
            .ok_or(EscrowError::Overflow)?;

        config.last_batch_week = week_id;

        // Emit comprehensive batch event
        emit!(BatchDisburseEvent {
            week_id,
            total_points_pledged: total_points,
            total_amount_requested: total_lamports_requested,
            total_amount_disbursed: total_disbursed_this_batch,
            pro_rata_bps,
            num_ngos: allocations.len() as u8,
            disbursements: disbursement_details,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "Batch disbursement complete: {} lamports to {} NGOs (week {})",
            total_disbursed_this_batch,
            allocations.len(),
            week_id
        );

        Ok(())
    }

    /// Get the current escrow status (view function via simulation)
    pub fn get_status(ctx: Context<GetStatus>) -> Result<()> {
        let config = &ctx.accounts.config;
        let vault_balance = ctx.accounts.escrow_vault.lamports();

        msg!("=== Ecoscore Escrow Status ===");
        msg!("Admin: {}", config.admin);
        msg!("Total Deposited: {} lamports", config.total_deposited);
        msg!("Total Disbursed: {} lamports", config.total_disbursed);
        msg!("Total Points Redeemed: {}", config.total_points_redeemed);
        msg!("Last Batch Week: {}", config.last_batch_week);
        msg!("Current Vault Balance: {} lamports", vault_balance);

        Ok(())
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/// Convert points to lamports using the fixed conversion rate
fn points_to_lamports(points: u64) -> Result<u64> {
    // 1000 points = LAMPORTS_PER_1000_POINTS lamports
    points
        .checked_mul(LAMPORTS_PER_1000_POINTS)
        .ok_or(EscrowError::Overflow.into())
        .map(|v| v / 1000)
}

// =============================================================================
// ACCOUNT STRUCTURES
// =============================================================================

/// Configuration account storing admin and totals
#[account]
#[derive(InitSpace)]
pub struct Config {
    /// The admin who can add NGOs and trigger disbursements
    pub admin: Pubkey,
    /// Total lamports deposited by all sponsors
    pub total_deposited: u64,
    /// Total lamports disbursed to all NGOs
    pub total_disbursed: u64,
    /// Total points redeemed by users across all batches
    pub total_points_redeemed: u64,
    /// Last processed batch week (YYYYWW format, e.g., 202605)
    pub last_batch_week: u64,
    /// Bump seed for this PDA
    pub bump: u8,
    /// Bump seed for the vault PDA
    pub vault_bump: u8,
}

/// Entry for a single NGO in the registry
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct NgoEntry {
    /// The NGO's wallet address
    pub pubkey: Pubkey,
    /// Human-readable name (max 64 chars)
    #[max_len(64)]
    pub name: String,
    /// Total lamports received by this NGO
    pub total_received: u64,
    /// Whether this NGO can receive disbursements
    pub is_active: bool,
}

/// Registry of all whitelisted NGOs
#[account]
pub struct NgoRegistry {
    /// List of all registered NGOs
    pub ngos: Vec<NgoEntry>,
    /// Bump seed for this PDA
    pub bump: u8,
}

impl NgoRegistry {
    pub const SPACE: usize = 8  // discriminator
        + 4  // Vec length prefix
        + (MAX_NGOS * (32 + 4 + 64 + 8 + 1))  // MAX_NGOS * NgoEntry size
        + 1; // bump
}

/// Entry for a single sponsor (brand partner) in the registry
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct SponsorEntry {
    /// The sponsor's wallet address
    pub pubkey: Pubkey,
    /// Human-readable brand name (max 64 chars)
    #[max_len(64)]
    pub name: String,
    /// Total lamports deposited by this sponsor
    pub total_deposited: u64,
    /// Number of deposits made
    pub deposit_count: u32,
    /// Timestamp of last deposit
    pub last_deposit: i64,
    /// Whether this sponsor is a verified partner
    pub is_verified: bool,
}

/// Registry of all registered sponsors (brand partners)
#[account]
pub struct SponsorRegistry {
    /// List of all registered sponsors
    pub sponsors: Vec<SponsorEntry>,
    /// Bump seed for this PDA
    pub bump: u8,
}

impl SponsorRegistry {
    pub const SPACE: usize = 8  // discriminator
        + 4  // Vec length prefix
        + (MAX_SPONSORS * (32 + 4 + 64 + 8 + 4 + 8 + 1))  // MAX_SPONSORS * SponsorEntry size
        + 1; // bump
}

/// Allocation for a single NGO in a batch disbursement
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BatchAllocation {
    /// NGO wallet address
    pub ngo: Pubkey,
    /// Total points pledged to this NGO this week
    pub points_pledged: u64,
}

/// Detail of a single disbursement within a batch (for events)
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DisbursementDetail {
    /// NGO wallet address
    pub ngo: Pubkey,
    /// Points pledged by users
    pub points_pledged: u64,
    /// Actual lamports sent (may be less due to pro-rata)
    pub amount_disbursed: u64,
}

// =============================================================================
// INSTRUCTION CONTEXTS (Account Validation)
// =============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The admin who will control the escrow
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Config account storing escrow settings
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    /// Registry of whitelisted NGOs
    #[account(
        init,
        payer = admin,
        space = NgoRegistry::SPACE,
        seeds = [NGO_REGISTRY_SEED],
        bump
    )]
    pub ngo_registry: Account<'info, NgoRegistry>,

    /// Registry of verified sponsors (brand partners)
    #[account(
        init,
        payer = admin,
        space = SponsorRegistry::SPACE,
        seeds = [SPONSOR_REGISTRY_SEED],
        bump
    )]
    pub sponsor_registry: Account<'info, SponsorRegistry>,

    /// The escrow vault PDA that holds deposited funds
    /// CHECK: This is a PDA that will hold SOL, validated by seeds
    #[account(
        mut,
        seeds = [ESCROW_SEED],
        bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    /// The sponsor depositing funds
    #[account(mut)]
    pub sponsor: Signer<'info>,

    /// Config account to update totals
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Sponsor registry to update sponsor totals
    #[account(
        mut,
        seeds = [SPONSOR_REGISTRY_SEED],
        bump = sponsor_registry.bump
    )]
    pub sponsor_registry: Account<'info, SponsorRegistry>,

    /// The escrow vault receiving the deposit
    /// CHECK: Validated by seeds
    #[account(
        mut,
        seeds = [ESCROW_SEED],
        bump = config.vault_bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterSponsor<'info> {
    /// Only the admin can register sponsors
    #[account(
        mut,
        constraint = admin.key() == config.admin @ EscrowError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Config to verify admin
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Sponsor registry to update
    #[account(
        mut,
        seeds = [SPONSOR_REGISTRY_SEED],
        bump = sponsor_registry.bump
    )]
    pub sponsor_registry: Account<'info, SponsorRegistry>,
}

#[derive(Accounts)]
pub struct RemoveSponsor<'info> {
    /// Only the admin can remove sponsors
    #[account(
        mut,
        constraint = admin.key() == config.admin @ EscrowError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Config to verify admin
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Sponsor registry to update
    #[account(
        mut,
        seeds = [SPONSOR_REGISTRY_SEED],
        bump = sponsor_registry.bump
    )]
    pub sponsor_registry: Account<'info, SponsorRegistry>,
}

#[derive(Accounts)]
pub struct AddNgo<'info> {
    /// Only the admin can add NGOs
    #[account(
        mut,
        constraint = admin.key() == config.admin @ EscrowError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Config to verify admin
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// NGO registry to update
    #[account(
        mut,
        seeds = [NGO_REGISTRY_SEED],
        bump = ngo_registry.bump
    )]
    pub ngo_registry: Account<'info, NgoRegistry>,
}

#[derive(Accounts)]
pub struct RemoveNgo<'info> {
    /// Only the admin can remove NGOs
    #[account(
        mut,
        constraint = admin.key() == config.admin @ EscrowError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Config to verify admin
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// NGO registry to update
    #[account(
        mut,
        seeds = [NGO_REGISTRY_SEED],
        bump = ngo_registry.bump
    )]
    pub ngo_registry: Account<'info, NgoRegistry>,
}

#[derive(Accounts)]
pub struct Disburse<'info> {
    /// Only the admin can disburse
    #[account(
        mut,
        constraint = admin.key() == config.admin @ EscrowError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Config to verify admin and update totals
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// NGO registry to verify recipient
    #[account(
        mut,
        seeds = [NGO_REGISTRY_SEED],
        bump = ngo_registry.bump
    )]
    pub ngo_registry: Account<'info, NgoRegistry>,

    /// The escrow vault sending funds
    /// CHECK: Validated by seeds
    #[account(
        mut,
        seeds = [ESCROW_SEED],
        bump = config.vault_bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    /// The NGO receiving the disbursement
    /// CHECK: Validated against ngo_registry in instruction
    #[account(mut)]
    pub ngo: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BatchDisburse<'info> {
    /// Only the admin can trigger batch disbursements
    #[account(
        mut,
        constraint = admin.key() == config.admin @ EscrowError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Config to verify admin, update totals, and track batch week
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// NGO registry to verify all recipients
    #[account(
        mut,
        seeds = [NGO_REGISTRY_SEED],
        bump = ngo_registry.bump
    )]
    pub ngo_registry: Account<'info, NgoRegistry>,

    /// The escrow vault sending funds
    /// CHECK: Validated by seeds
    #[account(
        mut,
        seeds = [ESCROW_SEED],
        bump = config.vault_bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
    // NGO accounts are passed as remaining_accounts
}

#[derive(Accounts)]
pub struct GetStatus<'info> {
    /// Config to read totals
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Vault to check balance
    /// CHECK: Validated by seeds
    #[account(
        seeds = [ESCROW_SEED],
        bump = config.vault_bump
    )]
    pub escrow_vault: SystemAccount<'info>,
}

// =============================================================================
// EVENTS (Emitted for off-chain indexing and verification)
// =============================================================================

#[event]
pub struct InitializeEvent {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DepositEvent {
    pub sponsor: Pubkey,
    pub sponsor_name: Option<String>,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct SponsorRegisteredEvent {
    pub sponsor: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[event]
pub struct SponsorRemovedEvent {
    pub sponsor: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct NgoAddedEvent {
    pub ngo: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[event]
pub struct NgoRemovedEvent {
    pub ngo: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DisburseEvent {
    pub ngo: Pubkey,
    pub amount: u64,
    pub memo: String,
    pub timestamp: i64,
}

#[event]
pub struct BatchDisburseEvent {
    /// Week identifier (e.g., 202605 for week 5 of 2026)
    pub week_id: u64,
    /// Total points pledged by all users this week
    pub total_points_pledged: u64,
    /// Total lamports that would be sent at full value
    pub total_amount_requested: u64,
    /// Actual lamports sent (may be less if pro-rata applied)
    pub total_amount_disbursed: u64,
    /// Pro-rata percentage in basis points (10000 = 100%)
    pub pro_rata_bps: u16,
    /// Number of NGOs receiving funds
    pub num_ngos: u8,
    /// Detailed breakdown per NGO
    pub disbursements: Vec<DisbursementDetail>,
    pub timestamp: i64,
}

// =============================================================================
// ERRORS
// =============================================================================

#[error_code]
pub enum EscrowError {
    #[msg("Only the admin can perform this action")]
    Unauthorized,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("NGO is not in the whitelist")]
    NgoNotFound,
    #[msg("NGO is already in the whitelist")]
    NgoAlreadyExists,
    #[msg("NGO has been deactivated")]
    NgoNotActive,
    #[msg("NGO registry is at maximum capacity")]
    NgoRegistryFull,
    #[msg("Insufficient funds in escrow vault")]
    InsufficientFunds,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("NGO name exceeds maximum length (64 characters)")]
    NameTooLong,
    #[msg("Memo exceeds maximum length (256 characters)")]
    MemoTooLong,
    #[msg("This week has already been processed")]
    WeekAlreadyProcessed,
    #[msg("Batch exceeds maximum size of 10 NGOs")]
    BatchTooLarge,
    #[msg("Batch cannot be empty")]
    EmptyBatch,
    #[msg("Account list does not match allocation list")]
    AccountMismatch,
    #[msg("Sponsor is not in the registry")]
    SponsorNotFound,
    #[msg("Sponsor is already in the registry")]
    SponsorAlreadyExists,
    #[msg("Sponsor registry is at maximum capacity")]
    SponsorRegistryFull,
}
