import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface Props {
  profile: Profile;
  onConfirm: (profile: Profile) => void;
}

export function NameConfirmModal({ profile, onConfirm }: Props) {
  const [name, setName] = useState(profile.name);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await supabase.from('profiles').update({ name: trimmed }).eq('id', profile.id);
    } catch {
      // 실패해도 로컬에서 이름 적용
    } finally {
      setLoading(false);
      onConfirm({ ...profile, name: trimmed });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
          >
            <span className="text-white font-bold text-xl">權</span>
          </div>
          <h2 className="text-lg font-bold text-slate-800">가계도에 표시될 이름</h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            실명으로 입력해주세요.<br />
            <span className="text-xs text-slate-400">(카카오 닉네임이 아닌 본인 성함)</span>
          </p>
        </div>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="홍길동"
          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#1e3a5f] bg-slate-50 mb-4"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        />

        <button
          onClick={handleConfirm}
          disabled={!name.trim() || loading}
          className="w-full py-3 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
        >
          {loading ? '저장 중...' : '확인'}
        </button>
      </div>
    </div>
  );
}
