'use strict';

// 纯函数：构造作答 / 问题提取的提示词。无 Electron 依赖，便于单测。

function buildPrompt({
  question,
  transcript,
  context,
  answerLanguage,
  maxChars,
  profile,
  jobDescription,
}) {
  const langRule =
    answerLanguage === "es"
      ? "Responde SIEMPRE en Español (Spanish)."
      : answerLanguage === "en"
        ? "Answer in English."
        : answerLanguage === "zh"
          ? "请用中文作答。"
          : "AUTOMATIC LANGUAGE DETECTION (English / Spanish): Detect the language of the question. If the question/interview is in English, answer in English. If the question/interview is in Spanish, answer in Spanish. DO NOT use Chinese or other languages.";

  const lines = [
    "You are the candidate in a live technical job interview. Eres el candidato en la entrevista de trabajo.",
    "Speak in the first person with a professional, confident, and direct tone, as if speaking aloud in an interview.",
    "Rules:",
    `1) 严格控制在 ${maxChars} 字符以内（硬性上限），目标约 300 字、宁可更短。Structure: Start with a direct 1-sentence conclusion/verdict, followed by 2-3 concise bullet points ("- ") with key tools, metrics, or trade-offs.`,
    "2) Plain text only. No heavy Markdown, no asterisks, no unnecessary headings, no conversational fluff.",
    "3) Jump straight into the answer. Do not repeat the question or add \"My answer:\".",
    "4) Ground answers in the provided knowledge base / resume when relevant; otherwise use your senior engineering knowledge.",
    "5) The transcript comes from live speech-to-text. Tolerate minor acoustic typos and identify the core question.",
    `6) Language Rule: ${langRule}`,
    "7) Absolute Language Rule: Never respond in Chinese characters unless the interview is in Chinese.",
  ];

  if (jobDescription && jobDescription.trim()) {
    lines.push(
      "",
      "================ 目标岗位 JD / Job Description (Align your answer with these requirements) ================",
      jobDescription.trim().slice(0, 6000),
    );
  }
  if (profile && profile.trim()) {
    lines.push(
      "",
      "================ Candidate Profile & Style (Highest Priority) ================",
      profile.trim(),
    );
  }
  const systemInstruction = lines.join("\n");

  const parts = [];
  if (context) parts.push(`【可参考的个人资料 / Knowledge Base Context】\n${context}\n`);

  const q = (question || "").trim();
  if (q) {
    if (transcript) {
      parts.push(
        `【最近约15轮面试对话历史 / Conversation History】\n${transcript}\n`,
      );
    }
    parts.push(`【Question to Answer】\n${q}`);
    parts.push("Respond directly to this question in the appropriate language (English or Spanish):");
    parts.push("\nAnswer / Respuesta:");
  } else {
    parts.push(
      `【最近约15轮面试对话历史 / Conversation History】\n${transcript || "(No conversation yet)"}\n`,
    );
    parts.push(
      "Identify the interviewer core question (最新/当前) from the dialogue and answer it directly in the same language (English or Spanish).",
    );
    parts.push(
      "Start immediately with your answer.",
    );
    parts.push("\nAnswer / Respuesta:");
  }

  return { systemInstruction, userText: parts.join("\n") };
}

// 问题提取（只看最近几轮）
const EXTRACTION_SYSTEM =
  "You clean up noisy live interview transcripts. Identify the interviewer CURRENT core question and rewrite it as ONE clean question. Output ONLY that question — no prefix, no quotes. Write it in the SAME language the interviewer is speaking (English or Spanish). Never output Chinese.";

function buildExtractionUser(recentTranscript) {
  return `Recent turns:\n${recentTranscript}\n\nThe interviewer current core question is:`;
}

module.exports = { buildPrompt, EXTRACTION_SYSTEM, buildExtractionUser };
