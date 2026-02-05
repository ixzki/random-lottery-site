import { useState, useEffect, useRef } from "react";
import { POOL_PRESETS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, FileUp, Save, Undo2, History, RotateCcw, Trash2, Clock, Trophy, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { nanoid } from "nanoid";
import { format } from "date-fns";

type HistoryRecord = {
  id: string;
  timestamp: number;
  names: string[];
};

export default function Home() {
  // --- State ---
  const [currentPoolId, setCurrentPoolId] = useState<string>(POOL_PRESETS[0].id);
  const [allNames, setAllNames] = useState<string[]>([]);
  const [remainingNames, setRemainingNames] = useState<string[]>([]);
  const [currentDraw, setCurrentDraw] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Settings Dialog
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [importText, setImportText] = useState("");

  // Refs for auto-scroll
  const historyEndRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---
  useEffect(() => {
    // 1. Restore Pool Selection
    const savedPoolId = localStorage.getItem("lottery_pool_id");
    const activePoolId = savedPoolId || POOL_PRESETS[0].id;
    setCurrentPoolId(activePoolId);

    // 2. Load Names for that pool
    // Check if there's a custom override for this specific pool? 
    // For simplicity: Custom imports override the *currently selected* pool temporarily 
    // OR we treat custom as a separate "mode".
    // Let's stick to the requirement: "Two default pools, switchable".
    // If user imports custom names, we can save it as a "Custom" pool state or just overwrite current.
    // Decision: Import overwrites current active pool in memory/storage until reset.
    
    const savedCustomNames = localStorage.getItem(`lottery_custom_names_${activePoolId}`);
    let baseNames: string[] = [];

    if (savedCustomNames) {
      baseNames = JSON.parse(savedCustomNames);
    } else {
      const preset = POOL_PRESETS.find(p => p.id === activePoolId) || POOL_PRESETS[0];
      baseNames = preset.names;
    }
    
    setAllNames(baseNames);
    setImportText(baseNames.join("\n"));

    // 3. Load Progress
    const savedRemaining = localStorage.getItem(`lottery_remaining_${activePoolId}`);
    const savedCurrent = localStorage.getItem(`lottery_current_${activePoolId}`);
    const savedHistory = localStorage.getItem(`lottery_history_${activePoolId}`);

    if (savedRemaining) {
      setRemainingNames(JSON.parse(savedRemaining));
    } else {
      setRemainingNames([...baseNames]);
    }

    if (savedCurrent) {
      setCurrentDraw(JSON.parse(savedCurrent));
    } else {
      setCurrentDraw([]);
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      setHistory([]);
    }

  }, []); // Run once on mount, but we need to handle pool changes separately

  // --- Handle Pool Change ---
  const handlePoolChange = (value: string) => {
    if (isAnimating) return;
    
    // Save current state before switching? (Already handled by effects)
    
    const newPoolId = value;
    setCurrentPoolId(newPoolId);
    localStorage.setItem("lottery_pool_id", newPoolId);

    // Load new pool data
    const savedCustomNames = localStorage.getItem(`lottery_custom_names_${newPoolId}`);
    let baseNames: string[] = [];
    
    if (savedCustomNames) {
      baseNames = JSON.parse(savedCustomNames);
    } else {
      const preset = POOL_PRESETS.find(p => p.id === newPoolId) || POOL_PRESETS[0];
      baseNames = preset.names;
    }

    setAllNames(baseNames);
    setImportText(baseNames.join("\n"));

    // Load new pool progress
    const savedRemaining = localStorage.getItem(`lottery_remaining_${newPoolId}`);
    const savedCurrent = localStorage.getItem(`lottery_current_${newPoolId}`);
    const savedHistory = localStorage.getItem(`lottery_history_${newPoolId}`);

    setRemainingNames(savedRemaining ? JSON.parse(savedRemaining) : [...baseNames]);
    setCurrentDraw(savedCurrent ? JSON.parse(savedCurrent) : []);
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
    
    toast.success(`已切换至: ${POOL_PRESETS.find(p => p.id === newPoolId)?.name}`);
  };

  // --- Persistence ---
  useEffect(() => {
    if (allNames.length > 0 && currentPoolId) {
      localStorage.setItem(`lottery_remaining_${currentPoolId}`, JSON.stringify(remainingNames));
      localStorage.setItem(`lottery_current_${currentPoolId}`, JSON.stringify(currentDraw));
      localStorage.setItem(`lottery_history_${currentPoolId}`, JSON.stringify(history));
    }
  }, [remainingNames, currentDraw, allNames, history, currentPoolId]);

  // Scroll history to top when new item added
  useEffect(() => {
    if (history.length > 0 && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // --- Logic ---
  const handleDraw = (count: number) => {
    if (isAnimating) return;
    
    if (remainingNames.length === 0) {
      toast.error("当前奖池已抽完！请重置。");
      return;
    }

    const drawCount = Math.min(count, remainingNames.length);
    setIsAnimating(true);
    setCurrentDraw([]); 

    let step = 0;
    const maxSteps = 15;
    const interval = setInterval(() => {
      const tempDraw: string[] = [];
      for (let i = 0; i < drawCount; i++) {
        const randomIndex = Math.floor(Math.random() * remainingNames.length);
        tempDraw.push(remainingNames[randomIndex]);
      }
      setCurrentDraw(tempDraw);
      step++;

      if (step >= maxSteps) {
        clearInterval(interval);
        finalizeDraw(drawCount);
      }
    }, 80);
  };

  const finalizeDraw = (count: number) => {
    const newRemaining = [...remainingNames];
    const winners: string[] = [];

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * newRemaining.length);
      const winner = newRemaining[randomIndex];
      winners.push(winner);
      newRemaining.splice(randomIndex, 1);
    }

    setRemainingNames(newRemaining);
    setCurrentDraw(winners);
    
    // Add to history
    const newRecord: HistoryRecord = {
      id: nanoid(),
      timestamp: Date.now(),
      names: winners
    };
    setHistory(prev => [newRecord, ...prev]);

    setIsAnimating(false);
    
    confetti({
      particleCount: 100 * count,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f43f5e']
    });
  };

  const handleReset = () => {
    if (confirm("确定要重置当前奖池进度吗？")) {
      setRemainingNames([...allNames]);
      setCurrentDraw([]);
      setHistory([]);
      toast.success("已重置当前奖池");
    }
  };

  // --- Settings Logic ---
  const handleSaveImport = () => {
    const names = importText
      .split(/[\n,，]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) {
      toast.error("名单不能为空");
      return;
    }

    setAllNames(names);
    localStorage.setItem(`lottery_custom_names_${currentPoolId}`, JSON.stringify(names));
    
    // Reset everything
    setRemainingNames([...names]);
    setCurrentDraw([]);
    setHistory([]);
    
    setIsSettingsOpen(false);
    toast.success(`已更新当前奖池名单`);
  };

  const handleRestoreDefault = () => {
    if (confirm("恢复当前奖池的默认名单？")) {
      const preset = POOL_PRESETS.find(p => p.id === currentPoolId) || POOL_PRESETS[0];
      
      setAllNames(preset.names);
      setImportText(preset.names.join("\n"));
      setRemainingNames([...preset.names]);
      setCurrentDraw([]);
      setHistory([]);
      localStorage.removeItem(`lottery_custom_names_${currentPoolId}`);
      
      setIsSettingsOpen(false);
      toast.success("已恢复默认名单");
    }
  };

  // --- Render ---
  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-row">
      
      {/* LEFT PANEL: Main Draw Area */}
      <div className="flex-1 flex flex-col relative p-6 md:p-10">
        
        {/* Top Controls */}
        <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
           {/* Pool Switcher */}
           <Select value={currentPoolId} onValueChange={handlePoolChange} disabled={isAnimating}>
            <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur border-indigo-100 shadow-sm font-bold text-indigo-900">
              <SelectValue placeholder="选择奖池" />
            </SelectTrigger>
            <SelectContent>
              {POOL_PRESETS.map(pool => (
                <SelectItem key={pool.id} value={pool.id} className="font-medium">
                  {pool.name}
                </SelectItem>
              ))}
            </SelectContent>
           </Select>

           <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>名单管理 - {POOL_PRESETS.find(p => p.id === currentPoolId)?.name}</DialogTitle>
                <DialogDescription>
                  编辑当前奖池名单，保存后会自动重置进度。
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="请输入名单..."
                  className="h-[300px] font-mono text-sm resize-none"
                />
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>共 {importText.split(/[\n,，]/).filter(n => n.trim().length > 0).length} 人</span>
                  <span>支持换行或逗号分隔</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" type="button" onClick={handleRestoreDefault} className="mr-auto text-muted-foreground">
                  <Undo2 className="w-4 h-4 mr-2" />
                  恢复默认
                </Button>
                <Button type="submit" onClick={handleSaveImport}>
                  <Save className="w-4 h-4 mr-2" />
                  保存并重置
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Top Right: Progress */}
        <div className="absolute top-6 right-6 flex items-center gap-3 text-sm font-medium text-muted-foreground bg-white/50 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", remainingNames.length > 0 ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span>剩余: <span className="text-foreground font-bold text-base">{remainingNames.length}</span> / {allNames.length}</span>
          </div>
          {remainingNames.length < allNames.length && (
             <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-destructive hover:bg-destructive/10 rounded-full" onClick={handleReset} title="重置">
               <RotateCcw className="w-3.5 h-3.5" />
             </Button>
          )}
        </div>

        {/* Center: Draw Result */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto">
          {currentDraw.length > 0 ? (
            <div className={cn(
              "grid gap-6 w-full px-8 transition-all duration-500",
              currentDraw.length === 1 ? "grid-cols-1" : 
              currentDraw.length <= 3 ? "grid-cols-1 md:grid-cols-3" : 
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            )}>
              {currentDraw.map((name, index) => (
                <div 
                  key={`${name}-${index}`}
                  className={cn(
                    "relative group animate-pop-in flex items-center justify-center",
                    "aspect-[4/3] rounded-2xl bg-white shadow-xl border border-indigo-100",
                    isAnimating && "scale-95 opacity-80"
                  )}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" />
                  <span className={cn(
                    "font-bold text-slate-800 tracking-tight text-center px-4",
                    currentDraw.length === 1 ? "text-7xl md:text-8xl" : "text-4xl md:text-5xl"
                  )}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-6 opacity-30 select-none">
              <div className="inline-flex items-center justify-center p-8 rounded-full bg-indigo-50">
                 <Trophy className="w-24 h-24 text-indigo-200" />
              </div>
              <p className="text-3xl font-light tracking-widest text-indigo-900/40">
                {POOL_PRESETS.find(p => p.id === currentPoolId)?.name}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="mt-auto pt-10 pb-4 flex justify-center gap-6">
           <Button 
             size="lg" 
             onClick={() => handleDraw(1)} 
             disabled={isAnimating || remainingNames.length === 0}
             className="h-20 w-48 text-2xl font-bold rounded-2xl shadow-lg shadow-indigo-200/50 bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-1 transition-all"
           >
             抽 1 人
           </Button>
           <Button 
             size="lg" 
             onClick={() => handleDraw(3)} 
             disabled={isAnimating || remainingNames.length === 0}
             className="h-20 w-48 text-2xl font-bold rounded-2xl shadow-lg shadow-purple-200/50 bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:brightness-110 hover:-translate-y-1 transition-all"
           >
             抽 3 人
           </Button>
           <Button 
             size="lg" 
             onClick={() => handleDraw(5)} 
             disabled={isAnimating || remainingNames.length === 0}
             className="h-20 w-48 text-2xl font-bold rounded-2xl shadow-lg shadow-pink-200/50 bg-white text-pink-600 border-2 border-pink-100 hover:border-pink-300 hover:bg-pink-50 hover:-translate-y-1 transition-all"
           >
             抽 5 人
           </Button>
        </div>
      </div>

      {/* RIGHT PANEL: History */}
      <div className="w-[320px] md:w-[400px] border-l bg-slate-50/50 backdrop-blur flex flex-col shadow-[-5px_0_30px_rgba(0,0,0,0.02)] z-20">
        <div className="p-6 border-b bg-white/80 backdrop-blur sticky top-0 z-10 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-lg text-slate-800">抽奖记录</h2>
          <span className="ml-auto text-xs font-mono text-muted-foreground bg-slate-100 px-2 py-1 rounded">
            {history.length} 轮
          </span>
        </div>

        <ScrollArea className="flex-1 p-6">
           <div className="space-y-6">
             {history.length === 0 ? (
               <div className="text-center py-20 text-muted-foreground text-sm flex flex-col items-center gap-3 opacity-60">
                 <Clock className="w-10 h-10 stroke-1" />
                 <p>暂无抽奖记录</p>
               </div>
             ) : (
               history.map((record, i) => (
                 <div key={record.id} className="group animate-slide-in-right relative pl-4 border-l-2 border-indigo-100 hover:border-indigo-400 transition-colors pb-1 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                         Round {history.length - i}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {format(record.timestamp, "HH:mm:ss")}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                       {record.names.map(name => (
                         <span key={name} className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border shadow-sm text-sm font-medium text-slate-700">
                           {name}
                         </span>
                       ))}
                    </div>
                 </div>
               ))
             )}
             <div ref={historyEndRef} />
           </div>
        </ScrollArea>
        
        {history.length > 0 && (
           <div className="p-4 border-t bg-white/50 backdrop-blur text-center">
             <Button variant="ghost" size="sm" onClick={() => {
                if(confirm("确定清空历史记录？")) setHistory([]);
             }} className="text-slate-400 hover:text-destructive text-xs w-full">
               <Trash2 className="w-3 h-3 mr-2" />
               清空记录
             </Button>
           </div>
        )}
      </div>
    </div>
  );
}
