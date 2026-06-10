import React from 'react';
import { X, Calendar, Edit3, Trash2, Heart, User, ChevronRight, MessageSquareOff } from 'lucide-react';
import { FamilyMember, Relationship } from '../types';

interface DetailPanelProps {
  member: FamilyMember | null;
  onClose: () => void;
  relationships: Relationship[];
  allMembers: FamilyMember[];
  isAdmin: boolean;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  onSelectMember: (member: FamilyMember) => void; // Click to jump to relationship relative
}

export function DetailPanel({
  member,
  onClose,
  relationships,
  allMembers,
  isAdmin,
  onEdit,
  onDelete,
  onSelectMember
}: DetailPanelProps) {
  if (!member) return null;

  // Find relationships for this member
  const parents = relationships
    .filter(r => r.type === 'parent_child' && r.toMemberId === member.id)
    .map(r => allMembers.find(m => m.id === r.fromMemberId))
    .filter((m): m is FamilyMember => !!m);

  const children = relationships
    .filter(r => r.type === 'parent_child' && r.fromMemberId === member.id)
    .map(r => allMembers.find(m => m.id === r.toMemberId))
    .filter((m): m is FamilyMember => !!m);

  const spouses = relationships
    .filter(r => r.type === 'spouse' && (r.fromMemberId === member.id || r.toMemberId === member.id))
    .map(r => {
      const spouseId = r.fromMemberId === member.id ? r.toMemberId : r.fromMemberId;
      return allMembers.find(m => m.id === spouseId);
    })
    .filter((m): m is FamilyMember => !!m);

  const siblings = relationships
    .filter(r => r.type === 'sibling' && (r.fromMemberId === member.id || r.toMemberId === member.id))
    .map(r => {
      const siblingId = r.fromMemberId === member.id ? r.toMemberId : r.fromMemberId;
      return allMembers.find(m => m.id === siblingId);
    })
    .filter((m): m is FamilyMember => !!m);

  const isDeceased = member.isDeceased;

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${
      member ? 'translate-x-0' : 'translate-x-full'
    } flex flex-col`}>
      {/* Elegant Cultural Header including Profile Info */}
      <div className="p-6 bg-cultural-navy text-white flex flex-col shrink-0 border-b-4 border-cultural-gold">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-serif font-bold text-sm tracking-wide flex items-center space-x-2">
            <span className="text-cultural-gold font-semibold">族譜 詳情</span>
            <span className="text-white/70 text-xs">(족보 상세 정보)</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#162a45] rounded-full transition text-slate-300 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative shrink-0">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                referrerPolicy="no-referrer"
                className={`w-16 h-16 rounded-xl object-cover border-2 shadow-md ${
                  isDeceased ? 'border-slate-300 grayscale' : 'border-white/20'
                }`}
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center border-2 ${
                  member.gender === 'male'
                    ? 'bg-blue-50/10 text-blue-200 border-white/10'
                    : member.gender === 'female'
                    ? 'bg-rose-50/10 text-rose-200 border-white/10'
                    : 'bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <User size={30} />
              </div>
            )}
            {/* Generation Badge */}
            <span className="absolute -bottom-1 -right-1 bg-cultural-gold text-white border border-white/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
              {member.generation}代
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold font-serif tracking-wider text-white">{member.name}</h2>
            <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                member.gender === 'male' ? 'bg-blue-500/20 text-blue-200' : member.gender === 'female' ? 'bg-rose-500/20 text-rose-200' : 'bg-slate-500/20 text-slate-300'
              }`}>
                {member.gender === 'male' ? '남성 (男)' : member.gender === 'female' ? '여성 (女)' : '성별 미상'}
              </span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                isDeceased ? 'bg-slate-500/30 text-slate-300' : 'bg-emerald-550/20 text-emerald-200'
              }`}>
                {isDeceased ? '고인 (卒)' : '생존(生存)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Life dates and bio details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 border-l-4 border-cultural-gold pl-2 tracking-wider font-serif uppercase">세목정보 (상세 정보)</h4>
          <div className="bg-[#fdfdfb] border border-slate-200/50 rounded-xl p-4 space-y-3.5 text-xs">
            <div className="flex items-center space-x-3 text-slate-600">
              <Calendar size={15} className="text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700">생년월일 (出生)</p>
                <p className="text-slate-600 mt-0.5">{member.birthDate || '기록 없음'}</p>
              </div>
            </div>
            
            {isDeceased && (
              <div className="flex items-center space-x-3 text-slate-600">
                <Calendar size={15} className="text-rose-400" />
                <div>
                  <p className="font-semibold text-rose-700">사망년월일 (卒去)</p>
                  <p className="text-slate-600 mt-0.5">{member.deathDate || '기록 없음 (고인)'}</p>
                </div>
              </div>
            )}

            {member.memo && (
              <div className="border-t border-slate-200/60 pt-3 mt-2">
                <p className="font-semibold text-slate-700 mb-1">인적 사적 (메모)</p>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-white/60 p-2.5 rounded-lg border border-slate-100">
                  {member.memo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Relatives list */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-700 border-l-4 border-cultural-gold pl-2 tracking-wider font-serif uppercase">가족관계 (直系 關係)</h4>
          
          {/* Spouses */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">배우자 (配偶子)</p>
            {spouses.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5">
                {spouses.map(sp => (
                  <button
                    key={sp.id}
                    onClick={() => onSelectMember(sp)}
                    className="flex items-center justify-between p-2.5 text-left text-xs text-slate-700 bg-[#fdfdfb]/55 border border-slate-200 hover:border-cultural-gold/50 rounded-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Heart size={13} className="text-rose-500" fill="currentColor" />
                      <span className="font-semibold font-serif text-slate-800">{sp.name}</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">기록된 배우자가 없습니다.</p>
            )}
          </div>

          {/* Parents */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">부모 (父母)</p>
            {parents.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5">
                {parents.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelectMember(p)}
                    className="flex items-center justify-between p-2.5 text-left text-xs text-slate-700 bg-[#fdfdfb]/55 border border-slate-200 hover:border-cultural-gold/50 rounded-lg transition-all cursor-pointer"
                  >
                    <span className="font-semibold font-serif text-slate-800">{p.name} ({p.generation}代)</span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">기록된 부모가 없습니다.</p>
            )}
          </div>

          {/* Children */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">자녀 (子女)</p>
            {children.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5">
                {children.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onSelectMember(c)}
                    className="flex items-center justify-between p-2.5 text-left text-xs text-slate-700 bg-[#fdfdfb]/55 border border-slate-200 hover:border-cultural-gold/50 rounded-lg transition-all cursor-pointer"
                  >
                    <span className="font-semibold font-serif text-slate-800">{c.name} ({c.generation}代)</span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">기록된 자녀가 없습니다.</p>
            )}
          </div>

          {/* Siblings */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">형제자매 (兄弟姉妹)</p>
            {siblings.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5">
                {siblings.map(sib => (
                  <button
                    key={sib.id}
                    onClick={() => onSelectMember(sib)}
                    className="flex items-center justify-between p-2.5 text-left text-xs text-slate-700 bg-[#fdfdfb]/55 border border-slate-200 hover:border-cultural-gold/50 rounded-lg transition-all cursor-pointer"
                  >
                    <span className="font-semibold font-serif text-slate-800">{sib.name} ({sib.generation}代)</span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">기록된 형제자매가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Action Bar */}
      {isAdmin && (
        <div className="p-5 bg-slate-50 border-t border-slate-200/60 flex flex-col space-y-2 shrink-0">
          <button
            onClick={() => onEdit(member)}
            className="w-full bg-cultural-navy text-white py-2.5 rounded-lg font-bold text-xs hover:bg-[#203f69] transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Edit3 size={13} />
            <span>생애 단장 (기록 수정)</span>
          </button>
          
          <button
            onClick={() => onDelete(member.id)}
            className="w-full border border-slate-250 text-slate-500 py-2 rounded-lg font-semibold text-xs hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>기록 공제 (기록 삭제)</span>
          </button>
        </div>
      )}
    </div>
  );
}
