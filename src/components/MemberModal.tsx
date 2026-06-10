import React, { useState, useEffect } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { FamilyMember, RelationshipType } from '../types';

interface MemberModalProps {
  member: FamilyMember | null;
  onClose: () => void;
  onSave: (
    memberData: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
    relationData?: { targetId: string; type: RelationshipType | 'parent' }
  ) => void;
  allMembers: FamilyMember[];
}

export function MemberModal({ member, onClose, onSave, allMembers }: MemberModalProps) {
  const [generation, setGeneration] = useState<number>(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [isExternalSpouse, setIsExternalSpouse] = useState(false);
  const [surname, setSurname] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [hasRelation, setHasRelation] = useState(false);
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState<RelationshipType | 'parent'>('spouse');

  // 외성 배우자 등록 시 배우자 세대에 자동 맞춤
  useEffect(() => {
    if (isExternalSpouse && relTargetId) {
      const target = allMembers.find(m => m.id === relTargetId);
      if (target) setGeneration(target.generation);
    }
  }, [isExternalSpouse, relTargetId, allMembers]);

  useEffect(() => {
    if (member) {
      setGeneration(member.generation);
      setName(member.name);
      setGender(member.gender);
      setBirthDate(member.birthDate || '');
      setDeathDate(member.deathDate || '');
      setIsDeceased(member.isDeceased || false);
      setIsExternalSpouse(member.isExternalSpouse || false);
      setSurname(member.surname || '');
      setPhotoUrl(member.photoUrl || '');
      setMemo(member.memo || '');
      setHasRelation(false);
    } else {
      setGeneration(1);
      setName('');
      setGender('male');
      setBirthDate('');
      setDeathDate('');
      setIsDeceased(false);
      setIsExternalSpouse(false);
      setSurname('');
      setPhotoUrl('');
      setMemo('');
      setHasRelation(false);
      setRelTargetId('');
      setRelType('spouse');
    }
  }, [member]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let { width, height } = img;
        if (width > height) { if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; } }
        else { if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.92));
        } else {
          setPhotoUrl(reader.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
      generation, name: name.trim(), gender,
      birthDate: birthDate || undefined,
      deathDate: isDeceased ? (deathDate || undefined) : undefined,
      isDeceased,
      isExternalSpouse: isExternalSpouse || undefined,
      surname: isExternalSpouse ? (surname.trim() || undefined) : undefined,
      photoUrl: photoUrl || undefined,
      memo: memo || undefined
    };
    const relationInput = (!member && hasRelation && relTargetId)
      ? { targetId: relTargetId, type: relType as RelationshipType | 'parent' }
      : undefined;
    onSave(data, relationInput);
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:bg-white transition";
  const labelClass = "block text-xs font-semibold text-slate-500 mb-1.5";

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-8">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}
        >
          <h3 className="font-bold text-sm text-white">
            {member ? '가족 정보 수정' : '새 가족 등록'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Generation & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`${labelClass} ${isExternalSpouse ? 'opacity-40' : ''}`}>세대 (몇 대) {!isExternalSpouse && '*'}</label>
              <input type="number" min={1} max={50} required={!isExternalSpouse} value={generation}
                disabled={isExternalSpouse}
                onChange={e => setGeneration(parseInt(e.target.value) || 1)}
                className={`${inputClass} ${isExternalSpouse ? 'opacity-40 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className={labelClass}>이름 *</label>
              <input type="text" required placeholder="홍길동" value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Gender & Deceased */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>성별 *</label>
              <div className="flex gap-1.5">
                {(['male', 'female', 'unknown'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      gender === g
                        ? g === 'male' ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : g === 'female' ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : 'bg-slate-100 border-slate-400 text-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'male' ? '남' : g === 'female' ? '여' : '?'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>생존 여부</label>
              <label className="flex items-center gap-2.5 h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-3 cursor-pointer hover:bg-slate-100 transition">
                <input type="checkbox" checked={isDeceased}
                  onChange={e => setIsDeceased(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-[#1e3a5f]"
                />
                <span className="text-xs font-medium text-slate-600">고인으로 표기</span>
              </label>
            </div>
          </div>

          {/* External spouse */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={isExternalSpouse}
                onChange={e => {
                  const checked = e.target.checked;
                  setIsExternalSpouse(checked);
                  if (checked) {
                    setHasRelation(true);
                    setRelType('spouse');
                  }
                }}
                className="w-4 h-4 rounded cursor-pointer accent-[#a07830]"
              />
              <div>
                <span className="text-xs font-semibold text-slate-700">권씨 가문이 아닌 배우자</span>
                <p className="text-[10px] text-slate-400 mt-0.5">세대 대신 성씨로 표시됩니다</p>
              </div>
            </label>
            {isExternalSpouse && (
              <div>
                <label className={labelClass}>성씨 <span className="text-slate-400 font-normal">(예: 김씨, 이씨)</span></label>
                <input
                  type="text"
                  placeholder="김씨"
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>생년월일</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={`${labelClass} ${!isDeceased ? 'opacity-40' : ''}`}>사망일</label>
              <input type="date" disabled={!isDeceased} value={deathDate}
                onChange={e => setDeathDate(e.target.value)}
                className={`${inputClass} ${!isDeceased ? 'opacity-40 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className={labelClass}>사진</label>
            <div className="flex gap-2">
              <input type="text" placeholder="이미지 URL 직접 입력" value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                className={`${inputClass} flex-1 text-xs`}
              />
              <label className="flex items-center gap-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer transition shrink-0">
                <Upload size={13} />
                <span>올리기</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            {photoUrl && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <img src={photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-[10px] text-slate-500 flex-1">사진 선택됨</span>
                <button type="button" onClick={() => setPhotoUrl('')} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Memo */}
          <div>
            <label className={labelClass}>메모 / 소개</label>
            <textarea
              placeholder="간단한 소개, 직업, 특이사항 등을 자유롭게 적어주세요..."
              rows={3}
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Relationship */}
          {!member && allMembers.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              {isExternalSpouse ? (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-700">가족 관계 바로 연결하기</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#a0783015', color: '#a07830' }}>
                    배우자 필수
                  </span>
                </div>
              ) : (
                <label className="flex items-center gap-2.5 cursor-pointer select-none mb-3">
                  <input type="checkbox" checked={hasRelation}
                    onChange={e => setHasRelation(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer accent-[#1e3a5f]"
                  />
                  <span className="text-xs font-semibold text-slate-700">가족 관계 바로 연결하기</span>
                </label>
              )}

              {hasRelation && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">대상 선택</label>
                      <select required={hasRelation} value={relTargetId}
                        onChange={e => setRelTargetId(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="">-- 선택 --</option>
                        {allMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.generation}대)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">관계</label>
                      {isExternalSpouse ? (
                        <div className="w-full bg-white border border-[#a07830]/40 text-[#a07830] rounded-lg px-2 py-1.5 text-xs font-semibold">
                          배우자
                        </div>
                      ) : (
                        <select value={relType}
                          onChange={e => setRelType(e.target.value as RelationshipType)}
                          className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="spouse">배우자</option>
                          <option value="parent_child">자녀 (선택한 사람의 자녀)</option>
                          <option value="parent">부모 (선택한 사람의 부모)</option>
                          <option value="sibling">형제 / 자매</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            취소
          </button>
          <button type="button" onClick={handleSubmit} disabled={!name.trim()}
            className="px-5 py-2 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
