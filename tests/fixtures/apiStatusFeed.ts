export const apiStatusRssDocument = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>eBay API Status</title>
    <item>
      <title>Inventory API latency</title>
      <description><![CDATA[<p>Requests are taking longer than expected.</p>]]></description>
      <link>https://developer.ebay.com/support/status/inventory-latency</link>
      <api>Inventory API</api>
      <site>All</site>
      <status>Unresolved</status>
      <lastUpdated>2026-08-03T14:30:00Z</lastUpdated>
    </item>
    <item>
      <title>Trading API interruption</title>
      <summary>Service has recovered.</summary>
      <link>https://developer.ebay.com/support/status/trading-recovered</link>
      <api>Trading API</api>
      <site>US</site>
      <status>Resolved</status>
      <lastUpdated>2026-08-02T11:00:00Z</lastUpdated>
    </item>
  </channel>
</rss>`;

export const singleIncidentRssDocument = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Sandbox maintenance</title>
      <api>Sandbox</api>
      <site>All</site>
      <status>Resolved</status>
      <lastUpdated>2026-08-01T08:00:00Z</lastUpdated>
    </item>
  </channel>
</rss>`;
