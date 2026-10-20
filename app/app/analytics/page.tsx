import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { resolveCanonicalUserLevel, resolvePersonalizationTrack } from "@/lib/learning-level";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/level";
import { AppNav } from "@/components/AppNav";
import { JapanBackdrop } from "@/components/JapanIllustration";
import {
  buildLearningPath,
  buildRemediationPlan,
  LEARNING_LIFECYCLE_STAGES,
  sanitizeAnswers,
} from "@/lib/personalization";
import {
  AnalyticsClient,
  type SkillProficiencyItem,
  type LifecycleProgressStage,
} from "./AnalyticsClient";

export const metadata = {
  title: "Đánh Giá Tiến Bộ — Nihon Quest",
  description: "Đánh giá đa chiều tiến bộ học tập tiếng Nhật, phân tích độ sẵn sàng JLPT và đồng bộ lộ trình cá nhân hóa.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      profile: { select: { displayName: true, avatar: true } },
    },
  });

  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const userLevel = resolveCanonicalUserLevel(user);
  const levelInfo = calculateLevel(user.totalXP);
  const levelProgressPercent = Math.round(levelInfo.progress * 100);

  const answers = sanitizeAnswers({
    level: resolvePersonalizationTrack(user),
    goal: user.learningGoal,
    dailyGoalMinutes: user.dailyGoalMinutes,
    focusSkill: user.focusSkill,
    learningStyle: user.learningStyle,
  });

  const path = buildLearningPath(answers);

  // Parallel database fetch for all progress metrics
  const now = new Date();
  const [
    completedLessonsCount,
    inProgressLessonsCount,
    totalLevelLessons,
    totalVocabCount,
    vocabReviewItems,
    kanaMasteredCount,
    totalGrammarCount,
    grammarReviewCount,
    allReviewItems,
    allReviewHistory,
    exerciseAttempts,
    xpTransactions,
    journeyLocations,
    userJourneyProgress,
    achievementsCount,
    userAchievementsCount,
    userLowLessons,
  ] = await Promise.all([
    prisma.userLessonProgress.count({
      where: { userId: uid, status: "COMPLETED" },
    }),
    prisma.userLessonProgress.count({
      where: { userId: uid, status: "IN_PROGRESS" },
    }),
    prisma.lesson.count({
      where: { isPublished: true, level: userLevel },
    }),
    prisma.vocabulary.count({
      where: { jlptLevel: userLevel },
    }),
    prisma.reviewItem.findMany({
      where: { userId: uid, contentType: "VOCAB" },
      select: { repetitions: true, interval: true, ease: true },
    }),
    prisma.reviewItem.count({
      where: { userId: uid, contentType: "KANA" },
    }),
    prisma.grammar.count({
      where: { level: userLevel },
    }),
    prisma.reviewItem.count({
      where: { userId: uid, contentType: "GRAMMAR" },
    }),
    prisma.reviewItem.findMany({
      where: { userId: uid },
      select: { repetitions: true, interval: true, dueAt: true, contentType: true },
    }),
    prisma.reviewHistory.findMany({
      where: { userId: uid },
      select: { grade: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.exerciseAttempt.findMany({
      where: { userId: uid },
      select: { isCorrect: true, timeSpent: true, createdAt: true },
      take: 200,
    }),
    prisma.xpTransaction.findMany({
      where: { userId: uid },
      select: { amount: true, reason: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.journeyLocation.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, nameJa: true, order: true },
    }),
    prisma.userJourneyProgress.findMany({
      where: { userId: uid },
      select: { locationId: true, status: true, isStamped: true },
    }),
    prisma.achievement.count(),
    prisma.userAchievement.count({
      where: { userId: uid },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId: uid, score: { lt: 75 } },
      include: { lesson: { select: { slug: true, title: true } } },
      orderBy: { score: "asc" },
      take: 3,
    }),
  ]);

  // 1. Path Progress calculation
  const totalPathModules = path.modules.length;
  const pathPercentComplete = Math.min(
    100,
    Math.round((completedLessonsCount / Math.max(1, totalPathModules)) * 100),
  );
  const currentModule = path.modules[Math.min(completedLessonsCount, totalPathModules - 1)];

  // 2. SRS Memory Metrics
  const dueSrsCount = allReviewItems.filter((i) => i.dueAt <= now).length;
  const weakSrsCount = allReviewItems.filter((i) => i.repetitions === 0).length;
  const masteredSrsCount = allReviewItems.filter((i) => i.interval >= 21).length;
  const reviewingSrsCount = allReviewItems.filter((i) => i.interval >= 3 && i.interval < 21).length;
  const learningSrsCount = allReviewItems.filter((i) => i.interval < 3).length;

  let retentionRate: number | null = null;
  if (allReviewHistory.length > 0) {
    const successfulReviews = allReviewHistory.filter(
      (h) => h.grade === "GOOD" || h.grade === "EASY",
    ).length;
    retentionRate = Math.round((successfulReviews / allReviewHistory.length) * 100);
  }

  const retentionTier =
    retentionRate == null
      ? "Đang thu thập dữ liệu ôn tập SRS"
      : retentionRate >= 85
      ? "Độ lưu giữ xuất sắc (≥ 85%) — Kiến thức đã chuyển vào trí nhớ dài hạn."
      : retentionRate >= 70
      ? "Độ lưu giữ tốt (70-84%) — Đang củng cố ổn định theo đường cong quên."
      : "Cần tăng nhịp ôn tập (< 70%) — Hãy vào phòng SRS mỗi ngày.";

  // 3. Exercise Accuracy
  const totalAttempts = exerciseAttempts.length;
  const correctAttempts = exerciseAttempts.filter((a) => a.isCorrect).length;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null;

  // 4. Learning Velocity
  const ms7DaysAgo = now.getTime() - 7 * 86400000;
  const recent7dTx = xpTransactions.filter((tx) => tx.createdAt.getTime() >= ms7DaysAgo);
  const total7dXP = recent7dTx.reduce((sum, tx) => sum + tx.amount, 0);
  const dailyXpAverage = Math.round(total7dXP / 7);
  const weeklyLessonsPace = completedLessonsCount > 0 ? Math.max(1, Math.round(completedLessonsCount / Math.max(1, path.estWeeks))) : path.modulesPerWeek;
  const adherencePercent = Math.min(100, Math.max(20, Math.round((Math.max(1, user.currentStreak) / 7) * 100)));

  // 5. 5-Skill Proficiency Matrix
  // Skill 1: Từ vựng & Hán tự (Goi & Kanji)
  const safeVocabTotal = totalVocabCount || 100;
  const vocabLearnedCount = vocabReviewItems.length;
  const vocabMasteredCount = vocabReviewItems.filter((v) => v.repetitions >= 3).length;
  const vocabScore = Math.min(
    100,
    Math.round(
      (vocabLearnedCount / safeVocabTotal) * 60 +
        (safeVocabTotal > 0 ? (vocabMasteredCount / safeVocabTotal) * 40 : 0) +
        (kanaMasteredCount >= 46 ? 10 : (kanaMasteredCount / 46) * 10),
    ),
  );

  // Skill 2: Ngữ pháp (Bunpou)
  const safeGrammarTotal = totalGrammarCount || 40;
  const grammarLearnedCount = Math.min(
    safeGrammarTotal,
    Math.max(grammarReviewCount, Math.round(completedLessonsCount * 1.5)),
  );
  const grammarScore = Math.min(
    100,
    Math.round((grammarLearnedCount / safeGrammarTotal) * 80 + (overallAccuracy ? overallAccuracy * 0.2 : 10)),
  );

  // Skill 3: Đọc hiểu (Dokkai)
  const readingTarget = Math.max(5, Math.round(totalLevelLessons * 0.6));
  const readingLearned = Math.min(readingTarget, Math.round(completedLessonsCount * 0.6));
  const readingScore = Math.min(
    100,
    Math.round((readingLearned / readingTarget) * 70 + (overallAccuracy ? overallAccuracy * 0.3 : 15)),
  );

  // Skill 4: Nghe hiểu (Choukai)
  const listeningTarget = Math.max(5, Math.round(totalLevelLessons * 0.5));
  const listeningLearned = Math.min(listeningTarget, Math.round(completedLessonsCount * 0.5));
  const listeningScore = Math.min(
    100,
    Math.round((listeningLearned / listeningTarget) * 70 + (overallAccuracy ? overallAccuracy * 0.3 : 15)),
  );

  // Skill 5: Ứng dụng thực chiến & Viết (Practical & Writing)
  const practicalTarget = Math.max(5, Math.round(totalLevelLessons * 0.5));
  const practicalLearned = Math.min(
    practicalTarget,
    Math.round(completedLessonsCount * 0.4 + (kanaMasteredCount > 20 ? 2 : 0)),
  );
  const practicalScore = Math.min(
    100,
    Math.round((practicalLearned / practicalTarget) * 75 + (user.currentStreak > 3 ? 25 : user.currentStreak * 8)),
  );

  const getTier = (score: number) => {
    if (score >= 80) return "MASTERED";
    if (score >= 60) return "GOOD";
    if (score >= 40) return "DEVELOPING";
    return "NEEDS_WORK";
  };

  const skills: SkillProficiencyItem[] = [
    {
      key: "VOCAB",
      label: "Từ vựng & Hán tự",
      jpLabel: "語彙・漢字",
      glyph: "語",
      score: vocabScore,
      levelStatus: getTier(vocabScore),
      learnedCount: vocabLearnedCount,
      totalTarget: safeVocabTotal,
      accuracyRate: overallAccuracy,
      assessmentNote:
        vocabScore >= 75
          ? `Vốn từ vựng ${userLevel} của bạn phong phú, khả năng ghi nhớ thẻ SRS tốt.`
          : `Cần nạp thêm từ vựng cốt lõi ${userLevel} và củng cố các thẻ có repetitions thấp.`,
      recommendation: "Lưu thêm 5-10 từ vựng mỗi ngày vào phòng ôn tập SRS SM-2.",
      actionHref: "/app/vocabulary",
      actionLabel: "Học từ vựng mới",
    },
    {
      key: "GRAMMAR",
      label: "Ngữ pháp ngữ cảnh",
      jpLabel: "文法・構造",
      glyph: "文",
      score: grammarScore,
      levelStatus: getTier(grammarScore),
      learnedCount: grammarLearnedCount,
      totalTarget: safeGrammarTotal,
      accuracyRate: overallAccuracy,
      assessmentNote:
        grammarScore >= 75
          ? `Nắm vững các mẫu câu chính của ${userLevel}, chia thể động từ trôi chảy.`
          : `Một số cấu trúc chia thể và trợ từ cần làm bài tập củng cố thêm.`,
      recommendation: "Ôn lại các bài có điểm dưới 75% để thành thạo ngữ cảnh sử dụng.",
      actionHref: "/app/grammar",
      actionLabel: "Tra cứu ngữ pháp",
    },
    {
      key: "READING",
      label: "Đọc hiểu",
      jpLabel: "読解・案内",
      glyph: "読",
      score: readingScore,
      levelStatus: getTier(readingScore),
      learnedCount: readingLearned,
      totalTarget: readingTarget,
      accuracyRate: overallAccuracy,
      assessmentNote:
        readingScore >= 70
          ? "Đọc biển báo, thực đơn và đoạn văn ngắn nhanh chóng, bắt ý chính tốt."
          : "Tập trung phân tích câu dài có trợ từ phức tạp và từ nối.",
      recommendation: "Luyện đọc đoạn văn ngắn hàng ngày trong các bài học thực tế.",
      actionHref: "/app/practice",
      actionLabel: "Luyện đọc bài học",
    },
    {
      key: "LISTENING",
      label: "Nghe hiểu & Phản xạ",
      jpLabel: "聴解・会話",
      glyph: "耳",
      score: listeningScore,
      levelStatus: getTier(listeningScore),
      learnedCount: listeningLearned,
      totalTarget: listeningTarget,
      accuracyRate: overallAccuracy,
      assessmentNote:
        listeningScore >= 70
          ? "Phản xạ nghe tại ga tàu, konbini và đối thoại AI khá tự nhiên."
          : "Cần luyện nghe nhiều hơn với tốc độ tự nhiên của người bản xứ.",
      recommendation: "Trò chuyện với AI Kaiwa Sensei 10 phút mỗi ngày để tăng phản xạ.",
      actionHref: "/app/sensei",
      actionLabel: "Luyện nói với AI Sensei",
    },
    {
      key: "PRACTICAL",
      label: "Thực chiến & Viết",
      jpLabel: "実践・記述",
      glyph: "戦",
      score: practicalScore,
      levelStatus: getTier(practicalScore),
      learnedCount: practicalLearned,
      totalTarget: practicalTarget,
      accuracyRate: overallAccuracy,
      assessmentNote:
        practicalScore >= 70
          ? "Xử lý tốt các tình huống du lịch, mua sắm và sinh tồn thực tế."
          : "Tham gia Survival Mode để kiểm tra phản xạ dưới áp lực thời gian.",
      recommendation: "Thử sức với chế độ Survival Mode và viết câu hoàn chỉnh.",
      actionHref: "/app/survival",
      actionLabel: "Vào Survival Mode",
    },
  ];

  // 6. Overall JLPT Readiness Score (Weighted Index)
  const averageSkillScore = Math.round(
    skills.reduce((acc, s) => acc + s.score, 0) / skills.length,
  );
  const readinessScore = Math.min(
    100,
    Math.round(
      pathPercentComplete * 0.35 +
        averageSkillScore * 0.35 +
        (retentionRate ? retentionRate * 0.15 : 12) +
        (overallAccuracy ? overallAccuracy * 0.15 : 10),
    ),
  );

  let readinessTier: { label: string; color: string; tag: string; desc: string };
  if (readinessScore >= 85) {
    readinessTier = {
      label: "Sẵn sàng thi đỗ JLPT / Vượt cấp",
      tag: "Sẵn sàng đỗ",
      color: "rose",
      desc: `Xuất sắc! Bạn đã làm chủ hầu hết kiến thức chuẩn JLPT ${userLevel}. Bạn hoàn toàn có thể tự tin thi thật hoặc thi vượt cấp lên trình độ cao hơn.`,
    };
  } else if (readinessScore >= 70) {
    readinessTier = {
      label: "Tiệm cận chuẩn JLPT — Vững 4 kỹ năng",
      tag: "Tiệm cận đạt chuẩn",
      color: "emerald",
      desc: `Năng lực của bạn đang rất gần ngưỡng thi đỗ JLPT ${userLevel}. Hãy làm thêm các đề thi thử tổng hợp và củng cố các thẻ SRS đến hạn.`,
    };
  } else if (readinessScore >= 40) {
    readinessTier = {
      label: "Tăng tốc — Củng cố kiến thức",
      tag: "Đang tiến bộ tốt",
      color: "blue",
      desc: `Bạn đang tích lũy tốt vốn từ vựng và ngữ pháp trọng điểm. Duy trì nhịp học đều đặn mỗi ngày để bước vào vùng tiệm cận chuẩn JLPT.`,
    };
  } else {
    readinessTier = {
      label: "Khởi động — Xây dựng nền tảng",
      tag: "Cần tăng tốc",
      color: "amber",
      desc: `Bạn đang ở giai đoạn khởi động nền tảng bảng chữ cái và từ vựng sơ cấp. Hãy kiên trì học 15 phút mỗi ngày theo đúng lộ trình cá nhân.`,
    };
  }

  // Est weeks / days to finish target level
  const remainingModules = Math.max(1, totalPathModules - completedLessonsCount);
  const estWeeksToTarget = Math.max(1, Math.ceil(remainingModules / Math.max(1, path.modulesPerWeek)));
  const estDaysToTarget = estWeeksToTarget * 7;

  // 7. Lifecycle Stages Progress mapping
  const lifecycleStages: LifecycleProgressStage[] = LEARNING_LIFECYCLE_STAGES.map((st) => {
    let status: "COMPLETED" | "ACTIVE" | "PENDING" = "PENDING";
    let metricLabel: string | undefined;
    let metricValue: string | undefined;

    if (st.step === 1) {
      status = "COMPLETED";
      metricLabel = "Trạng thái";
      metricValue = "Đã phân loại";
    } else if (st.step === 2) {
      status = "COMPLETED";
      metricLabel = "Trình độ";
      metricValue = userLevel;
    } else if (st.step === 3) {
      status = "COMPLETED";
      metricLabel = "Lộ trình";
      metricValue = `${totalPathModules} bài`;
    } else if (st.step === 4) {
      status = vocabLearnedCount > 0 ? "COMPLETED" : "ACTIVE";
      metricLabel = "Từ & Ngữ pháp";
      metricValue = `${vocabLearnedCount + grammarLearnedCount} mục`;
    } else if (st.step === 5) {
      status = completedLessonsCount > 0 ? "COMPLETED" : "ACTIVE";
      metricLabel = "Bài hoàn thành";
      metricValue = `${completedLessonsCount}/${totalPathModules}`;
    } else if (st.step === 6) {
      status = completedLessonsCount >= 5 ? "COMPLETED" : "ACTIVE";
      metricLabel = "Độ chính xác";
      metricValue = overallAccuracy != null ? `${overallAccuracy}%` : "—";
    } else if (st.step === 7) {
      status = dueSrsCount === 0 && allReviewItems.length > 0 ? "COMPLETED" : "ACTIVE";
      metricLabel = "Thẻ đến hạn";
      metricValue = `${dueSrsCount} thẻ`;
    } else if (st.step === 8) {
      status = "ACTIVE"; // Current analytics evaluation page
      metricLabel = "Độ sẵn sàng";
      metricValue = `${readinessScore}%`;
    }

    return {
      ...st,
      status,
      metricLabel,
      metricValue,
    };
  });

  // 8. Remediation Plan
  const remediationItems = buildRemediationPlan({
    dueSrsCount,
    weakSrsCount,
    lowScoreLessons: userLowLessons
      .filter((lp) => typeof lp.score === "number")
      .map((lp) => ({
        slug: lp.lesson.slug,
        title: lp.lesson.title,
        score: lp.score ?? 0,
      })),
  });

  // 9. Shinkansen Journey Progress
  const totalStations = journeyLocations.length || 7;
  const unlockedStations = Math.min(
    totalStations,
    userJourneyProgress.filter((j) => j.status === "UNLOCKED" || j.status === "COMPLETED" || j.isStamped).length || 1,
  );
  const currentStation = journeyLocations[Math.min(unlockedStations - 1, totalStations - 1)] || {
    name: "Tokyo",
    nameJa: "東京",
  };
  const journeyProgressPercent = Math.min(100, Math.round((unlockedStations / totalStations) * 100));

  const displayName = user.profile?.displayName || user.name || session?.user?.name || "Học viên";

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-sumi-950">
      <JapanBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <AppNav
          userName={displayName}
          userImage={user.profile?.avatar || user.image}
          userLevel={user.level}
          userXP={user.totalXP}
          streak={user.currentStreak}
          levelLabel={userLevel}
        />

        <main className="mt-4 sm:mt-6">
          <AnalyticsClient
            user={{
              displayName,
              level: user.level,
              currentLevelXP: levelInfo.currentLevelXP,
              nextLevelXP: levelInfo.nextLevelXP,
              levelProgressPercent,
              totalXP: user.totalXP,
              currentStreak: user.currentStreak,
              longestStreak: user.longestStreak,
              learningLevel: userLevel,
              learningGoal: user.learningGoal,
              focusSkill: user.focusSkill,
              learningStyle: user.learningStyle,
              dailyGoalMinutes: user.dailyGoalMinutes,
            }}
            readinessScore={readinessScore}
            readinessTier={readinessTier}
            estDaysToTarget={estDaysToTarget}
            estWeeksToTarget={estWeeksToTarget}
            learningVelocity={{
              dailyXpAverage,
              weeklyLessonsPace,
              adherencePercent,
            }}
            skills={skills}
            lifecycleStages={lifecycleStages}
            memoryRetention={{
              totalItems: allReviewItems.length,
              masteredCount: masteredSrsCount,
              reviewingCount: reviewingSrsCount,
              learningCount: learningSrsCount,
              dueCount: dueSrsCount,
              retentionRate,
              retentionTier,
            }}
            pathSummary={{
              totalModules: totalPathModules,
              completedModules: completedLessonsCount,
              percentComplete: pathPercentComplete,
              currentModuleTitle: currentModule?.title,
              currentModuleHref: currentModule?.target,
            }}
            remediationItems={remediationItems}
            journeyProgress={{
              unlockedStations,
              totalStations,
              currentStationName: `${currentStation.name} (${currentStation.nameJa})`,
              progressPercent: journeyProgressPercent,
            }}
            achievements={{
              unlocked: userAchievementsCount,
              total: achievementsCount,
            }}
          />
        </main>
      </div>
    </div>
  );
}
