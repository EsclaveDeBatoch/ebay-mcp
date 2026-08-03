import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisputeApi } from '@/api/order-management/dispute.js';
import { VeroApi } from '@/api/other/vero.js';
import { EDeliveryApi } from '@/api/other/edelivery.js';
import type { EbayApiClient } from '@/api/client.js';
import { Effect } from 'effect';

describe('Other APIs', () => {
  let client: EbayApiClient;

  beforeEach(() => {
    client = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getConfig: vi.fn(() => ({ environment: 'sandbox' })),
      getFromUrl: vi.fn(),
      postToUrl: vi.fn(),
    } as unknown as EbayApiClient;
  });

  describe('DisputeApi', () => {
    let api: DisputeApi;

    beforeEach(() => {
      api = new DisputeApi(client);
    });

    it('get payment dispute summaries with filter', async () => {
      const mockResponse = { paymentDisputeSummaries: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getPaymentDisputeSummaries({ orderId: 'ORDER123', limit: 10 }));

      expect(client.get).toHaveBeenCalledWith('/sell/fulfillment/v1/payment_dispute_summary', {
        order_id: 'ORDER123',
        limit: '10',
      });
    });

    it('get payment dispute by ID', async () => {
      const mockResponse = { paymentDisputeId: 'DISPUTE123' };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getPaymentDispute({ paymentDisputeId: 'DISPUTE123' }));

      expect(client.get).toHaveBeenCalledWith('/sell/fulfillment/v1/payment_dispute/DISPUTE123');
    });

    it('contest payment dispute', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      await Effect.runPromise(
        api.contestPaymentDispute({ paymentDisputeId: 'DISPUTE123', body: { returnAddress: {} } }),
      );

      expect(client.post).toHaveBeenCalledWith(
        '/sell/fulfillment/v1/payment_dispute/DISPUTE123/contest',
        { returnAddress: {} },
      );
    });

    it('accept payment dispute', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      await Effect.runPromise(
        api.acceptPaymentDispute({ paymentDisputeId: 'DISPUTE123', body: { returnAddress: {} } }),
      );

      expect(client.post).toHaveBeenCalledWith(
        '/sell/fulfillment/v1/payment_dispute/DISPUTE123/accept',
        { returnAddress: {} },
      );
    });
  });

  describe('VeroApi', () => {
    let api: VeroApi;

    beforeEach(() => {
      api = new VeroApi(client);
    });

    it('create VERO report', async () => {
      const mockResponse = { veroReportId: 'REPORT123' };
      const reportData = {
        reportItems: [
          {
            itemId: 'ITEM123',
            veroReasonCodeId: 'TRADEMARK',
          },
        ],
      };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.createVeroReport({ reportData }));

      expect(client.post).toHaveBeenCalledWith('/commerce/vero/v1/vero_report', reportData);
    });

    it('get VERO report by ID', async () => {
      const mockResponse = { veroReportId: 'REPORT123', status: 'OPEN' };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getVeroReport({ veroReportId: 'REPORT123' }));

      expect(client.get).toHaveBeenCalledWith('/commerce/vero/v1/vero_report/REPORT123');
    });

    it('get VERO report items', async () => {
      const mockResponse = { items: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(
        api.getVeroReportItems({ filter: 'filter:test', limit: 10, offset: 5 }),
      );

      expect(client.get).toHaveBeenCalledWith('/commerce/vero/v1/vero_report_items', {
        filter: 'filter:test',
        limit: 10,
        offset: 5,
      });
    });

    it('get VERO report items without optional params', async () => {
      const mockResponse = { items: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getVeroReportItems({}));

      expect(client.get).toHaveBeenCalledWith('/commerce/vero/v1/vero_report_items');
    });

    it('get VERO reason code by ID', async () => {
      const mockResponse = {
        veroReasonCodeId: 'CODE123',
        name: 'Trademark Infringement',
        description: 'Unauthorized use of trademark',
      };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getVeroReasonCode({ veroReasonCodeId: 'CODE123' }));

      expect(client.get).toHaveBeenCalledWith('/commerce/vero/v1/vero_reason_code/CODE123');
    });

    it('get all VERO reason codes', async () => {
      const mockResponse = {
        veroReasonCodes: [
          { veroReasonCodeId: 'CODE1', name: 'Trademark' },
          { veroReasonCodeId: 'CODE2', name: 'Copyright' },
        ],
      };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getVeroReasonCodes({}));

      expect(client.get).toHaveBeenCalledWith('/commerce/vero/v1/vero_reason_code');
    });

    it('reject missing VERO reason code ID before requesting eBay', async () => {
      const error = await Effect.runPromise(
        Effect.flip(api.getVeroReasonCode({ veroReasonCodeId: '' })),
      );

      expect(error).toMatchObject({ _tag: 'EndpointInputError', parameter: 'veroReasonCodeId' });
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('EDeliveryApi', () => {
    let api: EDeliveryApi;

    beforeEach(() => {
      api = new EDeliveryApi(client);
    });

    // Cost & Preferences
    it('gets actual costs with generated query params', async () => {
      const mockResponse = { costs: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getActualCosts({ trackingNumbers: 'TRACK123' }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/actual_costs',
        {
          tracking_numbers: 'TRACK123',
        },
      );
    });

    it('gets address preferences', async () => {
      const mockResponse = { preferences: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getAddressPreferences({}));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/address_preference',
      );
    });

    it('creates address preference with body input', async () => {
      const mockResponse = { preferenceId: 'PREF123' };
      const body = { shipFromAddress: { city: 'New York' } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.createAddressPreference({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/address_preference',
        body,
      );
    });

    it('gets consign preferences', async () => {
      const mockResponse = { preferences: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getConsignPreferences({}));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/consign_preference',
      );
    });

    it('creates consign preference with body input', async () => {
      const mockResponse = { preferenceId: 'CONS123' };
      const body = { consignAddress: { consignPreferenceName: 'Main' } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.createConsignPreference({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/consign_preference',
        body,
      );
    });

    // Agents & Services
    it('gets agents with pagination query params', async () => {
      const mockResponse = { agents: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getAgents({ limit: 50, offset: 10 }));

      expect(client.get).toHaveBeenCalledWith('/sell/edelivery_international_shipping/v1/agents', {
        limit: '50',
        offset: '10',
      });
    });

    it('gets battery qualifications with pagination query params', async () => {
      const mockResponse = { qualifications: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getBatteryQualifications({ limit: 25 }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/battery_qualifications',
        {
          limit: '25',
        },
      );
    });

    it('gets dropoff sites with pagination query params', async () => {
      const mockResponse = { sites: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getDropoffSites({ offset: 5 }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/dropoff_sites',
        {
          offset: '5',
        },
      );
    });

    it('gets services with pagination query params', async () => {
      const mockResponse = { services: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getServices({ limit: 20 }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/services',
        { limit: '20' },
      );
    });

    // Bundles
    it('creates bundle with body input', async () => {
      const mockResponse = { bundleId: 'BUNDLE123' };
      const body = { bundle: { trackingNumbers: ['TRACK1', 'TRACK2'] } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.createBundle({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/bundle',
        body,
      );
    });

    it('gets bundle by ID', async () => {
      const mockResponse = { bundleId: 'BUNDLE123' };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getBundle({ bundleId: 'BUNDLE123' }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/bundle/BUNDLE123',
      );
    });

    it('cancels bundle without a synthetic body', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      await Effect.runPromise(api.cancelBundle({ bundleId: 'BUNDLE123' }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/bundle/BUNDLE123/cancel',
      );
    });

    it('gets bundle label by ID', async () => {
      const mockResponse = { labelUrl: 'https://label.url' };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getBundleLabel({ bundleId: 'BUNDLE123' }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/bundle/BUNDLE123/label',
      );
    });

    // Packages (Single)
    it('creates package with body input', async () => {
      const mockResponse = { packageId: 'PKG123' };
      const body = { packageInfo: { packageWeight: 1000 } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.createPackage({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package',
        body,
      );
    });

    it('gets package by ID', async () => {
      const mockResponse = { packageId: 'PKG123' };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getPackage({ packageId: 'PKG123' }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/PKG123',
      );
    });

    it('deletes package by ID', async () => {
      vi.mocked(client.delete).mockResolvedValue(undefined);

      await Effect.runPromise(api.deletePackage({ packageId: 'PKG123' }));

      expect(client.delete).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/PKG123',
      );
    });

    it('gets packages by order line item ID', async () => {
      const mockResponse = { packageId: 'PKG123' };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getPackagesByLineItemId({ orderLineItemId: 'ORDER_LINE_123' }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/ORDER_LINE_123/item',
      );
    });

    it('cancels package without a synthetic body', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      await Effect.runPromise(api.cancelPackage({ packageId: 'PKG123' }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/PKG123/cancel',
      );
    });

    it('clones package without a synthetic body', async () => {
      const mockResponse = { packageId: 'PKG456' };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.clonePackage({ packageId: 'PKG123' }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/PKG123/clone',
      );
    });

    it('confirms package without a synthetic body', async () => {
      vi.mocked(client.post).mockResolvedValue(undefined);

      await Effect.runPromise(api.confirmPackage({ packageId: 'PKG123' }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/PKG123/confirm',
      );
    });

    // Packages (Bulk)
    it('bulk cancels packages with body input', async () => {
      const mockResponse = { results: [] };
      const body = { requests: { packageIds: ['PKG1', 'PKG2'] } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.bulkCancelPackages({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/bulk_cancel_packages',
        body,
      );
    });

    it('bulk confirms packages with body input', async () => {
      const mockResponse = { results: [] };
      const body = { requests: { packageIds: ['PKG1', 'PKG2'] } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.bulkConfirmPackages({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/bulk_confirm_packages',
        body,
      );
    });

    it('bulk deletes packages with body input', async () => {
      const mockResponse = { results: [] };
      const body = { requests: { packageIds: ['PKG1', 'PKG2'] } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.bulkDeletePackages({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/package/bulk_delete_packages',
        body,
      );
    });

    // Labels & Tracking
    it('gets labels with generated query params', async () => {
      const mockResponse = { labels: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(
        api.getLabels({
          pageSize: 'A4',
          printPreference: 'nameEn',
          trackingNumbers: 'TRACK123',
        }),
      );

      expect(client.get).toHaveBeenCalledWith('/sell/edelivery_international_shipping/v1/labels', {
        page_size: 'A4',
        print_preference: 'nameEn',
        tracking_numbers: 'TRACK123',
      });
    });

    it('gets handover sheet with generated query params', async () => {
      const mockResponse = { sheetUrl: 'https://sheet.url' };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getHandoverSheet({ trackingNumbers: 'TRACK123' }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/handover_sheet',
        {
          tracking_numbers: 'TRACK123',
        },
      );
    });

    it('gets tracking with generated query params', async () => {
      const mockResponse = { tracking: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.getTracking({ trackingNumber: 'TRACK123' }));

      expect(client.get).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/tracking',
        {
          tracking_number: 'TRACK123',
        },
      );
    });

    // Other
    it('creates complaint with body input', async () => {
      const mockResponse = { complaintId: 'COMPLAINT123' };
      const body = { complaintRequest: { complaintReason: 'LOST', remark: 'Package damaged' } };
      vi.mocked(client.post).mockResolvedValue(mockResponse);

      await Effect.runPromise(api.createComplaint({ body }));

      expect(client.post).toHaveBeenCalledWith(
        '/sell/edelivery_international_shipping/v1/complaint',
        body,
      );
    });

    it('rejects missing tracking number before getTracking requests eBay', async () => {
      const failure = await Effect.runPromiseExit(api.getTracking({ trackingNumber: '' }));

      expect(failure._tag).toBe('Failure');
      if (failure._tag === 'Failure') {
        const error = failure.cause._tag === 'Fail' ? failure.cause.error : undefined;
        expect(error?._tag).toBe('EndpointInputError');
      }
      expect(client.get).not.toHaveBeenCalled();
    });
  });
});
