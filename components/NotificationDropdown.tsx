"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUserProgress } from "@/components/UserProgressContext";
import { useNativeLanguage } from "@/components/LanguageContext";
import { useSoundAndTheme } from "@/components/SoundAndThemeContext";
import { Icon, IconButton } from "@/components/ui";

interface NotificationItem {
  id: string;
  type: "streak" | "srs" | "mission" | "sensei";
  title: string;
  desc: string;
  actionUrl?: string;
  actionLabel?: string;
  time: string;
}

export function NotificationDropdown() {
  const { progress } = useUserProgress();
  const { nativeLanguage } = useNativeLanguage();
  const { playClick, showToast } = useSoundAndTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isEn = nativeLanguage === "en";

  // Build active dynamic notifications based on live user progress
  const notifications: NotificationItem[] = [];

  const streak = progress?.currentStreak ?? 0;
  const dueCards = progress?.stats?.dueReviewCount ?? 0;
  const completedLessons = progress?.stats?.completedLessonsCount ?? 0;
  const totalLessons = progress?.stats?.totalLessonsInLevel ?? 50;

  // 1. SRS Due Notification
  if (dueCards > 0) {
    notifications.push({
      id: "notif-srs",
      type: "srs",
      title: isEn ? `⏰ ${dueCards} SRS Cards Due for Review` : `⏰ ${dueCards} Thẻ Từ Vựng Đến Hạn Ôn`,
      desc: isEn
        ? "Review now to lock newly learned words into your long-term memory!"
        : "Ôn tập ngay bây giờ là thời điểm vàng để từ vựng khắc sâu vào trí nhớ dài hạn!",
      actionUrl: "/app/review",
      actionLabel: isEn ? "Review Now →" : "Ôn tập ngay →",
      time: isEn ? "Today" : "Hôm nay",
    });
  }

  // 2. Daily Streak Alert
  notifications.push({
    id: "notif-streak",
    type: "streak",
    title: isEn ? `🔥 Keep Your ${streak}-Day Streak Alive!` : `🔥 Duy Trì Chuỗi ${streak} Ngày Streak!`,
    desc: isEn
      ? "Complete at least 1 lesson or 5 SRS reviews before midnight to keep your flame burning."
      : "Hoàn thành tối thiểu 1 bài học hoặc 5 thẻ SRS trước 24:00 để ngọn lửa không bị dập tắt.",
    actionUrl: "/app/practice",
    actionLabel: isEn ? "Learn Lesson →" : "Học bài ngay →",
    time: isEn ? "Priority" : "Ưu tiên",
  });

  // 3. Curriculum Progress
  if (completedLessons < totalLessons) {
    notifications.push({
      id: "notif-mission",
      type: "mission",
      title: isEn ? `🎯 Curriculum Milestone: ${completedLessons}/${totalLessons}` : `🎯 Tiến độ khóa học: ${completedLessons}/${totalLessons}`,
      desc: isEn
        ? `You have completed ${completedLessons} lessons in JLPT ${progress?.learningLevel || "N5"}. Keep moving forward!`
        : `Bạn đã vượt qua ${completedLessons} bài học JLPT ${progress?.learningLevel || "N5"}. Hãy tiếp tục chinh phục bài tiếp theo!`,
      actionUrl: "/app/path",
      actionLabel: isEn ? "View Path →" : "Xem lộ trình →",
      time: isEn ? "Curriculum" : "Giáo trình",
    });
  }

  // 4. Kawaii Sensei Daily Tip
  notifications.push({
    id: "notif-sensei",
    type: "sensei",
    title: isEn ? "🌸 Aoi Sensei Tip: Shadowing" : "🌸 Lời khuyên Sensei: Luyện Shadowing",
    desc: isEn
      ? "Practice repeating Japanese audio out loud to build natural rhythm and pronunciation."
      : "Hãy bật nút nghe phát âm và nhại lại giọng đọc để cơ miệng quen với ngữ điệu tự nhiên của người Nhật nhé.",
    actionUrl: "/app/sensei",
    actionLabel: isEn ? "Chat with Sensei →" : "Nói chuyện với Sensei →",
    time: isEn ? "Daily Tip" : "Mẹo mỗi ngày",
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  // Dismiss on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleMarkAllRead = () => {
    playClick();
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const handleSendReminderEmail = async () => {
    try {
      playClick();
      setIsSendingEmail(true);
      showToast({
        title: isEn ? "Sending study reminder email..." : "Đang gửi email nhắc nhở học tập...",
        type: "info",
      });

      const res = await fetch("/api/user/study-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nativeLanguage }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast({
          title: isEn ? "Reminder Email Sent! 🌸" : "Đã gửi email nhắc nhở thành công! 🌸",
          description: data.message || "Hãy kiểm tra hòm thư của bạn.",
          type: "success",
        });
      } else {
        showToast({
          title: "Lỗi gửi email",
          description: data.error || "Chưa thể gửi email lúc này",
          type: "error",
        });
      }
    } catch {
      showToast({ title: "Lỗi kết nối máy chủ", type: "error" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <IconButton
        label="Thông báo"
        className="relative h-10 w-10 sm:h-10 sm:w-10 max-[420px]:hidden"
        onClick={() => {
          playClick();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-sumi-900 animate-pulse" />
        )}
      </IconButton>

      {isOpen && (
        <div
          role="menu"
          aria-label="Trung tâm thông báo"
          className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-sumi-900 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {isEn ? "Notifications" : "Thông báo học tập"}
              </h4>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition font-medium"
              >
                {isEn ? "Mark all read" : "Đã đọc"}
              </button>
            )}
          </div>

          {/* Quick Email Reminder Action Card */}
          <div className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30 border border-red-200/70 dark:border-red-900/40 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-red-900 dark:text-red-300">
                {isEn ? "Email Study Reminder" : "Nhắc nhở học qua Email"}
              </p>
              <p className="text-[11px] text-red-700/80 dark:text-red-400/80">
                {isEn ? "Get daily study brief in your inbox" : "Nhận tổng hợp bài học & Streak vào hòm thư"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendReminderEmail}
              disabled={isSendingEmail}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm transition active:scale-95"
            >
              {isSendingEmail ? (isEn ? "Sending..." : "Đang gửi...") : (isEn ? "Send now ✉️" : "Gửi ngay ✉️")}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
            {notifications.map((item) => {
              const isRead = readIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition ${
                    isRead
                      ? "bg-slate-50/60 dark:bg-sumi-950/40 border-slate-100 dark:border-slate-800/80 opacity-70"
                      : "bg-white dark:bg-sumi-800/90 border-slate-200/80 dark:border-slate-700 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.time}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.desc}
                  </p>

                  {item.actionUrl && (
                    <div className="mt-2 flex justify-end">
                      <Link
                        href={item.actionUrl}
                        onClick={() => {
                          playClick();
                          setIsOpen(false);
                          setReadIds((prev) => new Set(prev).add(item.id));
                        }}
                        className="text-[11px] font-extrabold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                      >
                        {item.actionLabel}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

