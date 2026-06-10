import React, { useState } from 'react';
import { X, Link2 } from 'lucide-react';
import { FamilyMember, RelationshipType } from '../types';

interface ConnectModalProps {
  sourceId: string;
  targetId: string;
  allMembers: FamilyMember[];
  onConfirm: (type: RelationshipType, fromId: string, toId: string) => void;
  onCancel: () => void;
}

const REL_OPTIONS: { value: string; label: string; desc: (a: string, b: string) => string; color: string }[] = [
  {
    value: 'parent_child_ab',
    label: '부모 → 자녀',
    desc: (a, b) => `${a} 가 ${b} 의 부모`,
    color: '#1e3a5f',
  },
  {
    value: 'parent_child_ba',
    label: '자녀 → 부모',
    desc: (a, b) => `${b} 가 ${a} 의 부모`,
    color: '#2d5a9e',
  },
  {
    value: 'spouse',
    label: '배우자',
    desc: (a, b) => `${a} 와 ${b} 는 배우자`,
    color: '#f43f5e',
  },
  {
    value: 'sibling',
    label: '형제 / 자매',
    desc: (a, b) => `${a} 와 ${b} 는 형제자매`,
    color: '#8b5cf6',
  },
];

export function ConnectModal({ sourceId, targetId, allMembers, onConfirm, onCancel }: ConnectModalProps) {
  const [selected, setSelected] = useState('parent_child_ab');

  const source = allMembers.find(m => m.id === sourceId);
  const target = allMembers.find(m => m.id === targetId);

  if (!source || !target) return null;

  const handleConfirm = () => {
    if (selected === 'parent_child_ab') {
      onConfirm('parent_child', sourceId, targetId);
    } else if (selected === 'parent_child_ba') {
      onConfirm('parent_child', targetId, sourceId);
    } else if (selected === 'spouse') {
      onConfirm('spouse', sourceId, targetId);
    } else if (selected === 'sibling') {
      onConfirm('sibling', sourceId, targetId);
    }
  };

  const opt = REL_OPTIONS.find(o => o.value === selected)!;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}
        >
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-[#c5a059]" />
            <h3 className="text-sm font-bold text-white">관계 연결</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Node names */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 text-sm border border-slate-100">
            <div className="text-center">
              <p className="font-bold text-slate-800">{source.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{source.generation}대</p>
            </div>
            <div className="text-slate-300 text-xs">↔</div>
            <div className="text-center">
              <p className="font-bold text-slate-800">{target.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{target.generation}대</p>
            </div>
          </div>

          {/* Relationship type selection */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">관계 선택</p>
            {REL_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setSelected(o.value)}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer"
                style={{
                  background: selected === o.value ? `${o.color}08` : 'white',
                  borderColor: selected === o.value ? o.color : '#e2e8f0',
                  boxShadow: selected === o.value ? `0 0 0 2px ${o.color}25` : 'none',
                }}
              >
                <div>
                  <p className="text-xs font-bold" style={{ color: selected === o.value ? o.color : '#475569' }}>
                    {o.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{o.desc(source.name, target.name)}</p>
                </div>
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: selected === o.value ? o.color : '#cbd5e1' }}
                >
                  {selected === o.value && (
                    <div className="w-2 h-2 rounded-full" style={{ background: o.color }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
          >
            연결하기
          </button>
        </div>
      </div>
    </div>
  );
}
