import React, { useState } from 'react';
import { Profile } from '../types';
import { Lock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';

interface LoginViewProps {
  onLoginSuccess: (profile: Profile) => void;
}

const ACCOUNTS: Record<string, { pw: string; profile: Omit<Profile, 'id' | 'createdAt'> }> = {
  master: {
    pw: 'onionkjs@62',
    profile: { email: 'bucha810301@gmail.com', name: '관리자', role: 'admin' },
  },
};

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [inputId, setInputId] = useState('');
  const [inputPw, setInputPw] = useState('');
  const [error, setError] = useState('');

  const handleIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const account = ACCOUNTS[inputId.trim()];
    if (!account || account.pw !== inputPw) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }
    try { await signInAnonymously(auth); } catch (e) { console.warn('Anonymous auth failed:', e); }
    onLoginSuccess({
      id: 'master_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...account.profile,
    });
  };

  const handleSocialLogin = async (role: 'admin' | 'member') => {
    try { await signInAnonymously(auth); } catch (e) { console.warn('Anonymous auth failed:', e); }
    onLoginSuccess({
      id: 'guest_' + role + '_' + Math.random().toString(36).substring(2, 9),
      email: role === 'admin' ? 'bucha810301@gmail.com' : 'member@younggwang.org',
      name: role === 'admin' ? '김성수 (관리자)' : '김철수 (회원)',
      role,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2744 100%)' }}
    >
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(145deg, #c5a059 0%, #e8c87a 45%, #a07830 100%)',
              boxShadow: '0 4px 20px rgba(197,160,89,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: '32px',
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.35)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              權
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">영광종회 가계도</h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            우리 가문의 뿌리를 함께 기록하고 이어가는 공간
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Social login */}
          <div className="p-6 space-y-3">
            <button
              onClick={() => handleSocialLogin('member')}
              className="w-full flex items-center space-x-3 py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700 cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google로 시작하기</span>
            </button>

            <button
              onClick={() => handleSocialLogin('member')}
              className="w-full flex items-center space-x-3 py-3 px-4 rounded-xl transition-all text-sm font-medium cursor-pointer"
              style={{ background: '#FEE500', color: '#191919' }}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="#191919" className="w-5 h-5">
                  <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.72 5.19 4.32 6.63L5.2 21l4.56-2.88c.73.12 1.48.18 2.24.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
                </svg>
              </div>
              <span>카카오로 시작하기</span>
            </button>

            <button
              onClick={() => handleSocialLogin('member')}
              className="w-full flex items-center space-x-3 py-3 px-4 rounded-xl transition-all text-sm font-medium text-white cursor-pointer"
              style={{ background: '#03C75A' }}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold text-base"
                style={{ color: '#03C75A', background: 'white', borderRadius: '4px', lineHeight: 1 }}>
                N
              </div>
              <span>네이버로 시작하기</span>
            </button>
          </div>

          {/* Admin login — collapsed by default */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => { setShowAdmin(v => !v); setError(''); }}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              {showAdmin ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              관리자로 로그인
            </button>

            {showAdmin && (
              <form onSubmit={handleIdLogin} className="px-6 pb-6 space-y-3">
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={inputId}
                    onChange={e => { setInputId(e.target.value); setError(''); }}
                    placeholder="아이디"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1e3a5f] focus:bg-white transition"
                    autoComplete="username"
                  />
                </div>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={inputPw}
                    onChange={e => { setInputPw(e.target.value); setError(''); }}
                    placeholder="비밀번호"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1e3a5f] focus:bg-white transition"
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-bold text-white rounded-xl transition cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
                >
                  로그인
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
