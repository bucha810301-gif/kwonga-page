import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Profile, FamilyMember, Relationship } from './types';
import {
  fetchFamilyMembers,
  fetchRelationships,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  addRelationship,
  seedInitialClanData,
  getLocalMembers,
  getLocalRelations
} from './services/familyService';
import { layoutFamilyTree } from './utils/treeLayout';

import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { FamilyNode } from './components/FamilyNode';
import { DetailPanel } from './components/DetailPanel';
import { MemberModal } from './components/MemberModal';
import { AdminPanel } from './components/AdminPanel';

import { Plus, HelpCircle, Users, Activity, Sparkles, BookOpen } from 'lucide-react';

const nodeTypes = {
  familyNode: FamilyNode
};

export default function App() {
  // Auth state
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Active view
  const [currentView, setView] = useState<'tree' | 'admin'>('tree');

  // Biography DB States (Initialized with localStorage fast caches for instant load)
  const [members, setMembers] = useState<FamilyMember[]>(() => getLocalMembers());
  const [relationships, setRelationships] = useState<Relationship[]>(() => getLocalRelations());
  const [loading, setLoading] = useState(false);

  // Layout-calculated visual nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Selected relative and modal triggers
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<FamilyMember | null>(null);

  // Search Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch entire family records
  const loadData = useCallback(async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const [membersList, relationsList] = await Promise.all([
        fetchFamilyMembers(),
        fetchRelationships()
      ]);
      setMembers(membersList);
      setRelationships(relationsList);
    } catch (err) {
      console.error('기록 로드 실패: ', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Generate tree positions dynamically when raw data or search query updates
  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = layoutFamilyTree(members, relationships);

    // If query exists, highlight matching elements
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const finalNodes = rawNodes.map((n: any) => {
      const member = n.data.member as FamilyMember;
      let isHighlighted = false;

      if (trimmedQuery.length > 0) {
        const matchesName = member.name.toLowerCase().includes(trimmedQuery);
        const matchesGen = member.generation.toString() === trimmedQuery ||
                           `${member.generation}대` === trimmedQuery ||
                           `${member.generation}代` === trimmedQuery;
        isHighlighted = matchesName || matchesGen;
      }

      return {
        ...n,
        data: {
          ...n.data,
          isHighlighted,
          onSelect: (selected: FamilyMember) => {
            setSelectedMember(selected);
          }
        }
      };
    });

    setNodes(finalNodes);
    setEdges(rawEdges);
  }, [members, relationships, searchQuery, setNodes, setEdges]);

  // Seeding initial Younggwang genealogical trace
  const handleSeedData = async () => {
    if (!userProfile) return;
    if (!confirm('영광종회의 1대~5대 모범 역사 가훈 및 13인 가로족보를 데이터베이스에 수록하시겠습니까?')) {
      return;
    }
    setLoading(true);
    try {
      const result = await seedInitialClanData(userProfile.id);
      setMembers(result.members);
      setRelationships(result.relationships);
    } catch (err) {
      alert('기준 족보 세팅 중 기밀 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Selection Jump triggered inside slide details
  const handleJumpToMember = useCallback((target: FamilyMember) => {
    setSelectedMember(target);
  }, []);

  // Creation or Edition save trigger
  const handleSaveMember = async (
    memberData: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
    relationData?: { targetId: string; type: any }
  ) => {
    if (!userProfile) return;
    setLoading(true);
    try {
      if (memberToEdit) {
        // Edit Operation
        await updateFamilyMember(memberToEdit.id, memberData);
        setMembers(prev =>
          prev.map(m => (m.id === memberToEdit.id ? { ...m, ...memberData, updatedAt: new Date().toISOString() } : m))
        );
        // Sync open detail view
        setSelectedMember(prev => prev && prev.id === memberToEdit.id ? { ...prev, ...memberData } as FamilyMember : prev);
      } else {
        // Creation Operation
        const newMember = await addFamilyMember(memberData, userProfile.id);
        setMembers(prev => [...prev, newMember]);

        // Connect direct lineage immediately if defined
        if (relationData && relationData.targetId) {
          // If relationship is spouse/sibling, it's reciprocal or basic link
          // If relationship is parent_child and target is specified as 'parent', then newly created is 'child'
          const fromId = relationData.type === 'parent_child' ? relationData.targetId : newMember.id;
          const toId = relationData.type === 'parent_child' ? newMember.id : relationData.targetId;

          const newRel = await addRelationship(fromId, toId, relationData.type);
          setRelationships(prev => [...prev, newRel]);
        }
      }
      setIsModalOpen(false);
      setMemberToEdit(null);
    } catch (e) {
      alert('기록 수록 중 권한 성사에 오류가 생겼습니다: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('해당 가인의 족보 기록 및 연계된 모든 부부/친자/형제 관계선이 모두 삭제됩니다. 계속하시겠습니까?')) {
      return;
    }
    setLoading(true);
    try {
      await deleteFamilyMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setRelationships(prev => prev.filter(r => r.fromMemberId !== memberId && r.toMemberId !== memberId));
      setSelectedMember(null);
    } catch (e) {
      alert('기록 공제 중 오류가 생겼습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Authorization toggle logic
  const handleLogout = () => {
    setUserProfile(null);
    setView('tree');
  };

  // If not logged-in, enforce compliance redirect view
  if (!userProfile) {
    return <LoginView onLoginSuccess={setUserProfile} />;
  }

  const isAdmin = userProfile.role === 'admin';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
      {/* Top Navigation */}
      <Header
        currentView={currentView}
        setView={setView}
        userProfile={userProfile}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        onSeedData={handleSeedData}
        hasMembers={members.length > 0}
      />

      {/* Main Screen Router */}
      <div className="flex-1 relative overflow-hidden flex">
        {currentView === 'admin' ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <AdminPanel onBack={() => setView('tree')} currentUserUid={userProfile.id} />
          </div>
        ) : (
          /* Tree Visualization Area */
          <div className="flex-1 relative flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Tree Map Stage */}
            <div className="flex-1 h-full relative" id="react-flow-container">
              {members.length === 0 ? (
                /* No data empty state */
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-cultural-canvas bg-repeat">
                  <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border-2 border-cultural-gold/25 flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-cultural-gold/10 flex items-center justify-center border-2 border-cultural-gold/50">
                      <BookOpen className="text-cultural-gold w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold font-serif text-cultural-navy">
                      영광종회 가계도 장부가 비어있습니다.
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-serif">
                      오른쪽 상단의 <b className="text-cultural-gold">기초 가록(족보) 심기</b> 버튼을 클릭하여 5대 가업 계보를 즉각 생성하거나, 아래 버튼으로 신규 선조를 한명씩 수록해 보십시오.
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setMemberToEdit(null);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center space-x-1.5 px-5 py-2.5 bg-cultural-navy hover:bg-[#1f3d64] border border-cultural-gold text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>신규 시조 등록하기</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* React Flow Render block */
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.15 }}
                  className="bg-cultural-canvas bg-repeat"
                >
                  <Background color="#cbd5e1" gap={20} size={1} />
                  <Controls className="!bg-[#fdfdfb] !shadow-lg !rounded-xl !border-2 !border-cultural-gold/25 !text-cultural-navy" />
                  <MiniMap
                    nodeColor={(n: any) => {
                      if (n.data?.member?.isDeceased) return '#94a3b8';
                      return n.data?.member?.gender === 'male' ? '#3b82f6' : '#ec4899';
                    }}
                    nodeStrokeWidth={3}
                    maskColor="rgba(245, 245, 240, 0.45)"
                    className="!bg-[#fdfdfb] !rounded-xl !border-2 !border-cultural-gold/25 !shadow-lg hidden sm:block"
                  />
                </ReactFlow>
              )}

              {/* Float helper description block */}
              {members.length > 0 && (
                <div className="absolute bottom-5 left-5 bg-[#fdfdfb]/95 backdrop-blur-xs p-4 rounded-xl border-2 border-cultural-gold/25 shadow-xl text-[10px] space-y-2.5 z-10 max-w-xs leading-relaxed pointer-events-none select-none">
                  <p className="font-bold text-cultural-navy font-serif text-xs border-b border-cultural-gold/20 pb-1.5">문중 가계도 례식 (범례)</p>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block shadow-inner" />
                      <span className="font-serif">남성 (男)</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block shadow-inner" />
                      <span className="font-serif">여성 (女)</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full inline-block shadow-inner" />
                      <span className="font-serif">고인 (卒)</span>
                    </span>
                  </div>
                  <p className="text-slate-500 font-serif leading-relaxed">
                    * 인물을 클릭하면 생내 사적 및 자녀, 배우자의 상세 일람이 열립니다. 마우스 휠로 줌인/줌아웃, 드래그로 화면 이동이 가능합니다.
                  </p>
                </div>
              )}

              {/* Admin register floating trigger */}
              {isAdmin && members.length > 0 && (
                <button
                  onClick={() => {
                    setMemberToEdit(null);
                    setIsModalOpen(true);
                  }}
                  title="신규 종원 추가"
                  className="absolute bottom-5 right-5 w-12 h-12 bg-cultural-navy hover:bg-[#1a3354] text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-cultural-gold transition-all duration-300 hover:rotate-90 z-20 cursor-pointer"
                >
                  <Plus size={24} strokeWidth={2.5} className="text-cultural-gold" />
                </button>
              )}
            </div>

            {/* Sidebar detail drawer slide-out panel */}
            <DetailPanel
              member={selectedMember}
              onClose={() => setSelectedMember(null)}
              relationships={relationships}
              allMembers={members}
              isAdmin={isAdmin}
              onEdit={m => {
                setMemberToEdit(m);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteMember}
              onSelectMember={handleJumpToMember}
            />
          </div>
        )}
      </div>

      {/* Editor Modal Overlay for Creation & Mode updates */}
      {isModalOpen && (
        <MemberModal
          member={memberToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setMemberToEdit(null);
          }}
          onSave={handleSaveMember}
          allMembers={members}
        />
      )}
    </div>
  );
}
