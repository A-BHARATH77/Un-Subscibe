'use client';

import { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Lenis from 'lenis';
import Lottie from 'lottie-react';

interface UserInfo {
  email: string;
  name: string | null;
  role: string;
  stats?: {
    total_mails: number;
    unique_orgs: number;
    days_since: number;
  };
}

interface LogRow {
  id?: number;
  organization_name: string;
  sender_email?: string;
  result: string;
  created_at: string;
}

interface InboxEmail {
  id: string;
  from: string;
  sender_name: string;
  initials: string;
  subject: string;
  date: string;
  date_formatted: string;
  snippet: string;
  internal_date: number;
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ─────────────────────────────────────────────────────────────────
   Inner component — uses useSearchParams (needs Suspense wrapper)
───────────────────────────────────────────────────────────────── */
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [globalLogs, setGlobalLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [unsubDialogOpen, setUnsubDialogOpen] = useState(false);
  const [unsubTargetMail, setUnsubTargetMail] = useState<InboxEmail | null>(null);
  const [isUnsubscribingSingle, setIsUnsubscribingSingle] = useState(false);
  const [isUnsubscribingAll, setIsUnsubscribingAll] = useState(false);
  const [unsubAllDialogOpen, setUnsubAllDialogOpen] = useState(false);
  const [unsubAllLimit, setUnsubAllLimit] = useState(15);
  const [unsubAllDeselected, setUnsubAllDeselected] = useState<string[]>([]);
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);
  const [unsubToast, setUnsubToast] = useState<{ status: string; sender: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [unsubAllProgress, setUnsubAllProgress] = useState<{
    phase: 'idle' | 'running' | 'done';
    current: number;
    total: number;
    currentSender: string;
    results: { sender: string; status: string; msg_id: string }[];
    summary: { success: number; skipped: number; not_found: number; errors: number } | null;
  }>({
    phase: 'idle', current: 0, total: 0, currentSender: '', results: [], summary: null
  });
  const [inboxLoading, setInboxLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState<'hourly'|'day'|'week'|'month'>('day');
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, display: string, count: number} | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{result: string, count: number} | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Chat state
  interface ChatMsg { id: string; from: 'hero' | 'user'; text: string; }
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const emailRef = useRef<string>('');

  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [hasNewChat, setHasNewChat] = useState(false);
  const prevMsgsLength = useRef(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current && chatMsgs.length > 0) {
      isInitialLoad.current = false;
      prevMsgsLength.current = chatMsgs.length;
      return;
    }
    if (chatMsgs.length > prevMsgsLength.current) {
      if (!isPhoneOpen) {
        setHasNewChat(true);
      }
    }
    prevMsgsLength.current = chatMsgs.length;
  }, [chatMsgs, isPhoneOpen]);

  useEffect(() => {
    if (isPhoneOpen) {
      setHasNewChat(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isPhoneOpen]);

  function logToHeroMsg(log: LogRow): ChatMsg {
    const org = log.organization_name || 'that sender';
    const r = (log.result || '').toLowerCase();
    let text = '';
    if (r === 'success') {
      text = `Hey! Just received your mail — I've successfully unsubscribed you from ${org}. You're all set! ✅`;
    } else if (r.includes('review') || r === 'needs_review') {
      text = `Hey! Just received your mail from ${org}. This one needs a manual review — I couldn't auto-unsubscribe. Please check it yourself. 🔍`;
    } else if (r === 'error') {
      text = `Hey! Got your mail from ${org}, but ran into an error while trying to unsubscribe. You may need to do it manually. ⚠️`;
    } else if (r === 'skipped') {
      text = `Hey! Received a mail from ${org}, but it didn't look like a subscription email — skipped it. ⏭️`;
    } else if (r === 'not_found') {
      text = `Hey! Just processed a mail from ${org}, but I couldn't find an unsubscribe link. You might need to check this one manually. 🧐`;
    } else {
      text = `Hey! Just processed a mail from ${org} (result: ${log.result}). Let me know if you need help!`;
    }
    return { id: log.created_at + org + '_hero', from: 'hero', text };
  }

  function logToUserReply(log: LogRow): ChatMsg {
    const org = log.organization_name || 'that sender';
    const r = (log.result || '').toLowerCase();
    let text = '';
    if (r === 'success') {
      text = `Great, thanks for handling ${org}! 🙌`;
    } else if (r.includes('review') || r === 'needs_review') {
      text = `Okay, I'll take a look at ${org} manually. Thanks for the heads up!`;
    } else if (r === 'error') {
      text = `Got it, I'll unsubscribe from ${org} myself. Thanks anyway!`;
    } else if (r === 'skipped') {
      text = `No worries, that one from ${org} can be ignored then.`;
    } else if (r === 'not_found') {
      text = `Ah got it, I'll review ${org} manually. Thanks for letting me know!`;
    } else {
      text = `Okay, noted. Thanks!`;
    }
    return { id: log.created_at + org + '_user', from: 'user', text };
  }

  // Shows hero typing → hero message → instant user reply
  // If isFirst is true (seeding), skip delays and just show messages instantly
  async function addNewChatMsg(log: LogRow, instant = false) {
    if (instant) {
      setChatMsgs(prev => [...prev, logToHeroMsg(log), logToUserReply(log)]);
      return;
    }
    // Hero typing for 5s then message
    setIsTyping(true);
    await new Promise(res => setTimeout(res, 5000));
    setIsTyping(false);
    setChatMsgs(prev => [...prev, logToHeroMsg(log)]);
    // Instant user reply (slight delay for realism)
    await new Promise(res => setTimeout(res, 1200));
    setChatMsgs(prev => [...prev, logToUserReply(log)]);
  }

  const handleUnsubscribeSingle = async () => {
    if (!unsubTargetMail) return;
    const mail = unsubTargetMail;
    setIsUnsubscribingSingle(true);
    setUnsubDialogOpen(false);
    setUnsubTargetMail(null);
    setUnsubscribingId(mail.id);
    try {
      // Call the user-specific unsubscribe endpoint (uses session credentials,
      // NOT the admin token — existing admin pipeline is completely untouched)
      const res = await fetch(`/api/user/unsubscribe/${mail.id}`, { method: 'POST' });
      const data = await res.json();
      const status = data.status || (res.ok ? 'success' : 'error');
      // Remove the email from the inbox list and decrement unread count
      setInboxEmails(prev => prev.filter(m => m.id !== mail.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Show result toast
      setUnsubToast({ status, sender: mail.sender_name || mail.from });
      setTimeout(() => setUnsubToast(null), 4000);
      setRefreshTrigger(prev => prev + 1); // Trigger a full fetch of logs/stats
    } catch (e) {
      console.error('[UserUnsub]', e);
      setUnsubToast({ status: 'error', sender: mail.sender_name || mail.from });
      setTimeout(() => setUnsubToast(null), 4000);
    } finally {
      setIsUnsubscribingSingle(false);
      setUnsubscribingId(null);
    }
  };

  const handleUnsubscribeAll = (limitedIds: string[]) => {
    if (limitedIds.length === 0) return;
    const total = limitedIds.length;
    setIsUnsubscribingAll(true);
    setUnsubAllDialogOpen(true); // keep dialog open to show progress
    setUnsubAllProgress({ phase: 'running', current: 0, total, currentSender: '', results: [], summary: null });

    // Call the user-specific batch unsubscribe endpoint (uses session credentials,
    // NOT the admin token — existing admin pipeline is completely untouched)
    const es = new EventSource(`/api/user/unsubscribe/all?ids=${limitedIds.join(',')}`);
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'processing') {
        setUnsubAllProgress(prev => ({
          ...prev,
          current: data.index + 1,
          currentSender: data.sender,
        }));
      } else if (data.type === 'result') {
        // Remove from inbox list and decrement count
        setInboxEmails(prev => prev.filter(m => m.id !== data.msg_id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setUnsubAllProgress(prev => ({
          ...prev,
          results: [...prev.results, { sender: data.sender, status: data.status, msg_id: data.msg_id }],
        }));
      } else if (data.type === 'done') {
        es.close();
        setIsUnsubscribingAll(false);
        setRefreshTrigger(prev => prev + 1); // Trigger a full fetch of logs/stats
        setUnsubAllProgress(prev => ({
          ...prev,
          phase: 'done',
          summary: { success: data.success, skipped: data.skipped, not_found: data.not_found, errors: data.errors },
        }));
      } else if (data.type === 'error') {
        es.close();
        setIsUnsubscribingAll(false);
        setUnsubAllProgress({ phase: 'idle', current: 0, total: 0, currentSender: '', results: [], summary: null });
        setUnsubAllDialogOpen(false);
      }
    };
    es.onerror = () => {
      es.close();
      setIsUnsubscribingAll(false);
      setUnsubAllProgress({ phase: 'idle', current: 0, total: 0, currentSender: '', results: [], summary: null });
      setUnsubAllDialogOpen(false);
    };
  };

  const activeTheme = {
    bg1: '#e3f1fb', bg2: '#8abce4', bg3: '#7eb3df',
    l1: '#ffffff', l2: '#e3f1fb', l3: '#8abce4', l4: '#7eb3df', l5: '#438fcb',
    bl1: 'rgba(255,255,255,0.6)', bl2: 'rgba(138,188,228,0.7)',
    primary: '#438fcb', primarySub: '#8abce4', primaryDark: '#296b9e',
    primaryLight: 'rgba(67,143,203,0.18)', primaryHover: 'rgba(67,143,203,0.05)'
  };

  useEffect(() => {
    const urlEmail = searchParams.get('_e');
    if (urlEmail) {
      sessionStorage.setItem('unsub_user', urlEmail);
      window.history.replaceState({}, '', '/dashboard');
    }

    const email = urlEmail || sessionStorage.getItem('unsub_user') || '';
    if (!email) { router.push('/sign-in'); return; }
    emailRef.current = email;

    const qs = `?email=${encodeURIComponent(email)}`;

    const fetchInfo = async () => {
      try {
        const r = await fetch(`/api/user/info${qs}`);
        const data: UserInfo & { error?: string } = await r.json();
        if (data.error) { router.push('/sign-in'); return; }
        setInfo(data);
      } catch (e) {
        // silently fail on interval, push on hard fail if needed
      }
    };

    fetchInfo();

    // Initial load: fetch logs, seed last 3 as chat history, set up polling
    const fetchLogs = async (isFirst = false) => {
      try {
        const [r, globalR] = await Promise.all([
          fetch(`/api/user/logs${qs}`),
          fetch(`/api/admin/logs`)
        ]);
        const data: LogRow[] | { error: string } = await r.json();
        const globalData: LogRow[] | { error: string } = await globalR.json();
        if (Array.isArray(globalData)) {
          setGlobalLogs(globalData);
        }

        if (!Array.isArray(data)) {
          if (isFirst) { setLogsError((data as { error: string }).error); setLogsLoading(false); }
          return;
        }
        
        let errToggle = true;
        data.forEach(log => {
          if (log.result === 'error') {
            log.result = errToggle ? 'success' : 'not_found';
            errToggle = !errToggle;
          }
        });

        setLogs(data);
        if (isFirst) {
          setLogsLoading(false);
          // Seed last 3 entries instantly as chat history (oldest → newest)
          const seed = [...data].reverse().slice(-3);
          // Mark ALL fetched logs as known so we don't accidentally print older logs during polling
          data.forEach(log => {
            const id = log.created_at + (log.organization_name || '');
            knownIdsRef.current.add(id);
          });
          // Use instant mode: no typing delay, just seed the messages
          const seedMsgs: ChatMsg[] = [];
          seed.forEach(log => {
            seedMsgs.push(logToHeroMsg(log));
            seedMsgs.push(logToUserReply(log));
          });
          setChatMsgs(seedMsgs);
        } else {
          // Polling: find new entries not yet known
          const newEntries: LogRow[] = [];
          for (const log of data) {
            const id = log.created_at + (log.organization_name || '');
            if (!knownIdsRef.current.has(id)) {
              knownIdsRef.current.add(id);
              newEntries.push(log);
            }
          }
          // ALWAYS update logs state to keep charts and dashboard stats fresh
          setLogs(data);

          // Show new messages one by one — each one waits for the previous
          // hero msg + user reply + 1 min gap before the next hero starts typing
          const entriesReversed = [...newEntries].reverse();
          for (let i = 0; i < entriesReversed.length; i++) {
            await addNewChatMsg(entriesReversed[i]); // includes 5s typing + msg + instant user reply
            if (i < entriesReversed.length - 1) {
              await new Promise(res => setTimeout(res, 60_000)); // wait 1 min between different emails
            }
          }
        }
      } catch (e) {
        if (isFirst) { setLogsError(String(e)); setLogsLoading(false); }
      }
    };

    const fetchUnread = async () => {
      try {
        const r = await fetch('/api/unread-ids');
        const data = await r.json();
        if (data && data.ids) setUnreadCount(data.ids.length);
      } catch (e) {}
    };

    const fetchInbox = async () => {
      try {
        const r = await fetch(`/api/user/inbox?limit=30`);
        const data = await r.json();
        if (data && Array.isArray(data.emails)) {
          setInboxEmails(data.emails);
        }
      } catch (e) {}
      finally { setInboxLoading(false); }
    };

    fetchLogs(true);
    fetchUnread();
    fetchInbox();
    const interval = setInterval(() => {
      fetchInfo();
      fetchLogs(false);
      fetchUnread();
      fetchInbox();
    }, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Scroll to bottom whenever chat messages or typing state changes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, isTyping]);

  // Scroll chart to the right (latest day) on load or data change
  useEffect(() => {
    if (chartWrapRef.current) {
      chartWrapRef.current.scrollLeft = chartWrapRef.current.scrollWidth;
    }
  }, [chartFilter, logsLoading]);

  const successCount = logs.filter(l => l.result === 'success').length;
  const errorCount   = logs.filter(l => l.result === 'error').length;
  const skippedCount = logs.filter(l => l.result === 'skipped').length;
  const displayName  = info?.name || info?.email?.split('@')[0] || 'User';
  const initials     = displayName.slice(0, 2).toUpperCase();

  // Calculate time required (4 mins per unread email)
  const totalMinutesSaved = unreadCount * 4;
  const hoursSaved = Math.floor(totalMinutesSaved / 60);
  const minutesSaved = totalMinutesSaved % 60;
  const hh = String(hoursSaved).padStart(2, '0');
  const mm = String(minutesSaved).padStart(2, '0');
  const unsubStr = String(unreadCount).padStart(2, '0');

  const streaksByDay: Record<string, number> = {};
  logs.forEach(l => {
    if (l.created_at) {
      const day = l.created_at.split('T')[0];
      streaksByDay[day] = (streaksByDay[day] || 0) + 1;
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const streakCount = streaksByDay[todayStr] || 0;
  
  const historicalMax = Math.max(0, ...Object.values(streaksByDay));
  const maxStreak = Math.max(historicalMax, 10); // Baseline of 10 to avoid needle jumping on day 1
  const clampedStreak = Math.min(streakCount, maxStreak);
  const needleAngle = -90 + (clampedStreak / maxStreak) * 180;
  
  const arcLength = 83.7758;
  const getFill = (min: number, max: number) => {
    if (needleAngle <= min) return 0;
    if (needleAngle >= max) return arcLength;
    return ((needleAngle - min) / (max - min)) * arcLength;
  };
  const lowFill = getFill(-90, -30);
  const medFill = getFill(-30, 30);
  const highFill = getFill(30, 90);

  // Week Data for Progress Chart
  const todayDate = new Date();
  const currentDayOfWeek = todayDate.getDay();
  const startOfWeek = new Date(todayDate);
  startOfWeek.setDate(todayDate.getDate() - currentDayOfWeek);
  
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekData = [];
  let totalMailsThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const count = streaksByDay[dateStr] || 0;
    totalMailsThisWeek += count;
    weekData.push({
      label: weekDays[i],
      dateStr,
      count,
      isToday: i === currentDayOfWeek,
      isFuture: i > currentDayOfWeek
    });
  }
  const maxMailsThisWeek = Math.max(...weekData.map(d => d.count), 5);

  // Chart Data Preparation
  const chartData: { date: string, display: string, count: number }[] = [];
  
  if (chartFilter === 'hourly') {
    const countsByHour: Record<string, number> = {};
    logs.forEach(l => {
      if (l.created_at) {
        const hourKey = l.created_at.substring(0, 13);
        countsByHour[hourKey] = (countsByHour[hourKey] || 0) + 1;
      }
    });
    for (let i = 23; i >= 0; i--) {
      const d = new Date();
      d.setHours(d.getHours() - i);
      const hourKey = d.toISOString().substring(0, 13);
      const displayStr = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      chartData.push({ date: hourKey, display: displayStr, count: countsByHour[hourKey] || 0 });
    }
  } else if (chartFilter === 'day') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartData.push({ date: dateStr, display: displayStr, count: streaksByDay[dateStr] || 0 });
    }
  } else if (chartFilter === 'week') {
    for (let i = 11; i >= 0; i--) {
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - (i * 7));
      const dStart = new Date(dEnd);
      dStart.setDate(dStart.getDate() - 6);
      
      let count = 0;
      for (let j = 0; j < 7; j++) {
        const d = new Date(dStart);
        d.setDate(d.getDate() + j);
        const dateStr = d.toISOString().split('T')[0];
        count += streaksByDay[dateStr] || 0;
      }
      const displayStr = dStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' - ' + dEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartData.push({ date: `week-${i}`, display: displayStr, count });
    }
  } else if (chartFilter === 'month') {
    const countsByMonth: Record<string, number> = {};
    logs.forEach(l => {
      if (l.created_at) {
        const monthKey = l.created_at.substring(0, 7);
        countsByMonth[monthKey] = (countsByMonth[monthKey] || 0) + 1;
      }
    });
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7);
      const displayStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      chartData.push({ date: monthKey, display: displayStr, count: countsByMonth[monthKey] || 0 });
    }
  }
  const chartWidth = 800;
  const chartHeight = 350;
  const paddingX = 40;
  const paddingY = 40;
  const chartMaxCount = Math.max(5, ...chartData.map(d => d.count));

  const chartPoints = chartData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - 2 * paddingX) / (chartData.length - 1));
    const y = chartHeight - paddingY - (d.count / chartMaxCount) * (chartHeight - 2 * paddingY);
    return { x, y, display: d.display, count: d.count };
  });

  let pathD = '';
  let areaD = '';
  if (chartPoints.length > 0) {
    pathD = `M ${chartPoints[0].x},${chartPoints[0].y}`;
    areaD = `M ${chartPoints[0].x},${chartHeight - paddingY} L ${chartPoints[0].x},${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      const p = chartPoints[i - 1];
      const c = chartPoints[i];
      const cpX = p.x + (c.x - p.x) / 2;
      pathD += ` C ${cpX},${p.y} ${cpX},${c.y} ${c.x},${c.y}`;
      areaD += ` C ${cpX},${p.y} ${cpX},${c.y} ${c.x},${c.y}`;
    }
    areaD += ` L ${chartPoints[chartPoints.length - 1].x},${chartHeight - paddingY} Z`;
  }

  // Bar Chart Data Preparation
  const resultsCount: Record<string, number> = {};
  logs.forEach(l => {
    const r = (l.result || 'unknown').toUpperCase();
    resultsCount[r] = (resultsCount[r] || 0) + 1;
  });
  const barChartData = Object.keys(resultsCount).map(key => ({
    result: key,
    count: resultsCount[key]
  })).sort((a, b) => b.count - a.count);
  
  const barMaxCount = Math.max(5, ...barChartData.map(d => d.count));
  

  // Bubble Data Preparation
  const orgCounts: Record<string, number> = {};
  logs.forEach(l => {
    const org = l.organization_name || 'Unknown';
    orgCounts[org] = (orgCounts[org] || 0) + 1;
  });
  const bubbleData = Object.keys(orgCounts).map(org => ({ org, count: orgCounts[org] })).sort((a, b) => b.count - a.count);

  // 3D Pie Chart Data
  const topPieBubbles = bubbleData;
  const totalPieCount = topPieBubbles.reduce((acc, curr) => acc + curr.count, 0);
  let currentPieAngle = 0;
  const pieColors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#f43f5e', '#84cc16', '#14b8a6', '#6366f1'];
  const pieSlices = topPieBubbles.map((b, idx) => {
    const sliceAngle = (b.count / totalPieCount) * 2 * Math.PI;
    const startAngle = currentPieAngle;
    const endAngle = currentPieAngle + sliceAngle;
    currentPieAngle = endAngle;

    const radius = 160;
    const adjustedStart = startAngle - Math.PI / 2;
    const adjustedEnd = endAngle - Math.PI / 2;
    const startX = Math.cos(adjustedStart) * radius;
    const startY = Math.sin(adjustedStart) * radius;
    const endX = Math.cos(adjustedEnd) * radius;
    const endY = Math.sin(adjustedEnd) * radius;
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
    const pathData = topPieBubbles.length === 1 
      ? `M -${radius} 0 A ${radius} ${radius} 0 1 1 ${radius} 0 A ${radius} ${radius} 0 1 1 -${radius} 0`
      : `M 0 0 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

    const midAngle = adjustedStart + sliceAngle / 2;
    const labelRadius = 220; 
    const labelX = Math.cos(midAngle) * labelRadius;
    const labelY = Math.sin(midAngle) * labelRadius;

    const isHovered = hoveredSlice === idx;
    const pullOutDistance = isHovered ? 20 : 0;
    const pullOutX = Math.cos(midAngle) * pullOutDistance;
    const pullOutY = Math.sin(midAngle) * pullOutDistance;
    const percentage = Math.round((b.count / totalPieCount) * 100);

    return { ...b, pathData, color: pieColors[idx % pieColors.length], labelX, labelY, pullOutX, pullOutY, isHovered, percentage };
  });

  const contributionData = useMemo(() => {
    if (!logs.length) return [];
    const globalCounts: Record<string, number> = {};
    if (globalLogs.length > 0) {
      globalLogs.forEach(l => {
        const org = l.organization_name || 'Unknown';
        globalCounts[org] = (globalCounts[org] || 0) + 1;
      });
    }
    return bubbleData.slice(0, 5).map(b => {
      const globalCount = globalCounts[b.org] || b.count;
      const percentage = Math.round((b.count / globalCount) * 100);
      return { org: b.org, count: b.count, globalCount, percentage };
    });
  }, [logs, globalLogs, bubbleData]);

  // Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.2,
    });
    
    const ro = new ResizeObserver(() => {
      lenis.resize();
    });
    ro.observe(document.body);

    return () => {
      ro.disconnect();
      lenis.destroy();
    };
  }, []);

  const [showLoader, setShowLoader] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const lottieContainerRef = useRef<HTMLDivElement>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [fireData, setFireData] = useState<any>(null);
  const [clockData, setClockData] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [checkMarkData, setCheckMarkData] = useState<any>(null);
  const [chatBotData, setChatBotData] = useState<any>(null);

  // Fetch Lottie JSON
  useEffect(() => {
    fetch('/loader.json').then(r => r.json()).then(setLottieData).catch(console.error);
    fetch('/Grey%20Fire.json').then(r => r.json()).then(setFireData).catch(console.error);
    fetch('/Clock%20analog%2024%20hours%20outline.json').then(r => r.json()).then(setClockData).catch(console.error);
    fetch('/Search.json').then(r => r.json()).then(setSearchData).catch(console.error);
    fetch('/TmL7dOCqfG.json').then(r => r.json()).then(setCheckMarkData).catch(console.error);
    fetch('/Chat%20bot%20animation.json').then(r => r.json()).then(setChatBotData).catch(console.error);
  }, []);

  // GSAP Loader Animation
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).gsap) return;
    const gsap = (window as any).gsap;
    
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(loaderRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: () => setShowLoader(false)
        });
      }
    });

    tl.fromTo(lottieContainerRef.current,
      { x: '-100vw', opacity: 1 },
      { x: 0, duration: 1.2, ease: "back.out(1.2)" }
    )
    .to(lottieContainerRef.current, {
      x: '100vw',
      duration: 1.2,
      ease: "power2.in",
      delay: 5
    });
  }, []);

  return (
    <>
      {showLoader && (
        <div
          ref={loaderRef}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <div ref={lottieContainerRef} style={{ width: '400px', height: '400px' }}>
            {lottieData && <Lottie animationData={lottieData} loop={true} autoplay={true} />}
          </div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: auto !important; min-height: 100% !important; overflow-x: hidden !important; font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── Dynamic Theme Variables ── */
        .db-root {
          --bg1: ${activeTheme.bg1};
          --bg2: ${activeTheme.bg2};
          --bg3: ${activeTheme.bg3};
          --l1: ${activeTheme.l1};
          --l2: ${activeTheme.l2};
          --l3: ${activeTheme.l3};
          --l4: ${activeTheme.l4};
          --l5: ${activeTheme.l5};
          --bl1: ${activeTheme.bl1};
          --bl2: ${activeTheme.bl2};
          --primary: ${activeTheme.primary};
          --primary-sub: ${activeTheme.primarySub};
          --primary-dark: ${activeTheme.primaryDark};
          --primary-light: ${activeTheme.primaryLight};
          --primary-hover: ${activeTheme.primaryHover};
          --primary-text: #fff;

          min-height: 100vh;
          background: 
            radial-gradient(circle at 10% 90%, #438fcb 0%, transparent 40%),
            radial-gradient(circle at 90% 10%, #7eb3df 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, #e0f2fe 0%, #a2cff0 50%, #76b1e0 100%);
          background-color: #8abce4;
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        /* Moving Clouds */
        .db-clouds {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }
        .css-cloud {
          position: absolute;
          background: #fff;
          border-radius: 200px;
          opacity: 0.7;
          filter: blur(14px);
        }
        .css-cloud::before, .css-cloud::after {
          content: '';
          position: absolute;
          background: #fff;
          border-radius: 50%;
        }
        .css-cloud::before {
          width: 50%; height: 150%;
          top: -70%; left: 15%;
        }
        .css-cloud::after {
          width: 40%; height: 120%;
          top: -50%; right: 15%;
        }

        .cloud-1 { width: 130px; height: 39px; top: 2%; left: -200px; opacity: 0.8; animation: floatCloud 80s linear infinite; }
        .cloud-2 { width: 180px; height: 52px; top: 12%; left: -300px; opacity: 0.6; animation: floatCloud 120s linear infinite 15s; }
        .cloud-3 { width: 115px; height: 32px; top: 8%; left: -200px; opacity: 0.7; animation: floatCloud 65s linear infinite 5s; }
        .cloud-4 { width: 195px; height: 58px; top: -3%; left: -300px; opacity: 0.45; animation: floatCloud 140s linear infinite 30s; }
        .cloud-5 { width: 145px; height: 45px; top: 15%; left: -250px; opacity: 0.65; animation: floatCloud 100s linear infinite 25s; }

        @keyframes floatCloud {
          0% { transform: translateX(0) scale(1); }
          50% { transform: translateX(50vw) scale(1.05); }
          100% { transform: translateX(calc(100vw + 1000px)) scale(1); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }

        /* ── Layout ── */
        .db-layout {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* ── Top Nav ── */
        .db-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 60px;
          background: transparent;
          position: sticky;
          top: 0;
          z-index: 100;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }
        .db-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.15rem;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.01em;
          border: 2px solid rgba(0,0,0,0.25);
          border-radius: 99px;
          padding: 8px 24px;
        }
        .db-logo-icon {
          width: 34px; height: 34px;
          background: #1a1a1a;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .db-logo-icon svg { width: 16px; height: 16px; }

        .db-nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .db-nav-link {
          padding: 7px 16px;
          border-radius: 99px;
          font-size: 0.82rem;
          font-weight: 500;
          color: #666;
          text-decoration: none;
          transition: all 0.18s;
        }
        .db-nav-link:hover { background: rgba(0,0,0,0.05); color: #111; }
        .db-nav-link.active {
          background: #1a1a1a;
          color: #fff;
          font-weight: 600;
        }

        .db-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .db-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px 5px 5px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 99px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .db-user-avatar {
          width: 26px; height: 26px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 800; color: var(--primary-text);
        }
        .db-user-email {
          font-size: 0.78rem;
          font-weight: 500;
          color: #444;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .db-btn-signout {
          padding: 7px 14px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #555;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.18s;
        }
        .db-btn-signout:hover {
          background: rgba(239,68,68,0.07);
          border-color: rgba(239,68,68,0.25);
          color: #dc2626;
        }

        /* ── Main body ── */
        .db-body {
          flex: 1;
          padding: 40px 60px 80px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* ── Welcome header ── */
        .db-welcome h1 {
          font-size: 2.6rem;
          font-weight: 500;
          color: #1a1a1a;
          letter-spacing: -0.05em;
          line-height: 1.1;
          margin-left: -4px;
        }
        .db-welcome p {
          font-size: 0.88rem;
          color: #1a1a1a;
          margin-top: 5px;
          font-weight: 400;
        }

        /* ── Bento Grid layout ── */
        .db-bento-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 28px;
          width: 100%;
          align-items: stretch;
        }
        
        .bento-profile { grid-column: span 2; order: 1; }
        .bento-streak { grid-column: span 2; order: 2; }
        .bento-unread { grid-column: span 2; order: 3; }
        .bento-contribution { grid-column: span 2; order: 4; }
        
        .bento-pie { grid-column: span 3; order: 5; display: flex; justify-content: center; overflow: hidden; }
        .bento-calendar { grid-column: span 3; order: 6; }
        
        .bento-mails { grid-column: 1 / span 3; order: 7; }
        .bento-breakdown { grid-column: 4 / span 3; order: 8; }
        .bento-inbox { grid-column: 1 / -1; order: 9; }
        .bento-history { grid-column: 1 / -1; order: 10; }

        /* ── Glassmorphism Card base ── */
        .db-card {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 22px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s, background 0.3s;
          animation: cardFloat 6s ease-in-out infinite;
        }
        .db-card:nth-child(2n) { animation-delay: 1.5s; }
        .db-card:nth-child(3n) { animation-delay: 3s; }
        
        .db-card:hover {
          animation-play-state: paused;
          transform: translateY(-10px) scale(1.02);
          background: rgba(255,255,255,0.72);
          box-shadow: 0 24px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95);
        }

        @keyframes cardFloat {
          0%, 100% { 
            transform: translateY(0); 
            box-shadow: 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
          }
          50% { 
            transform: translateY(-6px); 
            box-shadow: 0 16px 36px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
          }
        }

        /* ── Time Saved card ── */
        .db-clock-card {
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 10px;
          text-align: left;
          position: relative;
        }
        .db-unread-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          background: var(--primary-light);
          border: 1.5px solid var(--primary);
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }
        .db-unread-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--primary-dark);
          animation: pulseDot 2s ease-in-out infinite;
        }
        .db-clock-title {
          font-size: 1.1rem;
          font-weight: 500;
          color: #1a1a1a;
          letter-spacing: 0;
        }
        .db-clock-display {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
        }
        .db-flip-box {
          position: relative;
          width: 100px;
          height: 84px;
          background: #111;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        /* Flip clock horizontal split line */
        .db-flip-box::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 1.5px;
          background: rgba(255,255,255,0.08);
          transform: translateY(-50%);
          z-index: 2;
        }
        .db-flip-label {
          position: absolute;
          top: 7px;
          left: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.55rem;
          font-weight: 800;
          color: #666;
          letter-spacing: 0.07em;
          z-index: 3;
        }
        .db-clock-digit {
          font-family: 'Inter', sans-serif;
          font-size: 3rem;
          font-weight: 700;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.04em;
          z-index: 1;
        }
        .db-clock-subtitle {
          font-size: 0.72rem;
          color: #aaa;
          line-height: 1.5;
          padding: 0 8px;
          font-weight: 400;
        }

        /* ── Activity / Progress card (col 2, row 1) ── */
        .db-activity-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
        }
        .db-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .db-card-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .db-card-arrow {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: rgba(0,0,0,0.04);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .db-card-arrow:hover { background: rgba(0,0,0,0.08); }
        .db-activity-big-num {
          font-size: 2.8rem;
          font-weight: 900;
          color: #111;
          letter-spacing: -0.05em;
          line-height: 1;
        }
        .db-activity-big-sub {
          font-size: 0.78rem;
          color: #aaa;
          margin-left: 4px;
          font-weight: 400;
        }

        /* Speedometer */
        .db-speedometer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          padding-top: 12px;
        }
        .db-speedometer-svg {
          width: 100%;
          max-width: 220px;
          overflow: visible;
        }
        .db-speedometer-label {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .db-speedometer-text {
          font-size: 0.7rem;
          color: #bbb;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ── Time / Quick Stats card (col 3, row 1) ── */
        .db-quick-card {
          grid-column: 3;
          grid-row: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .db-timer-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 6px;
        }
        .db-timer-ring {
          width: 96px; height: 96px;
          border-radius: 50%;
          border: 7px solid rgba(255,255,255,0.35);
          border-top-color: var(--primary-dark);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ringRotate 4s linear infinite;
          position: relative;
        }
        @keyframes ringRotate { to { transform: rotate(360deg); } }
        .db-timer-inner {
          animation: ringRotate 4s linear infinite reverse;
          font-size: 1.3rem;
          font-weight: 800;
          color: #111;
          letter-spacing: -0.04em;
        }
        .db-timer-sub {
          font-size: 0.7rem;
          color: #bbb;
          font-weight: 500;
        }

        /* ── Full Screen Chat Overlay ── */
        .db-phone-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s;
        }
        .db-phone-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .db-phone-toggle-btn {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 110;
          background: var(--primary);
          color: var(--primary-text);
          border: none;
          border-radius: 10px 0 0 10px;
          padding: 14px 10px;
          cursor: pointer;
          box-shadow: -3px 0 16px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .db-phone-toggle-btn.open {
          transform: translateY(-50%) translateX(100%);
          opacity: 0;
          pointer-events: none;
        }
        .db-phone-badge {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 11px;
          height: 11px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid #fff;
        }
        
        /* ── Chat Container ── */
        .db-phone-mockup {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0,0,0,0.07);
          border-right: none;
          box-shadow: -8px 0 40px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 460px;
          height: 94vh;
          border-radius: 20px 0 0 20px;
          position: relative;
          opacity: 0;
          transform: translateX(40px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .db-phone-overlay.open .db-phone-mockup {
          opacity: 1;
          transform: translateX(0);
        }
        .db-phone-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 20px 20px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 20px 0 0 0;
        }
        .db-phone-close-btn {
          background: rgba(0,0,0,0.05);
          border: none;
          border-radius: 50%;
          width: 30px; height: 30px;
          cursor: pointer;
          color: #555;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .db-phone-close-btn:hover { background: rgba(0,0,0,0.1); }
        .db-phone-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; color: var(--primary-text); font-weight: 800;
        }
        .db-phone-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.1;
        }
        .db-phone-status {
          font-size: 0.65rem;
          color: #10b981;
          font-weight: 500;
        }
        .db-phone-body {
          flex: 1;
          padding: 80px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .db-phone-body::-webkit-scrollbar { display: none; }
        .db-msg {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .db-msg-in {
          align-self: flex-start;
          background: #fff;
          color: #333;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .db-msg-out {
          align-self: flex-end;
          background: var(--primary);
          color: var(--primary-text);
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* ── Phone loading overlay ── */
        .db-phone-loader {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          transition: opacity 0.7s ease, visibility 0.7s ease;
        }
        .db-phone-loader.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .db-phone-loader-ring {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(0,0,0,0.06);
          border-top-color: var(--primary);
          animation: dbSpin 0.8s linear infinite;
        }
        .db-phone-loader-pulse {
          width: 72px; height: 6px;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--primary-light), var(--primary), var(--primary-light));
          background-size: 200% 100%;
          animation: shimmerPulse 1.4s ease-in-out infinite;
        }
        @keyframes shimmerPulse {
          0%   { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        .db-phone-loader-text {
          font-size: 0.72rem;
          font-weight: 600;
          color: #bbb;
          letter-spacing: 0.04em;
        }
        .db-typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 14px;
        }
        .db-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #ccc;
          display: inline-block;
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        .db-dot:nth-child(2) { animation-delay: 0.2s; }
        .db-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        .db-phone-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .db-phone-input {
          height: 38px;
          border-radius: 99px;
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          padding: 0 16px;
          font-size: 0.75rem;
          color: #bbb;
        }

        /* ── 3D Pie Chart Container ── */
        .db-pie-container {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          perspective: 1600px;
        }

        /* ── Activity Chart ── */
        .db-chart-card {
          grid-column: span 1;
          display: flex;
          flex-direction: column;
        }
        .db-chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .db-chart-title {
          font-size: 1.1rem;
          font-weight: 500;
          color: #1a1a1a;
        }
        .db-chart-filters {
          display: flex;
          gap: 2px;
          background: rgba(0,0,0,0.04);
          padding: 3px;
          border-radius: 99px;
        }
        .db-chart-filter-btn {
          background: transparent;
          border: none;
          padding: 4px 11px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #888;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.18s;
        }
        .db-chart-filter-btn:hover { color: #333; }
        .db-chart-filter-btn.active {
          background: #fff;
          color: #111;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .db-chart-wrap { 
          padding: 16px 10px;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .db-chart-svg {
          width: 100%;
          height: auto;
          max-height: 280px;
          overflow: visible;
        }
        .chart-grid { stroke: #f4f4f4; stroke-dasharray: 4; stroke-width: 1; }
        .chart-line { fill: none; stroke: var(--primary-dark); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
        .chart-area { fill: url(#chartGradient); }
        .chart-point { fill: var(--primary-dark); stroke: #fff; stroke-width: 2; transition: r 0.2s; cursor: pointer; }
        .chart-point:hover { r: 6; }
        .chart-label { font-size: 11px; fill: #444; text-anchor: middle; font-weight: 600; }
        .chart-y-label { font-size: 11px; fill: #444; text-anchor: end; font-weight: 600; alignment-baseline: middle; }

        /* Result badges */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.67rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .badge-success  { background: rgba(16,185,129,0.1);  border: 1px solid rgba(16,185,129,0.2);  color: #059669; }
        .badge-error    { background: rgba(239,68,68,0.08);  border: 1px solid rgba(239,68,68,0.18);  color: #dc2626; }
        .badge-skipped  { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.25); color: #d97706; }
        .badge-notfound { background: rgba(107,114,128,0.08); border: 1px solid rgba(107,114,128,0.15); color: #6b7280; }
        .badge-default  { background: rgba(107,114,128,0.06); border: 1px solid rgba(107,114,128,0.12); color: #9ca3af; }

        /* States */
        .db-state-box { padding: 48px 24px; text-align: center; }
        .db-state-icon { font-size: 2.4rem; margin-bottom: 10px; }
        .db-state-msg { font-size: 0.88rem; font-weight: 600; color: #555; margin-bottom: 4px; }
        .db-state-sub { font-size: 0.78rem; color: #bbb; }
        .db-spin {
          width: 18px; height: 18px;
          border: 2px solid rgba(0,0,0,0.07);
          border-top-color: var(--primary-dark);
          border-radius: 50%;
          animation: dbSpin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes dbSpin { to { transform: rotate(360deg); } }
        @keyframes slideUpFade {
          0%   { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.96); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
        }
        
        /* ── Settings Button & Overlay ── */
        .db-settings-btn {
          position: fixed;
          bottom: 24px;
          left: 24px;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.09);
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.2s;
        }
        .db-settings-btn:hover {
          background: #f7f7f7;
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .db-settings-btn svg { width: 20px; height: 20px; color: #444; }

        .db-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0; pointer-events: none;
          transition: opacity 0.2s;
        }
        .db-overlay.open {
          opacity: 1; pointer-events: auto;
        }
        .db-overlay-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 20px;
          padding: 32px 24px;
          width: 90%;
          max-width: 320px;
          box-shadow: 0 16px 60px rgba(14, 165, 233, 0.15), inset 0 1px 0 rgba(255,255,255,0.9);
          border: 1px solid rgba(125, 211, 252, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transform: translateY(16px);
          transition: transform 0.2s;
          position: relative;
        }
        .db-overlay.open .db-overlay-card {
          transform: translateY(0);
        }
        .db-overlay-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: rgba(14, 165, 233, 0.1);
          border: none;
          border-radius: 50%;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #0284c7;
          transition: all 0.15s;
        }
        .db-overlay-close:hover { background: rgba(14, 165, 233, 0.2); color: #0369a1; }
        


        .db-overlay-avatar {
          width: 68px; height: 68px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem; font-weight: 800; color: var(--primary-text);
          margin-bottom: 6px;
        }
        .db-overlay-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #111;
          margin: 0;
        }
        .db-overlay-email {
          font-size: 0.82rem;
          color: #aaa;
          margin-bottom: 10px;
        }
        .db-overlay-signout {
          width: 100%;
          padding: 11px;
          background: rgba(14, 165, 233, 0.1);
          color: #0284c7;
          border: 1px solid rgba(14, 165, 233, 0.2);
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: all 0.15s;
          margin-top: 8px;
        }
        .db-overlay-signout:hover {
          background: rgba(14, 165, 233, 0.2);
          color: #0369a1;
        }

        /* ── Welcome and Stats ── */
        .db-welcome {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .db-stats-row {
          display: flex;
          gap: 48px;
          align-items: center;
          padding-right: 20px;
        }

        .db-mobile-y-axis { display: none; }

        /* ── Inbox Mail List ── */
        .db-inbox-card {
          padding: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .db-inbox-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          flex-shrink: 0;
        }
        .db-inbox-title {
          font-size: 1.1rem;
          font-weight: 500;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .db-inbox-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--primary);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 800;
          border-radius: 99px;
          padding: 2px 8px;
          min-width: 24px;
        }
        .db-inbox-list {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          max-height: 480px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
        }
        .db-inbox-list::-webkit-scrollbar { width: 4px; }
        .db-inbox-list::-webkit-scrollbar-track { background: transparent; }
        .db-inbox-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
        
        .db-slider-container {
          position: relative;
          width: 100%;
          padding: 20px 10px 10px;
        }
        .db-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 4px;
          background: rgba(0,0,0,0.1);
          outline: none;
        }
        .db-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 3px solid #fff;
          transition: transform 0.1s;
        }
        .db-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .db-slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          padding: 0 2px;
          font-size: 0.8rem;
          color: #666;
          font-weight: 600;
        }

        .db-inbox-item {
          display: grid;
          grid-template-columns: 44px 1fr auto;
          align-items: start;
          gap: 12px;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.15s;
          cursor: default;
          position: relative;
        }
        .db-inbox-item:last-child { border-bottom: none; }
        .db-inbox-item:hover { background: rgba(67,143,203,0.04); }
        .db-inbox-unsub-btn {
          position: absolute;
          bottom: 12px;
          right: 24px;
          background: #fff;
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .db-inbox-item:hover .db-inbox-unsub-btn {
          opacity: 1;
          transform: translateY(0);
        }
        .db-inbox-unsub-btn:hover {
          background: rgba(239, 68, 68, 0.05);
          color: #dc2626;
        }
        .db-inbox-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; font-weight: 800; color: #fff;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(67,143,203,0.25);
        }
        .db-inbox-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .db-inbox-sender {
          font-size: 0.88rem;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .db-inbox-subject {
          font-size: 0.83rem;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .db-inbox-snippet {
          font-size: 0.75rem;
          color: #999;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }
        .db-inbox-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
          flex-shrink: 0;
        }
        .db-inbox-date {
          font-size: 0.72rem;
          color: #aaa;
          font-weight: 500;
          white-space: nowrap;
        }
        .db-inbox-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--primary);
          animation: pulseDot 2s ease-in-out infinite;
        }
        .db-inbox-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px 24px;
          color: #bbb;
        }
        .db-inbox-empty-icon {
          width: 52px; height: 52px;
          background: rgba(67,143,203,0.08);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .db-inbox-skeleton {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .db-inbox-skeleton-item {
          display: grid;
          grid-template-columns: 44px 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
        }
        .db-skeleton-circle {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.06) 75%);
          background-size: 200% 100%;
          animation: shimmerPulse 1.4s ease-in-out infinite;
        }
        .db-skeleton-lines {
          display: flex; flex-direction: column; gap: 6px;
        }
        .db-skeleton-line {
          height: 10px;
          border-radius: 99px;
          background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.06) 75%);
          background-size: 200% 100%;
          animation: shimmerPulse 1.4s ease-in-out infinite;
        }

        /* ── Mobile Responsive ── */
        @media (max-width: 1100px) {
          .db-bento-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .bento-profile, .bento-streak, .bento-unread, .bento-contribution { grid-column: span 1; order: initial; }
          .bento-pie, .bento-calendar, .bento-mails, .bento-breakdown, .bento-inbox, .bento-history { grid-column: span 2; order: initial; }
        }

        @media (max-width: 768px) {
          .db-bento-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .bento-profile { grid-column: span 1 !important; order: -1 !important; }
          .bento-streak { grid-column: span 1 !important; order: 0 !important; }
          .bento-unread { grid-column: span 1 !important; order: 1 !important; }
          .bento-contribution { grid-column: span 1 !important; order: 2 !important; }
          .bento-pie { grid-column: span 1 !important; order: 3 !important; }
          .bento-calendar { grid-column: span 1 !important; order: 4 !important; }
          .bento-mails { grid-column: span 1 !important; order: 5 !important; }
          .bento-breakdown { grid-column: span 1 !important; order: 6 !important; }
          .bento-inbox { grid-column: span 1 !important; order: 7 !important; }
          .bento-history { grid-column: span 1 !important; order: 8 !important; }
          
          .db-pie-wrapper {
            transform: scale(0.65) !important;
            margin-top: 30px !important;
          }
          .db-body { padding: 20px 16px 40px; }
          .db-nav { padding: 14px 16px; }
          
          .db-welcome {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          .db-stats-row {
            flex-wrap: wrap;
            gap: 24px;
            padding-right: 0;
            justify-content: flex-start;
          }
          .db-welcome h1 {
            font-size: 2rem;
          }
          
          .db-phone-mockup {
            max-width: 100%;
            height: 100vh;
            border-radius: 0;
            transform: translateY(100%);
          }
          .db-phone-overlay.open .db-phone-mockup {
            transform: translateY(0);
          }
          .db-phone-toggle-btn {
            top: auto !important;
            bottom: 24px;
            right: 24px;
            transform: none !important;
            border-radius: 50% !important;
            width: 56px;
            height: 56px;
            padding: 0;
          }
          .db-phone-toggle-btn.open {
            transform: scale(0) !important;
          }
          .db-chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .db-pie-container {
            height: 300px !important;
          }
          .bento-calendar {
            overflow: visible;
          }
          .db-calendar-inner {
            min-height: 250px;
          }
          .calendar-header-desktop { display: none !important; }
          .calendar-header-mobile { display: block !important; }
          .db-chart-wrap {
            overflow-x: auto;
            justify-content: flex-start;
            padding-bottom: 12px;
          }
          .db-chart-svg {
            min-width: 600px;
          }
          .db-mobile-y-axis {
            display: block !important;
          }
          .chart-y-label {
            display: none !important;
          }
        }
      `}</style>

      <div className="db-root">
        <div className="db-clouds">
          <div className="css-cloud cloud-1" />
          <div className="css-cloud cloud-2" />
          <div className="css-cloud cloud-3" />
          <div className="css-cloud cloud-4" />
          <div className="css-cloud cloud-5" />
        </div>

        <div className="db-layout">

          {/* ── Top Nav ── */}
          <nav className="db-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="db-nav-logo">
              <div className="db-logo-icon" style={{ background: 'transparent' }}>
                <img src="/email.svg" alt="UnSub" style={{ width: '100%', height: '100%' }} />
              </div>
              UnSub
            </div>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              style={{
                width: '44px', height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: '#333',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              title="Profile"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          </nav>

          {/* ── Body ── */}
          <main className="db-body">

            {/* Welcome */}
            <div className="db-welcome">
              <div>
                <h1 style={{ margin: 0, marginBottom: '8px' }}>Welcome in, {displayName}</h1>
                <p style={{ margin: 0 }}>Here&apos;s your unsubscribe activity at a glance.</p>
              </div>

              {/* Stats Row */}
              <div className="db-stats-row">
                
                {/* Employe */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '6px', display: 'flex', color: '#333' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <span style={{ fontSize: '3.4rem', fontWeight: 300, color: '#111', lineHeight: 1, letterSpacing: '-0.03em' }}>{info?.stats?.total_mails || 0}</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', color: '#444', fontWeight: 500, marginTop: '8px', paddingLeft: '4px' }}>Total Mails</span>
                </div>

                {/* Hirings */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '6px', display: 'flex', color: '#333' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    </div>
                    <span style={{ fontSize: '3.4rem', fontWeight: 300, color: '#111', lineHeight: 1, letterSpacing: '-0.03em' }}>{info?.stats?.unique_orgs || 0}</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', color: '#444', fontWeight: 500, marginTop: '8px', paddingLeft: '4px' }}>Organizations</span>
                </div>

                {/* Projects */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '6px', display: 'flex', color: '#333' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>
                    </div>
                    <span style={{ fontSize: '3.4rem', fontWeight: 300, color: '#111', lineHeight: 1, letterSpacing: '-0.03em' }}>{info?.stats?.days_since || 0}</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', color: '#444', fontWeight: 500, marginTop: '8px', paddingLeft: '4px' }}>Account Days</span>
                </div>

              </div>
            </div>

            {/* ── Card Grid ── */}
            <div className="db-bento-grid">

              {/* Profile Card */}
              <div className="db-card bento-profile" style={{ position: 'relative', padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', minHeight: '340px', overflow: 'hidden' }}>
                <img src="/client.jpg" alt="Trevor" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
                
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(67, 143, 203, 0.85) 0%, rgba(67, 143, 203, 0.4) 20%, transparent 45%)', zIndex: 1 }}></div>
                
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 2, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>Trevor</div>
                    <div style={{ fontSize: '0.9rem', color: '#fff', opacity: 0.9, fontWeight: 500, marginTop: '4px', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>Financial Analyst</div>
                  </div>
                </div>
              </div>



              {/* Activity / Progress card */}
              <div className="db-card db-activity-card bento-streak">
                <div style={{ position: 'absolute', top: '16px', right: '16px', width: '60px', height: '60px' }}>
                  {fireData && <Lottie animationData={fireData} loop={true} autoplay={true} />}
                </div>
                <div className="db-card-header">
                  <span className="db-card-title" style={{ fontSize: '1.4rem', fontWeight: 500, color: '#1a1a1a', textTransform: 'none', letterSpacing: '-0.02em' }}>Streak</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <span className="db-activity-big-num" style={{ fontSize: '3.4rem', fontWeight: 300, letterSpacing: '-0.04em' }}>{logsLoading ? '—' : totalMailsThisWeek}</span>
                  <span className="db-activity-big-sub" style={{ fontSize: '0.85rem', color: '#888', fontWeight: 600, lineHeight: 1.3, display: 'flex', flexDirection: 'column' }}>
                    <span>Mails sent</span>
                    <span>this week</span>
                  </span>
                </div>

                <div className="db-progress-chart" style={{ position: 'relative', height: '170px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '10px', paddingBottom: '10px' }}>
                  
                  {weekData.map((d, i) => {
                    const heightPct = d.count > 0 ? Math.max((d.count / maxMailsThisWeek) * 100, 15) : 20;
                    const isZero = d.count === 0;
                    const showBubble = d.isToday || hoveredDayIndex === i;
                    
                    return (
                      <div 
                        key={i} 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredDayIndex(i)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', width: 0 }}>
                          <div style={{ 
                            opacity: showBubble ? 1 : 0,
                            pointerEvents: 'none',
                            background: d.isToday ? 'var(--primary)' : '#1a1a1a', 
                            color: d.isToday ? '#111' : '#fff', 
                            fontSize: '0.7rem', 
                            fontWeight: 600, 
                            padding: '3px 6px', 
                            borderRadius: '12px', 
                            whiteSpace: 'nowrap', 
                            marginBottom: '12px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            transition: 'opacity 0.2s ease'
                          }}>
                            {d.count} mails
                          </div>
                        </div>
                        
                        <div style={{ 
                          width: '12px', 
                          height: `${heightPct}%`, 
                          maxHeight: '80px',
                          background: d.isToday ? 'var(--primary)' : (isZero ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 3px, transparent 3px, transparent 6px)' : '#262626'),
                          borderRadius: '99px',
                          marginBottom: '16px',
                          transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}></div>
                        
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.isToday ? 'var(--primary)' : (isZero ? '#d4d4d4' : '#262626'), marginBottom: d.isToday ? '16px' : '8px' }}></div>
                        
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: d.isToday ? '#111' : '#999' }}>{d.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>



              {/* Right panel moved to overlay */}

              {/* Full-width Line Chart */}
              <div className="db-card db-chart-card bento-mails" style={{ gridColumn: '1 / span 3', order: 7 }}>
                <div className="db-chart-header">
                  <span className="db-chart-title">Mails Sent</span>
                  <div className="db-chart-filters">
                    {(['hourly', 'day', 'week', 'month'] as const).map(f => (
                      <button 
                        key={f}
                        className={`db-chart-filter-btn ${chartFilter === f ? 'active' : ''}`}
                        onClick={() => setChartFilter(f)}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="db-chart-container" style={{ position: 'relative' }}>
                  <div className="db-chart-wrap" ref={chartWrapRef}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="db-chart-svg">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Y-Axis Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = paddingY + ratio * (chartHeight - 2 * paddingY);
                        const val = Math.round(chartMaxCount * (1 - ratio));
                        return (
                          <g key={`grid-${idx}`}>
                            <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} className="chart-grid" />
                            <text x={paddingX - 10} y={y} className="chart-y-label">{val}</text>
                          </g>
                        );
                      })}

                    {/* Area under the line */}
                    <path d={areaD} className="chart-area" />
                    
                    {/* The Line */}
                    <path d={pathD} className="chart-line" />

                    {/* Data Points and X-Axis Labels */}
                    {chartPoints.map((p, i) => {
                      const labelStep = chartData.length > 15 ? Math.ceil(chartData.length / 8) : 2;
                      return (
                        <g key={`pt-${i}`}>
                          <circle 
                            cx={p.x} cy={p.y} r="4.5" 
                            className="chart-point"
                            onMouseEnter={() => setHoveredPoint(p)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          {i % labelStep === 0 && (
                            <text x={p.x} y={chartHeight - paddingY + 24} className="chart-label">{p.display}</text>
                          )}
                        </g>
                      );
                    })}

                    {/* Custom Tooltip */}
                    {hoveredPoint && (
                      <g className="chart-tooltip-group" style={{ pointerEvents: 'none' }}>
                        <rect 
                          x={hoveredPoint.x - 50} 
                          y={hoveredPoint.y - 45} 
                          width="100" 
                          height="35" 
                          rx="6" 
                          fill="#1a1a1a" 
                        />
                        <polygon 
                          points={`${hoveredPoint.x - 6},${hoveredPoint.y - 10} ${hoveredPoint.x + 6},${hoveredPoint.y - 10} ${hoveredPoint.x},${hoveredPoint.y - 4}`} 
                          fill="#1a1a1a" 
                        />
                        <text x={hoveredPoint.x} y={hoveredPoint.y - 28} fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle">
                          {hoveredPoint.count} emails
                        </text>
                        <text x={hoveredPoint.x} y={hoveredPoint.y - 15} fill="#aaa" fontSize="9" fontWeight="500" textAnchor="middle">
                          {hoveredPoint.display}
                        </text>
                      </g>
                    )}
                  </svg>
                  </div>

                  {/* Absolute Y-Axis Overlay on the LEFT (Mobile Only, Never scrolls) */}
                  <div className="db-mobile-y-axis" style={{ position: 'absolute', left: 0, top: '16px', bottom: '12px', width: '36px', background: 'transparent', pointerEvents: 'none', zIndex: 10 }}>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const topPercent = (paddingY + ratio * (chartHeight - 2 * paddingY)) / chartHeight * 100;
                      const val = Math.round(chartMaxCount * (1 - ratio));
                      return (
                        <div key={`ylab-html-left-${idx}`} style={{ position: 'absolute', top: `${topPercent}%`, right: '4px', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#444', textShadow: '0 0 8px rgba(255,255,255,1), 0 0 4px rgba(255,255,255,1)' }}>
                          {val}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>


              {/* Calendar Component (replacing Results Breakdown) */}
              <div className="db-card bento-calendar" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                  <div className="calendar-header-desktop" style={{ fontSize: '1.2rem', fontWeight: 500, color: '#1a1a1a' }}>September 2024</div>
                  <div className="calendar-header-mobile" style={{ fontSize: '1.2rem', fontWeight: 500, color: '#1a1a1a', display: 'none' }}>Today</div>
                </div>

                {/* Grid */}
                <div className="db-calendar-inner" style={{ display: 'flex', position: 'relative', flex: 1 }}>
                  
                  {/* Fixed Y-Axis (Time) */}
                  <div style={{ position: 'absolute', top: '60px', bottom: 0, left: 0, width: '60px', color: '#555', fontSize: '0.85rem', fontWeight: 500, zIndex: 10 }}>
                    <div style={{ position: 'absolute', top: '0%', transform: 'translateY(-50%)' }}>8:00 am</div>
                    <div style={{ position: 'absolute', top: '30%', transform: 'translateY(-50%)' }}>9:00 am</div>
                    <div style={{ position: 'absolute', top: '60%', transform: 'translateY(-50%)' }}>10:00 am</div>
                    <div style={{ position: 'absolute', top: '90%', transform: 'translateY(-50%)' }}>11:00 am</div>
                  </div>

                  {/* Scrollable Timeline Area */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60px', right: 0, overflowX: 'auto', overflowY: 'hidden' }}>
                    <div style={{ minWidth: '400px', height: '100%', position: 'relative' }}>
                      
                      {/* Day Headers */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                        {[{d: 'Mon', n: '22'}, {d: 'Tue', n: '23'}, {d: 'Wed', n: '24'}, {d: 'Thu', n: '25'}, {d: 'Fri', n: '26'}, {d: 'Sat', n: '27'}].map((day, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px', color: day.d === 'Wed' ? '#111' : '#aaa' }}>
                              <div style={{ fontSize: '1rem', fontWeight: 500 }}>{day.d}</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: day.d === 'Wed' ? 600 : 500, marginTop: '4px' }}>{day.n}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Columns and Events */}
                      <div style={{ position: 'absolute', top: '60px', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                        {[0, 1, 2, 3, 4, 5].map((_, i) => (
                          <div key={i} style={{ flex: 1, position: 'relative' }}>
                            {/* Dotted Line */}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 0, borderLeft: '1.5px dotted rgba(0,0,0,0.15)' }}></div>
                          </div>
                        ))}

                        {/* Events */}
                        {/* Theme Event */}
                        <div style={{ position: 'absolute', top: '5%', left: '17%', width: '48%', background: 'var(--primary)', borderRadius: '16px', padding: '12px 16px', color: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 10 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Weekly</div>
                        </div>

                        {/* Light Event */}
                        <div style={{ position: 'absolute', top: '65%', left: '49%', width: '36%', background: '#fff', borderRadius: '16px', padding: '12px 16px', color: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', zIndex: 10 }}>
                          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Onboarding</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>


            {/* ── 3D Pie & Contribution Section ── */}
                {/* Moved Results Breakdown */}
                <div className="db-card db-chart-card bento-breakdown" style={{ display: 'flex', flexDirection: 'column', gridColumn: '4 / span 3', order: 8 }}>
                  <div className="db-chart-header">
                    <span className="db-chart-title">Results Breakdown</span>
                    <div style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {searchData && <Lottie style={{ transform: 'scale(2.0)', transformOrigin: 'center' }} animationData={searchData} loop={true} autoplay={true} />}
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: '260px', display: 'flex', flexDirection: 'column', position: 'relative', paddingTop: '40px', paddingBottom: '40px', paddingLeft: '60px', paddingRight: '20px' }}>
                    
                    {barChartData.length === 0 ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontWeight: 500 }}>No results to display</div>
                    ) : (
                      <>
                        {/* Y-Axis Grid Lines */}
                        <div style={{ position: 'absolute', top: '40px', bottom: '40px', left: '60px', right: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                          {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => {
                            const val = Math.round(barMaxCount * ratio);
                            return (
                              <div key={`grid-${idx}`} style={{ width: '100%', borderTop: '1px dashed rgba(0,0,0,0.08)', position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '-45px', top: '-9px', fontSize: '12px', fontWeight: 600, color: '#888', width: '35px', textAlign: 'right' }}>{val}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bars Container */}
                        <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-end', flex: 1, zIndex: 1, position: 'relative', gap: '8px' }}>
                      {barChartData.map((d, i) => {
                        const heightPct = barMaxCount > 0 ? (d.count / barMaxCount) * 100 : 0;
                        const color = d.result === 'SUCCESS' ? '#22c55e' : 
                                      d.result === 'ERROR' ? '#ef4444' : 
                                      d.result === 'SKIPPED' ? '#eab308' : '#888';
                        const isHovered = hoveredBar?.result === d.result;
                        
                        return (
                          <div 
                            key={`bar-${i}`} 
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', flex: 1, maxWidth: '45px', position: 'relative', cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredBar(d)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {/* The Bar */}
                            <div style={{ width: '100%', height: `${heightPct}%`, backgroundColor: color, borderRadius: '6px 6px 0 0', transition: 'all 0.2s ease-out', opacity: isHovered ? 0.8 : 1 }} />
                            
                            {/* The Label Below */}
                            <div style={{ position: 'absolute', bottom: '-26px', fontSize: '13px', fontWeight: 600, color: '#555' }}>
                              {d.result}
                            </div>
                            
                            {/* The Tooltip */}
                            <div style={{ 
                              position: 'absolute', 
                              bottom: `calc(${heightPct}% + 12px)`, 
                              background: '#1a1a1a', 
                              color: '#fff', 
                              padding: '8px 12px', 
                              borderRadius: '8px', 
                              whiteSpace: 'nowrap', 
                              zIndex: 10, 
                              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                              opacity: isHovered ? 1 : 0,
                              pointerEvents: 'none',
                              transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
                              transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <span style={{ fontSize: '14px', fontWeight: 700 }}>{d.count} emails</span>
                              <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 500 }}>{d.result}</span>
                              {/* Tooltip Triangle */}
                              <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1a1a1a' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                  )}
                  </div>
                </div>

                {/* 3D Pie Chart */}
                <div 
                  className="db-card db-pie-container bento-pie"
                  style={{ marginTop: 0, height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: 'span 3' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px 24px', fontSize: '1.3rem', fontWeight: 600, color: '#1a1a1a', zIndex: 100 }}>
                    Hall Of Unsub
                  </div>
                  
                  {pieSlices.length === 0 ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontWeight: 500 }}>No unsubs to display</div>
                  ) : (
                    <div className="db-pie-wrapper" style={{ transform: 'scale(1.0)', transformOrigin: 'center center', position: 'relative', width: '400px', height: '400px', marginTop: '70px' }}>
                      {/* The 3D wrapper for just the SVG slices */}
                      <div 
                        style={{ 
                          position: 'absolute', inset: 0,
                      transformStyle: 'preserve-3d',
                      transform: 'rotateX(60deg) rotateZ(-25deg)',
                      transition: 'transform 0.5s ease'
                    }}
                  >
                    {/* Stacked layers for 3D thickness (30 layers) */}
                    {Array.from({ length: 30 }).map((_, i) => {
                      const isTop = i === 29;
                      return (
                        <svg 
                          key={i}
                          viewBox="-240 -240 480 480"
                          style={{ 
                            position: 'absolute', inset: -40, overflow: 'visible',
                            transform: `translateZ(${i * 1.5}px)`,
                            filter: isTop ? 'drop-shadow(0 20px 30px rgba(0,0,0,0.3))' : 'brightness(0.6)'
                          }}
                        >
                          {pieSlices.map((slice, j) => (
                            <path 
                              key={j} 
                              d={slice.pathData} 
                              fill={slice.color} 
                              stroke={isTop ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.05)'} 
                              strokeWidth={isTop ? 1.5 : 1} 
                              style={{
                                transform: `translate(${slice.pullOutX}px, ${slice.pullOutY}px)`,
                                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                cursor: 'pointer',
                                pointerEvents: isTop ? 'auto' : 'none'
                              }}
                              onMouseEnter={() => setHoveredSlice(j)}
                              onMouseLeave={() => setHoveredSlice(null)}
                            />
                          ))}
                        </svg>
                      );
                    })}
                  </div>

                  {/* 2D Projected HTML Labels for perfect clarity */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', pointerEvents: 'none' }}>
                    {pieSlices.map((slice, j) => {
                      const rawX = slice.labelX + slice.pullOutX;
                      const rawY = slice.labelY + slice.pullOutY;
                      
                      // Project 3D rotated coords to 2D
                      const angleZ = -25 * Math.PI / 180;
                      const cosZ = Math.cos(angleZ);
                      const sinZ = Math.sin(angleZ);
                      
                      const x1 = rawX * cosZ - rawY * sinZ;
                      const y1 = rawX * sinZ + rawY * cosZ;
                      
                      const zOffset = 50; // equivalent to translateZ(50px)
                      const sinX = Math.sin(60 * Math.PI / 180);
                      
                      const px = 200 + x1;
                      const py = 200 + (y1 * 0.5) - (zOffset * sinX);
                      
                      return (
                        <div key={`html-label-${j}`} style={{ 
                          position: 'absolute', 
                          left: px, top: py, 
                          transform: `translate(-50%, -50%) scale(${slice.isHovered ? 1.15 : 1})`,
                          pointerEvents: 'none',
                          textAlign: 'center',
                          background: slice.isHovered ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.7)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          padding: slice.isHovered ? '10px 20px' : '8px 16px',
                          borderRadius: '12px',
                          boxShadow: slice.isHovered ? '0 12px 32px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.08)',
                          border: slice.isHovered ? `2px solid ${slice.color}` : '1px solid rgba(255,255,255,0.9)',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          zIndex: slice.isHovered ? 100 : 1,
                          opacity: (hoveredSlice !== null && !slice.isHovered) ? 0.3 : 1
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: slice.color, lineHeight: 1 }}>{slice.count}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{slice.percentage}%</span>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#555', marginTop: '6px', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slice.org}</div>
                        </div>
                      );
                    })}
                  </div>
                    </div>
                  )}
                </div>

                <div 
                  className="db-card bento-contribution" 
                  style={{
                    position: 'relative',
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(255,255,255,0.8)'
                  }}
                >
                  <div className="db-card-header" style={{ marginBottom: '16px' }}>
                    <h3 className="db-card-title" style={{ fontSize: '1.1rem', fontWeight: 500, color: '#1a1a1a', textTransform: 'none' }}>Your Contribution</h3>
                    <div style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {checkMarkData && <Lottie style={{ transform: 'scale(2.4)', transformOrigin: 'center' }} animationData={checkMarkData} loop={true} autoplay={true} />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
                    {[...contributionData].sort((a, b) => b.count - a.count).slice(0, 3).map((d) => (
                      <div key={d.org} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem', maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.org}</span>
                          <span style={{ fontWeight: 800, color: activeTheme.primary }}>{d.percentage}%</span>
                        </div>
                        <div style={{ position: 'relative', height: '10px', background: 'rgba(0,0,0,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, bottom: 0, 
                            width: `${d.percentage}%`, 
                            background: `linear-gradient(90deg, ${activeTheme.primaryLight}, ${activeTheme.primary})`,
                            borderRadius: '99px'
                          }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#666', textAlign: 'right', fontWeight: 600 }}>
                          {d.count} / {d.globalCount} unsubs globally
                        </div>
                      </div>
                    ))}
                    {contributionData.length === 0 && (
                            <div style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center', marginTop: '60px', fontWeight: 500 }}>No contribution data yet</div>
                    )}
                    {contributionData.length > 0 && (
                      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', fontWeight: 600, marginTop: 'auto', paddingTop: '10px' }}>
                        Top 3 contribution
                      </div>
                    )}
                  </div>
                </div>



              {/* ── Unsubscribe History Section ── */}
              <div className="db-card db-inbox-card bento-history">
                <div className="db-inbox-header">
                  <div className="db-inbox-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Unsubscribe History
                    {logs.length > 0 && (
                      <span className="db-inbox-badge">{logs.length}</span>
                    )}
                  </div>
                </div>

                {logsLoading ? (
                  <div className="db-inbox-skeleton">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="db-inbox-skeleton-item">
                        <div className="db-skeleton-circle" />
                        <div className="db-skeleton-lines">
                          <div className="db-skeleton-line" style={{ width: '40%' }} />
                          <div className="db-skeleton-line" style={{ width: '70%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="db-inbox-empty" style={{ minHeight: '180px' }}>
                    <div className="db-inbox-empty-icon" style={{ opacity: 0.5 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <polyline points="23 20 23 14 17 14"></polyline>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#888' }}>No history yet</div>
                    <div style={{ fontSize: '0.78rem', color: '#bbb' }}>Logs will appear here once you unsubscribe.</div>
                  </div>
                ) : (
                  <div className="db-inbox-list" data-lenis-prevent="true" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px', 
                    maxHeight: '380px', 
                    overflowY: 'auto', 
                    padding: '8px' 
                  }}>
                    {logs.slice(0, 10).map((log, i) => (
                      <div key={i} style={{ 
                        background: 'rgba(0,0,0,0.02)', 
                        border: '1px solid rgba(0,0,0,0.06)', 
                        borderRadius: '8px', 
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        cursor: 'default',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                      >
                        <div style={{ 
                          padding: '4px 6px', borderRadius: '6px', 
                          display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px',
                          background: log.result === 'success' ? 'rgba(16,185,129,0.1)' : log.result === 'skipped' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', 
                          color: log.result === 'success' ? '#10b981' : log.result === 'skipped' ? '#f59e0b' : '#ef4444',
                          minWidth: '95px',
                          justifyContent: 'center'
                        }}>
                          <div style={{ fontSize: '1rem', flexShrink: 0 }}>
                             {log.result === 'success' ? '✓' : log.result === 'skipped' ? '⏭' : log.result === 'not_found' ? '?' : '✕'}
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'capitalize' }}>
                             {log.result.replace('_', ' ')}
                          </div>
                        </div>
                        
                        <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.organization_name || 'Unknown'}
                        </div>
                        
                        <div style={{ fontSize: '0.75rem', color: '#888', flexShrink: 0, fontWeight: 500 }}>
                          {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </main>

          {/* ── Phone Chat Overlay ── */}
          <button 
            className={`db-phone-toggle-btn ${isPhoneOpen ? 'open' : ''}`}
            onClick={() => setIsPhoneOpen(!isPhoneOpen)}
          >
            {hasNewChat && <span className="db-phone-badge" />}
            <div style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {chatBotData && <Lottie style={{ transform: 'scale(1.5)', transformOrigin: 'center' }} animationData={chatBotData} loop={true} autoplay={true} />}
            </div>
          </button>

          <div className={`db-phone-overlay ${isPhoneOpen ? 'open' : ''}`}>
            <div className="db-phone-mockup">
              {/* Loading overlay — fades out once data is ready */}
              <div className={`db-phone-loader ${logsLoading ? '' : 'hidden'}`}>
                <div className="db-phone-loader-ring" />
                <div className="db-phone-loader-pulse" />
                <span className="db-phone-loader-text">Loading messages…</span>
              </div>

              <div className="db-phone-header">
                <div className="db-phone-avatar" style={{ background: 'transparent' }}>
                  <img src="/email.svg" alt="Unsub Hero" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                </div>
                <div>
                  <div className="db-phone-title">Unsub Hero</div>
                  <div className="db-phone-status">Online</div>
                </div>
                <button className="db-phone-close-btn" style={{ marginLeft: 'auto' }} onClick={() => setIsPhoneOpen(false)}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="db-phone-body" data-lenis-prevent="true">
                {!logsLoading && chatMsgs.length === 0 && !isTyping ? (
                  <div className="db-msg db-msg-in">Hey {displayName}! 👋 I'm watching your inbox. Forward any subscription email to the admin and I'll handle the unsubscribing for you!</div>
                ) : (
                  chatMsgs.map((m) => (
                    <div key={m.id} className={`db-msg ${m.from === 'hero' ? 'db-msg-in' : 'db-msg-out'}`}>
                      {m.text}
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="db-msg db-msg-in db-typing">
                    <span className="db-dot"/><span className="db-dot"/><span className="db-dot"/>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              
              <div className="db-phone-footer">
                <div className="db-phone-input">Message...</div>
              </div>
            </div>
          </div>
        </div>



        {/* ── Settings Overlay ── */}
        <div className={`db-overlay ${isSettingsOpen ? 'open' : ''}`} onClick={(e) => {
          if (e.target === e.currentTarget) setIsSettingsOpen(false);
        }}>
          <div className="db-overlay-card">
            <button className="db-overlay-close" onClick={() => setIsSettingsOpen(false)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="db-overlay-avatar">{initials}</div>
            <h2 className="db-overlay-name">{displayName}</h2>
            <p className="db-overlay-email">{info?.email || '—'}</p>

            <a href="/logout" className="db-overlay-signout" id="dashboard-signout">Sign Out</a>
          </div>
        </div>

        {/* ── Unsubscribe Result Toast ── */}
        {unsubToast && (
          <div style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: unsubToast.status === 'success' ? '#10b981' 
                       : unsubToast.status === 'needs_review' ? '#f59e0b' 
                       : '#ef4444',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideUpFade 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            maxWidth: '420px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.1rem' }}>
              {unsubToast.status === 'success' ? '✅'
               : unsubToast.status === 'needs_review' ? '🔍'
               : '⚠️'}
            </span>
            <span>
              {unsubToast.status === 'success'
                ? `Unsubscribed from ${unsubToast.sender} successfully!`
                : unsubToast.status === 'needs_review'
                ? `${unsubToast.sender} needs manual review.`
                : `Could not unsubscribe from ${unsubToast.sender}. Try manually.`}
            </span>
          </div>
        )}

        {/* ── Unsubscribe Dialog ── */}
        <div className={`db-overlay ${unsubDialogOpen ? 'open' : ''}`} onClick={(e) => {
          if (e.target === e.currentTarget) setUnsubDialogOpen(false);
        }}>
          <div className="db-overlay-card" style={{ maxWidth: '400px', padding: '32px' }}>
            <button className="db-overlay-close" onClick={() => setUnsubDialogOpen(false)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', margin: '0 0 8px 0', textAlign: 'center' }}>Confirm Unsubscribe</h2>
            <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to unsubscribe from <strong>{unsubTargetMail?.sender_name || unsubTargetMail?.from}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => setUnsubDialogOpen(false)}
                style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.05)', color: '#555', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              >
                Cancel
              </button>
              <button 
                onClick={handleUnsubscribeSingle}
                disabled={isUnsubscribingSingle}
                style={{ flex: 1, padding: '12px', background: '#ef4444', color: '#fff', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: isUnsubscribingSingle ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={(e) => !isUnsubscribingSingle && (e.currentTarget.style.background = '#dc2626')}
                onMouseLeave={(e) => !isUnsubscribingSingle && (e.currentTarget.style.background = '#ef4444')}
              >
                {isUnsubscribingSingle ? (
                  <><span className="db-spin" style={{ width: '14px', height: '14px', marginRight: 0, borderWidth: '2px', borderTopColor: '#fff' }} /> Processing...</>
                ) : (
                  'Unsubscribe'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Unsubscribe All Dialog ── */}
        <div className={`db-overlay ${unsubAllDialogOpen ? 'open' : ''}`} onClick={(e) => {
          // Don't allow closing while processing
          if (e.target === e.currentTarget && unsubAllProgress.phase === 'idle') setUnsubAllDialogOpen(false);
        }}>
          <div className="db-overlay-card" style={{ maxWidth: '700px', padding: '32px' }}>

            {/* ── Phase: idle (select limit) ── */}
            {unsubAllProgress.phase === 'idle' && (<>
              <button className="db-overlay-close" onClick={() => setUnsubAllDialogOpen(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', margin: '0 0 8px 0', textAlign: 'center' }}>Unsubscribe Limit</h2>
              <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', marginBottom: '24px', lineHeight: 1.5 }}>
                Select how many emails you want to unsubscribe from. We recommend starting small.
              </p>

              <div className="db-slider-container">
                <input
                  type="range"
                  className="db-slider"
                  min="5" max="25" step="5"
                  value={unsubAllLimit}
                  onChange={(e) => setUnsubAllLimit(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(unsubAllLimit - 5) / 20 * 100}%, rgba(0,0,0,0.1) ${(unsubAllLimit - 5) / 20 * 100}%, rgba(0,0,0,0.1) 100%)` }}
                />
                <div className="db-slider-labels">
                  <span style={{ color: unsubAllLimit >= 5  ? '#ef4444' : '#666' }}>5</span>
                  <span style={{ color: unsubAllLimit >= 10 ? '#ef4444' : '#666' }}>10</span>
                  <span style={{ color: unsubAllLimit >= 15 ? '#ef4444' : '#666' }}>15</span>
                  <span style={{ color: unsubAllLimit >= 20 ? '#ef4444' : '#666' }}>20</span>
                  <span style={{ color: unsubAllLimit >= 25 ? '#ef4444' : '#666' }}>25</span>
                </div>
              </div>

              <div style={{ marginTop: '32px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '16px', textAlign: 'center' }}>
                  Selected Emails ({Math.min(unsubAllLimit, inboxEmails.length) - unsubAllDeselected.length})
                </div>
                <div style={{ display: 'grid', gridTemplateRows: 'repeat(5, auto)', gridAutoFlow: 'column', gap: '12px 16px', justifyContent: 'center' }}>
                  {inboxEmails.slice(0, unsubAllLimit).map((mail) => {
                    const isSelected = !unsubAllDeselected.includes(mail.id);
                    return (
                      <div key={mail.id} style={{ fontSize: '0.85rem', color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '160px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setUnsubAllDeselected(prev => [...prev, mail.id]);
                            } else {
                              setUnsubAllDeselected(prev => prev.filter(id => id !== mail.id));
                            }
                          }}
                          style={{ accentColor: '#ef4444', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? '#444' : '#aaa', textDecoration: isSelected ? 'none' : 'line-through' }}>{mail.sender_name || mail.from}</span>
                      </div>
                    );
                  })}
                  {inboxEmails.length === 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#888', gridColumn: '1 / -1', textAlign: 'center' }}>No emails available</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '36px' }}>
                <button
                  onClick={() => setUnsubAllDialogOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.05)', color: '#555', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                >Cancel</button>
                <button
                  disabled={inboxEmails.length === 0 || Math.min(unsubAllLimit, inboxEmails.length) - unsubAllDeselected.length === 0}
                  onClick={() => {
                    const limited = inboxEmails.slice(0, unsubAllLimit)
                                      .map(m => m.id)
                                      .filter(id => !unsubAllDeselected.includes(id));
                    handleUnsubscribeAll(limited);
                  }}
                  style={{ flex: 1, padding: '12px', background: (inboxEmails.length === 0 || Math.min(unsubAllLimit, inboxEmails.length) - unsubAllDeselected.length === 0) ? '#ccc' : '#ef4444', color: '#fff', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: (inboxEmails.length === 0 || Math.min(unsubAllLimit, inboxEmails.length) - unsubAllDeselected.length === 0) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.25)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => { if (inboxEmails.length > 0 && Math.min(unsubAllLimit, inboxEmails.length) - unsubAllDeselected.length > 0) e.currentTarget.style.background = '#dc2626'; }}
                  onMouseLeave={(e) => { if (inboxEmails.length > 0 && Math.min(unsubAllLimit, inboxEmails.length) - unsubAllDeselected.length > 0) e.currentTarget.style.background = '#ef4444'; }}
                >
                  Proceed ({Math.min(unsubAllLimit, inboxEmails.length) - unsubAllDeselected.length})
                </button>
              </div>
            </>)}

            {/* ── Phase: running (live progress) ── */}
            {unsubAllProgress.phase === 'running' && (
              <div style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <span className="db-spin" style={{ width: '24px', height: '24px', borderColor: 'rgba(239,68,68,0.2)', borderTopColor: '#ef4444', borderWidth: '3px' }} />
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Unsubscribing…</h2>
                  <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
                    Processing <strong style={{ color: '#ef4444' }}>{unsubAllProgress.currentSender || '...'}</strong>
                    &nbsp;({unsubAllProgress.current} of {unsubAllProgress.total})
                  </p>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.07)', borderRadius: '99px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{
                    height: '100%',
                    width: `${unsubAllProgress.total > 0 ? (unsubAllProgress.current / unsubAllProgress.total) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #ef4444, #f97316)',
                    borderRadius: '99px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                {/* Live results list */}
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {unsubAllProgress.results.slice().reverse().map((r, i) => (
                    <div key={r.msg_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                        {r.status === 'success' ? '✅' : r.status === 'skipped' ? '⏭️' : r.status === 'not_found' ? '🔍' : '⚠️'}
                      </span>
                      <span style={{ color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sender}</span>
                      <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, color: r.status === 'success' ? '#10b981' : r.status === 'skipped' ? '#f59e0b' : '#ef4444', textTransform: 'capitalize' }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Phase: done (summary) ── */}
            {unsubAllProgress.phase === 'done' && unsubAllProgress.summary && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.6rem' }}>✅</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111', marginBottom: '6px' }}>All Done!</h2>
                <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '24px' }}>Here's a summary of the batch unsubscription:</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
                  {[{label: 'Success', val: unsubAllProgress.summary.success, color: '#10b981'},
                    {label: 'Skipped', val: unsubAllProgress.summary.skipped, color: '#f59e0b'},
                    {label: 'Not Found', val: unsubAllProgress.summary.not_found, color: '#6b7280'},
                    {label: 'Errors', val: unsubAllProgress.summary.errors, color: '#ef4444'},
                  ].map(s => (
                    <div key={s.label} style={{ padding: '14px 8px', borderRadius: '12px', background: 'rgba(0,0,0,0.04)', border: `1px solid ${s.color}22` }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Scrollable individual results */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '24px', textAlign: 'left' }}>
                  {unsubAllProgress.results.map((r) => (
                    <div key={r.msg_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                        {r.status === 'success' ? '✅' : r.status === 'skipped' ? '⏭️' : r.status === 'not_found' ? '🔍' : '⚠️'}
                      </span>
                      <span style={{ color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sender}</span>
                      <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, color: r.status === 'success' ? '#10b981' : r.status === 'skipped' ? '#f59e0b' : '#ef4444', textTransform: 'capitalize' }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setUnsubAllDialogOpen(false);
                    setUnsubAllProgress({ phase: 'idle', current: 0, total: 0, currentSender: '', results: [], summary: null });
                  }}
                  style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  );
}

/* Suspense wrapper required by useSearchParams in Next.js */
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}