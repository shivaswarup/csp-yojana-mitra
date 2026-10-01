import { Scheme } from '../types';
import { SCHEMES_DATABASE } from '../data/schemes';

export function getExportableSchemesList(schemes: Scheme[] = SCHEMES_DATABASE) {
  return schemes.map((s, idx) => ({
    slNo: idx + 1,
    id: s.id,
    schemeName: s.name,
    targetCategory: s.category,
    targetBeneficiaries: s.targetEmploymentStatuses?.join(', ') || s.category,
    state: s.state,
    governmentLevel: s.governmentLevel,
    department: s.department,
    financialBenefit: s.financialBenefitAmount,
    summary: s.shortDescription,
    keyBenefits: s.benefits.join(' | '),
    eligibilityCriteria: s.eligibility.join(' | '),
    requiredDocuments: s.requiredDocuments.join(' | '),
    applicationProcess: s.applicationProcess.join(' -> '),
    applicationDeadline: s.deadline || 'Check Official Portal',
    officialWebsite: s.officialWebsite,
    officialSource: s.officialSource,
    lastVerified: s.lastUpdated
  }));
}

export function generateSchemesCSV(schemes: Scheme[] = SCHEMES_DATABASE): string {
  const data = getExportableSchemesList(schemes);
  
  const headers = [
    'S.No',
    'Scheme Name',
    'Category',
    'Target Group',
    'State',
    'Level',
    'Department',
    'Benefits',
    'Short Description',
    'Key Benefits',
    'Eligibility Criteria',
    'Required Documents',
    'Application Process',
    'Application Deadline',
    'Official Portal URL',
    'Official Source'
  ];

  const escapeCSV = (str: string | undefined | null): string => {
    if (!str) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = data.map(item => [
    item.slNo,
    escapeCSV(item.schemeName),
    escapeCSV(item.targetCategory),
    escapeCSV(item.targetBeneficiaries),
    escapeCSV(item.state),
    escapeCSV(item.governmentLevel),
    escapeCSV(item.department),
    escapeCSV(item.financialBenefit),
    escapeCSV(item.summary),
    escapeCSV(item.keyBenefits),
    escapeCSV(item.eligibilityCriteria),
    escapeCSV(item.requiredDocuments),
    escapeCSV(item.applicationProcess),
    escapeCSV(item.applicationDeadline),
    escapeCSV(item.officialWebsite),
    escapeCSV(item.officialSource)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function generateSchemesJSON(schemes: Scheme[] = SCHEMES_DATABASE): string {
  const data = getExportableSchemesList(schemes);
  return JSON.stringify(data, null, 2);
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
