import { Scheme, NotificationItem, UserProfile } from '../types';
import { evaluateSchemeEligibility } from './recommendationEngine';

// Current reference date for Yojana Mitra 2026 timeline
export const APP_REFERENCE_DATE = '2026-09-30';

/**
 * Calculates days remaining until a scheme application deadline expires.
 */
export function calculateDaysUntilDeadline(
  scheme: Scheme,
  referenceDateStr: string = APP_REFERENCE_DATE
): { daysLeft: number | null; isExpiringIn3Days: boolean; isExpiringSoon: boolean; statusText: string } {
  let targetDate: Date | null = null;

  if (scheme.deadlineDate && /^\d{4}-\d{2}-\d{2}$/.test(scheme.deadlineDate)) {
    targetDate = new Date(`${scheme.deadlineDate}T23:59:59`);
  } else if (scheme.deadline) {
    // Attempt parsing strings like "31 October 2026", "15 November 2026", etc.
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
      isExpiringSoon: false,
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
      isExpiringSoon: false,
      statusText: 'Deadline Expired'
    };
  }

  const isExpiringIn3Days = daysLeft <= 3 && daysLeft >= 0;
  const isExpiringSoon = daysLeft <= 45 && daysLeft >= 0;

  let statusText = '';
  if (daysLeft === 0) {
    statusText = 'Closes Today!';
  } else if (daysLeft === 1) {
    statusText = 'Closes Tomorrow (1 Day Left)';
  } else if (daysLeft <= 3) {
    statusText = `Closes in ${daysLeft} Days (${scheme.deadline})`;
  } else if (daysLeft <= 30) {
    statusText = `${daysLeft} Days Left (Closing ${scheme.deadline})`;
  } else {
    statusText = `${daysLeft} Days Remaining (Deadline: ${scheme.deadline})`;
  }

  return {
    daysLeft,
    isExpiringIn3Days,
    isExpiringSoon,
    statusText
  };
}

/**
 * Finds all schemes closing soon that are strictly eligible for the user.
 */
export function getSchemesExpiringWithin3Days(
  schemes: Scheme[],
  userProfile?: UserProfile | null,
  referenceDateStr: string = APP_REFERENCE_DATE
): Array<{ scheme: Scheme; daysLeft: number; statusText: string }> {
  const result: Array<{ scheme: Scheme; daysLeft: number; statusText: string }> = [];

  schemes.forEach(scheme => {
    const { daysLeft, isExpiringSoon, statusText } = calculateDaysUntilDeadline(scheme, referenceDateStr);
    
    if (daysLeft !== null && isExpiringSoon) {
      if (userProfile) {
        const evalRes = evaluateSchemeEligibility(scheme, userProfile);
        if (evalRes.unmetCriteria.length === 0) {
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
 * Generates automated deadline reminder notifications strictly for schemes the user is eligible for.
 */
export function generateDeadlineReminderNotifications(
  schemes: Scheme[],
  existingNotifications: NotificationItem[],
  userProfile: UserProfile,
  referenceDateStr: string = APP_REFERENCE_DATE
): NotificationItem[] {
  const newNotifications: NotificationItem[] = [];

  // Match schemes strictly matching citizen profile eligibility
  const eligibleSchemes = schemes.filter(scheme => {
    const evalRes = evaluateSchemeEligibility(scheme, userProfile);
    return evalRes.unmetCriteria.length === 0;
  });

  eligibleSchemes.forEach(scheme => {
    const { daysLeft, statusText, isExpiringSoon } = calculateDaysUntilDeadline(scheme, referenceDateStr);
    
    // Only remind deadlines of schemes with approaching application deadlines or closing dates
    const hasApproachingDeadline = isExpiringSoon || scheme.isDeadlineApproaching || (daysLeft !== null && daysLeft <= 45);
    if (!hasApproachingDeadline) {
      return;
    }

    const safeSchemeId = (scheme.id || 'scheme').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const notifId = `notif-deadline-${safeSchemeId}`;
    
    // Check if notification already exists
    const alreadyExists = existingNotifications.some(
      n => n.id === notifId || (n.schemeId === scheme.id && n.type === 'deadline') || (n.schemeId === safeSchemeId && n.type === 'deadline')
    );

    if (!alreadyExists) {
      let urgencyTag = '⏰ Application Deadline Reminder:';
      if (daysLeft !== null && daysLeft <= 3) {
        urgencyTag = '🚨 Urgent Deadline - Apply Now:';
      } else if (daysLeft !== null && daysLeft <= 15) {
        urgencyTag = '⏰ Closing Soon Reminder:';
      } else if (daysLeft !== null && daysLeft <= 45) {
        urgencyTag = '⏰ Upcoming Deadline Reminder:';
      }

      const docs = scheme.requiredDocuments && scheme.requiredDocuments.length > 0
        ? scheme.requiredDocuments.slice(0, 3).join(', ')
        : 'Aadhaar Card, Bank Passbook, Income Certificate';

      const benefitStr = scheme.financialBenefitAmount || 'financial entitlement';
      const cleanTitle = `${urgencyTag} ${scheme.name}`.slice(0, 180);
      const cleanMessage = `Application deadline is ${scheme.deadline} (${statusText}). Entitlement: ${benefitStr}. Please prepare required documents (${docs}) and apply via ${scheme.officialSource || 'official portal'}.`.slice(0, 1500);

      newNotifications.push({
        id: notifId,
        userId: userProfile?.id || 'guest',
        title: cleanTitle,
        message: cleanMessage,
        type: 'deadline',
        schemeId: safeSchemeId,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  });

  return newNotifications;
}

/**
 * Backward compatibility alias for 3-day notifications
 */
export function generate3DayDeadlineNotifications(
  schemes: Scheme[],
  existingNotifications: NotificationItem[],
  userProfile: UserProfile,
  referenceDateStr: string = APP_REFERENCE_DATE
): NotificationItem[] {
  return generateDeadlineReminderNotifications(schemes, existingNotifications, userProfile, referenceDateStr);
}
