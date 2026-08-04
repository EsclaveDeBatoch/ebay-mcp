import type { SellerStandardsProfile } from '@/ebay/sell/analytics/sellerStandardsProfile.js';
import type { CardField, CardSection, CardViewModel, Tone } from '@/ui/viewModels.js';

function ebayCodeLabel(ebayCode: string | undefined): string | undefined {
  if (ebayCode === undefined) {
    return;
  }

  return ebayCode
    .split('_')
    .filter((codeSegment) => codeSegment.length > 0)
    .map(
      (codeSegment) =>
        `${codeSegment.charAt(0).toUpperCase()}${codeSegment.slice(1).toLowerCase()}`,
    )
    .join(' ');
}

function optionalCellText(displayText: string | undefined): string | null {
  if (displayText === undefined) {
    return null;
  }
  return displayText;
}

function standardsLevelTone(standardsLevel: string | undefined): Tone | undefined {
  switch (standardsLevel) {
    case 'TOP_RATED':
    case 'ABOVE_STANDARD':
      return 'success';
    case 'BELOW_STANDARD':
      return 'danger';
    default:
      return;
  }
}

function sellerStandardsMetricFields(sellerStandardsProfile: SellerStandardsProfile): CardField[] {
  const metricFields: CardField[] = [];
  const sellerMetrics = sellerStandardsProfile.metrics;
  if (sellerMetrics === undefined) {
    return metricFields;
  }

  for (const sellerMetric of sellerMetrics) {
    const metricLabel = ebayCodeLabel(sellerMetric.metricKey);
    if (metricLabel !== undefined) {
      metricFields.push({
        label: metricLabel,
        value: optionalCellText(sellerMetric.value),
      });
    }
  }

  return metricFields;
}

function sellerProfileCycleName(
  sellerStandardsProfile: SellerStandardsProfile,
): string | undefined {
  const profileCycle = sellerStandardsProfile.cycle;
  if (profileCycle === undefined) {
    return;
  }
  return ebayCodeLabel(profileCycle.cycleType);
}

function sellerProfileEvaluationDate(
  sellerStandardsProfile: SellerStandardsProfile,
): string | undefined {
  const profileCycle = sellerStandardsProfile.cycle;
  if (profileCycle === undefined) {
    return;
  }
  return profileCycle.evaluationDate;
}

/**
 * Projects one generated seller standards profile into the detail card fields.
 * Missing eBay fields remain absent or null instead of receiving invented labels.
 *
 * @param sellerStandardsProfile - Generated eBay seller standards profile.
 * @returns Card presentation of the profile identity, cycle, level, and named metrics.
 */
export const sellerStandardsProfileCard = (
  sellerStandardsProfile: SellerStandardsProfile,
): CardViewModel => {
  const cycleName = sellerProfileCycleName(sellerStandardsProfile);
  const profileSections: CardSection[] = [
    {
      heading: 'Profile',
      fields: [
        { label: 'Cycle', value: optionalCellText(cycleName) },
        {
          label: 'Evaluation date',
          value: optionalCellText(sellerProfileEvaluationDate(sellerStandardsProfile)),
        },
        {
          label: 'Evaluation reason',
          value: optionalCellText(sellerStandardsProfile.evaluationReason),
        },
      ],
    },
  ];
  const metricFields = sellerStandardsMetricFields(sellerStandardsProfile);
  if (metricFields.length > 0) {
    profileSections.push({ heading: 'Metrics', fields: metricFields });
  }

  const profileCard: CardViewModel = {
    archetype: 'card',
    sections: profileSections,
  };
  const programName = ebayCodeLabel(sellerStandardsProfile.program);
  if (programName !== undefined) {
    profileCard.title = programName;
  }
  if (cycleName !== undefined) {
    profileCard.subtitle = cycleName;
  }

  const standardsTone = standardsLevelTone(sellerStandardsProfile.standardsLevel);
  const standardsLabel = ebayCodeLabel(sellerStandardsProfile.standardsLevel);
  if (standardsTone !== undefined && standardsLabel !== undefined) {
    profileCard.badges = [{ label: standardsLabel, tone: standardsTone }];
  }

  return profileCard;
};
