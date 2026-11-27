// The only file that talks to the LLM provider.
// The provider, the model and the key come from .env:
//   process.env.LLM_BASE_URL, process.env.LLM_MODEL, process.env.LLM_API_KEY

// TODO P4: make a constant SYSTEM here: the rules for every answer (tone, length, format).
//          Then send it as the first message, before the user's message, in ask().
const SYSTEM = `
답변은 존댓말(해요체)로 답한다.
줄바꿈 없는 한 문단으로, 세 문장 이내로 답한다.
목록, 제목, 굵은 글씨, 코드 블록 등 마크다운 형식을 사용하지 않는다.
`;

const SYSTEM_JSON = `
답변은 JSON 형식으로만 답한다.
키는 정확히 "sentiment", "score", "summary" 세 개만 사용한다.
sentiment는 "positive", "negative", "neutral" 중 하나의 문자열이어야 한다.
score는 1~5 사이의 정수여야 한다.
summary는 한 문장으로 된 문자열이어야 한다.
`;

// ask("a question")  ->  the model's answer, as a string
export async function ask(question) {
  // TODO P3: write this function (see problems/P3_ask.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// chat([{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...])
//   ->  the model's next answer, as a string
export async function chat(history) {
  // TODO P5: write this function (see problems/P5_chat.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        ...history,
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// analyze("a review")  ->  an object, not a sentence:
//   { sentiment: "positive" | "negative" | "neutral", score: 1..5, summary: "one short sentence" }
export async function analyze(text) {
  // TODO P6: write this function (see problems/P6_json.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_JSON },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM: HTTP ${res.status}`);
  }

  const data = await res.json();
  const { sentiment, score, summary } = JSON.parse(data.choices[0].message.content);
  if (
    !["positive", "negative", "neutral"].includes(sentiment) ||
    !Number.isInteger(score) ||
    score < 1 || score > 5 ||
    typeof summary !== "string") {
    throw new Error("LLM: the answer has the wrong shape");
  }

  return { sentiment, score, summary };
}
