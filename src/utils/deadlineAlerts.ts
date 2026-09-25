import { Scheme, NotificationItem, UserProfile } from '../types';
import { evaluateSchemeEligibility } from './recommendationEngine';

// Current reference date for Yojana Mitra 2026 timeline
export const APP_REFERENCE_DATE = '2026-09-06';

/**
 * Calculates days remaining until a scheme application deadline expires.
 */
export function calculateDaysUntilDeadline(
  scheme: Scheme,
  referenceDateStr: string = APP_REFERENCE_DATE
): { daysLeft: number | null; isExpiringIn3Days: boolean; statusText: string } {
  let targetDate: Date | null = null;

  if (scheme.deadlineDate && /^\d{4}-\d{2}-\d{2}$/.test(scheme.deadlineDate)) {
    targetDate = new Date(`${scheme.deadlineDate}T23:59:59`);
  } else if (scheme.deadline) {
    // Attempt parsing strings like "9 September 2026", "20 October 2026", etc.
    const parsed = Date.parse(scheme.deadline);
    if (!isNaN(parsed)) {
      targetDate = new Date(parsed);
      targetDate.setHours(23, 59, 59, 999);
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    return {
      daysLeft: null,
      isExpiringIn3Days: false,
      statusText: scheme.deadline || 'Open Year Round'
    };
  }

  const refDate = new Date(`${referenceDateStr}T00:00:00`);
  const diffTime = targetDate.getTime() - refDate.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      daysLeft,
      isExpiringIn3Days: false,
      statusText: 'Deadline Expired'
    };
  }

  const isExpiringIn3Days = daysLeft <= 3 && daysLeft >= 0;
  let statusText = '';
  if (daysLeft === 0) {
    statusText = 'Closes Today!';
  } else if (daysLeft === 1) {
    statusText = 'Closes Tomorrow (1 Day Left)';
  } else if (daysLeft <= 3) {
    statusText = `Closes in ${daysLeft} Days (${scheme.deadline})`;
  } else {
    statusText = `${daysLeft} Days Remaining`;
  }

  return {
    daysLeft,
    isExpiringIn3Days,
    statusText
  };
}

/**
 * Finds all schemes closing within 3 days that are eligible for the user (or general alert)
 */
export function getSchemesExpiringWithin3Days(
  schemes: Scheme[],
  userProfile?: UserProfile | null,
  referenceDateStr: string = APP_REFERENCE_DATE
): Array<{ scheme: Scheme; daysLeft: number; statusText: string }> {
  const result: Array<{ scheme: Scheme; daysLeft: number; statusText: string }> = [];

  schemes.forEach(scheme => {
    const { daysLeft, isExpiringIn3Days, statusText } = calculateDaysUntilDeadline(scheme, referenceDateStr);
    
    if (isExpiringIn3Days && daysLeft !== null) {
      // If user provided, check if user is broadly eligible or if it's their state/central
      if (userProfile) {
        const evalRes = evaluateSchemeEligibility(scheme, userProfile);
        // Include if eligible or high match
        if (evalRes.unmetCriteria.length <= 1) {
          result.push({ scheme, daysLeft, statusText });
        }
      } else {
        result.push({ scheme, daysLeft, statusText });
      }
    }
  });

  return result.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Generates automated 3-day deadline notification items if they don't already exist.
 */
export function generate3DayDeadlineNotifications(
  schemes: Scheme[],
  existingNotifications: NotificationItem[],
  userProfile: UserProfile,
  referenceDateStr: string = APP_REFERENCE_DATE
): NotificationItem[] {
  const expiring = getSchemesExpiringWithin3Days(schemes, userProfile, referenceDateStr);
  const newNotifications: NotificationItem[] = [];

  expiring.forEach(({ scheme, daysLeft, statusText }) => {
    const notifId = `notif-deadline-3days-${scheme.id}`;
    const alreadyExists = existingNotifications.some(n => n.id === notifId || (n.schemeId === scheme.id && n.type === 'deadline' && n.title.includes('3 Days')));

    if (!alreadyExists) {
      newNotifications.push({
        id: notifId,
        userId: userProfile.id,
        title: `🚨 ${daysLeft === 0 ? 'Last Day Today' : `${daysLeft} Days Left`}: Application Deadline Expiring!`,
        message: `The application window for "${scheme.name}" closes on ${scheme.deadline} (${statusText}). Apply now on ${scheme.officialSource || 'the official government portal'} before the portal closes.`,
        type: 'deadline',
        schemeId: scheme.id,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  });

  return newNotifications;
}
