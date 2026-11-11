export type MediaType = "anime" | "manga" | "series" | "movie";
export type UserStatus = "planned" | "in_progress" | "completed" | "dropped";
export type PublishStatus = "published" | "draft" | "review";
export type CampaignStatus = "recruiting" | "ongoing" | "finished" | "paused";

export interface Media {
  id: string;
  type: MediaType;
  title: string;
  synopsis: string | null;
  cover_url: string | null;
  release_year: number | null;
  total_units: number | null;
  genres?: string[];
  subtitle?: string | null;
  publish_status?: PublishStatus;
  created_at?: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  role: "user" | "admin";
  bio?: string | null;
  location?: string | null;
  banner_url?: string | null;
  created_at: string;
}

export interface LibraryEntry {
  id: string;
  user_id: string;
  media_id: string;
  status: UserStatus;
  rating: number | null;
  progress: number;
  review: string | null;
  has_spoilers: boolean;
  updated_at: string;
}

export interface Campaign {
  id: string;
  author_id: string;
  title: string;
  synopsis: string;
  system: string;
  rules: string | null;
  status: CampaignStatus;
  cover_url: string | null;
  created_at: string;
}

export interface CampaignReview {
  id: string;
  campaign_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
