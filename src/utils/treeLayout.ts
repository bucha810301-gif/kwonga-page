import { FamilyMember, Relationship } from '../types';

/**
 * Custom lightweight layout algorithm to arrange family tree nodes hierarchically.
 * It places:
 * - Generations along the Y-axis (Y = generation * 220)
 * - Siblings and members in the same generation along the X-axis
 * - Spouses directly next to each other
 */
export function layoutFamilyTree(
  members: FamilyMember[],
  relationships: Relationship[]
) {
  const nodes: any[] = [];
  const edges: any[] = [];

  // Group members by generation
  const generationGroups: { [gen: number]: FamilyMember[] } = {};
  const processedMemberIds = new Set<string>();

  // Sort members by birth date so siblings appear chronologically
  const sortedMembers = [...members].sort((a, b) => {
    const dateA = a.birthDate || '9999-12-31';
    const dateB = b.birthDate || '9999-12-31';
    return dateA.localeCompare(dateB);
  });

  // Group members by generation
  for (const m of sortedMembers) {
    const gen = m.generation;
    if (!generationGroups[gen]) {
      generationGroups[gen] = [];
    }
    generationGroups[gen].push(m);
  }

  // Get relationships lists for easy lookup
  const spouseRelations = relationships.filter(r => r.type === 'spouse');
  const parentChildRelations = relationships.filter(r => r.type === 'parent_child');

  // Let's compute positions
  const generations = Object.keys(generationGroups).map(Number).sort((a, b) => a - b);

  for (const gen of generations) {
    const genMembers = generationGroups[gen];
    let currentX = 0;
    const spacingX = 340; // Space between nodes/couples
    const spouseOffset = 300; // Offset between spouses

    const visitedInGen = new Set<string>();

    for (const m of genMembers) {
      if (visitedInGen.has(m.id)) continue;

      // Find if this member has a spouse in the SAME generation
      const spouseRelation = spouseRelations.find(
        r => r.fromMemberId === m.id || r.toMemberId === m.id
      );

      let spouse: FamilyMember | undefined;
      let relationDocId = '';
      if (spouseRelation) {
        const spouseId = spouseRelation.fromMemberId === m.id ? spouseRelation.toMemberId : spouseRelation.fromMemberId;
        spouse = genMembers.find(sm => sm.id === spouseId);
        relationDocId = spouseRelation.id;
      }

      const posY = (gen - 1) * 260 + 80;

      // Position first member
      const memberX = currentX;
      nodes.push({
        id: m.id,
        type: 'familyNode',
        position: { x: memberX, y: posY },
        data: {
          member: m,
          isHighlighted: false
        }
      });
      visitedInGen.add(m.id);

      if (spouse) {
        // Position spouse directly to the right
        const spouseX = currentX + spouseOffset;
        nodes.push({
          id: spouse.id,
          type: 'familyNode',
          position: { x: spouseX, y: posY },
          data: {
            member: spouse,
            isHighlighted: false
          }
        });
        visitedInGen.add(spouse.id);

        // Create horizontal dashed relationship edge for spouses
        // Direct Spouse Line
        edges.push({
          id: `edge-spouse-${relationDocId}`,
          source: m.gender === 'male' ? m.id : spouse.id,
          target: m.gender === 'male' ? spouse.id : m.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'straight',
          animated: false,
          style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '5,5' },
          label: '배우자',
          labelStyle: { fill: '#be123c', fontSize: 10, fontWeight: 'bold' }
        });

        currentX += spouseOffset + spacingX;
      } else {
        currentX += spacingX;
      }
    }
  }

  // Create Parent-Child edges
  for (const pc of parentChildRelations) {
    const parent = members.find(m => m.id === pc.fromMemberId);
    const child = members.find(m => m.id === pc.toMemberId);

    if (parent && child) {
      // Find if parent has a spouse. If so, let's connect from parent or spouse?
      // In professional layout, we connect top of child to bottom of parents' connection
      // For general React Flow, we connect from the parent's bottom handle to the child's top handle
      edges.push({
        id: `edge-pc-${pc.id}`,
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
  }

  return { nodes, edges };
}
