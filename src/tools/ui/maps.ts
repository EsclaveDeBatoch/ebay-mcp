/**
 * Tool-result → {@link ViewModel} projections for the interactive MCP Apps layer.
 *
 * Each exported `map*` const is referenced by exactly one tool's `ui.map` in
 * `src/tools/categories/*`. Keeping them here (rather than inline in the category
 * files) does two things: it keeps the tool definitions terse, and it lets the
 * unit tests import every projection directly. Drift protection still holds — the
 * `defineTool` call site type-checks each function against its handler's awaited
 * return type, so a renamed eBay field breaks compilation at the wiring point.
 *
 * Every input type is the exact generated OpenAPI schema the matching handler
 * returns; every output is the archetype view model the React app in `ui/`
 * renders. Formatting lives in `./mapHelpers.js` so these stay declarative.
 */

import { formatAmount, humanizeStatus, statusTone, truncate } from '@/tools/ui/mapHelpers.js';
import type { CardBadge, CardSection, CardViewModel, TableViewModel } from '@/ui/viewModels.js';
import type { components as InventorySchemas } from '@/generated/ebay/sell-apps/listing-management/sellInventoryV1Oas3.js';
import type { components as FulfillmentSchemas } from '@/generated/ebay/sell-apps/order-management/sellFulfillmentV1Oas3.js';

type Order = FulfillmentSchemas['schemas']['Order'];
type OrderSearchPagedCollection = FulfillmentSchemas['schemas']['OrderSearchPagedCollection'];
type ShippingFulfillmentPagedCollection =
  FulfillmentSchemas['schemas']['ShippingFulfillmentPagedCollection'];
type DisputeSummaryResponse = FulfillmentSchemas['schemas']['DisputeSummaryResponse'];
type PaymentDispute = FulfillmentSchemas['schemas']['PaymentDispute'];

type Offers = InventorySchemas['schemas']['Offers'];
type EbayOfferDetailsWithAll = InventorySchemas['schemas']['EbayOfferDetailsWithAll'];
type InventoryItems = InventorySchemas['schemas']['InventoryItems'];
type InventoryItemWithSkuLocaleGroupid =
  InventorySchemas['schemas']['InventoryItemWithSkuLocaleGroupid'];
type LocationResponse = InventorySchemas['schemas']['LocationResponse'];

const inventoryLocationColumns = [
  { key: 'key', label: 'Location key' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'types', label: 'Types' },
  { key: 'phone', label: 'Phone' },
];

const inventoryItemColumns = [
  { key: 'sku', label: 'SKU' },
  { key: 'title', label: 'Title' },
  { key: 'condition', label: 'Condition' },
  { key: 'quantity', label: 'Qty', align: 'right' as const },
];

const displayedLocationText = (locationText: string | undefined): string | null => {
  if (locationText === undefined) {
    return null;
  }
  return locationText;
};

const joinedLocationTypes = (locationTypes: string[] | undefined): string | null => {
  if (locationTypes === undefined) {
    return null;
  }
  return locationTypes.join(', ');
};

const displayedInventoryText = (inventoryText: string | undefined): string | null => {
  if (inventoryText === undefined) {
    return null;
  }
  return inventoryText;
};

const inventoryProductTitle = (inventoryItem: InventoryItemWithSkuLocaleGroupid): string | null => {
  if (inventoryItem.product === undefined) {
    return null;
  }
  if (inventoryItem.product.title === undefined) {
    return null;
  }
  return truncate(inventoryItem.product.title, 60);
};

const inventoryProductDescription = (
  inventoryItem: InventoryItemWithSkuLocaleGroupid,
): string | null => {
  if (inventoryItem.product === undefined) {
    return null;
  }
  const shortenedDescription = truncate(inventoryItem.product.description, 120);
  if (shortenedDescription === '') {
    return null;
  }
  return shortenedDescription;
};

const inventoryShipQuantity = (inventoryItem: InventoryItemWithSkuLocaleGroupid): number | null => {
  if (inventoryItem.availability === undefined) {
    return null;
  }
  if (inventoryItem.availability.shipToLocationAvailability === undefined) {
    return null;
  }
  const shipQuantity = inventoryItem.availability.shipToLocationAvailability.quantity;
  if (shipQuantity === undefined) {
    return null;
  }
  return shipQuantity;
};

const inventoryCardTitle = (sku: string | undefined): string => {
  if (sku === undefined) {
    return 'Inventory item';
  }
  return `SKU ${sku}`;
};

const inventoryCardSubtitle = (
  inventoryItem: InventoryItemWithSkuLocaleGroupid,
): string | undefined => {
  const productTitle = inventoryProductTitle(inventoryItem);
  if (productTitle === null) {
    return;
  }
  return truncate(productTitle, 80);
};

const inventoryConditionBadges = (condition: string | undefined): CardBadge[] | undefined => {
  const conditionBadge = statusBadge(condition);
  if (conditionBadge === undefined) {
    return;
  }
  return [conditionBadge];
};

/**
 * Builds a table's contextual footnote from how many rows are shown versus the
 * server's reported total, e.g. `"Showing 25 of 240"`. Returns `undefined` when
 * the response carries no total so the table renders without a footnote.
 */
const footnoteFor = (shown: number, total: number | undefined): string | undefined => {
  if (total === undefined) {
    return;
  }
  if (total > shown) {
    return `Showing ${shown} of ${total}`;
  }
  return `${total} total`;
};

/** Builds a status badge only when eBay returned a status value to display. */
const statusBadge = (status: string | undefined): CardBadge | undefined => {
  const label = humanizeStatus(status);
  if (label === null) {
    return;
  }
  return { label, tone: statusTone(status) };
};

/**
 * Projects a seller's orders into a table; rows drill into a single-order card.
 *
 * @param result - Generated fulfillment order search response from eBay.
 * @returns A table view model whose rows preserve order fields at the projection layer.
 *
 * @example
 * ```ts
 * const view = mapOrdersToTable({ orders: [{ orderId: '12-3456' }], total: 1 });
 * ```
 */
export const mapOrdersToTable = (result: OrderSearchPagedCollection): TableViewModel => {
  const orders = result.orders ?? [];
  return {
    archetype: 'table',
    title: 'Orders',
    columns: [
      { key: 'orderId', label: 'Order' },
      { key: 'creationDate', label: 'Created' },
      { key: 'fulfillment', label: 'Fulfillment' },
      { key: 'payment', label: 'Payment' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'total', label: 'Total', align: 'right' },
    ],
    rows: orders.map((order, index) => ({
      id: order.orderId ?? `order-${index}`,
      cells: {
        orderId: order.orderId ?? null,
        creationDate: order.creationDate ?? null,
        fulfillment: humanizeStatus(order.orderFulfillmentStatus),
        payment: humanizeStatus(order.orderPaymentStatus),
        buyer: order.buyer?.username ?? null,
        total: formatAmount(order.pricingSummary?.total),
      },
      drill: order.orderId
        ? {
            tool: 'ebay_sell_fulfillment_get_order',
            arguments: { orderId: order.orderId },
            label: 'View order',
          }
        : undefined,
    })),
    footnote: footnoteFor(orders.length, result.total),
  };
};

/**
 * Projects an order's shipping fulfillments (tracking/carrier) into a table.
 *
 * @param result - Generated fulfillment page from eBay.
 * @returns A table view model with one row per fulfillment.
 *
 * @example
 * ```ts
 * const view = mapFulfillmentsToTable({ fulfillments: [{ fulfillmentId: 'f1' }] });
 * ```
 */
export const mapFulfillmentsToTable = (
  result: ShippingFulfillmentPagedCollection,
): TableViewModel => {
  const fulfillments = result.fulfillments ?? [];
  return {
    archetype: 'table',
    title: 'Shipping fulfillments',
    columns: [
      { key: 'fulfillmentId', label: 'Fulfillment' },
      { key: 'carrier', label: 'Carrier' },
      { key: 'tracking', label: 'Tracking #' },
      { key: 'shippedDate', label: 'Shipped' },
    ],
    rows: fulfillments.map((fulfillment, index) => ({
      id: fulfillment.fulfillmentId ?? `fulfillment-${index}`,
      cells: {
        fulfillmentId: fulfillment.fulfillmentId ?? null,
        carrier: fulfillment.shippingCarrierCode ?? null,
        tracking: fulfillment.shipmentTrackingNumber ?? null,
        shippedDate: fulfillment.shippedDate ?? null,
      },
    })),
    footnote: footnoteFor(fulfillments.length, result.total),
  };
};

/**
 * Projects a seller's offers into a table; rows drill into a single-offer card.
 *
 * @param result - Generated inventory offers response from eBay.
 * @returns A table view model with offer rows and optional drill refs.
 *
 * @example
 * ```ts
 * const view = mapOffersToTable({ offers: [{ offerId: 'o1', sku: 'SKU-1' }] });
 * ```
 */
export const mapOffersToTable = (result: Offers): TableViewModel => {
  const offers = result.offers ?? [];
  return {
    archetype: 'table',
    title: 'Offers',
    columns: [
      { key: 'offerId', label: 'Offer' },
      { key: 'sku', label: 'SKU' },
      { key: 'marketplace', label: 'Marketplace' },
      { key: 'format', label: 'Format' },
      { key: 'price', label: 'Price', align: 'right' },
      { key: 'quantity', label: 'Qty', align: 'right' },
      { key: 'status', label: 'Status' },
    ],
    rows: offers.map((offer, index) => ({
      id: offer.offerId ?? offer.sku ?? `offer-${index}`,
      cells: {
        offerId: offer.offerId ?? null,
        sku: offer.sku ?? null,
        marketplace: offer.marketplaceId ?? null,
        format: humanizeStatus(offer.format),
        price: formatAmount(offer.pricingSummary?.price),
        quantity: offer.availableQuantity ?? null,
        status: humanizeStatus(offer.status),
      },
      drill: offer.offerId
        ? {
            tool: 'ebay_sell_inventory_get_offer',
            arguments: { offerId: offer.offerId },
            label: 'View offer',
          }
        : undefined,
    })),
    footnote: footnoteFor(offers.length, result.total),
  };
};

/**
 * Projects inventory items into a table; rows drill into a single-item card.
 *
 * @param inventoryItemCollection - Generated inventory item collection from eBay.
 * @returns A table view model with one row per inventory item.
 *
 * @example
 * ```ts
 * const view = mapInventoryItemsToTable({ inventoryItems: [{ sku: 'SKU-1' }] });
 * ```
 */
export const mapInventoryItemsToTable = (
  inventoryItemCollection: InventoryItems,
): TableViewModel => {
  const inventoryItems = inventoryItemCollection.inventoryItems;
  if (inventoryItems === undefined) {
    return {
      archetype: 'table',
      title: 'Inventory items',
      columns: inventoryItemColumns,
      rows: [],
      footnote: footnoteFor(0, inventoryItemCollection.total),
    };
  }

  const inventoryItemRows = inventoryItems.map((inventoryItem, index) => {
    const sku = inventoryItem.sku;
    const inventoryItemCells = {
      sku: displayedInventoryText(sku),
      title: inventoryProductTitle(inventoryItem),
      condition: humanizeStatus(inventoryItem.condition),
      quantity: inventoryShipQuantity(inventoryItem),
    };
    if (sku === undefined) {
      return {
        id: `inventory-item-${index}`,
        cells: inventoryItemCells,
      };
    }
    return {
      id: sku,
      cells: inventoryItemCells,
      drill: {
        tool: 'ebay_sell_inventory_get_inventory_item',
        arguments: { sku },
        label: 'View item',
      },
    };
  });

  return {
    archetype: 'table',
    title: 'Inventory items',
    columns: inventoryItemColumns,
    rows: inventoryItemRows,
    footnote: footnoteFor(inventoryItems.length, inventoryItemCollection.total),
  };
};

/**
 * Projects a seller's inventory locations into a table.
 *
 * @param inventoryLocationCollection - Generated inventory location collection from eBay.
 * @returns A table view model with location rows.
 *
 * @example
 * ```ts
 * const view = mapLocationsToTable({ locations: [{ merchantLocationKey: 'WAREHOUSE-1' }] });
 * ```
 */
export const mapLocationsToTable = (
  inventoryLocationCollection: LocationResponse,
): TableViewModel => {
  const inventoryLocations = inventoryLocationCollection.locations;
  if (inventoryLocations === undefined) {
    return {
      archetype: 'table',
      title: 'Inventory locations',
      columns: inventoryLocationColumns,
      rows: [],
      footnote: footnoteFor(0, inventoryLocationCollection.total),
    };
  }

  const inventoryLocationRows = inventoryLocations.map((inventoryLocation, index) => {
    const merchantLocationKey = inventoryLocation.merchantLocationKey;
    const inventoryLocationCells = {
      key: displayedLocationText(merchantLocationKey),
      name: displayedLocationText(inventoryLocation.name),
      status: humanizeStatus(inventoryLocation.merchantLocationStatus),
      types: joinedLocationTypes(inventoryLocation.locationTypes),
      phone: displayedLocationText(inventoryLocation.phone),
    };
    if (merchantLocationKey === undefined) {
      return {
        id: `location-${index}`,
        cells: inventoryLocationCells,
      };
    }
    return {
      id: merchantLocationKey,
      cells: inventoryLocationCells,
      drill: {
        tool: 'ebay_sell_inventory_get_inventory_location',
        arguments: { merchantLocationKey },
        label: 'View location',
      },
    };
  });

  return {
    archetype: 'table',
    title: 'Inventory locations',
    columns: inventoryLocationColumns,
    rows: inventoryLocationRows,
    footnote: footnoteFor(inventoryLocations.length, inventoryLocationCollection.total),
  };
};

/**
 * Projects payment-dispute summaries into a table; rows drill into a dispute card.
 *
 * @param result - Generated payment dispute summary response from eBay.
 * @returns A table view model with dispute rows and optional drill refs.
 *
 * @example
 * ```ts
 * const view = mapDisputeSummariesToTable({
 *   paymentDisputeSummaries: [{ paymentDisputeId: 'd1' }],
 * });
 * ```
 */
export const mapDisputeSummariesToTable = (result: DisputeSummaryResponse): TableViewModel => {
  const disputes = result.paymentDisputeSummaries ?? [];
  return {
    archetype: 'table',
    title: 'Payment disputes',
    columns: [
      { key: 'disputeId', label: 'Dispute' },
      { key: 'orderId', label: 'Order' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
      { key: 'amount', label: 'Amount', align: 'right' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'openDate', label: 'Opened' },
    ],
    rows: disputes.map((dispute, index) => ({
      id: dispute.paymentDisputeId ?? `dispute-${index}`,
      cells: {
        disputeId: dispute.paymentDisputeId ?? null,
        orderId: dispute.orderId ?? null,
        status: humanizeStatus(dispute.paymentDisputeStatus),
        reason: humanizeStatus(dispute.reason),
        amount: formatAmount(dispute.amount),
        buyer: dispute.buyerUsername ?? null,
        openDate: dispute.openDate ?? null,
      },
      drill: dispute.paymentDisputeId
        ? {
            tool: 'ebay_sell_fulfillment_get_payment_dispute',
            arguments: { payment_dispute_id: dispute.paymentDisputeId },
            label: 'View dispute',
          }
        : undefined,
    })),
    footnote: footnoteFor(disputes.length, result.total),
  };
};

/**
 * Projects a single order into a detail card with status badges and line items.
 *
 * @param result - Generated fulfillment order response from eBay.
 * @returns A card view model with summary and line-item sections.
 *
 * @example
 * ```ts
 * const view = mapOrderToCard({ orderId: '12-3456' });
 * ```
 */
export const mapOrderToCard = (result: Order): CardViewModel => {
  const lineItems = result.lineItems ?? [];
  const badges: CardBadge[] = [];
  const fulfillmentBadge = statusBadge(result.orderFulfillmentStatus);
  if (fulfillmentBadge) {
    badges.push(fulfillmentBadge);
  }
  const paymentBadge = statusBadge(result.orderPaymentStatus);
  if (paymentBadge) {
    badges.push(paymentBadge);
  }
  return {
    archetype: 'card',
    title: result.orderId ? `Order ${result.orderId}` : 'Order',
    subtitle: result.buyer?.username ? `Buyer: ${result.buyer.username}` : undefined,
    badges,
    sections: [
      {
        heading: 'Summary',
        fields: [
          { label: 'Created', value: result.creationDate ?? null },
          { label: 'Total', value: formatAmount(result.pricingSummary?.total) },
          { label: 'Line items', value: lineItems.length },
        ],
      },
      {
        heading: 'Items',
        fields: lineItems.map((lineItem) => ({
          label: truncate(lineItem.title, 60) || lineItem.sku || '',
          value: lineItem.quantity == null ? null : `×${lineItem.quantity}`,
        })),
      },
    ],
  };
};

/**
 * Projects a single offer into a detail card with pricing and listing sections.
 *
 * @param result - Generated inventory offer detail response from eBay.
 * @returns A card view model with pricing and listing sections.
 *
 * @example
 * ```ts
 * const view = mapOfferToCard({ offerId: 'o1', sku: 'SKU-1' });
 * ```
 */
export const mapOfferToCard = (result: EbayOfferDetailsWithAll): CardViewModel => {
  const badges: CardBadge[] = [];
  const offerStatusBadge = statusBadge(result.status);
  if (offerStatusBadge) {
    badges.push(offerStatusBadge);
  }
  if (result.format) {
    const formatLabel = humanizeStatus(result.format);
    if (formatLabel) {
      badges.push({ label: formatLabel });
    }
  }
  return {
    archetype: 'card',
    title: result.offerId ? `Offer ${result.offerId}` : 'Offer',
    subtitle: result.sku ? `SKU: ${result.sku}` : undefined,
    badges,
    sections: [
      {
        heading: 'Pricing',
        fields: [
          { label: 'Price', value: formatAmount(result.pricingSummary?.price) },
          { label: 'Available quantity', value: result.availableQuantity ?? null },
          { label: 'Marketplace', value: result.marketplaceId ?? null },
        ],
      },
      {
        heading: 'Listing',
        fields: [
          { label: 'Listing ID', value: result.listing?.listingId ?? null },
          { label: 'Listing status', value: humanizeStatus(result.listing?.listingStatus) },
        ],
      },
    ],
  };
};

/**
 * Projects a single inventory item into a detail card (product + availability).
 *
 * @param inventoryItem - Generated inventory item detail response from eBay.
 * @returns A card view model with product and availability sections.
 *
 * @example
 * ```ts
 * const view = mapInventoryItemToCard({ sku: 'SKU-1' });
 * ```
 */
const inventoryProductBrand = (
  inventoryItem: InventoryItemWithSkuLocaleGroupid,
): string | undefined => {
  if (inventoryItem.product === undefined) {
    return;
  }
  return inventoryItem.product.brand;
};

const inventoryProductManufacturerPartNumber = (
  inventoryItem: InventoryItemWithSkuLocaleGroupid,
): string | undefined => {
  if (inventoryItem.product === undefined) {
    return;
  }
  return inventoryItem.product.mpn;
};

export const mapInventoryItemToCard = (
  inventoryItem: InventoryItemWithSkuLocaleGroupid,
): CardViewModel => ({
  archetype: 'card',
  title: inventoryCardTitle(inventoryItem.sku),
  subtitle: inventoryCardSubtitle(inventoryItem),
  badges: inventoryConditionBadges(inventoryItem.condition),
  sections: [
    {
      heading: 'Product',
      fields: [
        {
          label: 'Brand',
          value: displayedInventoryText(inventoryProductBrand(inventoryItem)),
        },
        {
          label: 'MPN',
          value: displayedInventoryText(inventoryProductManufacturerPartNumber(inventoryItem)),
        },
        { label: 'Description', value: inventoryProductDescription(inventoryItem) },
      ],
    },
    {
      heading: 'Availability',
      fields: [
        {
          label: 'Quantity',
          value: inventoryShipQuantity(inventoryItem),
        },
      ],
    },
  ],
});

/**
 * Projects a single payment dispute into a detail card, listing available actions.
 *
 * @param result - Generated payment dispute response from eBay.
 * @returns A card view model with detail and available-action sections.
 *
 * @example
 * ```ts
 * const view = mapDisputeToCard({ paymentDisputeId: 'd1' });
 * ```
 */
export const mapDisputeToCard = (result: PaymentDispute): CardViewModel => {
  const sections: CardSection[] = [
    {
      heading: 'Details',
      fields: [
        { label: 'Order', value: result.orderId ?? null },
        { label: 'Reason', value: humanizeStatus(result.reason) },
        { label: 'Amount', value: formatAmount(result.amount) },
        { label: 'Buyer', value: result.buyerUsername ?? null },
        { label: 'Opened', value: result.openDate ?? null },
        { label: 'Respond by', value: result.respondByDate ?? null },
      ],
    },
  ];
  if (result.availableChoices?.length) {
    sections.push({
      heading: 'Available actions',
      fields: result.availableChoices.map((choice) => ({
        label: humanizeStatus(choice) ?? '',
        value: null,
      })),
    });
  }
  const disputeBadge = statusBadge(result.paymentDisputeStatus);
  return {
    archetype: 'card',
    title: result.paymentDisputeId ? `Dispute ${result.paymentDisputeId}` : 'Payment dispute',
    subtitle: result.orderId ? `Order: ${result.orderId}` : undefined,
    badges: disputeBadge ? [disputeBadge] : undefined,
    sections,
  };
};
