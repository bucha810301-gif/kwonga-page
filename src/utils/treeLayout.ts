import { FamilyMember, Relationship } from '../types';

/**
 * Tidy-tree layout algorithm for the family tree.
 *
 * Each parent (or parent couple) is centered above its own children, and every
 * subtree occupies its own non-overlapping horizontal range. This guarantees:
 * - No parent/child line ever crosses a sibling branch's line.
 * - Within a family, children are ordered left-to-right by birth order
 *   (eldest first), so the "eldest son's eldest son's eldest son" line stays
 *   the leftmost branch of the whole tree.
 *
 * Y-axis: generation number (Y = (generation - 1) * 260 + 80), same as before.
 * X-axis: computed recursively — a leaf gets the next open slot, a parent is
 * centered over the span of its children.
 */
export function layoutFamilyTree(
  members: FamilyMember[],
  relationships: Relationship[]
) {
  const nodes: any[] = [];
  const edges: any[] = [];

  const memberById = new Map(members.map(m => [m.id, m]));

  // parentId -> childId[], childId -> parentId (each child has one recorded parent)
  const childrenOf = new Map<string, string[]>();
  const parentOf = new Map<string, string>();
  for (const r of relationships) {
    if (r.type !== 'parent_child') continue;
    if (!memberById.has(r.fromMemberId) || !memberById.has(r.toMemberId)) continue;
    if (!childrenOf.has(r.fromMemberId)) childrenOf.set(r.fromMemberId, []);
    childrenOf.get(r.fromMemberId)!.push(r.toMemberId);
    if (!parentOf.has(r.toMemberId)) parentOf.set(r.toMemberId, r.fromMemberId);
  }

  // id -> spouseId (bidirectional), id -> spouse relationship id
  const spouseOf = new Map<string, string>();
  const spouseRelId = new Map<string, string>();
  for (const r of relationships) {
    if (r.type !== 'spouse') continue;
    if (!memberById.has(r.fromMemberId) || !memberById.has(r.toMemberId)) continue;
    spouseOf.set(r.fromMemberId, r.toMemberId);
    spouseOf.set(r.toMemberId, r.fromMemberId);
    spouseRelId.set(r.fromMemberId, r.id);
    spouseRelId.set(r.toMemberId, r.id);
  }

  const SPACING_X = 340; // horizontal gap reserved per leaf/single member
  const SPOUSE_OFFSET = 300; // gap between a couple's two nodes
  let cursorX = 0;

  const placed = new Set<string>();

  // Eldest-first: sort by birthDate when known; keep original (entry) order
  // when a date is missing, instead of pushing undated members to the end.
  function sortSiblings(ids: string[]): string[] {
    return [...ids].sort((a, b) => {
      const da = memberById.get(a)?.birthDate;
      const db = memberById.get(b)?.birthDate;
      if (da && db) return da.localeCompare(db);
      return 0;
    });
  }

  function coupleChildren(id: string, spouseId: string | undefined): string[] {
    const set = new Set<string>(childrenOf.get(id) ?? []);
    if (spouseId) for (const c of childrenOf.get(spouseId) ?? []) set.add(c);
    return sortSiblings([...set].filter(c => !placed.has(c)));
  }

  function posY(m: FamilyMember) {
    return (m.generation - 1) * 260 + 80;
  }

  function addSpouseEdge(a: FamilyMember, b: FamilyMember, relId: string) {
    edges.push({
      id: `edge-spouse-${relId}`,
      source: a.gender === 'male' ? a.id : b.id,
      target: a.gender === 'male' ? b.id : a.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'straight',
      animated: false,
      style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '5,5' },
      label: '배우자',
      labelStyle: { fill: '#be123c', fontSize: 10, fontWeight: 'bold' },
    });
  }

  // Places a member (and their spouse, if any) plus their whole subtree.
  // Returns the horizontal center of the couple, used by the caller (the
  // parent one level up) to center itself over its children.
  function placeCouple(id: string): number | null {
    if (placed.has(id)) return null;
    const m = memberById.get(id);
    if (!m) return null;
    placed.add(id);

    const spouseId = spouseOf.get(id);
    const spouse = spouseId && !placed.has(spouseId) ? memberById.get(spouseId) : undefined;
    if (spouse) placed.add(spouseId!);

    const children = coupleChildren(id, spouseId);

    let center: number;
    if (children.length === 0) {
      center = cursorX;
      cursorX += SPACING_X + (spouse ? SPOUSE_OFFSET : 0);
    } else {
      const childCenters = children
        .map(cid => placeCouple(cid))
        .filter((x): x is number => x !== null);
      center = childCenters.length > 0
        ? (childCenters[0] + childCenters[childCenters.length - 1]) / 2
        : cursorX;
      if (childCenters.length === 0) cursorX += SPACING_X + (spouse ? SPOUSE_OFFSET : 0);
    }

    const half = spouse ? SPOUSE_OFFSET / 2 : 0;
    const mX = center - half;

    nodes.push({
      id: m.id,
      type: 'familyNode',
      position: { x: mX, y: posY(m) },
      data: { member: m, isHighlighted: false },
    });

    if (spouse) {
      const spouseX = center + half;
      nodes.push({
        id: spouse.id,
        type: 'familyNode',
        position: { x: spouseX, y: posY(spouse) },
        data: { member: spouse, isHighlighted: false },
      });
      addSpouseEdge(m, spouse, spouseRelId.get(id)!);
    }

    return center;
  }

  // Roots: members with no recorded parent. Ordered by generation, then
  // birth order, so founding lines are laid out left-to-right consistently.
  const rootIds = members
    .filter(m => !parentOf.has(m.id))
    .sort((a, b) => {
      if (a.generation !== b.generation) return a.generation - b.generation;
      const da = a.birthDate, db = b.birthDate;
      if (da && db) return da.localeCompare(db);
      return 0;
    })
    .map(m => m.id);

  for (const id of rootIds) {
    placeCouple(id);
  }

  // Safety net: anyone unreachable from a root (dangling parent reference,
  // orphaned data, etc.) still gets placed rather than silently disappearing.
  const leftover = members.filter(m => !placed.has(m.id));
  for (const m of leftover) {
    placeCouple(m.id);
  }

  // Parent-child edges
  for (const r of relationships) {
    if (r.type !== 'parent_child') continue;
    const parent = memberById.get(r.fromMemberId);
    const child = memberById.get(r.toMemberId);
    if (!parent || !child) continue;

    edges.push({
      id: `edge-pc-${r.id}`,
      source: parent.id,
      target: child.id,
      sourceHandle: 'conn',
      targetHandle: null,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#1e3a5f', strokeWidth: 2 },
      markerEnd: {
        type: 'arrowclosed',
        width: 15,
        height: 15,
        color: '#1e3a5f',
      },
    });
  }

  return { nodes, edges };
}
