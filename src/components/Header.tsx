import React, { useState } from 'react';
import { LogOut, Search, Plus, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Profile } from '../types';

interface HeaderProps {
  userProfile: Profile | null;
  onLogout: () => void;
  onSearch: (query: string) => void;
  onAddMember: () => void;
  hasMembers: boolean;
  memberCount?: number;
  searchResultCount?: number;
  currentResultIndex?: number;
  onNextResult?: () => void;
  onPrevResult?: () => void;
}

export function Header({ userProfile, onLogout, onSearch, onAddMember, hasMembers, memberCount = 0, searchResultCount, currentResultIndex, onNextResult, onPrevResult }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const isAdmin = userProfile?.role === 'admin';
  const hasResults = searchResultCount !== undefined && searchResultCount > 0;

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hasResults) {
      e.preventDefault();
      onNextResult?.();
    }
  };

  return (
    <header
      className="text-white relative z-30 shrink-0"
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2f52 60%, #0d1f3c 100%)',
        borderBottom: '1px solid rgba(197,160,89,0.3)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top gold accent line */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #c5a059 30%, #e8c87a 50%, #c5a059 70%, transparent 100%)' }} />

      <div className="px-5 h-[52px] flex items-center gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 select-none"
            style={{
              background: 'linear-gradient(145deg, #c5a059 0%, #e8c87a 45%, #a07830 100%)',
              boxShadow: '0 2px 8px rgba(197,160,89,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              權
            </span>
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white whitespace-nowrap">영광종회 가계도</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 shrink-0" style={{ background: 'rgba(197,160,89,0.3)' }} />

        {/* Member count badge */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Users size={13} style={{ color: '#c5a059' }} />
          <span className="text-xs text-slate-300 font-medium">{memberCount}명 등록</span>
        </div>

        {/* Search — fills remaining space */}
        <div className="flex-1 hidden md:block">
          <div
            className="relative flex items-center rounded-xl transition-all duration-200"
            style={{
              background: focused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.055)',
              border: focused ? '1px solid rgba(197,160,89,0.55)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: focused ? '0 0 0 3px rgba(197,160,89,0.1)' : 'none',
            }}
          >
            <Search className="absolute left-3 w-3.5 h-3.5 transition-colors" style={{ color: focused ? '#c5a059' : '#475569' }} />
            <input
              type="text"
              placeholder="이름 또는 세대(예: 36대) 검색... (Enter로 이동)"
              value={searchQuery}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={`w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs pl-9 py-[9px] focus:outline-none ${hasResults ? 'pr-36' : searchQuery ? 'pr-8' : 'pr-4'}`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && searchResultCount !== undefined && (
                searchResultCount === 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-slate-500"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    결과 없음
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: '#eab308', color: '#fff' }}>
                      {(currentResultIndex ?? 0) + 1} / {searchResultCount}
                    </span>
                    <button onClick={onPrevResult}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer">
                      <ChevronLeft size={13} />
                    </button>
                    <button onClick={onNextResult}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer">
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )
              )}
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); onSearch(''); }}
                  className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 transition cursor-pointer text-xs">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: add button + user */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin && (
            <button
              onClick={onAddMember}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #c5a059, #e8c87a)',
                color: '#0a1628',
                boxShadow: '0 2px 10px rgba(197,160,89,0.3)',
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>새 가족 등록</span>
            </button>
          )}

          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {userProfile && (
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(197,160,89,0.15)', border: '1px solid rgba(197,160,89,0.25)' }}
              >
                <User size={13} style={{ color: '#c5a059' }} />
              </div>
              <div className="hidden sm:block leading-none">
                <p className="text-xs font-semibold text-white">{userProfile.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: isAdmin ? '#c5a059' : '#64748b' }}>
                  {isAdmin ? '관리자' : '일반 회원'}
                </p>
              </div>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="p-1.5 rounded-lg transition cursor-pointer text-slate-500 hover:text-white hover:bg-white/10"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-2.5 md:hidden">
        <div className="relative flex items-center rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="이름 또는 세대 검색..."
            value={searchQuery}
            onChange={handleQueryChange}
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 text-xs pl-9 pr-4 py-2 focus:outline-none"
          />
        </div>
      </div>
    </header>
  );
}
