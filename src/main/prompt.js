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
    answerLanguage === 'es'
      ? 'Responde SIEMPRE en Español (Spanish). Prohibido responder en chino o cualquier otro idioma.'
      : answerLanguage === 'zh'
        ? '请用中文作答。'
        : answerLanguage === 'en'
          ? 'Answer in English.'
          : 'Responde en el mismo idioma de la pregunta (si preguntan en español, responde en español). Do not use Chinese unless the question is in Chinese.';

  const lines = [
    'You are the candidate participating in a live job interview. Eres el candidato en la entrevista.',
    'Responde en primera persona, con tono profesional, natural y directo como si estuvieras hablando en vivo.',
    'Requisitos:',
    `1) 严格控制在 ${maxChars} 字符以内（硬性上限），目标约 300 字、宁可更短。Estructura concisa: primera línea conclusión directa, luego 2-3 puntos clave con viñetas ("- ").`,
    '2) Texto plano sin Markdown pesado ni títulos innecesarios. Sin rodeos ni saludos.',
    '3) Comienza directamente con la respuesta. No repitas la pregunta ni pongas "Mi respuesta:".',
    '4) Usa los datos de la hoja de vida / contexto si aplican; si no, responde con tu conocimiento técnico.',
    '5) El diálogo proviene de transcripción de voz (puede tener pequeños errores de audio). Identifica la pregunta central y responde a ella.',
    `6) Regla de Idioma: ${langRule}`,
    '7) Prohibido responder en caracteres chinos salvo que el idioma configurado sea chino (zh).',
  ];

  if (jobDescription && jobDescription.trim()) {
    lines.push(
      '',
      '================ 目标岗位 JD（请据此定制回答：对齐岗位要求、技术栈与关键词，突出匹配点）================',
      jobDescription.trim().slice(0, 6000),
    );
  }
  if (profile && profile.trim()) {
    lines.push(
      '',
      '================ 本次面试背景与作答风格（最高优先级，务必遵循） ================',
      profile.trim(),
    );
  }
  const systemInstruction = lines.join('\n');

  const parts = [];
  if (context) parts.push(`【可参考的个人资料 / 知识库 / Knowledge Context】\n${context}\n`);

  const q = (question || '').trim();
  if (q) {
    if (transcript) {
      parts.push(
        `【最近约15轮面试对话历史 / Transcript Context】\n${transcript}\n`,
      );
    }
    parts.push(`【需要回答的问题 / Question to Answer】\n${q}`);
    parts.push('Por favor responde directamente a la pregunta anterior en el idioma correspondiente:');
    parts.push('\nTu respuesta / Your Answer:');
  } else {
    parts.push(
      `【最近约15轮面试对话历史 / Transcript Context】\n${transcript || '(Sin diálogo aún)'}\n`,
    );
    parts.push(
      'Identifica en el diálogo la pregunta central que está haciendo el entrevistador (最新/当前) y responde directamente.',
    );
    parts.push(
      'Sin prefijos, empieza directamente con tu respuesta.',
    );
    parts.push('\nTu respuesta / Your Answer:');
  }

  return { systemInstruction, userText: parts.join('\n') };
}

// 问题提取（只看最近几轮）
const EXTRACTION_SYSTEM =
  "You clean up noisy live interview transcripts. The transcript may contain repeats, cross-talk, ASR errors and half-sentences. Identify the interviewer's CURRENT core question and rewrite it as ONE clean, complete question. Output ONLY that question — no prefix, no quotes, no explanation. Write it in the SAME language the interviewer is speaking (e.g., if Spanish, write in Spanish. Never output Chinese unless interviewer spoke Chinese).";

function buildExtractionUser(recentTranscript) {
  return `Recent turns:\n${recentTranscript}\n\nThe interviewer's current core question is:`;
}

module.exports = { buildPrompt, EXTRACTION_SYSTEM, buildExtractionUser };
