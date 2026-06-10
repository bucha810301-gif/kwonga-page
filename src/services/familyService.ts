import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, OperationType } from '../firebase';
import { FamilyMember, Relationship, Profile } from '../types';

// Collection references
const MEMBERS_COLL = 'family_members';
const RELATIONS_COLL = 'relationships';
const PROFILES_COLL = 'profiles';

// LocalStorage helpers to support reliable offline-first fallback
const LOCAL_PROFILES_KEY = 'younggwang_profiles';
const LOCAL_MEMBERS_KEY = 'younggwang_family_members';
const LOCAL_RELATIONS_KEY = 'younggwang_relationships';

function getLocalProfiles(): Profile[] {
  try {
    const data = localStorage.getItem(LOCAL_PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setLocalProfiles(profiles: Profile[]) {
  try {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to sync profiles local storage:', e);
  }
}

export function getLocalMembers(): FamilyMember[] {
  try {
    const data = localStorage.getItem(LOCAL_MEMBERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setLocalMembers(members: FamilyMember[]) {
  try {
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(members));
  } catch (e) {
    console.warn('Failed to sync members local storage due to size limits, attempting to clean up huge images:', e);
    try {
      // Crop out base64 images to satisfy localStorage file size restrictions
      const lightweight = members.map(m => {
        if (m.photoUrl && m.photoUrl.startsWith('data:')) {
          return { ...m, photoUrl: '' }; // Remove huge base64 photos to stay under quota
        }
        return m;
      });
      localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(lightweight));
    } catch (innerError) {
      console.error('Even lightweight member localstorage sync failed:', innerError);
    }
  }
}

export function getLocalRelations(): Relationship[] {
  try {
    const data = localStorage.getItem(LOCAL_RELATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setLocalRelations(relations: Relationship[]) {
  try {
    localStorage.setItem(LOCAL_RELATIONS_KEY, JSON.stringify(relations));
  } catch (e) {
    console.error('Failed to sync relationships local storage:', e);
  }
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

/**
 * Helper to race a promise against a timeout, avoiding long hangs on slow or offline Firestore
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`Firestore operation timed out after ${timeoutMs}ms, returning local fallback.`);
      resolve(fallback);
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Creates or gets the profile for a logged-in user
 */
export async function createOrGetProfile(uid: string, email: string, name: string): Promise<Profile> {
  const profileRef = doc(db, PROFILES_COLL, uid);
  try {
    const snap = await getDoc(profileRef);
    let profile: Profile;
    if (snap.exists()) {
      profile = snap.data() as Profile;
    } else {
      profile = {
        id: uid,
        email,
        name,
        role: email === 'bucha810301@gmail.com' ? 'admin' : 'member', // Bootstrap admin
        createdAt: new Date().toISOString()
      };
      await setDoc(profileRef, profile);
    }
    
    // Sync into local cache
    const currentLocal = getLocalProfiles();
    if (!currentLocal.some(p => p.id === uid)) {
      setLocalProfiles([...currentLocal, profile]);
    }
    return profile;
  } catch (error) {
    console.warn('Firestore createOrGetProfile read/write failed, using localStorage fallback:', error);
    
    const currentLocal = getLocalProfiles();
    const existing = currentLocal.find(p => p.id === uid || p.email === email);
    if (existing) {
      return existing;
    }
    
    const fallbackProfile: Profile = {
      id: uid,
      email,
      name,
      role: email === 'bucha810301@gmail.com' ? 'admin' : 'member',
      createdAt: new Date().toISOString()
    };
    setLocalProfiles([...currentLocal, fallbackProfile]);
    return fallbackProfile;
  }
}

/**
 * Gets all user profiles (For admin administration)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const snap = await getDocs(collection(db, PROFILES_COLL));
    const profiles = snap.docs.map(d => d.data() as Profile);
    setLocalProfiles(profiles);
    return profiles;
  } catch (error) {
    console.warn('Firestore getAllProfiles failed, using localStorage fallback:', error);
    return getLocalProfiles();
  }
}

/**
 * Upgrades or downgrades a user's role
 */
export async function updateProfileRole(userId: string, role: 'admin' | 'member'): Promise<void> {
  const localProfiles = getLocalProfiles();
  setLocalProfiles(localProfiles.map(p => p.id === userId ? { ...p, role } : p));
  
  const profileRef = doc(db, PROFILES_COLL, userId);
  try {
    await updateDoc(profileRef, { role });
  } catch (error) {
    console.warn('Firestore updateProfileRole failed, successfully updated localStorage instead:', error);
  }
}

/**
 * Deletes a user profile
 */
export async function deleteProfile(userId: string): Promise<void> {
  const localProfiles = getLocalProfiles();
  setLocalProfiles(localProfiles.filter(p => p.id !== userId));
  
  const profileRef = doc(db, PROFILES_COLL, userId);
  deleteDoc(profileRef).catch((error) => {
    console.warn('Background Firestore deleteProfile failed:', error);
  });
}

/**
 * Gets all family members from Firestore
 */
export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const local = getLocalMembers();
  const firestoreFetch = async () => {
    const snap = await getDocs(collection(db, MEMBERS_COLL));
    const members = snap.docs.map(d => d.data() as FamilyMember);
    if (members.length > 0) {
      setLocalMembers(members);
    }
    return members.length > 0 ? members : local;
  };

  try {
    return await withTimeout(firestoreFetch(), 1000, local);
  } catch (error) {
    console.warn('Firestore fetchFamilyMembers timed out or failed, returned local state:', error);
    return local;
  }
}

/**
 * Create a new family member
 */
export async function addFamilyMember(
  member: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
  uid: string
): Promise<FamilyMember> {
  const memberId = 'member_' + Math.random().toString(36).substring(2, 11);
  const newMember: FamilyMember = {
    ...member,
    id: memberId,
    createdBy: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // High Availability: Save to local storage first (instant response)
  const currentLocal = getLocalMembers();
  setLocalMembers([...currentLocal, newMember]);

  // Non-blocking background call to write to Firestore
  setDoc(doc(db, MEMBERS_COLL, memberId), stripUndefined(newMember)).catch((error) => {
    console.warn('Background Firestore addFamilyMember failed:', error);
  });
  
  return newMember;
}

/**
 * Update an existing family member Biography info
 */
export async function updateFamilyMember(
  id: string,
  memberData: Partial<Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const updatedAtStr = new Date().toISOString();
  
  // Update local storage cache
  const localMembers = getLocalMembers();
  setLocalMembers(localMembers.map(m => m.id === id ? { ...m, ...memberData, updatedAt: updatedAtStr } : m));

  const memberRef = doc(db, MEMBERS_COLL, id);
  updateDoc(memberRef, stripUndefined({
    ...memberData,
    updatedAt: updatedAtStr
  })).catch((error) => {
    console.warn('Background Firestore updateFamilyMember failed:', error);
  });
}

/**
 * Deletes a family member and their associated relationships
 */
export async function deleteFamilyMember(id: string): Promise<void> {
  // Update local storage caches
  const localMembers = getLocalMembers();
  setLocalMembers(localMembers.filter(m => m.id !== id));

  const localRelations = getLocalRelations();
  setLocalRelations(localRelations.filter(r => r.fromMemberId !== id && r.toMemberId !== id));

  // Non-blocking background job to clean up the DB
  (async () => {
    await deleteDoc(doc(db, MEMBERS_COLL, id));
    
    const relationsRef = collection(db, RELATIONS_COLL);
    const snapFrom = await getDocs(query(relationsRef, where('fromMemberId', '==', id)));
    const snapTo = await getDocs(query(relationsRef, where('toMemberId', '==', id)));
    
    const batch = writeBatch(db);
    snapFrom.forEach(d => batch.delete(d.ref));
    snapTo.forEach(d => batch.delete(d.ref));
    await batch.commit();
  })().catch((error) => {
    console.warn('Background Firestore deleteFamilyMember database cleanup failed:', error);
  });
}

/**
 * Fetch all parent, spouse, sibling relationships
 */
export async function fetchRelationships(): Promise<Relationship[]> {
  const local = getLocalRelations();
  const firestoreFetch = async () => {
    const snap = await getDocs(collection(db, RELATIONS_COLL));
    const relations = snap.docs.map(d => d.data() as Relationship);
    if (relations.length > 0) {
      setLocalRelations(relations);
    }
    return relations.length > 0 ? relations : local;
  };

  try {
    return await withTimeout(firestoreFetch(), 1000, local);
  } catch (error) {
    console.warn('Firestore fetchRelationships timed out or failed, returned local state:', error);
    return local;
  }
}

/**
 * Adds a relationship
 */
export async function addRelationship(
  fromMemberId: string,
  toMemberId: string,
  type: 'parent_child' | 'spouse' | 'sibling'
): Promise<Relationship> {
  const relationId = 'rel_' + Math.random().toString(36).substring(2, 11);
  const newRelation: Relationship = {
    id: relationId,
    fromMemberId,
    toMemberId,
    type,
    createdAt: new Date().toISOString()
  };
  
  // Local storage save first
  const currentLocal = getLocalRelations();
  setLocalRelations([...currentLocal, newRelation]);

  setDoc(doc(db, RELATIONS_COLL, relationId), newRelation).catch((error) => {
    console.warn('Background Firestore addRelationship failed:', error);
  });
  
  return newRelation;
}

/**
 * Deletes a specific relationship
 */
export async function deleteRelationship(id: string): Promise<void> {
  const currentLocal = getLocalRelations();
  setLocalRelations(currentLocal.filter(r => r.id !== id));

  deleteDoc(doc(db, RELATIONS_COLL, id)).catch((error) => {
    console.warn('Background Firestore deleteRelationship failed:', error);
  });
}

/**
 * Seeds a default historical pedigree for 영광종회 김씨 (Younggwang Clan Kim)
 * to make the app incredibly beautiful and immediately interactive.
 */
export async function seedInitialClanData(uid: string): Promise<{ members: FamilyMember[], relationships: Relationship[] }> {
  // Seed family members template
  const seedMembers: Omit<FamilyMember, 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'm1',
      generation: 1,
      name: '김선조 (金先祖)',
      gender: 'male',
      birthDate: '1850-04-12',
      deathDate: '1920-11-20',
      isDeceased: true,
      memo: '영광종회 김씨 파조. 가문을 개창하여 기틀을 다지심.',
      photoUrl: ''
    },
    {
      id: 'm2',
      generation: 2,
      name: '김태식 (金泰植)',
      gender: 'male',
      birthDate: '1880-01-15',
      deathDate: '1950-08-14',
      isDeceased: true,
      memo: '김선조 파조의 장남. 서당을 열어 후학 양성에 기여함.',
      photoUrl: ''
    },
    {
      id: 'm2_spouse',
      generation: 2,
      name: '밀양 박씨 (朴氏)',
      gender: 'female',
      birthDate: '1882-05-18',
      deathDate: '1960-03-24',
      isDeceased: true,
      memo: '김태식의 처. 가문 내조와 농경 관리를 헌신적으로 하심.',
      photoUrl: ''
    },
    {
      id: 'm3',
      generation: 2,
      name: '김태호 (金泰鎬)',
      gender: 'male',
      birthDate: '1885-09-02',
      deathDate: '1945-03-10',
      isDeceased: true,
      memo: '김선조 파조의 차남. 독립 동화 활동을 은밀히 지원하심.',
      photoUrl: ''
    },
    {
      id: 'm4',
      generation: 3,
      name: '김영수 (金永秀)',
      gender: 'male',
      birthDate: '1910-02-18',
      deathDate: '1980-12-05',
      isDeceased: true,
      memo: '김태식의 장남. 6.25 전후로 전란 중 가보와 족보를 무사히 지켜냄.',
      photoUrl: ''
    },
    {
      id: 'm4_spouse',
      generation: 3,
      name: '경주 이씨 (李氏)',
      gender: 'female',
      birthDate: '1912-10-10',
      deathDate: '1990-04-02',
      isDeceased: true,
      memo: '김영수의 처. 가문 규범을 세우고 효행으로 널리 칭송받음.',
      photoUrl: ''
    },
    {
      id: 'm5',
      generation: 3,
      name: '김영희 (金永姬)',
      gender: 'female',
      birthDate: '1915-06-21',
      deathDate: '1995-10-11',
      isDeceased: true,
      memo: '김태식의 차녀. 영가 가문의 법도를 지키며 자녀 교육에 올인하심.',
      photoUrl: ''
    },
    {
      id: 'm6',
      generation: 3,
      name: '김영철 (金永哲)',
      gender: 'male',
      birthDate: '1920-11-29',
      deathDate: '1990-07-22',
      isDeceased: true,
      memo: '김태호의 장남. 광복 이후 현대식 산업화 농가 개척에 헌신.',
      photoUrl: ''
    },
    {
      id: 'm7',
      generation: 4,
      name: '김진우 (金鎭宇)',
      gender: 'male',
      birthDate: '1940-03-24',
      deathDate: '2015-02-18',
      isDeceased: true,
      memo: '김영수의 장남. 종가 선산을 대대로 지키며 매년 시제를 꼼꼼히 주관함.',
      photoUrl: ''
    },
    {
      id: 'm7_spouse',
      generation: 4,
      name: '최영숙 (崔英淑)',
      gender: 'female',
      birthDate: '1945-09-08',
      isDeceased: false,
      memo: '김진우의 처. 현재 종손 며느리로서 가문의 화합을 주도하심.',
      photoUrl: ''
    },
    {
      id: 'm8',
      generation: 4,
      name: '김진아 (金鎭雅)',
      gender: 'female',
      birthDate: '1948-12-14',
      isDeceased: false,
      memo: '김영수의 장녀. 종가 교육 재단 지원 및 장학 사업에 동참.',
      photoUrl: ''
    },
    {
      id: 'm9',
      generation: 5,
      name: '김민준 (金珉俊)',
      gender: 'male',
      birthDate: '1970-07-05',
      isDeceased: false,
      memo: '김진우의 장남. 현재 대학교수 및 영광종회 보류 청년단장.',
      photoUrl: ''
    },
    {
      id: 'm10',
      generation: 5,
      name: '김서현 (金瑞賢)',
      gender: 'female',
      birthDate: '1975-04-18',
      isDeceased: false,
      memo: '김진우의 장녀. 가문 가훈 서예 전시회를 열고 문화 사업 주도.',
      photoUrl: ''
    }
  ];

  // Relationships template
  const seedRelations: Omit<Relationship, 'id' | 'createdAt'>[] = [
    { fromMemberId: 'm1', toMemberId: 'm2', type: 'parent_child' },
    { fromMemberId: 'm1', toMemberId: 'm3', type: 'parent_child' },
    { fromMemberId: 'm2', toMemberId: 'm2_spouse', type: 'spouse' },
    { fromMemberId: 'm4', toMemberId: 'm4_spouse', type: 'spouse' },
    { fromMemberId: 'm7', toMemberId: 'm7_spouse', type: 'spouse' },
    { fromMemberId: 'm2', toMemberId: 'm3', type: 'sibling' },
    { fromMemberId: 'm4', toMemberId: 'm5', type: 'sibling' },
    { fromMemberId: 'm9', toMemberId: 'm10', type: 'sibling' },
    { fromMemberId: 'm2', toMemberId: 'm4', type: 'parent_child' },
    { fromMemberId: 'm2', toMemberId: 'm5', type: 'parent_child' },
    { fromMemberId: 'm3', toMemberId: 'm6', type: 'parent_child' },
    { fromMemberId: 'm4', toMemberId: 'm7', type: 'parent_child' },
    { fromMemberId: 'm4', toMemberId: 'm8', type: 'parent_child' },
    { fromMemberId: 'm7', toMemberId: 'm9', type: 'parent_child' },
    { fromMemberId: 'm7', toMemberId: 'm10', type: 'parent_child' }
  ];

  const resolvedMembers: FamilyMember[] = [];
  const resolvedRelationships: Relationship[] = [];

  // 1. Build resolved data structure
  for (const sm of seedMembers) {
    const now = new Date().toISOString();
    resolvedMembers.push({
      ...sm,
      createdBy: uid,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const sr of seedRelations) {
    const relId = 'rel_' + Math.random().toString(36).substring(2, 11);
    resolvedRelationships.push({
      ...sr,
      id: relId,
      createdAt: new Date().toISOString()
    });
  }

  // 2. Commit to localStorage first for instant visual response
  setLocalMembers(resolvedMembers);
  setLocalRelations(resolvedRelationships);

  // 3. Try to push onto remote database in background
  try {
    const batch = writeBatch(db);
    for (const m of resolvedMembers) {
      batch.set(doc(db, MEMBERS_COLL, m.id), m);
    }
    for (const r of resolvedRelationships) {
      batch.set(doc(db, RELATIONS_COLL, r.id), r);
    }
    await batch.commit();
  } catch (error) {
    console.warn('Firestore seedInitialClanData sync failed, recorded in local space:', error);
  }

  return { members: resolvedMembers, relationships: resolvedRelationships };
}
