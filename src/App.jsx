import React, { useEffect, useMemo, useState } from "react";

// יומן מחוות — React single-file component (עברית RTL)
// Tailwind CSS assumed (כלול בקבצים).

const DEFAULT_GESTURES = [
  { id: "compliment", label: "מחמאה" },
  { id: "coffee", label: "הכנת קפה/משקה" },
  { id: "talk", label: "שיחה נעימה" },
  { id: "help", label: "עזרה בבית" },
  { id: "note", label: "מכתב/הודעה חמה" },
  { id: "gift", label: "מחווה מיוחדת" },
];

const STORAGE_KEY = "yoman_machavot_v1";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function App() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [startDate, setStartDate] = useState(today);
  const [monthsToShow, setMonthsToShow] = useState(3);
  const [gestures, setGestures] = useState(DEFAULT_GESTURES);
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  const [selectedDay, setSelectedDay] = useState(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const days = useMemo(() => {
    const arr = [];
    const s = new Date(startDate);
    const end = addDays(s, monthsToShow * 31);
    for (let d = new Date(s); d <= end; d = addDays(d, 1)) {
      const monthsDiff = (d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth());
      if (monthsDiff >= monthsToShow) break;
      arr.push(new Date(d));
    }
    return arr;
  }, [startDate, monthsToShow]);

  const daysWithIndex = useMemo(() => days.map((d) => ({ date: d, key: formatDate(d) })), [days]);

  function toggleGestureForDay(dayKey, gestureId) {
    setData((cur) => {
      const copy = { ...cur };
      const day = copy[dayKey] || { gestures: [] };
      const has = day.gestures.includes(gestureId);
      day.gestures = has ? day.gestures.filter((g) => g !== gestureId) : [...day.gestures, gestureId];
      copy[dayKey] = day;
      return copy;
    });
  }

  function clearDay(dayKey) {
    setData((cur) => {
      const copy = { ...cur };
      delete copy[dayKey];
      return copy;
    });
  }

  const stats = useMemo(() => {
    const totalDays = daysWithIndex.length;
    let markedDays = 0;
    const counts = {};
    for (const g of gestures) counts[g.id] = 0;
    for (const { key } of daysWithIndex) {
      const day = data[key];
      if (day && day.gestures && day.gestures.length) {
        markedDays++;
        for (const g of day.gestures) counts[g] = (counts[g] || 0) + 1;
      }
    }
    const percent = Math.round((markedDays / totalDays) * 100);
    return { totalDays, markedDays, counts, percent };
  }, [data, daysWithIndex, gestures]);

  function LiquidProgress({ percent = 0 }) {
    const pct = Math.max(0, Math.min(100, percent));
    return (
      <div className="w-64 h-40 relative">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fecaca" />
            </linearGradient>
            <clipPath id="round">
              <rect x="0" y="0" width="200" height="120" rx="14" />
            </clipPath>
          </defs>

          <rect x="0" y="0" width="200" height="120" rx="14" fill="#111827" opacity="0.06" />

          <g clipPath="url(#round)">
            <g transform={`translate(0, ${120 - (pct / 100) * 120})`} className="wave-group">
              <rect x="0" y="0" width="200" height="120" fill="url(#g1)" />
              <g className="glitter" opacity="0.9">
                <circle cx="20" cy="20" r="4" fill="#fff" opacity="0.6" />
                <circle cx="60" cy="10" r="3" fill="#fff" opacity="0.5" />
                <circle cx="110" cy="18" r="2.5" fill="#fff" opacity="0.45" />
                <circle cx="160" cy="8" r="3.5" fill="#fff" opacity="0.55" />
              </g>
            </g>
          </g>

          <text x="100" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
            {pct}%
          </text>
          <text x="100" y="83" textAnchor="middle" fontSize="10" fill="#0f172a">
            אחוז ימים עם מחווה לפחות אחת
          </text>
        </svg>

        <style>{`
          .wave-group { transition: transform 1s ease-out; }
          .wave-group rect { transform-origin: center; animation: shimmer 6s linear infinite; }
          @keyframes shimmer { 0%{transform:translateX(-10%)} 50%{transform:translateX(10%)} 100%{transform:translateX(-10%)} }
          .glitter { animation: floaty 4s ease-in-out infinite; }
          @keyframes floaty { 0%{transform: translateY(0)} 50%{transform: translateY(-3px)} 100%{transform: translateY(0)} }
        `}</style>
      </div>
    );
  }

  function handlePrint() {
    const printable = window.open("", "_blank");
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>סיכום יומן מחוות</title>
          <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}</style>
        </head>
        <body>
          <h1>סיכום יומן מחוות</h1>
          <p>טווח: ${formatDate(daysWithIndex[0].date)} — ${formatDate(daysWithIndex[daysWithIndex.length - 1].date)}</p>
          <p>ימים עם מחווה: ${stats.markedDays} מתוך ${stats.totalDays} (${stats.percent}%)</p>
          <h3>פירוט</h3>
          <ul>
            ${Object.entries(stats.counts)
              .map(([k, v]) => `<li>${gestures.find((g) => g.id === k)?.label || k}: ${v}</li>`)
              .join("")}
          </ul>
        </body>
      </html>
    `;
    printable.document.write(html);
    printable.document.close();
    printable.focus();
    printable.print();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ startDate: formatDate(startDate), monthsToShow, data }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yoman_machavot_${formatDate(startDate)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const rows = ["date,gestures_count,gestures_list"];
    for (const { key } of daysWithIndex) {
      const d = data[key];
      const list = d && d.gestures ? d.gestures.join("|") : "";
      rows.push(`${key},${d && d.gestures ? d.gestures.length : 0},"${list}"`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yoman_mechavot_${formatDate(startDate)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans" dir="rtl" lang="he">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">יומן מחוות — {monthsToShow} חודשים</h1>
          <p className="text-sm text-gray-600">התחל: {formatDate(startDate)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStartDate(startOfDay(new Date()))}
            className="px-3 py-2 bg-sky-500 text-white rounded shadow"
          >
            חזור להיום
          </button>
          <button onClick={exportJSON} className="px-3 py-2 border rounded">ייצא JSON</button>
          <button onClick={exportCSV} className="px-3 py-2 border rounded">ייצא CSV</button>
          <button onClick={handlePrint} className="px-3 py-2 bg-amber-400 rounded">הדפס/PDF</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="order-2 md:order-1">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">מדדי התקדמות</h3>
            <div className="flex items-center gap-4">
              <LiquidProgress percent={stats.percent} />
              <div>
                <p>ימים מסומנים: <strong>{stats.markedDays}</strong> / {stats.totalDays}</p>
                <div className="mt-4">
                  {gestures.map((g) => (
                    <div key={g.id} className="text-sm">
                      {g.label}: <strong>{stats.counts[g.id] || 0}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">הגדרות מהירות</h3>
            <div className="flex gap-2 items-center">
              <label className="text-sm">התחלה:</label>
              <input
                type="date"
                value={formatDate(startDate)}
                onChange={(e) => setStartDate(startOfDay(new Date(e.target.value)))}
                className="border p-1 rounded text-sm"
              />
            </div>
            <div className="mt-3">
              <label className="text-sm">מספר חודשים להצגה:</label>
              <select value={monthsToShow} onChange={(e) => setMonthsToShow(Number(e.target.value))} className="ml-2 p-1 border rounded">
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={6}>6</option>
              </select>
            </div>
          </div>
        </div>

        <main className="order-1 md:order-2 col-span-2">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">לוח ימים</h2>
              <div className="flex items-center gap-2">
                <input placeholder="חפש תאריך או מחווה" value={filter} onChange={(e)=>setFilter(e.target.value)} className="border p-1 rounded text-sm" />
                <button onClick={()=>{ setSelectedDay(null); setData({}); localStorage.removeItem(STORAGE_KEY); }} className="text-red-500 text-sm">נקה הכל</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {daysWithIndex.map(({ date, key }) => {
                const dayData = data[key];
                const isMarked = dayData && dayData.gestures && dayData.gestures.length > 0;
                const matchesFilter = !filter || key.includes(filter) || (isMarked && dayData.gestures.join(" ").includes(filter));
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay({ key, date })}
                    className={`p-3 rounded h-20 flex flex-col justify-between items-start transition-shadow ${isMarked ? "bg-amber-100" : "bg-gray-50"} ${matchesFilter ? "" : "opacity-30"}`}
                  >
                    <div className="text-xs text-gray-600">{date.toLocaleDateString("he-IL", { weekday: 'short' })}</div>
                    <div className="text-sm font-medium">{date.getDate()}/{date.getMonth()+1}</div>
                    <div className="text-xs w-full">
                      {isMarked ? <div className="text-xs">{dayData.gestures.map(g=>gestures.find(x=>x.id===g)?.label).join(', ')}</div> : <div className="text-xs text-gray-400">לא מסומן</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            טיפ: לחץ על כל יום כדי לסמן במהירות. שינויים נשמרים אוטומטית בדפדפן.
          </div>
        </main>

        <aside className="order-3">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">מעקב מהיר</h3>
            <p className="text-sm">הוספת מחוות חדשות או עריכה של הרשימות מובנית כאן.</p>
            <div className="mt-3">
              {gestures.map((g) => (
                <div key={g.id} className="flex items-center gap-2 mb-2">
                  <input
                    value={g.label}
                    onChange={(e) => setGestures((cur) => cur.map((it) => (it.id === g.id ? { ...it, label: e.target.value } : it)))}
                    className="border p-1 rounded text-sm flex-1"
                  />
                </div>
              ))}

              <AddGesture onAdd={(newLabel) => {
                const id = newLabel.trim().toLowerCase().replace(/\s+/g, "_");
                setGestures((cur) => [...cur, { id, label: newLabel }]);
              }} />
            </div>
          </div>
        </aside>
      </section>

      {selectedDay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-4 w-full max-w-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{formatDate(selectedDay.date)}</h3>
              <div className="flex gap-2">
                <button onClick={()=>{ clearDay(selectedDay.key); setSelectedDay(null); }} className="text-sm text-red-500">נקה יום</button>
                <button onClick={()=>setSelectedDay(null)} className="text-sm">סגור</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gestures.map((g) => {
                const checked = data[selectedDay.key] && data[selectedDay.key].gestures.includes(g.id);
                return (
                  <label key={g.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer">
                    <input type="checkbox" checked={!!checked} onChange={()=>toggleGestureForDay(selectedDay.key, g.id)} />
                    <div className="text-sm">{g.label}</div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddGesture({ onAdd }) {
  const [val, setVal] = useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="מחווה חדשה" className="border p-1 rounded text-sm flex-1" />
      <button onClick={() => { if(val.trim()) { onAdd(val); setVal(""); } }} className="px-3 py-1 bg-green-500 text-white rounded">הוסף</button>
    </div>
  );
}
