import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import { executeTool } from '@/tools/index.js';
import type { EbaySellerApi } from '@/api/index.js';
import process from 'node:process';

describe('Comprehensive Tools Coverage', () => {
  let mockApi: EbaySellerApi;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    // Create comprehensive mock API
    mockApi = {
      marketing: {
        getCampaigns: vi.fn(),
        getCampaign: vi.fn(),
        pauseCampaign: vi.fn(),
        resumeCampaign: vi.fn(),
        endCampaign: vi.fn(),
        updateCampaignIdentification: vi.fn(),
        cloneCampaign: vi.fn(),
        getPromotions: vi.fn(),
      },
      setUserTokens: vi.fn(),
      getTokenInfo: vi.fn().mockReturnValue({
        hasUserToken: false,
        hasClientToken: true,
        accessTokenExpired: false,
        refreshTokenExpired: false,
      }),
      getAuthClient: vi.fn().mockReturnValue({
        getOAuthClient: vi.fn().mockReturnValue({
          clearAllTokens: vi.fn(),
          getAccessToken: vi.fn(),
        }),
      }),
    } as unknown as EbaySellerApi;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Marketing Tools', () => {
    it('ebay_get_campaigns', async () => {
      const mockResponse = { campaigns: [] };
      vi.mocked(mockApi.marketing.getCampaigns).mockReturnValue(Effect.succeed(mockResponse));
      const input = { campaignStatus: 'RUNNING' };
      await executeTool(mockApi, 'ebay_get_campaigns', input);
      expect(mockApi.marketing.getCampaigns).toHaveBeenCalledWith(input);
    });

    it('ebay_get_campaign', async () => {
      const mockResponse = { campaignId: 'CAMP123' };
      vi.mocked(mockApi.marketing.getCampaign).mockReturnValue(Effect.succeed(mockResponse));
      const input = { campaignId: 'CAMP123' };
      await executeTool(mockApi, 'ebay_get_campaign', input);
      expect(mockApi.marketing.getCampaign).toHaveBeenCalledWith(input);
    });

    it('ebay_pause_campaign', async () => {
      vi.mocked(mockApi.marketing.pauseCampaign).mockReturnValue(Effect.succeed(undefined));
      const input = { campaignId: 'CAMP123' };
      await executeTool(mockApi, 'ebay_pause_campaign', input);
      expect(mockApi.marketing.pauseCampaign).toHaveBeenCalledWith(input);
    });

    it('ebay_resume_campaign', async () => {
      vi.mocked(mockApi.marketing.resumeCampaign).mockReturnValue(Effect.succeed(undefined));
      const input = { campaignId: 'CAMP123' };
      await executeTool(mockApi, 'ebay_resume_campaign', input);
      expect(mockApi.marketing.resumeCampaign).toHaveBeenCalledWith(input);
    });

    it('ebay_end_campaign', async () => {
      vi.mocked(mockApi.marketing.endCampaign).mockReturnValue(Effect.succeed(undefined));
      const input = { campaignId: 'CAMP123' };
      await executeTool(mockApi, 'ebay_end_campaign', input);
      expect(mockApi.marketing.endCampaign).toHaveBeenCalledWith(input);
    });

    it('ebay_update_campaign_identification', async () => {
      vi.mocked(mockApi.marketing.updateCampaignIdentification).mockReturnValue(
        Effect.succeed(undefined),
      );
      const request = { campaignName: 'Updated' };
      const input = {
        campaignId: 'CAMP123',
        request,
      };
      await executeTool(mockApi, 'ebay_update_campaign_identification', input);
      expect(mockApi.marketing.updateCampaignIdentification).toHaveBeenCalledWith(input);
    });

    it('ebay_clone_campaign', async () => {
      const request = { campaignName: 'Cloned' };
      vi.mocked(mockApi.marketing.cloneCampaign).mockReturnValue(Effect.succeed({}));
      const input = {
        campaignId: 'CAMP123',
        request,
      };
      await executeTool(mockApi, 'ebay_clone_campaign', input);
      expect(mockApi.marketing.cloneCampaign).toHaveBeenCalledWith(input);
    });

    it('ebay_get_promotions', async () => {
      const mockResponse = { promotions: [] };
      vi.mocked(mockApi.marketing.getPromotions).mockReturnValue(Effect.succeed(mockResponse));
      const input = {
        marketplaceId: 'EBAY_US',
        limit: 10,
        offset: 5,
        promotionStatus: 'RUNNING',
        promotionType: 'ORDER_DISCOUNT',
      };
      await executeTool(mockApi, 'ebay_get_promotions', input);
      expect(mockApi.marketing.getPromotions).toHaveBeenCalledWith(input);
    });
  });
});
