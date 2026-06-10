import React, { useState } from 'react';
import { LogOut, Search, Plus, User, Users, ChevronLeft, ChevronRight, LayoutList, GitFork } from 'lucide-react';
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
  view?: 'tree' | 'admin';
  onViewChange?: (view: 'tree' | 'admin') => void;
}

export function Header({ userProfile, onLogout, onSearch, onAddMember, hasMembers, memberCount = 0, searchResultCount, currentResultIndex, onNextResult, onPrevResult, view = 'tree', onViewChange }: HeaderProps) {
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

      <div className="px-5 h-[62px] flex items-center gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 select-none"
            style={{
              background: 'linear-gradient(145deg, #c5a059 0%, #e8c87a 45%, #a07830 100%)',
              boxShadow: '0 2px 8px rgba(197,160,89,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span style={{ fontFamily: '"Noto Serif KR", serif', fontSize: '20px', fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.35)', lineHeight: 1 }}>
              權
            </span>
          </div>
          <span className="font-bold text-[17px] tracking-tight text-white whitespace-nowrap">영광종회 가계도</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 shrink-0" style={{ background: 'rgba(197,160,89,0.35)' }} />

        {/* Member count badge */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <Users size={14} style={{ color: '#c5a059' }} />
          <span className="text-sm text-slate-200 font-semibold">{memberCount}명 등록</span>
        </div>

        {/* Search */}
        <div className="flex-1 hidden md:block">
          <div
            className="relative flex items-center rounded-xl transition-all duration-200"
            style={{
              background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
              border: focused ? '1px solid rgba(197,160,89,0.6)' : '1px solid rgba(255,255,255,0.15)',
              boxShadow: focused ? '0 0 0 3px rgba(197,160,89,0.12)' : 'none',
            }}
          >
            <Search className="absolute left-3.5 w-4 h-4 transition-colors" style={{ color: focused ? '#c5a059' : '#94a3b8' }} />
            <input
              type="text"
              placeholder="이름 또는 세대(예: 36대) 검색... (Enter로 이동)"
              value={searchQuery}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={`w-full bg-transparent text-white placeholder-slate-400 text-sm pl-10 py-2.5 focus:outline-none ${hasResults ? 'pr-36' : searchQuery ? 'pr-8' : 'pr-4'}`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && searchResultCount !== undefined && (
                searchResultCount === 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full text-slate-400"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    결과 없음
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: '#eab308', color: '#fff' }}>
                      {(currentResultIndex ?? 0) + 1} / {searchResultCount}
                    </span>
                    <button onClick={onPrevResult}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer">
                      <ChevronLeft size={15} />
                    </button>
                    <button onClick={onNextResult}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )
              )}
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); onSearch(''); }}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer text-sm">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: view toggle + add button + user */}
        <div className="flex items-center gap-3 shrink-0">

          {/* View toggle */}
          <div className="flex items-center rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => onViewChange?.('tree')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                view === 'tree'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <GitFork size={14} />
              <span>가계도</span>
            </button>
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <button
              onClick={() => onViewChange?.('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                view === 'admin'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutList size={14} />
              <span>구성원 목록</span>
            </button>
          </div>

          {/* Add member button */}
          <button
            onClick={onAddMember}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #c5a059, #e8c87a)',
              color: '#0a1628',
              boxShadow: '0 2px 10px rgba(197,160,89,0.35)',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>새 가족 등록</span>
          </button>

          <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.15)' }} />

          {/* User info */}
          {userProfile && (
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(197,160,89,0.18)', border: '1px solid rgba(197,160,89,0.3)' }}
              >
                <User size={15} style={{ color: '#c5a059' }} />
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-white">{userProfile.name}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: isAdmin ? '#c5a059' : '#94a3b8' }}>
                  {isAdmin ? '관리자' : '일반 회원'}
                </p>
              </div>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="p-1.5 rounded-lg transition cursor-pointer text-slate-400 hover:text-white hover:bg-white/10"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative flex items-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="이름 또는 세대 검색..."
            value={searchQuery}
            onChange={handleQueryChange}
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm pl-10 pr-4 py-2.5 focus:outline-none"
          />
        </div>
      </div>
    </header>
  );
}
