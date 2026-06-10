import React, { useState, useMemo } from 'react';
import { FamilyMember, Relationship } from '../types';
import { Search, Edit3, Trash2, Users, ChevronUp, ChevronDown } from 'lucide-react';

interface AdminViewProps {
  members: FamilyMember[];
  relationships: Relationship[];
  isAdmin?: boolean;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
}

type SortKey = 'generation' | 'name' | 'birthDate';
type SortDir = 'asc' | 'desc';

export function AdminView({ members, relationships, isAdmin = false, onEdit, onDelete }: AdminViewProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('generation');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const stats = useMemo(() => {
    const genMap: Record<number, number> = {};
    members.forEach(m => { genMap[m.generation] = (genMap[m.generation] ?? 0) + 1; });
    return {
      total: members.length,
      deceased: members.filter(m => m.isDeceased).length,
      external: members.filter(m => m.isExternalSpouse).length,
      generations: Object.entries(genMap).sort((a, b) => Number(a[0]) - Number(b[0])),
    };
  }, [members]);

  // 외성 배우자 → 배우자 이름 라벨 미리 계산
  const spouseLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach(m => {
      if (!m.isExternalSpouse) return;
      const rel = relationships.find(r => r.type === 'spouse' && (r.fromMemberId === m.id || r.toMemberId === m.id));
      if (!rel) return;
      const spouseId = rel.fromMemberId === m.id ? rel.toMemberId : rel.fromMemberId;
      const spouse = members.find(s => s.id === spouseId);
      if (spouse) map[m.id] = `(${spouse.generation}대 ${spouse.name}의 배우자)`;
    });
    return map;
  }, [members, relationships]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter(m =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.generation.toString().includes(q) ||
        (m.memo ?? '').toLowerCase().includes(q) ||
        (m.surname ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        if (sortKey === 'generation') { va = a.generation; vb = b.generation; }
        else if (sortKey === 'name') { va = a.name; vb = b.name; }
        else if (sortKey === 'birthDate') { va = a.birthDate ?? '9999'; vb = b.birthDate ?? '9999'; }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [members, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={12} className="text-slate-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-[#c5a059]" /> : <ChevronDown size={12} className="text-[#c5a059]" />;
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 min-h-0">

      {/* Stats bar */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-100 flex gap-4 md:gap-6 flex-wrap">
        <StatCard label="총 구성원" value={stats.total} unit="명" color="#1e3a5f" />
        <StatCard label="고인" value={stats.deceased} unit="명" color="#94a3b8" />
        <StatCard label="외성 배우자" value={stats.external} unit="명" color="#a07830" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">세대 분포</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.generations.map(([gen, cnt]) => (
              <span key={gen} className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#1e3a5f15', color: '#1e3a5f' }}>
                {gen}대 {cnt}명
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 md:px-6 md:py-3 bg-white border-b border-slate-100">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="이름, 세대, 메모 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1e3a5f] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden overflow-auto px-3 py-3 space-y-2.5" style={{ flex: '1 1 0', minHeight: 0 }}>
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">검색 결과가 없습니다</p>
        ) : filtered.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex items-center gap-3">
            {m.photoUrl ? (
              <img src={m.photoUrl} alt={m.name} className={`w-12 h-12 rounded-xl object-cover shrink-0 ${m.isDeceased ? 'grayscale' : ''}`} />
            ) : (
              <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                <span className="text-slate-400 text-xl">👤</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap mb-0.5">
                {m.isExternalSpouse ? (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: '#a0783015', color: '#a07830' }}>{m.surname || '외성'}</span>
                ) : (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: '#1e3a5f12', color: '#1e3a5f' }}>{m.generation}대</span>
                )}
                <span className="text-[11px] px-1.5 py-0.5 rounded-md font-medium"
                  style={{ background: m.gender === 'male' ? '#eff6ff' : m.gender === 'female' ? '#fff1f2' : '#f8fafc', color: m.gender === 'male' ? '#2563eb' : m.gender === 'female' ? '#e11d48' : '#64748b' }}>
                  {m.gender === 'male' ? '남' : m.gender === 'female' ? '여' : '?'}
                </span>
                {m.isDeceased && <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">고인</span>}
              </div>
              <p className="font-bold text-slate-800 text-sm truncate">
                {m.name}
                {spouseLabelMap[m.id] && <span className="text-[11px] text-slate-400 font-normal ml-1">{spouseLabelMap[m.id]}</span>}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{m.birthDate || '생년 미상'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEdit(m)} className="p-2 rounded-xl text-slate-400 hover:text-[#1e3a5f] hover:bg-slate-100 transition cursor-pointer">
                <Edit3 size={15} />
              </button>
              {isAdmin && (
                <button onClick={() => { if (confirm(`'${m.name}'을(를) 삭제할까요?`)) onDelete(m.id); }}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length > 0 && (
          <p className="text-center text-[11px] text-slate-400 py-1">{filtered.length}명 표시 중 (전체 {members.length}명)</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:flex flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <Th onClick={() => toggleSort('generation')}>
                  세대 <SortIcon k="generation" />
                </Th>
                <Th onClick={() => toggleSort('name')}>
                  이름 <SortIcon k="name" />
                </Th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">성별</th>
                <Th onClick={() => toggleSort('birthDate')}>
                  생년월일 <SortIcon k="birthDate" />
                </Th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">메모</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">상태</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isAdmin ? '관리' : '수정'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    검색 결과가 없습니다
                  </td>
                </tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* 세대 */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {m.isExternalSpouse ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#a0783015', color: '#a07830' }}>
                        {m.surname || '외성'}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#1e3a5f12', color: '#1e3a5f' }}>
                        {m.generation}대
                      </span>
                    )}
                  </td>

                  {/* 이름 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.photoUrl && (
                        <img src={m.photoUrl} alt={m.name}
                          className={`w-7 h-7 rounded-lg object-cover shrink-0 ${m.isDeceased ? 'grayscale' : ''}`} />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800">{m.name}</span>
                        {spouseLabelMap[m.id] && (
                          <span className="ml-1.5 text-[11px] text-slate-400">
                            {spouseLabelMap[m.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 성별 */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: m.gender === 'male' ? '#eff6ff' : m.gender === 'female' ? '#fff1f2' : '#f8fafc',
                        color: m.gender === 'male' ? '#2563eb' : m.gender === 'female' ? '#e11d48' : '#64748b',
                      }}>
                      {m.gender === 'male' ? '남성' : m.gender === 'female' ? '여성' : '미상'}
                    </span>
                  </td>

                  {/* 생년월일 */}
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {m.birthDate || '—'}
                    {m.isDeceased && m.deathDate && (
                      <span className="text-slate-400"> ~ {m.deathDate}</span>
                    )}
                  </td>

                  {/* 메모 */}
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">
                    {m.memo || '—'}
                  </td>

                  {/* 상태 */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {m.isDeceased && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">
                        고인
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#1e3a5f] hover:bg-slate-100 transition cursor-pointer"
                        title="수정">
                        <Edit3 size={14} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => {
                          if (confirm(`'${m.name}'을(를) 삭제할까요?`)) onDelete(m.id);
                        }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="삭제">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 flex items-center gap-1">
              <Users size={11} />
              <span>{filtered.length}명 표시 중 (전체 {members.length}명)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>
        {value}<span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th onClick={onClick}
      className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-600 select-none">
      <div className="flex items-center gap-1">{children}</div>
    </th>
  );
}
