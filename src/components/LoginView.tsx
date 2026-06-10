import React, { useState } from 'react';
import { googleProvider, auth } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { createOrGetProfile } from '../services/familyService';
import { Profile } from '../types';
import { TreeDeciduous, Shield, User, Globe } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (profile: Profile) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = async (role: 'admin' | 'member') => {
    setLoading(true);
    setError(null);
    const tempId = 'guest_' + role + '_' + Math.random().toString(36).substring(2, 9);
    const guestProfile: Profile = {
      id: tempId,
      email: role === 'admin' ? 'bucha810301@gmail.com' : 'member@younggwang.org',
      name: role === 'admin' ? '도유사 김성수 (관리자)' : '도원 김철수 (회원)',
      role: role,
      createdAt: new Date().toISOString()
    };

    try {
      // Try to register the profile in Firestore, but do not block the login if it fails
      await createOrGetProfile(guestProfile.id, guestProfile.email, guestProfile.name);
    } catch (err) {
      console.warn('Firestore profile write was skipped or offline, continuing login locally:', err);
    }
    
    onLoginSuccess(guestProfile);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cultural-canvas bg-repeat flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Subtle Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e3a5f 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Core Icon / Branding */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-cultural-navy flex items-center justify-center shadow-xl border-2 border-cultural-gold">
            <TreeDeciduous className="text-cultural-gold w-12 h-12" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl font-serif font-bold text-cultural-navy tracking-wider">
          영광종회 가계도 (靈光宗會 族譜)
        </h2>
        
        <p className="mt-2 text-center text-xs text-slate-600 max-w-sm mx-auto font-serif leading-relaxed px-4">
          대대손손 이어온 가문의 뿌리와 행적을 온라인에서 소중하고 격조 있게 받들며 보존하는 영광종회 공식 온라인 가계도입니다.
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-cultural-gold/15 space-y-6">
          
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-lg leading-relaxed">
              {error}
            </div>
          )}

          {/* Social Logins */}
          <div className="space-y-3">
            {/* Real Google Auth */}
            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-white border border-slate-350 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:border-cultural-gold/50 transition-all cursor-pointer"
            >
              {/* Google G icon */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google 계정으로 입장 (도유사/관리자)</span>
            </button>

            {/* Kakao Mock */}
            <button
              onClick={() => handleQuickLogin('member')}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-[#FEE500] hover:bg-[#FEE500]/90 rounded-xl text-xs font-semibold text-[#191919] transition-all cursor-pointer"
            >
              <Globe size={18} className="text-amber-800" />
              <span>카카오 계정으로 입장 (일반도원/회원)</span>
            </button>

            {/* Naver Mock */}
            <button
              onClick={() => handleQuickLogin('member')}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-[#03C75A] hover:bg-[#03C75A]/90 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <Globe size={18} className="text-emerald-100" />
              <span>네이버 계정으로 입장 (일반도원/회원)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
