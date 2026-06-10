import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FamilyNodeData } from '../types';
import { User } from 'lucide-react';

export function FamilyNode({ data }: { data: FamilyNodeData }) {
  const { member, isHighlighted, onSelect } = data;
  const isDeceased = member.isDeceased;

  return (
    <div
      id={`node-${member.id}`}
      onClick={() => onSelect(member)}
      className={`relative cursor-pointer select-none rounded-xl border-x border-b p-4 bg-white shadow-md hover:shadow-xl transition-all duration-300 w-64 text-left border-t-4 ${
        isDeceased
          ? 'border-t-slate-400 border-x-slate-200 border-b-slate-200 bg-slate-50/90 filter grayscale opacity-80'
          : 'border-t-cultural-navy border-x-slate-250 border-b-slate-250 hover:border-cultural-gold/60'
      } ${
        isHighlighted
          ? 'ring-4 ring-cultural-gold/40 shadow-2xl scale-105 !border-cultural-gold'
          : 'ring-1 ring-slate-100/50'
      }`}
    >
      {/* Handles for connections */}
      {/* Top handles: parent connection in trees */}
      <Handle type="target" position={Position.Top} className="!bg-cultural-navy !w-2 !h-2" />
      {/* Bottom handles: child connection */}
      <Handle type="source" position={Position.Bottom} className="!bg-cultural-navy !w-2 !h-2" />
      {/* Left and Right handles for spouse/sibling connections */}
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-1.5 !h-1.5" id="left" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-1.5 !h-1.5" id="right" />
 
      <div className="flex items-center space-x-3">
        {/* Photo or Placeholder */}
        <div className="relative flex-shrink-0">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              referrerPolicy="no-referrer"
              className={`w-11 h-11 rounded-xl object-cover border-2 shadow-inner ${
                isDeceased ? 'border-slate-300' : 'border-cultural-navy/15'
              }`}
            />
          ) : (
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 ${
                member.gender === 'male'
                  ? 'bg-blue-50/70 text-blue-600 border-blue-200/50'
                  : member.gender === 'female'
                  ? 'bg-rose-50/70 text-rose-600 border-rose-200/50'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <User size={18} />
            </div>
          )}
          {/* Generation Badge */}
          <span
            className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
              isDeceased
                ? 'bg-slate-500 text-white'
                : 'bg-cultural-gold text-white'
            }`}
          >
            {member.generation}代
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 truncate font-serif">
              {member.name}
            </h4>
            <span className={`text-[10px] font-medium ${
              member.gender === 'male' ? 'text-blue-600' : member.gender === 'female' ? 'text-rose-600' : 'text-slate-500'
            }`}>
              {member.gender === 'male' ? '남(男)' : member.gender === 'female' ? '여(女)' : '미상'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {member.birthDate ? member.birthDate.substring(0, 4) : '生 미상'}
            {isDeceased ? ` ~ ${member.deathDate ? member.deathDate.substring(0, 4) : '卒'}` : ''}
          </p>
        </div>
      </div>

      {isDeceased && (
        <div className="absolute top-1 right-2 text-[9px] text-slate-400 font-serif font-bold">
          卒
        </div>
      )}
    </div>
  );
}
