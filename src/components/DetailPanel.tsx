import React from 'react';
import { X, Calendar, Edit3, Trash2, Heart, User, ChevronRight, Link2Off } from 'lucide-react';
import { FamilyMember, Relationship } from '../types';

interface DetailPanelProps {
  member: FamilyMember | null;
  onClose: () => void;
  relationships: Relationship[];
  allMembers: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onSelectMember: (member: FamilyMember) => void;
}

function RelativeRow({
  member,
  onClick,
  icon,
  onDeleteRel,
}: {
  member: FamilyMember;
  onClick: () => void;
  icon?: React.ReactNode;
  onDeleteRel: () => void;
  [key: string]: any;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onClick}
        className="flex-1 flex items-center justify-between p-2.5 text-left text-xs rounded-xl border border-slate-100 hover:border-[#c5a059]/40 hover:bg-amber-50/30 transition-all cursor-pointer bg-slate-50/50"
      >
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <span className="font-semibold text-slate-800">{member.name}</span>
            {member.isExternalSpouse
              ? <span className="text-slate-400 ml-1.5">{member.surname || '외성'}</span>
              : <span className="text-slate-400 ml-1.5">{member.generation}대</span>
            }
          </div>
        </div>
        <ChevronRight size={13} className="text-slate-300" />
      </button>
      <button
        onClick={onDeleteRel}
        title="관계 삭제"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer shrink-0"
      >
        <Link2Off size={13} />
      </button>
    </div>
  );
}

export function DetailPanel({ member, onClose, relationships, allMembers, onEdit, onDelete, onDeleteRelationship, onSelectMember }: DetailPanelProps) {
  if (!member) return null;

  const parentRels = relationships.filter(r => r.type === 'parent_child' && r.toMemberId === member.id);
  const parents = parentRels
    .map(r => ({ rel: r, m: allMembers.find(m => m.id === r.fromMemberId) }))
    .filter((x): x is { rel: Relationship; m: FamilyMember } => !!x.m);

  const childRels = relationships.filter(r => r.type === 'parent_child' && r.fromMemberId === member.id);
  const children = childRels
    .map(r => ({ rel: r, m: allMembers.find(m => m.id === r.toMemberId) }))
    .filter((x): x is { rel: Relationship; m: FamilyMember } => !!x.m);

  const spouseRels = relationships.filter(r => r.type === 'spouse' && (r.fromMemberId === member.id || r.toMemberId === member.id));
  const spouses = spouseRels
    .map(r => ({ rel: r, m: allMembers.find(m => m.id === (r.fromMemberId === member.id ? r.toMemberId : r.fromMemberId)) }))
    .filter((x): x is { rel: Relationship; m: FamilyMember } => !!x.m);

  const siblingRels = relationships.filter(r => r.type === 'sibling' && (r.fromMemberId === member.id || r.toMemberId === member.id));
  const siblings = siblingRels
    .map(r => ({ rel: r, m: allMembers.find(m => m.id === (r.fromMemberId === member.id ? r.toMemberId : r.fromMemberId)) }))
    .filter((x): x is { rel: Relationship; m: FamilyMember } => !!x.m);

  const genderLabel = member.gender === 'male' ? '남성' : member.gender === 'female' ? '여성' : '미상';
  const genderColor = member.gender === 'male' ? '#3b82f6' : member.gender === 'female' ? '#f43f5e' : '#94a3b8';

  const handleDeleteRel = (rel: Relationship) => {
    if (!confirm('이 관계를 삭제할까요?')) return;
    onDeleteRelationship(rel.id);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-88 bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col"
      style={{ width: '360px', transform: member ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease' }}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-100 shrink-0" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-medium text-slate-400">상세 정보</span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} referrerPolicy="no-referrer"
              className={`w-14 h-14 rounded-xl object-cover border-2 border-white/10 ${member.isDeceased ? 'grayscale' : ''}`}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 bg-white/5">
              <User size={24} className="text-slate-400" />
            </div>
          )}

          <div>
            <h2 className="text-base font-bold text-white">{member.name}</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${genderColor}20`, color: genderColor, border: `1px solid ${genderColor}30` }}
              >
                {genderLabel}
              </span>
              {member.isDeceased && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}
                >
                  고인
                </span>
              )}
              {member.isExternalSpouse ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(160,120,48,0.2)', color: '#a07830' }}
                >
                  {member.surname || '외성'} 배우자
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                  {member.generation}대
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Basic Info */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">기본 정보</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-start gap-2.5 text-slate-600">
              <Calendar size={13} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-slate-400 text-[10px]">생년월일</p>
                <p className="font-medium text-slate-700 mt-0.5">{member.birthDate || '기록 없음'}</p>
              </div>
            </div>

            {member.isDeceased && (
              <div className="flex items-start gap-2.5 text-slate-600">
                <Calendar size={13} className="text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-rose-400 text-[10px]">사망일</p>
                  <p className="font-medium text-slate-700 mt-0.5">{member.deathDate || '기록 없음'}</p>
                </div>
              </div>
            )}

            {member.memo && (
              <div className="border-t border-slate-200 pt-3">
                <p className="text-slate-400 text-[10px] mb-1">메모</p>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{member.memo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Family Relations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">가족 관계</p>
            <span className="text-[9px] text-slate-400 flex items-center gap-1">
              <Link2Off size={10} /> 아이콘으로 관계 삭제
            </span>
          </div>

          {spouses.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500">배우자</p>
              {spouses.map(({ rel, m }) => (
                <RelativeRow key={rel.id} member={m} onClick={() => onSelectMember(m)}
                  icon={<Heart size={11} className="text-rose-400" fill="currentColor" />}
                  onDeleteRel={() => handleDeleteRel(rel)}
                />
              ))}
            </div>
          )}

          {parents.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500">부모</p>
              {parents.map(({ rel, m }) => (
                <RelativeRow key={rel.id} member={m} onClick={() => onSelectMember(m)}
                  onDeleteRel={() => handleDeleteRel(rel)}
                />
              ))}
            </div>
          )}

          {children.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500">자녀 ({children.length}명)</p>
              {children.map(({ rel, m }) => (
                <RelativeRow key={rel.id} member={m} onClick={() => onSelectMember(m)}
                  onDeleteRel={() => handleDeleteRel(rel)}
                />
              ))}
            </div>
          )}

          {siblings.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500">형제자매</p>
              {siblings.map(({ rel, m }) => (
                <RelativeRow key={rel.id} member={m} onClick={() => onSelectMember(m)}
                  onDeleteRel={() => handleDeleteRel(rel)}
                />
              ))}
            </div>
          )}

          {spouses.length === 0 && parents.length === 0 && children.length === 0 && siblings.length === 0 && (
            <p className="text-xs text-slate-400 py-2">등록된 가족 관계가 없습니다.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0 bg-slate-50/50">
        <button
          onClick={() => onEdit(member)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
        >
          <Edit3 size={13} />
          <span>정보 수정</span>
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
