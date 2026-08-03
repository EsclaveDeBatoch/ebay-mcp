import type { components } from '@/generated/ebay/application-settings/developerAnalyticsV1BetaOas3.js';
import type { StatTile, StatViewModel, Tone } from '@/ui/viewModels.js';

type DeveloperRateLimits = components['schemas']['RateLimitsResponse'];
type DeveloperRate = components['schemas']['Rate'];
type DeveloperRateLimit = components['schemas']['RateLimit'];
type DeveloperRateResource = components['schemas']['Resource'];

function headroomTone(remainingCalls: number, callLimit: number): Tone {
  if (callLimit <= 0) {
    return 'neutral';
  }
  const remainingRatio = remainingCalls / callLimit;
  if (remainingRatio <= 0.1) {
    return 'danger';
  }
  if (remainingRatio <= 0.25) {
    return 'warning';
  }
  return 'success';
}

function rateLimitLabel(
  developerRateLimit: DeveloperRateLimit,
  ratedResource: DeveloperRateResource,
): string {
  const labelParts = [
    developerRateLimit.apiContext,
    developerRateLimit.apiName,
    ratedResource.name,
  ].filter((labelPart): labelPart is string => labelPart !== undefined && labelPart.length > 0);
  if (labelParts.length === 0) {
    return '';
  }
  return labelParts.join(' · ');
}

function rateCount(rateCountField: number | undefined): number {
  if (rateCountField === undefined) {
    return 0;
  }
  return rateCountField;
}

function rateLimitTile(
  developerRateLimit: DeveloperRateLimit,
  ratedResource: DeveloperRateResource,
  firstRate: DeveloperRate,
): StatTile {
  const remainingCalls = rateCount(firstRate.remaining);
  const callLimit = rateCount(firstRate.limit);
  return {
    label: rateLimitLabel(developerRateLimit, ratedResource),
    value: remainingCalls.toLocaleString('en-US'),
    sub: `of ${callLimit.toLocaleString('en-US')}`,
    tone: headroomTone(remainingCalls, callLimit),
  };
}

function ratedResourceTile(
  developerRateLimit: DeveloperRateLimit,
  ratedResource: DeveloperRateResource,
): StatTile | undefined {
  if (ratedResource.rates === undefined) {
    return;
  }
  const [firstRate] = ratedResource.rates;
  if (firstRate === undefined) {
    return;
  }
  return rateLimitTile(developerRateLimit, ratedResource, firstRate);
}

function rateLimitTiles(rateLimitsDocument: DeveloperRateLimits): StatTile[] {
  if (rateLimitsDocument.rateLimits === undefined) {
    return [];
  }
  const statTiles: StatTile[] = [];
  for (const developerRateLimit of rateLimitsDocument.rateLimits) {
    if (developerRateLimit.resources !== undefined) {
      for (const ratedResource of developerRateLimit.resources) {
        const statTile = ratedResourceTile(developerRateLimit, ratedResource);
        if (statTile !== undefined) {
          statTiles.push(statTile);
        }
      }
    }
  }
  return statTiles;
}

/**
 * Projects application rate limits into one stat tile per rated resource.
 *
 * @param rateLimitsDocument - Generated application rate-limit document from eBay.
 * @returns Stat view with application quota headroom.
 */
export const applicationRateLimitsStat = (
  rateLimitsDocument: DeveloperRateLimits,
): StatViewModel => ({
  archetype: 'stat',
  title: 'Application rate limits',
  tiles: rateLimitTiles(rateLimitsDocument),
});

/**
 * Projects user rate limits into one stat tile per rated resource.
 *
 * @param rateLimitsDocument - Generated user rate-limit document from eBay.
 * @returns Stat view with per-user quota headroom.
 */
export const userRateLimitsStat = (rateLimitsDocument: DeveloperRateLimits): StatViewModel => ({
  archetype: 'stat',
  title: 'User rate limits',
  tiles: rateLimitTiles(rateLimitsDocument),
});
