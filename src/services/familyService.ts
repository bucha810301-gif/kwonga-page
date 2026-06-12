import { supabase } from '../lib/supabase';
import { FamilyMember, Relationship, Profile } from '../types';

const ADMIN_EMAIL = 'bucha810301@gmail.com';

export async function upsertProfile(user: { id: string; email: string; name: string }): Promise<{ profile: Profile; isNew: boolean }> {
  try {
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (existing) {
      return {
        profile: {
          id: existing.id,
          email: user.email,
          name: existing.name ?? user.name,
          role: user.email === ADMIN_EMAIL ? 'admin' : (existing.role ?? 'member'),
          createdAt: existing.created_at,
        },
        isNew: false,
      };
    }

    const defaultRole = user.email === ADMIN_EMAIL ? 'admin' : 'member';
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email, name: user.name, role: defaultRole })
      .select()
      .single();
    if (error) throw error;
    return {
      profile: {
        id: data.id,
        email: data.email ?? user.email,
        name: data.name ?? user.name,
        role: defaultRole,
        createdAt: data.created_at,
      },
      isNew: true,
    };
  } catch (err) {
    console.warn('upsertProfile 실패, 기본값 사용:', err);
    return {
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.email === ADMIN_EMAIL ? 'admin' : 'member',
        createdAt: new Date().toISOString(),
      },
      isNew: false,
    };
  }
}

export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(row => ({
      id: row.id,
      email: row.email ?? '',
      name: row.name ?? '',
      role: row.role ?? 'member',
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function updateProfileRole(userId: string, role: 'admin' | 'member'): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export async function deleteProfile(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

const LOCAL_MEMBERS_KEY = 'younggwang_family_members';
const LOCAL_RELATIONS_KEY = 'younggwang_relationships';

export function getLocalMembers(): FamilyMember[] {
  try {
    const data = localStorage.getItem(LOCAL_MEMBERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setLocalMembers(members: FamilyMember[]) {
  try {
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(members));
  } catch {
    try {
      const lightweight = members.map(m =>
        m.photoUrl?.startsWith('data:') ? { ...m, photoUrl: '' } : m
      );
      localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(lightweight));
    } catch { /* ignore */ }
  }
}

export function getLocalRelations(): Relationship[] {
  try {
    const data = localStorage.getItem(LOCAL_RELATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setLocalRelations(relations: Relationship[]) {
  try {
    localStorage.setItem(LOCAL_RELATIONS_KEY, JSON.stringify(relations));
  } catch { /* ignore */ }
}

// DB row (snake_case) <-> TypeScript (camelCase) mapping
function fromDbMember(row: Record<string, any>): FamilyMember {
  return {
    id: row.id,
    generation: row.generation,
    name: row.name,
    gender: row.gender,
    birthDate: row.birth_date ?? undefined,
    deathDate: row.death_date ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    memo: row.memo ?? undefined,
    isDeceased: row.is_deceased,
    isExternalSpouse: row.is_external_spouse ?? undefined,
    surname: row.surname ?? undefined,
    createdBy: row.created_by ?? '',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

function toDbMember(m: FamilyMember) {
  return {
    id: m.id,
    generation: m.generation,
    name: m.name,
    gender: m.gender,
    birth_date: m.birthDate ?? null,
    death_date: m.deathDate ?? null,
    photo_url: m.photoUrl ?? null,
    memo: m.memo ?? null,
    is_deceased: m.isDeceased,
    is_external_spouse: m.isExternalSpouse ?? false,
    surname: m.surname ?? null,
    created_by: m.createdBy,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

function fromDbRelation(row: Record<string, any>): Relationship {
  return {
    id: row.id,
    fromMemberId: row.from_member_id,
    toMemberId: row.to_member_id,
    type: row.type,
    createdAt: row.created_at ?? '',
  };
}

function toDbRelation(r: Relationship) {
  return {
    id: r.id,
    from_member_id: r.fromMemberId,
    to_member_id: r.toMemberId,
    type: r.type,
    created_at: r.createdAt,
  };
}

export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const local = getLocalMembers();
  try {
    const { data, error } = await supabase.from('family_members').select('*');
    if (error) throw error;
    const members = (data ?? []).map(fromDbMember);
    if (members.length > 0) {
      setLocalMembers(members);
      return members;
    }
    // Supabase empty but local has data → sync up
    if (local.length > 0) {
      await supabase.from('family_members').insert(local.map(toDbMember));
    }
    return local;
  } catch (error) {
    console.warn('Supabase fetchFamilyMembers failed, using local:', error);
    return local;
  }
}

export async function fetchRelationships(): Promise<Relationship[]> {
  const local = getLocalRelations();
  try {
    const { data, error } = await supabase.from('relationships').select('*');
    if (error) throw error;
    const relations = (data ?? []).map(fromDbRelation);
    if (relations.length > 0) {
      setLocalRelations(relations);
      return relations;
    }
    // Supabase empty but local has data → sync up
    if (local.length > 0) {
      await supabase.from('relationships').insert(local.map(toDbRelation));
    }
    return local;
  } catch (error) {
    console.warn('Supabase fetchRelationships failed, using local:', error);
    return local;
  }
}

export async function addFamilyMember(
  member: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
  uid: string
): Promise<FamilyMember> {
  const newMember: FamilyMember = {
    ...member,
    id: 'member_' + Math.random().toString(36).substring(2, 11),
    createdBy: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setLocalMembers([...getLocalMembers(), newMember]);
  const { error } = await supabase.from('family_members').insert(toDbMember(newMember));
  if (error) throw error;
  return newMember;
}

export async function updateFamilyMember(
  id: string,
  memberData: Partial<Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const updatedAt = new Date().toISOString();
  setLocalMembers(getLocalMembers().map(m =>
    m.id === id ? { ...m, ...memberData, updatedAt } : m
  ));

  const patch: Record<string, any> = { updated_at: updatedAt };
  if (memberData.name !== undefined) patch.name = memberData.name;
  if (memberData.generation !== undefined) patch.generation = memberData.generation;
  if (memberData.gender !== undefined) patch.gender = memberData.gender;
  if ('birthDate' in memberData) patch.birth_date = memberData.birthDate ?? null;
  if ('deathDate' in memberData) patch.death_date = memberData.deathDate ?? null;
  if ('photoUrl' in memberData) patch.photo_url = memberData.photoUrl ?? null;
  if ('memo' in memberData) patch.memo = memberData.memo ?? null;
  if (memberData.isDeceased !== undefined) patch.is_deceased = memberData.isDeceased;
  if ('isExternalSpouse' in memberData) patch.is_external_spouse = memberData.isExternalSpouse ?? false;
  if ('surname' in memberData) patch.surname = memberData.surname ?? null;

  const { error } = await supabase.from('family_members').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteFamilyMember(id: string): Promise<void> {
  setLocalMembers(getLocalMembers().filter(m => m.id !== id));
  setLocalRelations(getLocalRelations().filter(r => r.fromMemberId !== id && r.toMemberId !== id));

  const { error: relError } = await supabase
    .from('relationships')
    .delete()
    .or(`from_member_id.eq.${id},to_member_id.eq.${id}`);
  if (relError) throw relError;

  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw error;
}

export async function addRelationship(
  fromMemberId: string,
  toMemberId: string,
  type: 'parent_child' | 'spouse' | 'sibling'
): Promise<Relationship> {
  const newRelation: Relationship = {
    id: 'rel_' + Math.random().toString(36).substring(2, 11),
    fromMemberId,
    toMemberId,
    type,
    createdAt: new Date().toISOString(),
  };
  setLocalRelations([...getLocalRelations(), newRelation]);
  const { error } = await supabase.from('relationships').insert(toDbRelation(newRelation));
  if (error) throw error;
  return newRelation;
}

export async function deleteRelationship(id: string): Promise<void> {
  setLocalRelations(getLocalRelations().filter(r => r.id !== id));
  const { error } = await supabase.from('relationships').delete().eq('id', id);
  if (error) throw error;
}
