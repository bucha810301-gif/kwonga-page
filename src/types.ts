export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  generation: number;
  name: string;
  gender: 'male' | 'female' | 'unknown';
  birthDate?: string;
  deathDate?: string;
  photoUrl?: string;
  memo?: string;
  isDeceased: boolean;
  isExternalSpouse?: boolean;
  surname?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type RelationshipType = 'parent_child' | 'spouse' | 'sibling';

export interface Relationship {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelationshipType;
  createdAt: string;
}

export interface FamilyNodeData {
  member: FamilyMember;
  isHighlighted?: boolean;
  onSelect: (member: FamilyMember) => void;
  isAdmin: boolean;
}
