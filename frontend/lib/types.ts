export type Province =
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT" | "NU"
  | "ON" | "PE" | "QC" | "SK" | "YT";

export type RoleType =
  | "RN" | "RPN" | "LPN" | "NP" | "CNA" | "Other";

export type ListingLanguage = "English" | "French" | "Bilingual";
export type ListingStatus = "Draft" | "PendingApproval" | "Active" | "Closed";
export type LanguagePreference = "English" | "French";

export interface Listing {
  id: string;
  slug: string;
  title: string;
  titleFr?: string;
  description: string;
  descriptionFr?: string;
  community: string;
  province: Province;
  roleTypes: RoleType[];
  language: ListingLanguage;
  payMin?: number;
  payMax?: number;
  contractLength?: string;
  startDate?: string;
  status: ListingStatus;
  isFeatured: boolean;
  orgName: string;
  createdAt: string;
}

export interface ListingFilter {
  provinces?: Province[];
  roleTypes?: RoleType[];
  languages?: ListingLanguage[];
  contractLengths?: string[];
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface SubmitApplicationRequest {
  listingId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  licences: { province: Province; licenceNumber?: string; expiry?: string }[];
  coverLetter?: string;
  emailConsent: boolean;
}

export interface SubscribeRequest {
  email: string;
  languagePref: LanguagePreference;
  preferences: ListingFilter;
}
