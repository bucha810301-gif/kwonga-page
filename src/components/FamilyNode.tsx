import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from '@xyflow/react';
import { FamilyNodeData } from '../types';
import { User, X, Link2 } from 'lucide-react';

export function FamilyNode({ data }: { data: FamilyNodeData }) {
  const { member, isHighlighted, onSelect, isAdmin } = data;
  const [lightbox, setLightbox] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isDeceased = member.isDeceased;
  const isExternalSpouse = member.isExternalSpouse;

  const genderColor = member.gender === 'male'
    ? { accent: '#3b82f6', bg: '#eff6ff', text: '#2563eb', label: '남성' }
    : member.gender === 'female'
    ? { accent: '#f43f5e', bg: '#fff1f2', text: '#e11d48', label: '여성' }
    : { accent: '#94a3b8', bg: '#f8fafc', text: '#64748b', label: '미상' };

  const accentColor = isDeceased ? '#94a3b8' : isExternalSpouse ? '#a07830' : genderColor.accent;

  // Invisible large handles for incoming connections (target)
  const hiddenHandleStyle: React.CSSProperties = {
    width: 20, height: 20, opacity: 0, border: 'none', background: 'transparent',
    pointerEvents: 'all',
  };

  return (
    <>
    <div
      id={`node-${member.id}`}
      onClick={() => onSelect(member)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative cursor-pointer select-none bg-white transition-all duration-200 ${
        isDeceased ? 'opacity-65' : ''
      } ${isHighlighted ? 'scale-[1.06]' : 'hover:-translate-y-0.5'}`}
      style={{
        width: '240px',
        borderRadius: '14px',
        border: isHighlighted ? '2.5px solid #eab308' : '1.5px solid #e2e8f0',
        boxShadow: isHighlighted
          ? '0 0 0 5px rgba(234,179,8,0.22), 0 0 20px rgba(234,179,8,0.18), 0 8px 24px rgba(0,0,0,0.12)'
          : '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'visible',
      }}
    >
      {/* Invisible target handles — large hit area for receiving connections */}
      <Handle type="target" position={Position.Top} style={{ ...hiddenHandleStyle, top: -10 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ ...hiddenHandleStyle, left: -10 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ ...hiddenHandleStyle, right: -10 }} />

      {/* Large visible "관계 연결" drag bar — bottom, admin only, shows on hover */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="conn"
        style={{
          width: 180,
          height: 30,
          borderRadius: '0 0 14px 14px',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          border: 'none',
          background: hovered
            ? 'linear-gradient(135deg, #1e3a5f, #2d5a9e)'
            : 'transparent',
          cursor: 'crosshair',
          opacity: 1,
          pointerEvents: 'all',
          transition: 'background 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      />

      {/* "관계 연결" label overlay (visual only, not interactive) */}
      {hovered && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none select-none"
          style={{ height: 30, borderRadius: '0 0 14px 14px', zIndex: 11 }}
        >
          <Link2 size={11} color="white" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>
            끌어서 관계 연결
          </span>
        </div>
      )}

      {/* Search match indicator */}
      {isHighlighted && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
          style={{ background: '#eab308', color: '#fff' }}>
          ✦ 검색
        </div>
      )}

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-[14px]"
        style={{ background: isDeceased ? '#94a3b8' : `linear-gradient(180deg, ${accentColor}, ${accentColor}88)` }}
      />

      {/* Card body */}
      <div className="pl-4 pr-3 py-3 flex gap-3 items-center" style={{ paddingBottom: 38 }}>

        {/* Photo */}
        <div className="shrink-0 relative">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              referrerPolicy="no-referrer"
              onClick={e => { e.stopPropagation(); setLightbox(true); }}
              className={`w-[68px] h-[68px] rounded-xl object-cover cursor-zoom-in hover:opacity-90 transition-opacity ${isDeceased ? 'grayscale' : ''}`}
              style={{ border: `2px solid ${accentColor}22` }}
            />
          ) : (
            <div
              className="w-[68px] h-[68px] rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${genderColor.bg}, white)`,
                border: `2px solid ${accentColor}22`,
              }}
            >
              <User size={28} style={{ color: genderColor.text, opacity: 0.7 }} />
            </div>
          )}
          {isDeceased && (
            <div className="absolute -bottom-1 -right-1 bg-slate-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">
              고인
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-1 mb-1">
            {isExternalSpouse ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: '#a0783015', color: '#a07830' }}>
                {member.surname || '외성'}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: `${accentColor}15`, color: accentColor }}>
                {member.generation}대
              </span>
            )}
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: genderColor.bg, color: genderColor.text }}>
              {genderColor.label}
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-800 truncate leading-tight">{member.name}</h4>

          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {member.birthDate
              ? (isDeceased ? `${member.birthDate} ~ ${member.deathDate || '미상'}` : member.birthDate)
              : '생년 미상'}
          </p>

          {member.memo && (
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {member.memo}
            </p>
          )}
        </div>
      </div>
    </div>

      {lightbox && member.photoUrl && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            <img
              src={member.photoUrl}
              alt={member.name}
              referrerPolicy="no-referrer"
              className={`rounded-2xl shadow-2xl ${isDeceased ? 'grayscale' : ''}`}
              style={{ maxWidth: 'min(80vw, 640px)', maxHeight: '75vh', width: 'auto', height: 'auto' }}
            />
            <p className="text-white font-semibold mt-3 text-sm">{member.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{member.generation}대</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
