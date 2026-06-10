import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Heart, User } from 'lucide-react';
import { FamilyMember, RelationshipType } from '../types';

interface MemberModalProps {
  member: FamilyMember | null; // null if adding new member
  onClose: () => void;
  onSave: (
    memberData: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
    relationData?: { targetId: string; type: RelationshipType }
  ) => void;
  allMembers: FamilyMember[];
}

export function MemberModal({
  member,
  onClose,
  onSave,
  allMembers
}: MemberModalProps) {
  const [generation, setGeneration] = useState<number>(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [memo, setMemo] = useState('');

  // Relationship attachment state
  const [hasRelation, setHasRelation] = useState(false);
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState<RelationshipType>('spouse');

  useEffect(() => {
    if (member) {
      setGeneration(member.generation);
      setName(member.name);
      setGender(member.gender);
      setBirthDate(member.birthDate || '');
      setDeathDate(member.deathDate || '');
      setIsDeceased(member.isDeceased || false);
      setPhotoUrl(member.photoUrl || '');
      setMemo(member.memo || '');
      setHasRelation(false); // Only configure relation on creation
    } else {
      // Default creation state
      setGeneration(1);
      setName('');
      setGender('male');
      setBirthDate('');
      setDeathDate('');
      setIsDeceased(false);
      setPhotoUrl('');
      setMemo('');
      setHasRelation(false);
      setRelTargetId('');
      setRelType('spouse');
    }
  }, [member]);

  // Handle local photo upload (convert to Base64 with high-efficiency downscaling to prevent localStorage quota issues)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Downscale to a Max 160px bounding box to keep images highly optimized (~5-15 KB JPEGs)
            const MAX_SIZE = 160;
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG is plenty clear for small avatars!
              setPhotoUrl(compressedBase64);
            } else {
              setPhotoUrl(reader.result as string);
            }
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: Omit<FamilyMember, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
      generation,
      name: name.trim(),
      gender,
      birthDate: birthDate || undefined,
      deathDate: isDeceased ? (deathDate || undefined) : undefined,
      isDeceased,
      photoUrl: photoUrl || undefined,
      memo: memo || undefined
    };

    const relationInput = (!member && hasRelation && relTargetId) 
      ? { targetId: relTargetId, type: relType } 
      : undefined;

    onSave(data, relationInput);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-cultural-navy text-white flex items-center justify-between border-b-4 border-cultural-gold">
          <h3 className="font-serif font-bold text-base tracking-wide">
            {member ? '宗員 記錄 修正 (선조 기록 단장)' : '宗員 新規 登錄 (신규 종원 등록)'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[#162a45] rounded-full text-slate-300 hover:text-white transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Generation & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                세대 명시 (대/代) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={generation}
                onChange={e => setGeneration(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                성명 (姓名) *
              </label>
              <input
                type="text"
                required
                placeholder="홍길동 등"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Gender & Photo Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                성별 (性別) *
              </label>
              <div className="flex space-x-2">
                {(['male', 'female', 'unknown'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      gender === g
                        ? g === 'male'
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : g === 'female'
                          ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : 'bg-slate-100 border-slate-400 text-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'male' ? '남(男)' : g === 'female' ? '여(女)' : '미상'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                생존 여부 *
              </label>
              <label className="flex items-center space-x-2.5 h-[34px] bg-slate-50 border border-slate-200 rounded-lg px-3 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeceased}
                  onChange={e => setIsDeceased(e.target.checked)}
                  className="rounded-sm text-[#1e3a5f] focus:ring-[#1e3a5f] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">고인(卒)으로 표기</span>
              </label>
            </div>
          </div>

          {/* Birth & Death Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                출생년일 (出生)
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDeceased ? 'text-slate-700' : 'text-slate-400'}`}>
                사망년일 (卒去) {isDeceased && '*'}
              </label>
              <input
                type="date"
                disabled={!isDeceased}
                required={isDeceased}
                value={deathDate}
                onChange={e => setDeathDate(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-hidden transition ${
                  !isDeceased && 'opacity-50 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Photo upload and Photo URL */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              영정/사진 등록
            </label>
            <div className="flex space-x-3 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="사진 이미지 URL 입력 (또는 오른쪽 업로드)"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-[#1e3a5f] focus:outline-hidden transition"
                />
              </div>
              <label className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition">
                <Upload size={14} className="text-slate-500" />
                <span>업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            {photoUrl && (
              <div className="flex items-center space-x-2 p-1.5 bg-slate-50 rounded-lg border border-slate-150">
                <img src={photoUrl} alt="Preview" className="w-8 h-8 rounded-full object-cover" />
                <span className="text-[10px] text-slate-500 truncate flex-1">사진 미리보기 활성화됨</span>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Memorandums (Memo) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              행적 미소/기타 메모 (行績 • 略歷)
            </label>
            <textarea
              placeholder="관직 명예, 한자 성함, 부군/부인 성비, 호칭 또는 특기 사적을 기록하세요..."
              rows={3}
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-[#1e3a5f] focus:outline-hidden transition resize-none"
            />
          </div>

          {/* Direct Relationships configuration - ONLY for New Members */}
          {!member && allMembers.length > 0 && (
            <div className="border-t border-slate-200 pt-4 mt-2">
              <label className="flex items-center space-x-2.5 select-none cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={hasRelation}
                  onChange={e => setHasRelation(e.target.checked)}
                  className="rounded-sm text-[#1e3a5f] focus:ring-[#1e3a5f] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  등록과 동시에 족보 관계 연결하기
                </span>
              </label>

              {hasRelation && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        관계 대상 종원
                      </label>
                      <select
                        required={hasRelation}
                        value={relTargetId}
                        onChange={e => setRelTargetId(e.target.value)}
                        className="w-full bg-white border border-slate-250 text-slate-700 rounded-lg p-1.5 text-xs focus:outline-hidden"
                      >
                        <option value="">-- 대상 종원 선택 --</option>
                        {allMembers.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.generation}代)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        이 사람과 나의 관계
                      </label>
                      <select
                        required={hasRelation}
                        value={relType}
                        onChange={e => setRelType(e.target.value as RelationshipType)}
                        className="w-full bg-white border border-slate-250 text-slate-700 rounded-lg p-1.5 text-xs focus:outline-hidden"
                      >
                        <option value="spouse">이 사람의 배우자(配偶子)로 지정</option>
                        <option value="parent_child">이 사람의 자녀(子女)로 지정</option>
                        <option value="sibling">이 사람의 형제자매(兄弟)로 지정</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 font-medium">
                    * 이 기능은 지정된 도원을 대상으로 부모-자식 혹은 부부, 형제 관계를 족보에 즉각 수록합니다.
                  </p>
                </div>
              )}
            </div>
          )}

        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-1.5 bg-cultural-navy hover:bg-[#203f69] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
          >
            기록 수록
          </button>
        </div>

      </div>
    </div>
  );
}
