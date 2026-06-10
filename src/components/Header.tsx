import React, { useState } from 'react';
import { LogOut, Shield, TreeDeciduous, Users, Search, Play } from 'lucide-react';
import { Profile } from '../types';

interface HeaderProps {
  currentView: 'tree' | 'admin';
  setView: (view: 'tree' | 'admin') => void;
  userProfile: Profile | null;
  onLogout: () => void;
  onSearch: (query: string) => void;
  onSeedData: () => void;
  hasMembers: boolean;
}

export function Header({
  currentView,
  setView,
  userProfile,
  onLogout,
  onSearch,
  onSeedData,
  hasMembers
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val); // Real-time search feedback
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <header className="bg-cultural-navy text-white shadow-lg border-b-4 border-cultural-gold relative z-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('tree')}>
          <div className="w-8 h-8 rounded-full bg-cultural-gold flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
            <span className="font-serif text-white">榮</span>
          </div>
          <span className="font-serif font-bold text-lg tracking-wider text-white">
            영광종회 가계도 <span className="hidden sm:inline text-cultural-gold text-xs align-middle ml-1 font-normal opacity-85">Family Genealogy</span>
          </span>
        </div>

        {/* Search Bar - only shown on tree view */}
        {currentView === 'tree' && (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-80">
            <input
              type="text"
              placeholder="이름 또는 세대(대) 검색..."
              value={searchQuery}
              onChange={handleQueryChange}
              className="w-full bg-white/10 text-slate-100 placeholder-white/40 text-xs pl-9 pr-4 py-1.5 rounded-full border border-white/20 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold focus:outline-hidden transition-all duration-350"
            />
            <Search className="absolute left-3 text-white/50 w-4 h-4" />
          </form>
        )}

        {/* Right Nav buttons */}
        <div className="flex items-center space-x-3 text-xs font-medium">
          {/* Seed Data Trigger */}
          <button
            onClick={onSeedData}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-cultural-gold hover:bg-[#b08b47] text-white rounded-full font-semibold transition-all shadow-md cursor-pointer"
          >
            <Play size={10} fill="currentColor" />
            <span>기초 가록(족보) 심기</span>
          </button>

          {/* Toggle tree / admin */}
          <button
            onClick={() => setView('tree')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              currentView === 'tree'
                ? 'bg-cultural-gold/25 border-cultural-gold text-cultural-gold font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <TreeDeciduous size={14} />
            <span className="font-sans">가계도 지도</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setView('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-cultural-gold/25 border-cultural-gold text-cultural-gold font-semibold'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Shield size={14} />
              <span>종원 권한 제어</span>
            </button>
          )}

          {/* User Profile display & Logout */}
          {userProfile && (
            <div className="flex items-center space-x-2.5 border-l border-white/20 pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-slate-100 font-semibold text-[11px] font-serif">{userProfile.name}</p>
                <p className="text-[9px] text-[#c5a059] font-serif uppercase tracking-widest leading-none">
                  {userProfile.role === 'admin' ? '도유사/관리자' : '일반도원/회원'}
                </p>
              </div>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile search bar */}
      {currentView === 'tree' && (
        <div className="px-4 pb-2 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="이름 또는 세대(대) 검색..."
              value={searchQuery}
              onChange={handleQueryChange}
              className="w-full bg-white/10 text-slate-100 placeholder-white/40 text-xs pl-9 pr-4 py-1.5 rounded-full border border-white/20 focus:border-cultural-gold focus:outline-hidden transition-all"
            />
            <Search className="absolute left-3 top-2.5 text-white/50 w-4 h-4" />
          </form>
        </div>
      )}
    </header>
  );
}
