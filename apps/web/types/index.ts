export type User = {
  id: string;
  orcid_id: string;
  display_name: string;
  created_at: string;
};

export type Annotation = {
  id: string;
  paper_id: string;
  paper_version: number;
  user_id: string;
  selected_text: string;
  text_hash: string;
  char_start: number;
  char_end: number;
  content: string;
  is_archived: boolean;
  created_at: string;
  user?: User;
  vote_score?: number;
  user_vote?: number | null;
};

export type Comment = {
  id: string;
  paper_id: string;
  annotation_id: string | null;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  user?: User;
  replies?: Comment[];
  vote_score?: number;
  user_vote?: number | null;
};
