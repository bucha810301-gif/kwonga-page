import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Panel,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Edge,
  Node,
  Connection
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
  deleteRelationship,
  getLocalMembers,
  getLocalRelations
} from './services/familyService';
import { layoutFamilyTree } from './utils/treeLayout';

import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { FamilyNode } from './components/FamilyNode';
import { DetailPanel } from './components/DetailPanel';
import { MemberModal } from './components/MemberModal';
import { ConnectModal } from './components/ConnectModal';
import { AdminView } from './components/AdminView';

import { Plus, Minus, Maximize2, BookOpen } from 'lucide-react';

const nodeTypes = { familyNode: FamilyNode };

// Inner component that can use useReactFlow hook (must be inside ReactFlow context)
function FlowControls({ isAdmin, onAddMember }: { isAdmin: boolean; onAddMember: () => void }) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <>
      {/* Bottom-left: usage guide + zoom controls stacked, no overlap */}
      <Panel position="bottom-left">
        <div className="flex flex-col gap-2 m-3">
          {/* Usage guide */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-md p-3 pointer-events-none select-none" style={{ maxWidth: 200 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1.5">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 남성
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> 여성
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> 고인
                </span>
              </div>
            </div>
            <div className="space-y-0.5 text-[10px] text-slate-400">
              <p>• 카드 클릭 → 상세 정보</p>
              <p>• 스크롤 → 줌인 / 줌아웃</p>
              <p>• 드래그 → 화면 이동</p>
              <p>• 핸들 드래그 → 관계 연결</p>
            </div>
          </div>

          {/* Zoom buttons */}
          <div className="flex gap-1.5 pointer-events-auto">
            <button
              onClick={() => zoomIn()}
              className="w-8 h-8 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:shadow-md transition cursor-pointer"
              title="줌 인"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => zoomOut()}
              className="w-8 h-8 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:shadow-md transition cursor-pointer"
              title="줌 아웃"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>
      </Panel>

      {/* Bottom-right: fit view + add member, stacked vertically */}
      <Panel position="bottom-right">
        <div className="flex flex-col gap-2 items-end m-3 pointer-events-auto">
          <button
            onClick={onAddMember}
            className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl shadow-lg text-xs font-semibold transition hover:opacity-90 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
          >
            <Plus size={14} />
            <span>새 가족 등록</span>
          </button>
          <button
            onClick={() => fitView({ padding: 0.15, duration: 400 })}
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-xs font-medium text-slate-600 hover:bg-slate-50 hover:shadow-md transition cursor-pointer"
          >
            <Maximize2 size={13} />
            <span>전체 뷰</span>
          </button>
        </div>
      </Panel>
    </>
  );
}

// Zooms to a single highlighted node (must be inside ReactFlow context)
function SearchFitter({ targetId }: { targetId: string | null }) {
  const { fitView } = useReactFlow();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!targetId || targetId === prevId.current) return;
    prevId.current = targetId;
    const timer = setTimeout(() => {
      fitView({
        nodes: [{ id: targetId }],
        padding: 0.6,
        duration: 550,
        maxZoom: 1.8,
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [targetId, fitView]);

  return null;
}

export default function App() {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>(() => getLocalMembers());
  const [relationships, setRelationships] = useState<Relationship[]>(() => getLocalRelations());
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<FamilyMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [view, setView] = useState<'tree' | 'admin'>('tree');

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
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => { loadData(); }, [loadData]);

  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = layoutFamilyTree(members, relationships);
    const trimmedQuery = searchQuery.trim().toLowerCase();

    const matched: string[] = [];
    const finalNodes = rawNodes.map((n: any) => {
      const member = n.data.member as FamilyMember;
      const isHighlighted = trimmedQuery.length > 0 && (
        member.name.toLowerCase().includes(trimmedQuery) ||
        member.generation.toString() === trimmedQuery ||
        `${member.generation}대` === trimmedQuery
      );
      if (isHighlighted) matched.push(member.id);
      return {
        ...n,
        data: {
          ...n.data,
          isHighlighted,
          isAdmin: userProfile?.role === 'admin',
          onSelect: (selected: FamilyMember) => setSelectedMember(selected)
        }
      };
    });

    // Sort matched IDs by generation descending (highest gen = most recent, shown first)
    const sortedIds = matched.sort((a, b) => {
      const genA = members.find(m => m.id === a)?.generation ?? 0;
      const genB = members.find(m => m.id === b)?.generation ?? 0;
      return genB - genA;
    });

    setNodes(finalNodes);
    setEdges(rawEdges);
    setHighlightedIds(prev => {
      const prevKey = prev.join(',');
      const nextKey = sortedIds.join(',');
      if (prevKey !== nextKey) setCurrentResultIndex(0);
      return sortedIds;
    });
  }, [members, relationships, searchQuery, setNodes, setEdges]);

  const handleJumpToMember = useCallback((target: FamilyMember) => {
    setSelectedMember(target);
  }, []);

  const handleNextResult = useCallback(() => {
    if (highlightedIds.length === 0) return;
    setCurrentResultIndex(i => (i + 1) % highlightedIds.length);
  }, [highlightedIds.length]);

  const handlePrevResult = useCallback(() => {
    if (highlightedIds.length === 0) return;
    setCurrentResultIndex(i => (i - 1 + highlightedIds.length) % highlightedIds.length);
  }, [highlightedIds.length]);

  const handleSaveMember = async (
    memberData: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
    relationData?: { targetId: string; type: any; }
  ) => {
    if (!userProfile) return;
    setLoading(true);
    try {
      if (memberToEdit) {
        await updateFamilyMember(memberToEdit.id, memberData);
        setMembers(prev => prev.map(m => m.id === memberToEdit.id ? { ...m, ...memberData, updatedAt: new Date().toISOString() } : m));
        setSelectedMember(prev => prev && prev.id === memberToEdit.id ? { ...prev, ...memberData } as FamilyMember : prev);
      } else {
        const newMember = await addFamilyMember(memberData, userProfile.id);
        setMembers(prev => [...prev, newMember]);
        if (relationData?.targetId) {
          let fromId: string;
          let toId: string;
          let relType: any;
          if (relationData.type === 'parent_child') {
            // target is parent, newMember is child
            fromId = relationData.targetId;
            toId = newMember.id;
            relType = 'parent_child';
          } else if (relationData.type === 'parent') {
            // newMember is parent, target is child
            fromId = newMember.id;
            toId = relationData.targetId;
            relType = 'parent_child';
          } else {
            fromId = newMember.id;
            toId = relationData.targetId;
            relType = relationData.type;
          }
          const newRel = await addRelationship(fromId, toId, relType);
          setRelationships(prev => [...prev, newRel]);
        }
      }
      setIsModalOpen(false);
      setMemberToEdit(null);
    } catch (e) {
      alert('저장 중 오류가 발생했습니다: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    setLoading(true);
    try {
      await deleteRelationship(relationshipId);
      setRelationships(prev => prev.filter(r => r.id !== relationshipId));
    } catch (e) {
      alert('관계 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('이 가족 구성원과 관련된 모든 관계 정보가 삭제됩니다. 계속할까요?')) return;
    setLoading(true);
    try {
      await deleteFamilyMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setRelationships(prev => prev.filter(r => r.fromMemberId !== memberId && r.toMemberId !== memberId));
      setSelectedMember(null);
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setPendingConnection({ source: connection.source, target: connection.target });
  }, []);

  const handleConfirmConnect = async (type: any, fromId: string, toId: string) => {
    setLoading(true);
    try {
      const newRel = await addRelationship(fromId, toId, type);
      setRelationships(prev => [...prev, newRel]);
    } catch (e) {
      alert('관계 연결 중 오류가 발생했습니다: ' + String(e));
    } finally {
      setLoading(false);
      setPendingConnection(null);
    }
  };

  const handleLogout = () => setUserProfile(null);
  const openAddModal = useCallback(() => { setMemberToEdit(null); setIsModalOpen(true); }, []);

  if (!userProfile) return <LoginView onLoginSuccess={setUserProfile} />;

  const isAdmin = userProfile.role === 'admin';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
      <Header
        userProfile={userProfile}
        onLogout={handleLogout}
        onSearch={(q) => { setSearchQuery(q); }}
        onAddMember={openAddModal}
        hasMembers={members.length > 0}
        memberCount={members.length}
        searchResultCount={searchQuery.trim() ? highlightedIds.length : undefined}
        currentResultIndex={searchQuery.trim() && highlightedIds.length > 0 ? currentResultIndex : undefined}
        onNextResult={handleNextResult}
        onPrevResult={handlePrevResult}
        view={view}
        onViewChange={setView}
      />

      <div className="flex-1 relative overflow-hidden flex">
        {view === 'admin' ? (
          <AdminView
            members={members}
            relationships={relationships}
            onEdit={m => { setMemberToEdit(m); setIsModalOpen(true); }}
            onDelete={handleDeleteMember}
          />
        ) : null}
        <div className={`flex-1 relative flex flex-col md:flex-row h-full overflow-hidden ${view === 'admin' ? 'hidden' : ''}`}>
          <div className="flex-1 h-full relative">
            {members.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-cultural-canvas">
                <div className="max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
                    <BookOpen className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">아직 등록된 가족이 없어요</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                      {isAdmin ? '아래 버튼을 눌러 첫 번째 가족 구성원을 등록해보세요.' : '관리자가 가족을 등록하면 이곳에 가계도가 나타납니다.'}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={openAddModal}
                      className="flex items-center gap-1.5 px-5 py-2.5 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
                    >
                      <Plus size={14} />
                      <span>새 가족 등록</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                nodeTypes={nodeTypes}
                nodesDraggable={false}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                className="bg-cultural-canvas"
              >
                <Background color="#e2e8f0" gap={28} size={1} />
                <MiniMap
                  position="top-right"
                  nodeColor={(n: any) => {
                    if (n.data?.member?.isDeceased) return '#94a3b8';
                    return n.data?.member?.gender === 'male' ? '#3b82f6' : '#f43f5e';
                  }}
                  nodeStrokeWidth={2}
                  maskColor="rgba(248,250,252,0.6)"
                  className="!bg-white !rounded-xl !border !border-slate-200 !shadow-md hidden sm:block"
                />
                <FlowControls isAdmin={isAdmin} onAddMember={openAddModal} />
                <SearchFitter targetId={highlightedIds[currentResultIndex] ?? null} />
              </ReactFlow>
            )}
          </div>

          <DetailPanel
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            relationships={relationships}
            allMembers={members}
            onEdit={m => { setMemberToEdit(m); setIsModalOpen(true); }}
            onDelete={handleDeleteMember}
            onDeleteRelationship={handleDeleteRelationship}
            onSelectMember={handleJumpToMember}
          />
        </div>
      </div>

      {isModalOpen && (
        <MemberModal
          member={memberToEdit}
          onClose={() => { setIsModalOpen(false); setMemberToEdit(null); }}
          onSave={handleSaveMember}
          allMembers={members}
        />
      )}

      {pendingConnection && (
        <ConnectModal
          sourceId={pendingConnection.source}
          targetId={pendingConnection.target}
          allMembers={members}
          onConfirm={handleConfirmConnect}
          onCancel={() => setPendingConnection(null)}
        />
      )}
    </div>
  );
}
