'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type WaitTimeData = {
  updated_at: string;
  data: Record<string, { terminal: string; waitTime: number }[]>;
  isMock: boolean;
};

const hubNames: Record<string, string> = {
  ATL: 'Hartsfield-Jackson Atlanta International (ATL)',
  BNA: 'Nashville International (BNA)',
  BOS: 'Boston Logan International (BOS)',
  BWI: 'Baltimore/Washington International (BWI)',
  CLE: 'Cleveland Hopkins International (CLE)',
  CLT: 'Charlotte Douglas International (CLT)',
  CVG: 'Cincinnati/Northern Kentucky International (CVG)',
  DAL: 'Dallas Love Field (DAL)',
  DCA: 'Ronald Reagan Washington National (DCA)',
  DEN: 'Denver International (DEN)',
  DFW: 'Dallas/Fort Worth International (DFW)',
  DTW: 'Detroit Metropolitan Wayne County (DTW)',
  EWR: 'Newark Liberty International (EWR)',
  FLL: 'Fort Lauderdale-Hollywood International (FLL)',
  HOU: 'William P. Hobby (HOU)',
  IAD: 'Washington Dulles International (IAD)',
  IAH: 'George Bush Intercontinental (IAH)',
  JAX: 'Jacksonville International (JAX)',
  JFK: 'John F. Kennedy International (JFK)',
  LAS: 'Harry Reid International (LAS)',
  LAX: 'Los Angeles International (LAX)',
  LGA: 'LaGuardia (LGA)',
  MCO: 'Orlando International (MCO)',
  MIA: 'Miami International (MIA)',
  MSP: 'Minneapolis-Saint Paul International (MSP)',
  OMA: 'Omaha Eppley Airfield (OMA)',
  ORD: 'Chicago O\'Hare International (ORD)',
  PBI: 'Palm Beach International (PBI)',
  PDX: 'Portland International (PDX)',
  PHL: 'Philadelphia International (PHL)',
  PHX: 'Phoenix Sky Harbor International (PHX)',
  PIT: 'Pittsburgh International (PIT)',
  SAN: 'San Diego International (SAN)',
  SEA: 'Seattle-Tacoma International (SEA)',
  SFO: 'San Francisco International (SFO)',
  SLC: 'Salt Lake City International (SLC)',
};

export default function FlyfastDashboard() {
  const [payload, setPayload] = useState<WaitTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/wait-times');
        if (!res.ok) throw new Error('Failed to fetch wait times');
        const json = await res.json();
        setPayload(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (mins: number) => {
    if (mins > 30) return { bg: 'bg-[#ef4444]', border: 'border-[#ef4444] hover:border-[#ef4444]', text: 'text-[#ef4444]', shadow: 'shadow-[0_0_15px_#ef4444]', label: 'Severe' };
    if (mins > 15) return { bg: 'bg-[#f59e0b]', border: 'border-[#f59e0b] hover:border-[#f59e0b]', text: 'text-[#f59e0b]', shadow: 'shadow-[0_0_15px_#f59e0b]', label: 'Moderate' };
    return { bg: 'bg-[#10b981]', border: 'border-[#10b981]/30 hover:border-[#10b981]/80', text: 'text-[#10b981]', shadow: 'shadow-[0_0_15px_#10b981]', label: 'Smooth' };
  };

  return (
    <main className="min-h-screen p-8 sm:p-12 md:p-24 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-6xl"
      >
        <header className="mb-16 text-center md:text-left">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block px-4 py-1 mb-4 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] text-xs font-bold tracking-widest uppercase border border-[#38bdf8]/30 backdrop-blur-sm shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          >
            Project Flyfast
          </motion.div>
          
          {payload?.isMock && (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="inline-block ml-4 px-4 py-1 mb-4 rounded-full bg-[#fca5a5]/10 text-[#fca5a5] text-xs font-bold tracking-widest uppercase border border-[#fca5a5]/30 backdrop-blur-sm"
             >
               Preview Data
             </motion.div>
          )}

          <h1 className="text-5xl md:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#f8fafc] via-[#e2e8f0] to-[#94a3b8] mb-4 drop-shadow-sm">
            Security Intelligence
          </h1>
          <p className="text-xl text-[#94a3b8] font-light max-w-2xl leading-relaxed">
            Real-time checkpoint wait times across 36 major U.S. airports, powered by live TSA data feeds and Firebase synchronization.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="w-16 h-16 rounded-full border-4 border-[#38bdf8]/20 border-t-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.3)] animate-spin" />
            </motion.div>
          ) : error ? (
             <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 rounded-3xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#fca5a5] text-center text-lg font-medium shadow-[0_0_25px_rgba(239,68,68,0.1)]"
            >
              System Error: {error}
            </motion.div>
          ) : payload && (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-16"
            >
              {Object.keys(payload.data).map((airport) => (
                 <div key={airport} className="space-y-6">
                    <h2 className="text-3xl font-serif text-[#f1f5f9] border-b border-[#334155] pb-4 flex items-center space-x-4 mix-blend-screen">
                       <span>{hubNames[airport] || airport}</span>
                    </h2>
                    
                    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
                      {payload.data[airport].map((cp: any, idx: number) => {
                        const isClosed = cp.status === 'closed';
                        const status = isClosed 
                          ? { bg: 'bg-[#64748b]', border: 'border-[#64748b] hover:border-[#64748b]', text: 'text-[#64748b]', shadow: 'shadow-none', label: 'Closed' }
                          : getStatusColor(cp.waitTime);
                          
                        return (
                          <motion.div 
                            key={cp.terminal}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 + 0.3, type: "spring", stiffness: 100 }}
                            className={`relative overflow-hidden p-6 lg:p-8 rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-[#334155]/50 hover:${status.border} transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="mb-4">
                              <h3 className="text-[#cbd5e1] font-semibold text-sm lg:text-base tracking-widest uppercase drop-shadow-md">
                                {cp.terminal}
                              </h3>
                              <p className="text-[#38bdf8] text-xs font-bold tracking-widest uppercase mt-1">
                                {cp.lanes && cp.lanes.length > 0 ? cp.lanes.join(', ') : 'STANDARD'}
                              </p>
                            </div>
                            
                            {isClosed ? (
                              <div className="flex items-baseline space-x-2">
                                <span className={`text-5xl font-black tracking-tighter ${status.text} drop-shadow-md`}>
                                  CLOSED
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-baseline space-x-2">
                                <span className={`text-6xl font-black tracking-tighter ${status.text} drop-shadow-lg`}>
                                  {cp.waitTime}
                                </span>
                                <span className="text-[#64748b] font-bold uppercase text-sm tracking-widest">min</span>
                              </div>
                            )}
                            
                            <div className="mt-8 flex items-center space-x-3 bg-[#0f172a]/50 w-max px-4 py-2 rounded-full border border-white/5">
                              <div className={`w-3 h-3 rounded-full ${status.bg} ${status.shadow}`} />
                              <span className="text-xs font-black text-[#f1f5f9] uppercase tracking-widest drop-shadow-md">
                                {status.label}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                 </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {payload && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 1 }}
             className="mt-16 text-center text-xs font-bold text-[#475569] uppercase tracking-[0.2em]"
          >
            Last Synchronized: {new Date(payload.updated_at).toLocaleTimeString()}
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
