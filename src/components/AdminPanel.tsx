import React, { useState, useEffect } from 'react';
import { getAllProfiles, updateProfileRole, deleteProfile } from '../services/familyService';
import { Profile } from '../types';
import { Shield, ShieldCheck, Trash2, ArrowLeft, RefreshCw, Mail, Calendar } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
  currentUserUid: string | undefined;
}

export function AdminPanel({ onBack, currentUserUid }: AdminPanelProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProfiles();
      setProfiles(data);
    } catch (e: any) {
      setError('종원 회원을 불러오는 중에 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleRoleToggle = async (profile: Profile) => {
    if (profile.id === currentUserUid) {
      alert("자신의 도유사(관리자) 권한은 강등할 수 없습니다.");
      return;
    }

    const newRole = profile.role === 'admin' ? 'member' : 'admin';
    const msg = `${profile.name}님의 등급을 ${newRole === 'admin' ? '도유사(관리자)' : '일반도원(회원)'}(으)로 변경하시겠습니까?`;
    if (!confirm(msg)) return;

    try {
      await updateProfileRole(profile.id, newRole);
      setProfiles(prev =>
        prev.map(p => (p.id === profile.id ? { ...p, role: newRole } : p))
      );
    } catch (e) {
      alert("역할 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteProfile = async (profile: Profile) => {
    if (profile.id === currentUserUid) {
      alert("로그인 중인 자신의 계정은 삭제할 수 없습니다.");
      return;
    }

    if (!confirm(`${profile.name}님의 도원 가입 정보를 종회 장부에서 영구 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteProfile(profile.id);
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
    } catch (e) {
      alert("도원 제명 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-serif text-slate-800">
              宗務 管理 (종원 권한 제어)
            </h1>
            <p className="text-xs text-slate-500">
              영광종회 가계도의 회원 목록을 열람하고, 관리자(도유사) 권한을 조정합니다.
            </p>
          </div>
        </div>

        <button
          onClick={fetchProfiles}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1.5 border border-slate-250 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 disabled:opacity-50 transition"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>새로고침</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="w-8 h-8 border-4 border-cultural-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">장부를 펼치는 중...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProfiles} className="font-bold underline">
            재시도
          </button>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">가입된 도원이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">성명 (姓名)</th>
                <th className="px-6 py-3.5">이메일 (電子郵件)</th>
                <th className="px-6 py-3.5">가입 일자 (登錄日)</th>
                <th className="px-6 py-3.5">직무 등급 (職務)</th>
                <th className="px-6 py-3.5 text-center">제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {profiles.map(profile => {
                const isSelf = profile.id === currentUserUid;
                return (
                  <tr key={profile.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <span>{profile.name}</span>
                        {isSelf && (
                          <span className="bg-blue-150 text-blue-800 px-1.5 py-0.5 rounded-sm text-[9px] font-bold">
                            본인 
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Mail size={13} className="text-slate-400" />
                        <span>{profile.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{profile.createdAt ? profile.createdAt.substring(0, 10) : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRoleToggle(profile)}
                        disabled={isSelf}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          profile.role === 'admin'
                            ? 'bg-cultural-gold/10 text-cultural-gold border border-cultural-gold/40 hover:bg-cultural-gold/20'
                            : 'bg-slate-105 text-slate-600 border border-slate-250 hover:bg-slate-200/60'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {profile.role === 'admin' ? (
                          <>
                            <ShieldCheck size={11} className="text-cultural-gold" />
                            <span>도유사 (관리자)</span>
                          </>
                        ) : (
                          <>
                            <Shield size={11} className="text-slate-400" />
                            <span>도원 (회원)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteProfile(profile)}
                        disabled={isSelf}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="도원 제명"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
