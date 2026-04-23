"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { telemedicineService, TelemedicineSession, ChatMessage, ConsultationType, BookingDoctor, BookingSlot } from "@/services/telemedicineService";
import { extractErrorMessage } from "@/api/response";
import { useAuth } from "@/contexts/AuthContext";


const TABS = [
    { id: "upcoming", label: "Sắp diễn ra", icon: "event_upcoming" },
    { id: "book", label: "Đặt lịch mới", icon: "add_circle" },
    { id: "history", label: "Lịch sử", icon: "history" },
    { id: "chat", label: "Chat y tế", icon: "chat" },
];

const TYPE_ICON: Record<string, string> = { video: "videocam", audio: "mic", chat: "chat" };
const TYPE_LABEL: Record<string, string> = { video: "Video", audio: "Âm thanh", chat: "Chat" };

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TelemedicinePage() {
    const { user } = useAuth();
    const patientId = user?.id ?? "";
    const tp = useTranslations("pages.portal.patient.telemedicine");

    const [activeTab, setActiveTab] = useState("upcoming");

    // ── Tab 1: Upcoming ──
    const [upcoming, setUpcoming] = useState<TelemedicineSession[]>([]);
    const [upcomingLoading, setUpcomingLoading] = useState(true);
    const [upcomingError, setUpcomingError] = useState("");

    // ── Tab 3: History ──
    const [history, setHistory] = useState<TelemedicineSession[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    // ── Tab 2: Book ──
    const [types, setTypes] = useState<ConsultationType[]>([]);
    const [typesLoading, setTypesLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string>("");
    const [specialty, setSpecialty] = useState("");
    const [doctors, setDoctors] = useState<BookingDoctor[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<BookingDoctor | null>(null);
    const [slots, setSlots] = useState<BookingSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string>("");
    const [slotDate, setSlotDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [bookReason, setBookReason] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState("");

    // ── Tab 4: Chat ──
    const [chatSession, setChatSession] = useState<TelemedicineSession | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatSending, setChatSending] = useState(false);
    const chatPollRef = useRef<NodeJS.Timeout | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    // ── Modal chat (from upcoming / history) ──
    const [showChatModal, setShowChatModal] = useState(false);
    const [modalSession, setModalSession] = useState<TelemedicineSession | null>(null);
    const [modalMessages, setModalMessages] = useState<ChatMessage[]>([]);
    const [modalChatInput, setModalChatInput] = useState("");
    const [modalChatSending, setModalChatSending] = useState(false);

    // ── Rating modal ──
    const [showRating, setShowRating] = useState(false);
    const [ratingSession, setRatingSession] = useState<TelemedicineSession | null>(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingSending, setRatingSending] = useState(false);

    // ── Prescription modal ──
    const [showPrescription, setShowPrescription] = useState(false);
    const [prescriptionSession, setPrescriptionSession] = useState<TelemedicineSession | null>(null);

    // ─────────────────────────────────────────────────────────────
    // Load upcoming
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        setUpcomingLoading(true);
        setUpcomingError("");
        telemedicineService
            .getList({ patientId, status: "scheduled" })
            .then(res => {
                setUpcoming(res.data ?? []);
            })
            .catch(e => {
                setUpcomingError(extractErrorMessage(e));
                setUpcoming([]);
            })
            .finally(() => setUpcomingLoading(false));
    }, [patientId]);

    // ─────────────────────────────────────────────────────────────
    // Load history (lazy — chỉ load khi switch sang tab)
    // ─────────────────────────────────────────────────────────────
    const loadHistory = useCallback(() => {
        if (historyLoaded) return;
        setHistoryLoading(true);
        telemedicineService
            .getList({ patientId, status: "completed" })
            .then(res => {
                setHistory(res.data ?? []);
                setHistoryLoaded(true);
            })
            .catch(() => {
                setHistory([]);
                setHistoryLoaded(true);
            })
            .finally(() => setHistoryLoading(false));
    }, [patientId, historyLoaded]);

    // ─────────────────────────────────────────────────────────────
    // Load consultation types
    // ─────────────────────────────────────────────────────────────
    const loadTypes = useCallback(() => {
        if (types.length > 0) return;
        setTypesLoading(true);
        telemedicineService
            .getTypes()
            .then(res => setTypes(res.data ?? []))
            .catch(() => setTypes([]))
            .finally(() => setTypesLoading(false));
    }, [types.length]);

    // Tab switch effects
    useEffect(() => {
        if (activeTab === "history") loadHistory();
        if (activeTab === "book") loadTypes();
    }, [activeTab, loadHistory, loadTypes]);

    // ─────────────────────────────────────────────────────────────
    // Tìm bác sĩ theo chuyên khoa
    // ─────────────────────────────────────────────────────────────
    const searchDoctors = () => {
        setDoctorsLoading(true);
        setSelectedDoctor(null);
        setSlots([]);
        setSelectedSlot("");
        telemedicineService
            .getDoctors({ specialty, type: selectedType })
            .then(res => setDoctors(res.data ?? []))
            .catch(() => setDoctors([]))
            .finally(() => setDoctorsLoading(false));
    };

    // ─────────────────────────────────────────────────────────────
    // Lấy slot của bác sĩ
    // ─────────────────────────────────────────────────────────────
    const loadSlots = (doctor: BookingDoctor) => {
        setSelectedDoctor(doctor);
        setSlots([]);
        setSelectedSlot("");
        setSlotsLoading(true);
        telemedicineService
            .getSlots({ doctorId: doctor.id, date: slotDate, type: selectedType })
            .then(res => setSlots(res.data ?? []))
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
    };

    // ─────────────────────────────────────────────────────────────
    // Đặt lịch
    // ─────────────────────────────────────────────────────────────
    const submitBooking = async () => {
        if (!selectedDoctor || !selectedType) {
            setBookingError("Vui lòng chọn bác sĩ và loại tư vấn.");
            return;
        }
        setBookingLoading(true);
        setBookingError("");
        try {
            await telemedicineService.create({
                doctorId: selectedDoctor.id,
                patientId,
                type: selectedType as "video" | "audio" | "chat",
                slotId: selectedSlot || undefined,
                reason: bookReason,
            });
            setBookingSuccess(true);
            // Reset form
            setSelectedDoctor(null);
            setSelectedSlot("");
            setDoctors([]);
            setSlots([]);
            setBookReason("");
        } catch (e) {
            setBookingError(extractErrorMessage(e));
        } finally {
            setBookingLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Tham gia phòng khám
    // ─────────────────────────────────────────────────────────────
    const joinRoom = async (session: TelemedicineSession) => {
        try {
            const res = await telemedicineService.joinRoom(session.id);
            if (res?.roomUrl) {
                window.open(res.roomUrl, "_blank");
            }
        } catch {
            // fallback: nếu không có roomUrl thì không làm gì
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Chat modal helpers
    // ─────────────────────────────────────────────────────────────
    const openChatModal = async (session: TelemedicineSession) => {
        setModalSession(session);
        setShowChatModal(true);
        setModalMessages([]);
        try {
            const res = await telemedicineService.getChatMessages(session.id);
            setModalMessages(res.data ?? []);
        } catch {
            setModalMessages([]);
        }
    };

    const sendModalMessage = async () => {
        if (!modalSession || !modalChatInput.trim()) return;
        setModalChatSending(true);
        try {
            const msg = await telemedicineService.sendMessage(modalSession.id, modalChatInput.trim());
            setModalMessages(prev => [...prev, msg]);
            setModalChatInput("");
        } catch {
            // keep message in input
        } finally {
            setModalChatSending(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Tab 4 Chat — polling
    // ─────────────────────────────────────────────────────────────
    const loadChatMessages = useCallback(async (session: TelemedicineSession) => {
        setChatLoading(true);
        try {
            const res = await telemedicineService.getChatMessages(session.id);
            setChatMessages(res.data ?? []);
        } catch {
            setChatMessages([]);
        } finally {
            setChatLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab !== "chat" || !chatSession) return;
        loadChatMessages(chatSession);
        chatPollRef.current = setInterval(() => loadChatMessages(chatSession), 10000);
        return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
    }, [activeTab, chatSession, loadChatMessages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const sendChatMessage = async () => {
        if (!chatSession || !chatInput.trim()) return;
        setChatSending(true);
        try {
            const msg = await telemedicineService.sendMessage(chatSession.id, chatInput.trim());
            setChatMessages(prev => [...prev, msg]);
            setChatInput("");
        } catch {
            // keep
        } finally {
            setChatSending(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Rating submit
    // ─────────────────────────────────────────────────────────────
    const submitRating = async () => {
        if (!ratingSession || ratingValue === 0) return;
        setRatingSending(true);
        try {
            await telemedicineService.rateSession({
                sessionId: ratingSession.id,
                rating: ratingValue,
                comment: ratingComment,
            });
            setShowRating(false);
            // refresh history
            setHistoryLoaded(false);
            loadHistory();
        } catch {
            // silently fail
        } finally {
            setRatingSending(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Render helpers
    // ─────────────────────────────────────────────────────────────
    const renderSessionCard = (session: TelemedicineSession, isHistory = false) => (
        <div key={session.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] hover:shadow-md hover:border-[#3C81C6]/20 transition-all p-5">
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${session.status === "scheduled" ? "bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] shadow-lg shadow-[#3C81C6]/20"
                    : session.status === "completed" ? "bg-green-100 dark:bg-green-500/10"
                    : "bg-gray-100 dark:bg-gray-700"}`}>
                    <span className={`material-symbols-outlined
                        ${session.status === "scheduled" ? "text-white"
                        : session.status === "completed" ? "text-green-600"
                        : "text-gray-400"}`} style={{ fontSize: "24px" }}>
                        {session.status === "scheduled" ? (TYPE_ICON[session.type ?? "video"] ?? "videocam")
                            : session.status === "completed" ? "check_circle" : "cancel"}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h4 className="text-sm font-bold text-[#121417] dark:text-white">{session.doctorName ?? session.doctor}</h4>
                            <p className="text-xs text-[#687582] mt-0.5">{session.department}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {session.type && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#3C81C6]/10 text-[#3C81C6] rounded-full uppercase">
                                    {TYPE_LABEL[session.type] ?? session.type}
                                </span>
                            )}
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase
                                ${session.status === "scheduled" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : session.status === "completed" ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                                {session.status === "scheduled" ? "Đã lên lịch" : session.status === "completed" ? "Hoàn thành" : "Đã hủy"}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#687582] flex-wrap">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event</span>{session.date}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>{session.time}</span>
                        {session.duration && <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>timer</span>{session.duration} phút</span>}
                    </div>
                    {session.reason && <p className="text-xs text-[#687582] mt-1.5">💬 {session.reason}</p>}
                    {session.diagnosis && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">📋 Chẩn đoán: {session.diagnosis}</p>
                        </div>
                    )}
                    {session.rating != null && session.rating > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`material-symbols-outlined ${i < session.rating! ? "text-amber-400" : "text-gray-200"}`} style={{ fontSize: "16px" }}>star</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#e5e7eb]/50 dark:border-[#2d353e]/50 flex-wrap">
                {session.status === "scheduled" && (
                    <>
                        <button
                            onClick={() => joinRoom(session)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>videocam</span>Vào phòng khám
                        </button>
                        <button
                            onClick={() => openChatModal(session)}
                            className="px-3 py-2 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] rounded-lg hover:bg-[#3C81C6]/[0.12] flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>Nhắn tin
                        </button>
                        <button
                            onClick={() => telemedicineService.cancel(session.id)}
                            className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                            Hủy lịch
                        </button>
                    </>
                )}
                {session.status === "completed" && (
                    <>
                        <button
                            onClick={() => openChatModal(session)}
                            className="px-3 py-2 text-xs font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252d36] flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>Xem tin nhắn
                        </button>
                        {session.prescription && (
                            <button
                                onClick={() => { setPrescriptionSession(session); setShowPrescription(true); }}
                                className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>medication</span>Xem đơn thuốc
                            </button>
                        )}
                        {(!session.rating || session.rating === 0) && (
                            <button
                                onClick={() => { setRatingSession(session); setRatingValue(0); setRatingComment(""); setShowRating(true); }}
                                className="px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>star</span>Đánh giá
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    // Tab contents
    // ─────────────────────────────────────────────────────────────
    const renderUpcoming = () => {
        if (upcomingLoading) return <LoadingSkeleton count={2} />;
        if (upcomingError) return (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-red-400 mb-2" style={{ fontSize: "40px" }}>error</span>
                <p className="text-sm text-red-600 dark:text-red-400">{upcomingError}</p>
                <p className="text-xs text-[#687582] mt-1">Đang hiển thị dữ liệu mẫu</p>
            </div>
        );
        if (upcoming.length === 0) return (
            <EmptyState icon="event_upcoming" title="Không có lịch khám sắp tới" hint="Đặt lịch khám trực tuyến để bắt đầu">
                <button onClick={() => setActiveTab("book")} className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_circle</span>Đặt lịch mới
                </button>
            </EmptyState>
        );
        return <div className="space-y-4">{upcoming.map(s => renderSessionCard(s, false))}</div>;
    };

    const renderHistory = () => {
        if (historyLoading) return <LoadingSkeleton count={3} />;
        if (history.length === 0) return <EmptyState icon="history" title="Chưa có lịch sử khám" />;
        return <div className="space-y-4">{history.map(s => renderSessionCard(s, true))}</div>;
    };

    const renderBook = () => (
        <div className="space-y-6">
            {bookingSuccess && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 rounded-2xl p-5 flex items-center gap-4">
                    <span className="material-symbols-outlined text-green-500" style={{ fontSize: "32px" }}>check_circle</span>
                    <div>
                        <p className="text-sm font-bold text-green-700 dark:text-green-400">Đặt lịch thành công!</p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Bạn sẽ nhận thông báo xác nhận sớm.</p>
                    </div>
                    <button onClick={() => setBookingSuccess(false)} className="ml-auto text-green-500 hover:text-green-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}

            {/* Step 1: Chọn loại */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#3C81C6] text-white text-xs font-bold flex items-center justify-center">1</span>
                    Chọn loại tư vấn
                </h3>
                {typesLoading ? (
                    <div className="flex gap-3">
                        {[1,2,3].map(i => <div key={i} className="flex-1 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="flex gap-3 flex-wrap">
                        {(types.length > 0
                            ? types
                            : [
                                { id: "video", name: "Video call", type: "video" as const, description: "Tư vấn qua video" },
                                { id: "audio", name: "Âm thanh", type: "audio" as const, description: "Tư vấn qua điện thoại" },
                                { id: "chat", name: "Chat", type: "chat" as const, description: "Tư vấn qua tin nhắn" },
                            ]
                        ).map(t => (
                            <button key={t.id}
                                onClick={() => setSelectedType(t.type)}
                                className={`flex-1 min-w-[100px] flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                                    ${selectedType === t.type
                                        ? "border-[#3C81C6] bg-[#3C81C6]/5"
                                        : "border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6]/40"}`}>
                                <span className={`material-symbols-outlined ${selectedType === t.type ? "text-[#3C81C6]" : "text-[#687582]"}`} style={{ fontSize: "22px" }}>
                                    {TYPE_ICON[t.type] ?? "videocam"}
                                </span>
                                <span className={`text-xs font-semibold ${selectedType === t.type ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>{t.name}</span>
                                {t.description && <span className="text-[10px] text-[#687582]">{t.description}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Step 2: Tìm bác sĩ */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#3C81C6] text-white text-xs font-bold flex items-center justify-center">2</span>
                    Tìm bác sĩ
                </h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={specialty}
                        onChange={e => setSpecialty(e.target.value)}
                        placeholder="Chuyên khoa (vd: Tim mạch, Nội khoa...)"
                        className="flex-1 px-4 py-2.5 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                    <button
                        onClick={searchDoctors}
                        disabled={doctorsLoading}
                        className="px-4 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-medium hover:bg-[#2a6da8] disabled:opacity-60 flex items-center gap-1.5">
                        {doctorsLoading ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: "18px" }}>progress_activity</span> : <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>search</span>}
                        Tìm
                    </button>
                </div>
                {doctors.length > 0 && (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                        {doctors.map(d => (
                            <button key={d.id} onClick={() => loadSlots(d)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                                    ${selectedDoctor?.id === d.id
                                        ? "border-[#3C81C6] bg-[#3C81C6]/5"
                                        : "border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6]/30"}`}>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {d.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{d.name}</p>
                                    <p className="text-xs text-[#687582]">{d.specialty ?? d.department}</p>
                                </div>
                                {d.rating != null && (
                                    <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>star</span>{d.rating}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
                {doctors.length === 0 && !doctorsLoading && specialty && (
                    <p className="text-xs text-[#687582] text-center py-4">Không tìm thấy bác sĩ. Thử chuyên khoa khác.</p>
                )}
            </div>

            {/* Step 3: Chọn slot */}
            {selectedDoctor && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#3C81C6] text-white text-xs font-bold flex items-center justify-center">3</span>
                        Chọn khung giờ — {selectedDoctor.name}
                    </h3>
                    <div className="flex gap-2 mb-3">
                        <input type="date" value={slotDate} onChange={e => { setSlotDate(e.target.value); loadSlots(selectedDoctor); }}
                            className="flex-1 px-3 py-2 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                    </div>
                    {slotsLoading ? (
                        <div className="flex gap-2 flex-wrap">
                            {[1,2,3,4].map(i => <div key={i} className="w-20 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
                        </div>
                    ) : slots.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                            {slots.map(slot => (
                                <button key={slot.id}
                                    disabled={!slot.available}
                                    onClick={() => setSelectedSlot(slot.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all
                                        ${!slot.available ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700 text-[#687582]"
                                        : selectedSlot === slot.id ? "border-[#3C81C6] bg-[#3C81C6] text-white"
                                        : "border-[#e5e7eb] dark:border-[#2d353e] text-[#121417] dark:text-white hover:border-[#3C81C6]"}`}>
                                    {slot.time}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-[#687582] text-center py-4">Không có slot trống cho ngày này.</p>
                    )}
                </div>
            )}

            {/* Step 4: Lý do + Submit */}
            {selectedDoctor && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#3C81C6] text-white text-xs font-bold flex items-center justify-center">4</span>
                        Lý do tư vấn
                    </h3>
                    <textarea
                        value={bookReason}
                        onChange={e => setBookReason(e.target.value)}
                        placeholder="Mô tả triệu chứng hoặc lý do bạn muốn tư vấn..."
                        className="w-full px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 min-h-[80px] resize-none"
                    />
                    {bookingError && (
                        <p className="text-xs text-red-500 mt-2">{bookingError}</p>
                    )}
                    <button
                        onClick={submitBooking}
                        disabled={bookingLoading || !selectedType}
                        className="mt-3 w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                        {bookingLoading
                            ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: "18px" }}>progress_activity</span>Đang đặt lịch...</>
                            : <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>Xác nhận đặt lịch</>}
                    </button>
                </div>
            )}
        </div>
    );

    const renderChat = () => {
        // Chọn session để chat
        const allSessions = [...upcoming, ...history];
        if (!chatSession) {
            return (
                <div className="space-y-3">
                    <p className="text-sm text-[#687582]">Chọn phiên khám để chat với bác sĩ:</p>
                    {allSessions.length === 0 ? (
                        <EmptyState icon="chat" title="Chưa có phiên khám nào" />
                    ) : (
                        allSessions.map(s => (
                            <button key={s.id} onClick={() => setChatSession(s)}
                                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6]/30 hover:shadow-sm transition-all text-left">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {(s.doctorName ?? s.doctor).charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{s.doctorName ?? s.doctor}</p>
                                    <p className="text-xs text-[#687582]">{s.department} • {s.date}</p>
                                </div>
                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase
                                    ${s.status === "scheduled" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                    {s.status === "scheduled" ? "Sắp tới" : "Đã khám"}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            );
        }

        return (
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] flex flex-col" style={{ height: "65vh" }}>
                {/* Header */}
                <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-3">
                    <button onClick={() => { setChatSession(null); setChatMessages([]); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-outlined text-[#687582]">arrow_back</span>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-xs font-bold">
                        {(chatSession.doctorName ?? chatSession.doctor).charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#121417] dark:text-white">{chatSession.doctorName ?? chatSession.doctor}</p>
                        <p className="text-xs text-[#687582]">{chatSession.department}</p>
                    </div>
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatLoading && chatMessages.length === 0 ? (
                        <div className="flex justify-center py-8"><span className="material-symbols-outlined animate-spin text-[#3C81C6]" style={{ fontSize: "28px" }}>progress_activity</span></div>
                    ) : chatMessages.length === 0 ? (
                        <div className="text-center py-8"><p className="text-sm text-[#687582]">Chưa có tin nhắn</p></div>
                    ) : (
                        chatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.senderRole === "patient" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm
                                    ${msg.senderRole === "patient"
                                        ? "bg-[#3C81C6] text-white rounded-br-md"
                                        : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white rounded-bl-md"}`}>
                                    <p>{msg.message}</p>
                                    <p className={`text-[10px] mt-1 ${msg.senderRole === "patient" ? "text-blue-200" : "text-[#687582]"}`}>{msg.timestamp}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>
                {/* Input */}
                <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 px-4 py-2.5 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                        <button
                            onClick={sendChatMessage}
                            disabled={chatSending || !chatInput.trim()}
                            className="px-4 py-2.5 bg-[#3C81C6] text-white rounded-xl hover:bg-[#2a6da8] transition-colors disabled:opacity-60">
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>send</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────
    // Main render
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">{tp("title")}</h1>
                    <p className="text-sm text-[#687582] mt-0.5">{tp("subtitle")}</p>
                </div>
                <button
                    onClick={() => setActiveTab("book")}
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg transition-all">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>videocam</span>Đặt lịch online
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-[#3C81C6]/5 to-[#60a5fa]/5 border border-[#3C81C6]/10 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "24px" }}>video_camera_front</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Khám bệnh trực tuyến tiện lợi</h3>
                    <p className="text-xs text-[#687582] mt-1">Tư vấn trực tiếp với bác sĩ chuyên khoa qua video call. Nhận đơn thuốc & chẩn đoán ngay tại nhà.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#f1f2f4] dark:bg-[#13191f] p-1 rounded-xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${activeTab === tab.id ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#121417]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "upcoming" && renderUpcoming()}
            {activeTab === "book" && renderBook()}
            {activeTab === "history" && renderHistory()}
            {activeTab === "chat" && renderChat()}

            {/* Chat Modal (from session cards) */}
            {showChatModal && modalSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowChatModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ height: "70vh" }} onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-xs font-bold">
                                    {(modalSession.doctorName ?? modalSession.doctor).charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{modalSession.doctorName ?? modalSession.doctor}</p>
                                    <p className="text-xs text-[#687582]">{modalSession.department}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChatModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[#687582]">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {modalMessages.length === 0 ? (
                                <div className="text-center py-8"><p className="text-sm text-[#687582]">Chưa có tin nhắn</p></div>
                            ) : modalMessages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderRole === "patient" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm
                                        ${msg.senderRole === "patient"
                                            ? "bg-[#3C81C6] text-white rounded-br-md"
                                            : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white rounded-bl-md"}`}>
                                        <p>{msg.message}</p>
                                        <p className={`text-[10px] mt-1 ${msg.senderRole === "patient" ? "text-blue-200" : "text-[#687582]"}`}>{msg.timestamp}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={modalChatInput}
                                    onChange={e => setModalChatInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") sendModalMessage(); }}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 px-4 py-2.5 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                                <button
                                    onClick={sendModalMessage}
                                    disabled={modalChatSending || !modalChatInput.trim()}
                                    className="px-4 py-2.5 bg-[#3C81C6] text-white rounded-xl hover:bg-[#2a6da8] transition-colors disabled:opacity-60">
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {showRating && ratingSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowRating(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white text-center mb-2">Đánh giá tư vấn</h3>
                        <p className="text-sm text-[#687582] text-center mb-4">{ratingSession.doctorName ?? ratingSession.doctor}</p>
                        <div className="flex justify-center gap-2 mb-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <button key={i} onClick={() => setRatingValue(i + 1)}
                                    className={`transition-colors ${i < ratingValue ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>star</span>
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={ratingComment}
                            onChange={e => setRatingComment(e.target.value)}
                            placeholder="Nhận xét (không bắt buộc)..."
                            className="w-full px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 min-h-[80px] resize-none mb-4" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRating(false)} className="flex-1 py-2.5 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36]">Bỏ qua</button>
                            <button
                                onClick={submitRating}
                                disabled={ratingSending || ratingValue === 0}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#3C81C6] rounded-xl hover:bg-[#2a6da8] disabled:opacity-60">
                                {ratingSending ? "Đang gửi..." : "Gửi đánh giá"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prescription Modal (placeholder) */}
            {showPrescription && prescriptionSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowPrescription(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">Đơn thuốc</h3>
                            <button onClick={() => setShowPrescription(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[#687582]">close</span>
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "48px" }}>medication</span>
                            <p className="text-sm text-[#687582] mt-2">Phiên: {prescriptionSession.id}</p>
                            <p className="text-xs text-[#687582] mt-1">Đơn thuốc sẽ được tải từ API</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function LoadingSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5 animate-pulse">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ icon, title, hint, children }: { icon: string; title: string; hint?: string; children?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] py-16 text-center">
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-3" style={{ fontSize: "56px" }}>{icon}</span>
            <h3 className="text-lg font-semibold text-[#121417] dark:text-white mb-1">{title}</h3>
            {hint && <p className="text-sm text-[#687582] mb-4">{hint}</p>}
            {children}
        </div>
    );
}
