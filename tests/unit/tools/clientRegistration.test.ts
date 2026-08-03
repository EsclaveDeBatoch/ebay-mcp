import { describe, expect, it } from 'vitest';

import { getToolDefinitions } from '@/tools/index.js';

describe('Developer Client Registration exposure', () => {
  it('does not advertise registration without the required eIDAS mTLS transport', () => {
    const advertisedToolNames = getToolDefinitions().map((toolDefinition) => toolDefinition.name);

    expect(advertisedToolNames).not.toContain('ebay_register_client');
  });
});
