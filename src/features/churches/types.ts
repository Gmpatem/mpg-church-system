export interface CreateChurchInput {
  name: string;
  slug: string;
  defaultLanguage?: "en" | "fr";
  timezone?: string;
  country?: string;
  city?: string;
}
