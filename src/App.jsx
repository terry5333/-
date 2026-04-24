```react
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Users, Settings, Check, X, Calendar, AlertCircle, Sparkles } from 'lucide-react';

// --- 設定檔與靜態資料 ---
const DAY1_DATE = '2026-05-05';
const DAY2_DATE = '2026-05-06';

const PERIOD_TIMES = [
  { id: 1, start: '08:10:00', end: '08:55:00' },
  { id: 2, start: '09:10:00', end: '09:55:00' },
  { id: 3, start: '10:10:00', end: '10:55:00' },
  { id: 4, start: '11:10:00', end: '11:55:00' },
  { id: 5, start: '13:10:00', end: '13:55:00' },
  { id: 6, start: '14:10:00', end: '14:55:00' },
  { id: 7, start: '15:10:00', end: '15:55:00' },
];

const SCHEDULE_DATA = {
  [DAY1_DATE]: [
    { period: 1, name: '正常上課' },
    { period: 2, name: '正常上課' },
    { period: 3, name: '正常上課' },
    { period: 4, name: '正常上課' },
    { period: 5, name: '作文' },
    { period: 6, name: '自習' },
    { period: 7, name: '社會' },
  ],
  [DAY2_DATE]: [
    { period: 1, name: '數學' },
    { period: 2, name: '自習' },
    { period: 3, name: '英文' },
    { period: 4, name: '自習' },
    { period: 5, name: '國文' },
    { period: 6, name: '自習' },
    { period: 7, name: '自然' },
  ]
};

const LEAVE_TYPES = ['正常', '事假', '病假', '公假', '喪假', '曠課', '遲到'];

const PALETTES = {
  saffron: { full: '#E8913A', bg: '#FEF4E8', mid: '#F8D4A3' },
  sage: { full: '#4A8B6F', bg: '#EDF5F1', mid: '#B3D8C6' },
};

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  
  // 測試模式時間設定 (模擬到 Day 1 的 13:40，看畫線效果)
  const testTimeBase = useMemo(() => new Date(`${DAY1_DATE}T13:40:00`), []);

  const [students, setStudents] = useState(() => {
    const initData = [];
    for (let i = 1; i <= 31; i++) {
      initData.push({ id: i, status: '正常', isEmpty: false });
    }
    return initData;
  });

  // 時鐘更新
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 判斷今天是否為考試當天
  const isExamDay = useMemo(() => {
    const tzDateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    return tzDateStr === DAY1_DATE || tzDateStr === DAY2_DATE;
  }, [now]);

  // 如果到了考試當天，強制關閉測試模式
  useEffect(() => {
    if (isExamDay) {
      setIsTestMode(false);
    }
  }, [isExamDay]);

  const currentTime = useMemo(() => {
    return isTestMode ? testTimeBase : now;
  }, [now, isTestMode, testTimeBase]);

  // 日程表與狀態計算
  const { currentDayDate, isDay2, activeSchedule } = useMemo(() => {
    const tzDateStr = new Date(currentTime.getTime() - (currentTime.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const dayDate = (tzDateStr >= DAY2_DATE) ? DAY2_DATE : DAY1_DATE;
    
    const scheduleWithTime = SCHEDULE_DATA[dayDate].map(subject => {
      const pInfo = PERIOD_TIMES.find(p => p.id === subject.period);
      const startDateTime = new Date(`${dayDate}T${pInfo.start}`);
      const endDateTime = new Date(`${dayDate}T${pInfo.end}`);
      
      return {
        ...subject,
        startTime: pInfo.start.substring(0, 5),
        endTime: pInfo.end.substring(0, 5),
        startObj: startDateTime,
        endObj: endDateTime,
        isFinished: currentTime > endDateTime,
        isActive: currentTime >= startDateTime && currentTime <= endDateTime
      };
    });

    return { currentDayDate: dayDate, isDay2: dayDate === DAY2_DATE, activeSchedule: scheduleWithTime };
  }, [currentTime]);

  const currentStatus = useMemo(() => {
    const activeSubject = activeSchedule.find(s => s.isActive);
    if (activeSubject) return activeSubject.name;
    if (currentTime < activeSchedule[0].startObj) return "準備中 / 早自習";
    if (currentTime > activeSchedule[activeSchedule.length - 1].endObj) return "本日考試已結束";
    return "下課休息時間";
  }, [activeSchedule, currentTime]);

  const attendanceSummary = useMemo(() => {
    const valid = students.filter(s => !s.isEmpty);
    return {
      expected: valid.length,
      absent: valid.filter(s => s.status !== '正常').length,
      list: valid.filter(s => s.status !== '正常')
    };
  }, [students]);

  const handleStudentChange = (id, field, value) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === 'isEmpty' && value === true) updated.status = '正常';
        return updated;
      }
      return s;
    }));
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#4A3F30] p-4 sm:p-8 lg:p-10 flex flex-col font-sans relative overflow-hidden">
      
      {/* 注入全局樣式與動畫 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Instrument+Sans:ital,wght@0,400..600;1,400..600&display=swap');
        .font-fraunces { font-family: 'Fraunces', serif; }
        .font-instrument { font-family: 'Instrument Sans', sans-serif; }
        
        .card-surface {
          background: rgba(255, 253, 249, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(237, 232, 224, 0.8);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(26, 18, 9, 0.03), inset 0 1px 0 rgba(255,255,255,1);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .card-surface:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px -12px rgba(26, 18, 9, 0.08), inset 0 1px 0 rgba(255,255,255,1);
        }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #EDE8E0; border-radius: 4px; }
      `}} />

      <div className="max-w-[1500px] mx-auto w-full flex-1 flex flex-col">
        
        {/* 頂部標題與控制項 */}
        <header className="mb-8 flex justify-between items-end animate-fade-up z-10" style={{ animationDelay: '50ms' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#FDF0EC] text-[#D4654A] font-instrument text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-[#F5C4B5]">
                {isExamDay ? 'Live' : 'System Ready'}
              </span>
            </div>
            <h1 className="font-fraunces text-3xl md:text-5xl text-[#1A1209] font-medium tracking-tight">
              114學年度 <span className="italic text-[#D4654A]">第二次段考</span>
            </h1>
          </div>
          
          {/* 測試模式按鈕 - 考試當天會自動隱藏 */}
          {!isExamDay && (
            <label className="font-instrument flex items-center space-x-2 text-xs text-[#8C7D6B] cursor-pointer bg-white px-4 py-2 rounded-full border border-[#EDE8E0] shadow-sm hover:border-[#D4654A] transition-all group">
              <input 
                type="checkbox" 
                checked={isTestMode} 
                onChange={(e) => setIsTestMode(e.target.checked)}
                className="rounded text-[#D4654A] focus:ring-[#D4654A] w-3.5 h-3.5 transition-colors"
              />
              <span className="group-hover:text-[#D4654A] transition-colors font-medium">Test Mode</span>
            </label>
          )}
        </header>

        {/* 核心雙欄佈局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 z-10">
          
          {/* 左欄：時間與考程 (7 col) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* 時間儀表板 */}
            <div className="card-surface overflow-hidden relative animate-fade-up p-8" style={{ animationDelay: '150ms' }}>
              <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full blur-[60px] opacity-40 mix-blend-multiply pointer-events-none" style={{ backgroundColor: PALETTES.saffron.mid }}></div>
              <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full blur-[70px] opacity-20 pointer-events-none" style={{ backgroundColor: PALETTES.saffron.full }}></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <div className="font-instrument uppercase tracking-[0.15em] text-[11px] font-bold text-[#E8913A] mb-2 flex items-center gap-1.5">
                    <Clock size={14} /> Local Time
                  </div>
                  <div className="font-fraunces text-6xl md:text-8xl text-[#1A1209] tracking-tighter leading-none mb-2">
                    {currentTime.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="font-instrument text-[#8C7D6B] text-sm md:text-base font-medium">
                    {new Date(currentTime).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-[#FFFDF9] p-6 rounded-[24px] min-w-[220px] text-center shadow-[0_8px_24px_-6px_rgba(26,18,9,0.06)]">
                  <span className="font-instrument text-[11px] font-bold tracking-widest uppercase text-[#8C7D6B] block mb-2">
                    Current Status
                  </span>
                  <span className="font-fraunces text-3xl md:text-4xl text-[#1A1209] block">
                    {currentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 考程 To-Do 列表 */}
            <div className="card-surface flex-1 flex flex-col animate-fade-up min-h-[350px]" style={{ animationDelay: '200ms' }}>
              <div className="px-8 py-6 border-b border-[#EDE8E0] flex justify-between items-center bg-gradient-to-r from-transparent to-[#FDF0EC]/30">
                <h2 className="font-fraunces text-2xl text-[#1A1209] flex items-center gap-2.5">
                  <Calendar size={22} className="text-[#D4654A]" />
                  今日考程
                </h2>
                <div className="bg-white px-4 py-1.5 rounded-full border border-[#EDE8E0] text-[13px] font-instrument font-bold text-[#D4654A] shadow-sm">
                  {isDay2 ? 'Day 2 (5/6)' : 'Day 1 (5/5)'}
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto custom-scroll">
                {activeSchedule.map((s) => (
                  <div 
                    key={s.period} 
                    className={`flex items-center p-4 mx-2 my-2 rounded-[16px] transition-all duration-500 ${
                      s.isFinished ? 'opacity-40 grayscale bg-transparent hover:bg-black/5' : 
                      s.isActive ? 'bg-gradient-to-r from-[#EDF1FB] to-white border border-[#B3C3EE]/50 shadow-[0_4px_12px_rgba(58,95,196,0.05)] transform scale-[1.01]' : 
                      'hover:bg-[#FAF8F4] border border-transparent'
                    }`}
                  >
                    <div className={`w-16 text-center font-instrument text-[13px] font-bold tracking-wide ${s.isActive ? 'text-[#3A5FC4]' : 'text-[#8C7D6B]'}`}>
                      第 {s.period} 節
                    </div>
                    <div className={`w-36 text-center font-instrument text-sm ${s.isFinished ? 'line-through text-[#8C7D6B]' : 'text-[#4A3F30] font-medium'}`}>
                      {s.startTime} - {s.endTime}
                    </div>
                    <div className={`flex-grow font-fraunces text-xl pl-4 ${
                      s.isFinished ? 'line-through text-[#8C7D6B]' : 
                      s.isActive ? 'text-[#3A5FC4] font-medium' : 'text-[#1A1209]'
                    }`}>
                      {s.name}
                    </div>
                    <div className="w-12 flex justify-end">
                      {s.isFinished && <Check size={20} className="text-[#4A8B6F]" />}
                      {s.isActive && (
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-4 h-4 bg-[#3A5FC4]/20 rounded-full animate-ping"></div>
                          <div className="relative w-2.5 h-2.5 bg-[#3A5FC4] rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右欄：出缺席管理 (5 col) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="card-surface p-8 animate-fade-up relative overflow-hidden flex flex-col h-full" style={{ animationDelay: '250ms' }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[50px] opacity-30 pointer-events-none" style={{ backgroundColor: PALETTES.sage.mid }}></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h2 className="font-fraunces text-2xl text-[#1A1209] flex items-center gap-2.5">
                  <Users size={22} className="text-[#4A8B6F]" />
                  出缺席統計
                </h2>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="font-instrument flex items-center gap-1.5 bg-white border border-[#EDE8E0] hover:border-[#4A8B6F] hover:text-[#4A8B6F] hover:shadow-md text-[#4A3F30] px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <Settings size={16} />
                  <span>管理名單</span>
                </button>
              </div>

              {/* 統計方塊 */}
              <div className="grid grid-cols-2 gap-5 mb-8 relative z-10">
                <div className="bg-gradient-to-br from-[#EDF5F1] to-white rounded-[20px] p-6 border border-[#B3D8C6]/60 text-center shadow-sm">
                  <span className="font-instrument text-[11px] font-bold tracking-widest uppercase text-[#4A8B6F] block mb-2">應到人數</span>
                  <span className="font-fraunces text-5xl text-[#1A1209] block">{attendanceSummary.expected}</span>
                </div>
                <div className={`rounded-[20px] p-6 border text-center transition-all duration-300 shadow-sm ${attendanceSummary.absent > 0 ? 'bg-gradient-to-br from-[#FDF0EC] to-white border-[#F5C4B5]' : 'bg-white border-[#EDE8E0]'}`}>
                  <span className={`font-instrument text-[11px] font-bold tracking-widest uppercase block mb-2 ${attendanceSummary.absent > 0 ? 'text-[#D4654A]' : 'text-[#8C7D6B]'}`}>未到人數</span>
                  <span className={`font-fraunces text-5xl block ${attendanceSummary.absent > 0 ? 'text-[#D4654A]' : 'text-[#1A1209]'}`}>{attendanceSummary.absent}</span>
                </div>
              </div>

              {/* 缺席名單 */}
              <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-[20px] border border-[#EDE8E0] p-6 relative z-10 flex flex-col">
                <h3 className="font-instrument text-[12px] font-bold tracking-widest uppercase text-[#8C7D6B] mb-5 flex items-center gap-1.5 border-b border-[#EDE8E0] pb-3">
                  <AlertCircle size={15} /> Absent List
                </h3>
                
                <div className="flex-1 overflow-y-auto custom-scroll pr-2">
                  {attendanceSummary.absent > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {attendanceSummary.list.map(s => (
                        <div key={s.id} className="bg-white border border-[#F5C4B5] text-[#D4654A] px-3.5 py-2 rounded-xl text-sm shadow-[0_2px_8px_rgba(212,101,74,0.08)] flex items-center gap-2.5 animate-fade-up">
                          <span className="font-fraunces font-bold text-base">{s.id.toString().padStart(2, '0')}</span>
                          <span className="w-[1.5px] h-3.5 bg-[#F5C4B5] rounded-full"></span>
                          <span className="font-instrument font-medium">{s.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#8C7D6B] opacity-70">
                      <Sparkles size={36} strokeWidth={1.5} className="mb-3 text-[#4A8B6F]" />
                      <p className="font-instrument text-sm font-medium">目前全員出席，狀況良好</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 落款 Footer */}
        <footer className="mt-8 mb-2 text-center text-[#8C7D6B] font-instrument text-sm font-medium tracking-wide animate-fade-up" style={{ animationDelay: '300ms' }}>
          made by Terry L.
        </footer>
      </div>

      {/* 設定 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1209]/30 backdrop-blur-md">
          <div className="bg-[#FFFDF9] border border-[#EDE8E0] rounded-[24px] w-full max-w-xl max-h-[85vh] flex flex-col shadow-[0_24px_64px_-12px_rgba(26,18,9,0.2)] animate-fade-up" style={{ animationDelay: '0ms' }}>
            
            <div className="px-8 py-6 border-b border-[#EDE8E0] flex justify-between items-center bg-white/50">
              <h3 className="font-fraunces text-2xl text-[#1A1209]">設定缺曠與空號</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-[#8C7D6B] hover:text-[#D4654A] transition-colors p-1.5 hover:bg-[#FDF0EC] rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow custom-scroll">
              <div className="grid grid-cols-12 gap-3 font-instrument text-[11px] font-bold tracking-widest uppercase text-[#8C7D6B] mb-4 px-3">
                <div className="col-span-3 text-center">座號</div>
                <div className="col-span-6">狀態設定</div>
                <div className="col-span-3 text-center">設為空號</div>
              </div>
              
              <div className="space-y-2.5">
                {students.map((student) => (
                  <div 
                    key={student.id} 
                    className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl border transition-all ${
                      student.isEmpty ? 'bg-black/5 border-transparent opacity-50' : 
                      student.status !== '正常' ? 'bg-[#FDF0EC] border-[#F5C4B5] shadow-sm' : 'bg-white border-[#EDE8E0] hover:border-[#D9B8D3]'
                    }`}
                  >
                    <div className="col-span-3 text-center font-fraunces text-xl text-[#1A1209]">
                      {student.id.toString().padStart(2, '0')}
                    </div>
                    
                    <div className="col-span-6">
                      <select
                        value={student.status}
                        disabled={student.isEmpty}
                        onChange={(e) => handleStudentChange(student.id, 'status', e.target.value)}
                        className={`w-full font-instrument text-sm rounded-lg border-[#EDE8E0] shadow-sm focus:border-[#D4654A] focus:ring-[#D4654A] disabled:opacity-50 transition-colors ${
                          student.status !== '正常' && !student.isEmpty ? 'text-[#D4654A] font-bold bg-white' : 'text-[#4A3F30]'
                        }`}
                      >
                        {LEAVE_T
