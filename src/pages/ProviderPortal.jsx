import { useState, useMemo, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import JobPhotoUploadModal from "@/components/provider/JobPhotoUploadModal";
import {
  MapPin, Calendar as CalendarIcon, MessageCircle, ShieldCheck, ShieldAlert,
  DollarSign, Camera, Phone, Repeat, CheckCircle2, Clock, Send, X, ChevronLeft,
  ChevronRight, Upload, AlertCircle, Plus, Navigation, ListChecks, ThumbsDown,
  ThumbsUp, PlayCircle, Trash2, LogOut
} from "lucide-react";
/* ---------------- helpers ---------------- */
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDate = (date) => date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const fmtMoney = (n) => `$${n.toFixed(2)}`;
const mapsLink = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const timeToMinutes = (t) => {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3].toUpperCase();
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + min;
};
const today = new Date();
let idCounter = 1000;
const nextId = () => idCounter++;
/* ---------------- seed data ---------------- */
const seedAvailableJobs = [
  { id: nextId(), customerName: "Renee Carter", phone: "(202) 555-0142", address: "1417 Holbrook St NE, Washington, DC", service: "Lawn Mowing", recurring: false, frequency: null, date: addDays(today, 1), time: "9:00 AM", price: 45, notes: "Gate code 4471. Dog stays inside during service." },
  { id: nextId(), customerName: "Daniel Osei", phone: "(301) 555-0198", address: "8822 Piney Branch Rd, Silver Spring, MD", service: "Lawn Mowing + Edging", recurring: true, frequency: "Weekly", date: addDays(today, 1), time: "11:30 AM", price: 60, notes: "Side gate unlocked Tuesdays only." },
  { id: nextId(), customerName: "Priya Nair", phone: "(703) 555-0117", address: "212 Hume Ave, Alexandria, VA", service: "Full Yard Cleanup", recurring: false, frequency: null, date: addDays(today, 2), time: "1:00 PM", price: 120, notes: "Large leaf pile near fence to bag and remove." },
];
const seedMyJobs = [
  { id: nextId(), customerName: "Marcus Webb", phone: "(202) 555-0166", address: "504 Quincy St NW, Washington, DC", service: "Lawn Mowing", recurring: true, frequency: "Weekly", date: today, time: "8:00 AM", price: 40, status: "scheduled", thisWeek: true, photos: [], notes: "Park in driveway, not street." },
  { id: nextId(), customerName: "Renee Carter", phone: "(202) 555-0142", address: "1417 Holbrook St NE, Washington, DC", service: "Lawn Mowing", recurring: false, frequency: null, date: today, time: "10:30 AM", price: 45, status: "scheduled", thisWeek: true, photos: [], notes: "" },
  { id: nextId(), customerName: "Joanna Ruiz", phone: "(202) 555-0190", address: "1820 Irving St NW, Washington, DC", service: "Spring Cleanup", recurring: false, frequency: null, date: today, time: "1:30 PM", price: 95, status: "scheduled", thisWeek: true, photos: [], notes: "" },
  { id: nextId(), customerName: "Tasha Greene", phone: "(301) 555-0177", address: "67 Forest Glen Rd, Silver Spring, MD", service: "Lawn Mowing + Edging", recurring: true, frequency: "Biweekly", date: addDays(today, -2), time: "9:00 AM", price: 55, status: "completed", thisWeek: true, photos: [], notes: "" },
  { id: nextId(), customerName: "Greg Holloway", phone: "(703) 555-0133", address: "39 Quaker Ln, Alexandria, VA", service: "Full Yard Cleanup", recurring: false, frequency: null, date: addDays(today, -3), time: "2:00 PM", price: 110, status: "completed", thisWeek: true, photos: [], notes: "" },
  { id: nextId(), customerName: "Marcus Webb", phone: "(202) 555-0166", address: "504 Quincy St NW, Washington, DC", service: "Lawn Mowing", recurring: true, frequency: "Weekly", date: addDays(today, -9), time: "8:00 AM", price: 40, status: "completed", thisWeek: false, photos: [], notes: "" },
  { id: nextId(), customerName: "Dana Okafor", phone: "(703) 555-0188", address: "14 Pendleton St, Alexandria, VA", service: "Hedge Trimming", recurring: false, frequency: null, date: addDays(today, 5), time: "10:00 AM", price: 75, status: "scheduled", thisWeek: false, photos: [], notes: "" },
];
const seedQuotes = [
  { id: nextId(), customerName: "Joanna Ruiz", phone: "(202) 555-0190", address: "1820 Irving St NW, Washington, DC", service: "Spring Cleanup + Mulching", amount: 180, status: "pending", date: addDays(today, -1) },
  { id: nextId(), customerName: "Bill Hartman", phone: "(301) 555-0144", address: "905 Bonifant St, Silver Spring, MD", service: "Lawn Mowing", amount: 42, status: "accepted", date: addDays(today, -4) },
  { id: nextId(), customerName: "Dana Okafor", phone: "(703) 555-0188", address: "14 Pendleton St, Alexandria, VA", service: "Hedge Trimming", amount: 75, status: "declined", date: addDays(today, -6) },
  { id: nextId(), customerName: "Renee Carter", phone: "(202) 555-0142", address: "1417 Holbrook St NE, Washington, DC", service: "Fall Leaf Removal", amount: 95, status: "expired", date: addDays(today, -12) },
];
const seedReviews = [
  { id: nextId(), type: "poor", date: addDays(today, -6), note: "Lawn lines uneven, asked for redo." },
];
const seedChatThreads = {
  "Marcus Webb": [
    { from: "customer", text: "Can you come a little earlier this week? Maybe 7:45?", time: addDays(today, -1) },
    { from: "provider", text: "I can do 7:45 — works on my end.", time: addDays(today, -1) },
  ],
  "Renee Carter": [
    { from: "customer", text: "Gate code is 4471, please make sure it latches when you leave.", time: addDays(today, -2) },
  ],
  "Tasha Greene": [
    { from: "customer", text: "Yard looked great last time, thank you!", time: addDays(today, -2) },
  ],
  "Joanna Ruiz": [
    { from: "customer", text: "Sent over a quote request for spring cleanup, let me know what you think.", time: addDays(today, -1) },
  ],
};
/* ---------------- small UI pieces ---------------- */
function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}
function Eyebrow({ children }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">{children}</p>;
}
function ratingTier(score) {
  if (score >= 85) return "green";
  if (score >= 60) return "amber";
  return "red";
}
function RatingBadge({ score, onClick }) {
  const tier = ratingTier(score);
  const styles = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-300",
    amber: "bg-amber-50 text-amber-800 border-amber-300",
    red: "bg-rose-50 text-rose-800 border-rose-300",
  };
  const dot = { green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-rose-500" };
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${styles[tier]}`}>
      <span className={`h-2 w-2 rounded-full ${dot[tier]}`} />
      {score}% rating
    </button>
  );
}
function InsuranceBadge({ status, onUpload }) {
  if (status === "verified") {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
        <ShieldCheck size={14} /> Insured
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
        <Clock size={14} /> Insurance pending review
      </span>
    );
  }
  return (
    <button onClick={onUpload} className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100">
      <ShieldAlert size={14} /> Not insured — upload proof
    </button>
  );
}
function RecurringTag({ frequency }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
      <Repeat size={11} /> Recurring · {frequency}
    </span>
  );
}
function StatusPill({ status }) {
  const map = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-emerald-100 text-emerald-800",
    declined: "bg-rose-100 text-rose-800",
    expired: "bg-stone-200 text-stone-600",
    scheduled: "bg-sky-100 text-sky-800",
    completed: "bg-emerald-100 text-emerald-800",
    in_progress: "bg-amber-100 text-amber-800",
  };
  const labels = {
    pending: "Pending", accepted: "Accepted", declined: "Declined", expired: "Expired",
    scheduled: "Scheduled", completed: "Completed", in_progress: "In progress",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}>{labels[status]}</span>;
}
function CustomerInfo({ name, phone, address }) {
  return (
    <div className="space-y-0.5 text-sm text-stone-600">
      <p className="font-semibold text-stone-900">{name}</p>
      <a href={`tel:${phone.replace(/[^\d]/g, "")}`} className="flex items-center gap-1.5 hover:text-emerald-700">
        <Phone size={12} /> {phone}
      </a>
      <a href={mapsLink(address)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-emerald-700">
        <MapPin size={12} /> {address}
      </a>
    </div>
  );
}
function PhotoUploader({ photos, onAdd, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Camera size={13} /> Job photos
        </p>
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200">
          <Upload size={12} /> Add photos
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => { if (e.target.files?.length) onAdd(Array.from(e.target.files)); e.target.value = ""; }} />
      </div>
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.id} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-stone-200">
              <img src={p.url} alt="job" className="h-full w-full object-cover" />
              <button onClick={() => onRemove(p.id)} className="absolute right-0.5 top-0.5 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:block">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ---------------- helpers ---------------- */
function mapJob(j, customerProfiles) {
  const profile = customerProfiles.find(
    (p) => p.user_email === j.customer_email || p.id === j.customer_id
  );
  const dateObj = j.scheduled_date ? new Date(j.scheduled_date + "T12:00:00") : new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    id: j.id,
    customerName: j.customer_name || "Customer",
    phone: profile?.phone || "",
    address: j.address || "",
    service: j.service_name || "Service",
    recurring: j.recurrence && j.recurrence !== "one_time",
    frequency: j.recurrence === "weekly" ? "Weekly" : j.recurrence === "biweekly" ? "Biweekly" : null,
    date: dateObj,
    time: j.scheduled_time || "TBD",
    price: j.quoted_price || j.final_price || 0,
    status: j.status,
    thisWeek: dateObj >= monday && dateObj <= sunday,
    photos: [],
    notes: j.customer_notes || "",
  };
}

/* ---------------- main component ---------------- */
export default function ProviderPortal() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [currentUser, setCurrentUser] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [insuranceStatus, setInsuranceStatus] = useState("verified");
  const [showPerf, setShowPerf] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [photoCompleteJob, setPhotoCompleteJob] = useState(null);
  const [adminSubject, setAdminSubject] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [sentAdminMessages, setSentAdminMessages] = useState([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ customerName: "", phone: "", address: "", service: "", amount: "" });
  const [chatThreads, setChatThreads] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [routeMode, setRouteMode] = useState("route");
  const [routeDayOffset, setRouteDayOffset] = useState(0);
  const [scheduleView, setScheduleView] = useState("week"); // Default to week view as requested
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [selectedCalDay, setSelectedCalDay] = useState(today.getDate());
  const insuranceInputRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const me = await base44.auth.me();
        setCurrentUser(me);
        const customerProfiles = await base44.entities.CustomerProfile.list();
        const myProfiles = await base44.entities.ProviderProfile.filter({ user_email: me.email });
        const myProfile = myProfiles[0];
        
        const queries = [
          base44.entities.Job.filter({ provider_email: me.email }),
          base44.entities.Job.filter({ status: "requested" })
        ];
        if (myProfile) {
          queries.push(base44.entities.Job.filter({ provider_id: myProfile.id }));
        }
        
        const results = await Promise.all(queries);
        const byEmail = results[0];
        const available = results[1];
        const byId = myProfile ? results[2] : [];

        // Merge and deduplicate by id
        const seen = new Set();
        const assigned = [];
        for (const j of [...byEmail, ...byId]) {
          if (!seen.has(j.id)) { seen.add(j.id); assigned.push(j); }
        }
        const cutoff = new Date('2025-06-01T00:00:00');
        setMyJobs(
          assigned.map((j) => mapJob(j, customerProfiles)).filter(j => {
            if (j.status === 'completed' && j.date < cutoff) return false;
            return true;
          })
        );
        setAvailableJobs(
          available
            .filter((j) => !j.provider_id && !j.provider_email)
            .map((j) => mapJob(j, customerProfiles))
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const rating = useMemo(() => {
    const poor = reviews.filter((r) => r.type === "poor").length;
    return Math.max(0, 100 - poor * 5);
  }, [reviews]);
  const weeklyPay = useMemo(
    () => myJobs.filter((j) => j.status === "completed" && j.thisWeek).reduce((sum, j) => sum + j.price, 0),
    [myJobs]
  );
  async function acceptJob(job) {
    try {
      setLoading(true);
      const res = await base44.functions.invoke('providerAcceptJob', { job_id: job.id });
      if (res.data?.error) throw new Error(res.data.error);
      
      setAvailableJobs((prev) => prev.filter((j) => j.id !== job.id));
      setMyJobs((prev) => [...prev, { ...job, status: "scheduled", thisWeek: isSameDay(job.date, today) || job.date >= startOfWeek(today), photos: [] }]);
      toast.success("Job claimed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to accept job.");
    } finally {
      setLoading(false);
    }
  }

  function passJob(id) {
    setAvailableJobs((prev) => prev.filter((j) => j.id !== id));
  }

  const [quotingJobId, setQuotingJobId] = useState(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");

  async function submitJobQuote(job) {
    if (!quotePrice) return toast.error("Please enter a price");
    try {
      setLoading(true);
      const myProfiles = await base44.entities.ProviderProfile.filter({ user_email: currentUser.email });
      const myProfile = myProfiles[0];
      if (!myProfile) throw new Error("Provider profile not found");
      
      await base44.entities.Quote.create({
        job_id: job.id,
        provider_id: myProfile.id,
        provider_name: myProfile.name,
        provider_email: currentUser.email,
        price: Number(quotePrice),
        message: quoteMessage,
        status: "pending"
      });
      
      await base44.functions.invoke('notifyQuoteSubmitted', { job_id: job.id, provider_id: myProfile.id, price: Number(quotePrice) }).catch(() => {});
      
      toast.success("Quote submitted!");
      setQuotingJobId(null);
      setQuotePrice("");
      setQuoteMessage("");
      // Optionally remove from job board
      setAvailableJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      toast.error(err.message || "Failed to submit quote.");
    } finally {
      setLoading(false);
    }
  }
  function startJob(id) {
    setMyJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "in_progress" } : j)));
  }
  async function completeJob(id, photos) {
    try {
      // 1. Submit photos via backend function to bypass RLS limits
      if (photos && Object.keys(photos).length > 0) {
         await base44.functions.invoke('submitJobPhoto', { job_id: id, photos });
      }
      
      // 2. Trigger the backend payment flow and notifications (marks job completed)
      const res = await base44.functions.invoke('capturePayment', { job_id: id, skip_photos: true });
      if (res.data && res.data.error) {
         throw new Error(res.data.error);
      }
      
      setMyJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "completed", thisWeek: true } : j)));
      toast.success("Job marked complete!");
    } catch (error) {
      console.error("Complete job error:", error);
      toast.error(error.message || "Failed to mark job complete. Please try again.");
      throw error;
    }
  }
  function addPhotos(id, files) {
    const newPhotos = files.map((f) => ({ id: nextId(), url: URL.createObjectURL(f) }));
    setMyJobs((prev) => prev.map((j) => (j.id === id ? { ...j, photos: [...j.photos, ...newPhotos] } : j)));
  }
  function removePhoto(jobId, photoId) {
    setMyJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, photos: j.photos.filter((p) => p.id !== photoId) } : j)));
  }
  function startOfWeek(d) {
    const monday = new Date(d);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  function addReview(type) {
    setReviews((prev) => [...prev, { id: nextId(), type, date: new Date(), note: type === "poor" ? "Simulated negative review." : "Simulated positive review." }]);
  }
  function updateQuoteStatus(id, status) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  }
  function submitQuote(e) {
    e.preventDefault();
    if (!quoteForm.customerName || !quoteForm.amount) return;
    setQuotes((prev) => [
      { id: nextId(), ...quoteForm, amount: parseFloat(quoteForm.amount) || 0, status: "pending", date: new Date() },
      ...prev,
    ]);
    setQuoteForm({ customerName: "", phone: "", address: "", service: "", amount: "" });
    setShowQuoteForm(false);
  }
  function sendChat() {
    if (!chatInput.trim() || !selectedCustomer) return;
    setChatThreads((prev) => ({
      ...prev,
      [selectedCustomer]: [...(prev[selectedCustomer] || []), { from: "provider", text: chatInput.trim(), time: new Date() }],
    }));
    setChatInput("");
  }
  function sendAdminMessage(e) {
    e.preventDefault();
    if (!adminMessage.trim()) return;
    setSentAdminMessages((prev) => [{ id: nextId(), subject: adminSubject || "(no subject)", message: adminMessage, time: new Date() }, ...prev]);
    setAdminSubject("");
    setAdminMessage("");
  }
  const routeDate = addDays(today, routeDayOffset);
  const routeJobs = useMemo(
    () => myJobs.filter((j) => isSameDay(j.date, routeDate) && j.status !== "completed").sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    [myJobs, routeDate]
  );
  const calendarDate = useMemo(() => new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1), [calendarMonthOffset]);
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstWeekday = calendarDate.getDay();
  const jobsForSelectedDay = myJobs.filter((j) => j.date.getFullYear() === calendarDate.getFullYear() && j.date.getMonth() === calendarDate.getMonth() && j.date.getDate() === selectedCalDay);
  const tabs = [
    { id: "jobs", label: "Job Board", icon: ListChecks },
    { id: "schedule", label: "My Schedule", icon: CheckCircle2 },
    { id: "route", label: "Route", icon: Navigation },
    { id: "quotes", label: "Quotes", icon: DollarSign },
    { id: "history", label: "History", icon: CheckCircle2 },
    { id: "chat", label: "Messages", icon: MessageCircle },
  ];
  return (
    <div className="min-h-screen bg-stone-50 pb-10 font-sans text-stone-900">
      <div className="bg-emerald-900 px-4 py-5 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Provider Dashboard</p>
              <h1 className="text-xl font-bold sm:text-2xl">{currentUser?.full_name || currentUser?.email?.split("@")[0] || "Provider"}</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdminModal(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600">
                <MessageCircle size={15} /> Contact Admin
              </button>
              <button onClick={() => base44.auth.logout('/')} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-950 px-4 py-2 text-sm font-semibold hover:bg-black">
                <LogOut size={15} /> Log Out
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <RatingBadge score={rating} onClick={() => setShowPerf((s) => !s)} />
            <InsuranceBadge status={insuranceStatus} onUpload={() => insuranceInputRef.current?.click()} />
            <input ref={insuranceInputRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => { if (e.target.files?.length) setInsuranceStatus("pending"); }} />
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-800 px-3 py-1.5 text-sm font-medium">
              <DollarSign size={14} /> {fmtMoney(weeklyPay)} this week
            </span>
          </div>
          {showPerf && (
            <Card className="mt-4 bg-white/95 text-stone-900">
              <Eyebrow>Performance</Eyebrow>
              <p className="text-sm text-stone-600">Every provider starts at 100%. Each substantiated negative customer review lowers your rating by 5%. Ratings of 85% and above stay green, 60-84% is amber, below 60% is flagged red for admin review.</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div className={`h-full ${ratingTier(rating) === "green" ? "bg-emerald-500" : ratingTier(rating) === "amber" ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${rating}%` }} />
              </div>
              <div className="mt-3 space-y-1.5">
                {reviews.length === 0 && <p className="text-sm text-stone-500">No reviews yet.</p>}
                {reviews.slice().reverse().map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm text-stone-600">
                    {r.type === "poor" ? <ThumbsDown size={13} className="text-rose-600" /> : <ThumbsUp size={13} className="text-emerald-600" />}
                    <span className="font-medium">{fmtDate(r.date)}</span> — {r.note}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
                <p className="text-xs text-stone-400">Test controls:</p>
                <button onClick={() => addReview("poor")} className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100">Simulate negative review</button>
                <button onClick={() => addReview("good")} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">Simulate positive review</button>
              </div>
            </Card>
          )}
        </div>
      </div>
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === t.id ? "bg-emerald-800 text-white" : "text-stone-600 hover:bg-stone-200"}`}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
          </div>
        ) : null}
        {!loading && activeTab === "jobs" && (
          <div className="space-y-3">
            <Eyebrow>Available tasks near you</Eyebrow>
            {availableJobs.length === 0 && <p className="text-sm text-stone-500">No available jobs right now — check back soon.</p>}
            {availableJobs.map((job) => (
              <Card key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <p className="font-semibold">{job.service}</p>
                      {job.recurring && <RecurringTag frequency={job.frequency} />}
                    </div>
                    <CustomerInfo name={job.customerName} phone={job.phone} address={job.address} />
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-500"><Clock size={12} /> {fmtDate(job.date)} · {job.time}</p>
                    {job.notes && <p className="mt-1 text-xs italic text-stone-500">{job.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-800">{fmtMoney(job.price)}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => passJob(job.id)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100">Pass</button>
                      <button onClick={() => acceptJob(job)} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">Accept</button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {!loading && activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Eyebrow>Upcoming and active jobs</Eyebrow>
              <div className="flex gap-1 rounded-lg bg-stone-200 p-1">
                <button onClick={() => setScheduleView("list")} className={`rounded-md px-3 py-1 text-xs font-semibold ${scheduleView === "list" ? "bg-white shadow" : "text-stone-600"}`}>List</button>
                <button onClick={() => setScheduleView("week")} className={`rounded-md px-3 py-1 text-xs font-semibold ${scheduleView === "week" ? "bg-white shadow" : "text-stone-600"}`}>Week</button>
              </div>
            </div>
            
            {scheduleView === "list" && (
              <div className="space-y-3">
                {myJobs.filter((j) => j.date >= startOfWeek(today) && (j.status !== "completed" || j.thisWeek)).length === 0 && <p className="text-sm text-stone-500">Nothing scheduled.</p>}
                {myJobs.filter((j) => j.date >= startOfWeek(today) && (j.status !== "completed" || j.thisWeek)).map((job) => (
                  <Card key={job.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-1.5 flex items-center gap-2">
                          <p className="font-semibold">{job.service}</p>
                          {job.recurring && <RecurringTag frequency={job.frequency} />}
                          <StatusPill status={job.status} />
                        </div>
                        <CustomerInfo name={job.customerName} phone={job.phone} address={job.address} />
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-500"><Clock size={12} /> {fmtDate(job.date)} · {job.time}</p>
                        <PhotoUploader photos={job.photos} onAdd={(files) => addPhotos(job.id, files)} onRemove={(pid) => removePhoto(job.id, pid)} />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-800">{fmtMoney(job.price)}</p>
                        <div className="mt-2 flex flex-col gap-2">
                          <button onClick={() => { setActiveTab("chat"); setSelectedCustomer(job.customerName); }} className="flex items-center justify-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100">
                            <MessageCircle size={12} /> Message
                          </button>
                          {job.status === "scheduled" && (
                            <button onClick={() => startJob(job.id)} className="flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
                              <PlayCircle size={12} /> Start job
                            </button>
                          )}
                          <button onClick={() => setPhotoCompleteJob(job)} className="flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
                            <CheckCircle2 size={12} /> Complete & Photos
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {scheduleView === "week" && (
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <button onClick={() => setScheduleWeekOffset((o) => o - 1)} className="rounded-lg p-1.5 hover:bg-stone-100"><ChevronLeft size={16} /></button>
                  <p className="font-semibold text-sm">Week of {fmtDate(addDays(startOfWeek(today), scheduleWeekOffset * 7))}</p>
                  <button onClick={() => setScheduleWeekOffset((o) => o + 1)} className="rounded-lg p-1.5 hover:bg-stone-100"><ChevronRight size={16} /></button>
                </div>
                
                <div className="space-y-4">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const day = addDays(startOfWeek(today), (scheduleWeekOffset * 7) + i);
                    const dayJobs = myJobs.filter((j) => isSameDay(j.date, day)).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
                    
                    if (dayJobs.length === 0) return null;
                    
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2 border-b border-stone-100 pb-1">
                          <p className={`text-sm font-bold ${isSameDay(day, today) ? "text-emerald-700" : "text-stone-700"}`}>
                            {fmtDate(day)} {isSameDay(day, today) && <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase">Today</span>}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {dayJobs.map((j) => (
                            <div key={j.id} className="flex flex-col justify-between rounded-xl border border-stone-200 bg-stone-50 p-3">
                              <div className="mb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold">{j.customerName}</p>
                                  <StatusPill status={j.status} />
                                </div>
                                <p className="text-xs font-medium text-stone-600">{j.service} {j.recurring && <span className="text-emerald-700">· Recurring</span>}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-stone-500"><Clock size={12} /> {j.time}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500"><MapPin size={12} /> {j.address}</p>
                              </div>
                              <div className="mt-2 flex items-center gap-2 border-t border-stone-200 pt-2">
                                {j.status === "scheduled" && (
                                  <button onClick={() => startJob(j.id)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
                                    <PlayCircle size={12} /> Start
                                  </button>
                                )}
                                <button onClick={() => setPhotoCompleteJob(j)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
                                  <CheckCircle2 size={12} /> Complete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {myJobs.filter((j) => {
                     const s = addDays(startOfWeek(today), scheduleWeekOffset * 7);
                     const e = addDays(s, 6);
                     return j.date >= s && j.date <= e;
                  }).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CalendarIcon size={32} className="mb-2 text-stone-300" />
                      <p className="text-sm font-medium text-stone-500">No jobs scheduled for this week.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
        {!loading && activeTab === "route" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Eyebrow>Plan your day</Eyebrow>
              <div className="flex gap-1 rounded-lg bg-stone-200 p-1">
                <button onClick={() => setRouteMode("route")} className={`rounded-md px-3 py-1 text-xs font-semibold ${routeMode === "route" ? "bg-white shadow" : "text-stone-600"}`}>Route</button>
                <button onClick={() => setRouteMode("calendar")} className={`rounded-md px-3 py-1 text-xs font-semibold ${routeMode === "calendar" ? "bg-white shadow" : "text-stone-600"}`}>Calendar</button>
              </div>
            </div>
            {routeMode === "route" && (
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <button onClick={() => setRouteDayOffset((o) => o - 1)} className="rounded-lg p-1.5 hover:bg-stone-100"><ChevronLeft size={16} /></button>
                  <p className="font-semibold">{isSameDay(routeDate, today) ? "Today" : fmtDate(routeDate)}</p>
                  <button onClick={() => setRouteDayOffset((o) => o + 1)} className="rounded-lg p-1.5 hover:bg-stone-100"><ChevronRight size={16} /></button>
                </div>
                {routeJobs.length === 0 ? (
                  <p className="text-sm text-stone-500">No stops scheduled for this day.</p>
                ) : (
                  <>
                    <div className="mb-4 flex items-center overflow-x-auto pb-2">
                      {routeJobs.map((j, i) => (
                        <div key={j.id} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">{i + 1}</div>
                            <p className="mt-1 w-20 truncate text-center text-[11px] text-stone-500">{j.time}</p>
                          </div>
                          {i < routeJobs.length - 1 && <div className="mx-1 h-0.5 w-10 shrink-0 border-t-2 border-dashed border-emerald-300" />}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {routeJobs.map((j, i) => (
                        <div key={j.id} className="flex items-center justify-between rounded-xl border border-stone-200 p-3">
                          <div>
                            <p className="text-sm font-semibold">{i + 1}. {j.customerName} {j.recurring && <span className="ml-1 text-emerald-700">· recurring</span>}</p>
                            <p className="text-xs text-stone-500">{j.service} · {j.time}</p>
                            <p className="text-xs text-stone-500">{j.address}</p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button onClick={() => setPhotoCompleteJob(j)} className="flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
                              <CheckCircle2 size={12} /> Complete
                            </button>
                            <a href={mapsLink(j.address)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                              <Navigation size={12} /> Directions
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}
            {routeMode === "calendar" && (
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <button onClick={() => setCalendarMonthOffset((o) => o - 1)} className="rounded-lg p-1.5 hover:bg-stone-100"><ChevronLeft size={16} /></button>
                  <p className="font-semibold">{calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  <button onClick={() => setCalendarMonthOffset((o) => o + 1)} className="rounded-lg p-1.5 hover:bg-stone-100"><ChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-stone-400">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: firstWeekday }).map((_, i) => <div key={`b${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasJob = myJobs.some((j) => j.date.getFullYear() === calendarDate.getFullYear() && j.date.getMonth() === calendarDate.getMonth() && j.date.getDate() === day);
                    const isToday = isSameDay(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day), today);
                    return (
                      <button key={day} onClick={() => setSelectedCalDay(day)}
                        className={`relative aspect-square rounded-lg text-sm font-medium ${selectedCalDay === day ? "bg-emerald-700 text-white" : isToday ? "bg-emerald-100 text-emerald-800" : "hover:bg-stone-100"}`}>
                        {day}
                        {hasJob && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${selectedCalDay === day ? "bg-white" : "bg-emerald-600"}`} />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 border-t border-stone-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Jobs on {calendarDate.toLocaleDateString("en-US", { month: "short" })} {selectedCalDay}</p>
                  {jobsForSelectedDay.length === 0 && <p className="text-sm text-stone-500">No jobs this day.</p>}
                  {jobsForSelectedDay.map((j) => (
                    <div key={j.id} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span>{j.time} — {j.customerName} {j.recurring && <span className="text-emerald-700">(recurring)</span>}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={j.status} />
                        {j.status !== "completed" && (
                          <button onClick={() => setPhotoCompleteJob(j)} className="flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-800">
                            <CheckCircle2 size={12} /> Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
        {!loading && activeTab === "quotes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Eyebrow>Quotes sent to customers</Eyebrow>
              <button onClick={() => setShowQuoteForm((s) => !s)} className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
                <Plus size={13} /> New quote
              </button>
            </div>
            {showQuoteForm && (
              <Card>
                <form onSubmit={submitQuote} className="grid gap-2 sm:grid-cols-2">
                  <input required placeholder="Customer name" value={quoteForm.customerName} onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                  <input placeholder="Phone" value={quoteForm.phone} onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                  <input placeholder="Address" value={quoteForm.address} onChange={(e) => setQuoteForm({ ...quoteForm, address: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
                  <input placeholder="Service" value={quoteForm.service} onChange={(e) => setQuoteForm({ ...quoteForm, service: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                  <input required type="number" min="0" placeholder="Amount ($)" value={quoteForm.amount} onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 sm:col-span-2">Send quote</button>
                </form>
              </Card>
            )}
            {quotes.map((q) => (
              <Card key={q.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <p className="font-semibold">{q.service}</p>
                      <StatusPill status={q.status} />
                    </div>
                    <CustomerInfo name={q.customerName} phone={q.phone} address={q.address} />
                    <p className="mt-1.5 text-xs text-stone-400">Sent {fmtDate(q.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-800">{fmtMoney(q.amount)}</p>
                    <select value={q.status} onChange={(e) => updateQuoteStatus(q.id, e.target.value)} className="mt-2 rounded-lg border border-stone-300 px-2 py-1 text-xs">
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {!loading && activeTab === "history" && (
          <div className="space-y-2">
            <Eyebrow>History (Prior to this week)</Eyebrow>
            {myJobs.filter((j) => j.status === "completed" && j.date < startOfWeek(today)).length === 0 && <p className="text-sm text-stone-500">No completed jobs prior to this week.</p>}
            {myJobs.filter((j) => j.status === "completed" && j.date < startOfWeek(today)).sort((a, b) => b.date - a.date).map((j) => (
              <Card key={j.id} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-semibold">{j.service} {j.recurring && <RecurringTag frequency={j.frequency} />}</p>
                  <p className="text-sm text-stone-500">{j.customerName} · {j.address}</p>
                  <p className="text-xs text-stone-400">{fmtDate(j.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-lg font-bold text-emerald-800">{fmtMoney(j.price)}</p>
                  <button onClick={() => setPhotoCompleteJob(j)} className="flex items-center justify-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100">
                    <Camera size={12} /> Upload Photos
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
        {!loading && activeTab === "chat" && (
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <Card className="h-fit p-2">
              {Object.keys(chatThreads).map((name) => (
                <button key={name} onClick={() => setSelectedCustomer(name)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${selectedCustomer === name ? "bg-emerald-700 text-white" : "hover:bg-stone-100"}`}>
                  {name}
                </button>
              ))}
            </Card>
            <Card className="flex h-[420px] flex-col">
              <p className="mb-2 border-b border-stone-100 pb-2 font-semibold">{selectedCustomer}</p>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {(chatThreads[selectedCustomer] || []).map((m, i) => (
                  <div key={i} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.from === "provider" ? "ml-auto bg-emerald-700 text-white" : "bg-stone-100 text-stone-800"}`}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 border-t border-stone-100 pt-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Message customer..." className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                <button onClick={sendChat} className="rounded-lg bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800"><Send size={15} /></button>
              </div>
            </Card>
          </div>
        )}
      </div>
      {photoCompleteJob && (
        <JobPhotoUploadModal
          job={photoCompleteJob}
          onClose={() => setPhotoCompleteJob(null)}
          onComplete={async (job, photos) => { 
            await completeJob(job.id, photos); 
            setPhotoCompleteJob(null); 
          }}
        />
      )}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold">Contact Admin</p>
              <button onClick={() => setShowAdminModal(false)} className="rounded-lg p-1 hover:bg-stone-100"><X size={18} /></button>
            </div>
            <form onSubmit={sendAdminMessage} className="space-y-2">
              <input placeholder="Subject" value={adminSubject} onChange={(e) => setAdminSubject(e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
              <textarea required placeholder="Describe the issue..." value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} rows={4} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
              <button type="submit" className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Send to admin</button>
            </form>
            {sentAdminMessages.length > 0 && (
              <div className="mt-4 max-h-40 space-y-2 overflow-y-auto border-t border-stone-100 pt-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase text-stone-400"><AlertCircle size={12} /> Sent</p>
                {sentAdminMessages.map((m) => (
                  <div key={m.id} className="rounded-lg bg-stone-50 p-2 text-xs">
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-stone-600">{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}