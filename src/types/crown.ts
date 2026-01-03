// Crown System Types

export interface CrownHolder {
  id: string;
  user_id: string;
  squad_id: string;
  source_event_id: string | null;
  granted_at: string;
  expires_at: string;
}

export interface Headline {
  id: string;
  user_id: string;
  squad_id: string;
  crown_id: string;
  content: string;
  created_at: string;
  expires_at: string;
}

export interface ActiveRivalry {
  id: string;
  declarer_id: string;
  rival1_id: string;
  rival2_id: string;
  squad_id: string;
  crown_id: string;
  created_at: string;
  expires_at: string;
}

export const HEADLINE_TEMPLATES = [
  "Bow down!",
  "The champ is here!",
  "Easy win",
  "Who's next?",
  "Can't touch this!",
  "Crown secured",
] as const;

export type HeadlineTemplate = (typeof HEADLINE_TEMPLATES)[number];

// Maximum headline length
export const MAX_HEADLINE_LENGTH = 50;
