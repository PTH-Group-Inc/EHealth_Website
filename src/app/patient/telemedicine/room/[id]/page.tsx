"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { telemedicineService } from "@/services/telemedicineService";

export default function TelemedicineRoomPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Fetch session details to ensure it exists
        const fetchDetails = async () => {
            try {
                // If there's an API bug right now, we will softly ignore and just show the mock room
                const details = await telemedicineService.getById(sessionId);
                setSessionDetails(details);
            } catch (err) {
                console.error("Failed to fetch session details:", err);
                // We mock details if fetch fails so user doesn't get blocked during UI testing
                setSessionDetails({
                    id: sessionId,
                    doctor: "BS. Nguyên Khang",
                    department: "Khám Tổng Quát",
                    status: "in_progress"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [sessionId]);

    // Mock local camera stream
    useEffect(() => {
        if (!isCameraOff && localVideoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                })
                .catch(err => console.error("Camera access denied or not found:", err));
        } else if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => {
                if (track.kind === 'video') track.enabled = !isCameraOff;
                if (track.kind === 'audio') track.enabled = !isMuted;
            });
        }
    }, [isCameraOff, isMuted]);

    // Stop streams when unmounting
    useEffect(() => {
        // Copy ref vào biến local — phòng trường hợp ref.current đổi giữa lúc
        // effect chạy và lúc cleanup, đảm bảo cleanup dùng đúng node ban đầu.
        const videoEl = localVideoRef.current;
        return () => {
            if (videoEl && videoEl.srcObject) {
                const stream = videoEl.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleEndCall = () => {
        // Here we would call API to end session
        router.push('/patient/telemedicine');
    };

    if (loading) {
        return (
            <div className="flex bg-[#121417] dark:bg-black w-full h-[calc(100vh-80px)] items-center justify-center">
                <p className="text-white">Đang kết nối phòng khám...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row bg-[#121417] dark:bg-black w-full h-[calc(100vh-80px)] overflow-hidden rounded-2xl shadow-xl border border-gray-800">
            {/* Main Video Area */}
            <div className={`relative flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? 'md:w-2/3' : 'w-full'}`}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/patient/telemedicine')} className="text-white hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all">
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <div>
                            <h2 className="text-white font-bold text-lg">{sessionDetails?.doctor || "Phòng Khám Từ Xa"}</h2>
                            <p className="text-green-400 text-xs font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Đang diễn ra
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <span className="material-symbols-outlined text-white/70 text-sm">schedule</span>
                        <span className="text-white text-sm font-mono tracking-wider">12:34</span>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-center items-center relative mt-12 mb-20">
                    
                    {/* Remote Video (Doctor) */}
                    <div className="relative w-full md:flex-1 h-full max-h-[60vh] md:max-h-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 group">
                        {/* Mock doctor avatar placeholder since we don't have real remote stream yet */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                                    {(sessionDetails?.doctor || "B").charAt(0)}
                                </div>
                                <p className="text-gray-300 font-medium">Bác sĩ đang kết nối camera...</p>
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 border border-white/10">
                            {sessionDetails?.doctor || "Bác sĩ"}
                        </div>
                    </div>

                    {/* Local Video (Patient) */}
                    <div className="absolute bottom-24 right-6 md:bottom-8 md:right-8 w-32 md:w-48 aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 z-20">
                        {isCameraOff ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <span className="material-symbols-outlined text-gray-500 text-4xl">videocam_off</span>
                            </div>
                        ) : (
                            <video 
                                ref={localVideoRef}
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover transform -scale-x-100" // scale-x-100 mirrors the video
                            />
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-medium border border-white/10">
                            Bạn
                        </div>
                        {isMuted && (
                            <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-md p-1 rounded-full text-white flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-[14px]">mic_off</span>
                            </div>
                        )}
                    </div>

                </div>

                {/* Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-3 md:gap-6">
                        
                        <button 
                            onClick={() => setIsMuted(!isMuted)} 
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? 'bg-red-500/90 text-white hover:bg-red-600' : 'bg-gray-800/80 text-white hover:bg-gray-700 backdrop-blur-md border border-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-[24px]">
                                {isMuted ? 'mic_off' : 'mic'}
                            </span>
                        </button>
                        
                        <button 
                            onClick={() => setIsCameraOff(!isCameraOff)} 
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isCameraOff ? 'bg-red-500/90 text-white hover:bg-red-600' : 'bg-gray-800/80 text-white hover:bg-gray-700 backdrop-blur-md border border-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-[24px]">
                                {isCameraOff ? 'videocam_off' : 'videocam'}
                            </span>
                        </button>

                        <button 
                            onClick={handleEndCall}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center transition-all shadow-xl shadow-red-900/30 ml-2"
                        >
                            <span className="material-symbols-outlined text-[28px]">call_end</span>
                        </button>

                        <button 
                            onClick={() => setIsChatOpen(!isChatOpen)} 
                            className={`w-12 h-12 ml-2 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isChatOpen ? 'bg-blue-600 text-white' : 'bg-gray-800/80 text-white hover:bg-gray-700 backdrop-blur-md border border-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-[24px]">chat</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Sidebar */}
            <div className={`transition-all duration-300 ease-in-out bg-white dark:bg-[#1A1D21] border-l border-gray-200 dark:border-gray-800 flex flex-col ${isChatOpen ? 'w-full md:w-1/3 max-w-sm absolute right-0 top-0 bottom-0 z-30 md:relative' : 'w-0 overflow-hidden opacity-0'}`}>
                {isChatOpen && (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#1A1D21]">
                            <h3 className="font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500 text-[20px]">forum</span>
                                Trò chuyện
                            </h3>
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white md:hidden">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#14161A]">
                            <div className="flex justify-center">
                                <span className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Hôm nay</span>
                            </div>
                            
                            <div className="flex gap-2 justify-start">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold shrink-0">BS</div>
                                <div>
                                    <div className="bg-white dark:bg-[#252A30] text-[#121417] dark:text-gray-200 text-sm px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-800">
                                        Chào bạn, tôi là Bác sĩ đây. Bạn nghe rõ tôi không?
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1">12:30</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 justify-end">
                                <div>
                                    <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-2xl rounded-tr-sm shadow-sm">
                                        Dạ vâng, tôi nghe rõ ạ.
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 mr-1 text-right">12:31</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1D21]">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#252A30] p-1.5 rounded-full border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-[#1A1D21] transition-all">
                                <input 
                                    type="text" 
                                    placeholder="Nhập tin nhắn..." 
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm px-3 text-[#121417] dark:text-white"
                                />
                                <button className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md">
                                    <span className="material-symbols-outlined text-[16px] ml-0.5">send</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
