import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT_EN = `You are InveStar AI — a 24/7 global financial analyst on Telegram. Keep answers concise (under 2000 chars) and use markdown formatting.

You cover ALL global markets: US (NYSE, NASDAQ), European (FTSE, DAX), Asian (Nikkei, SENSEX), Bangladesh (DSE, Sanchaypatra), crypto, forex, commodities, ETFs, bonds.

You will be given real-time web search results before each question. USE THEM as your primary data source for prices, rates, and news. Cite sources when possible.

Rules:
- Be direct and concise — this is Telegram, not a report
- Use bullet points and bold for key data
- Prioritize the web search data over your training data for prices/rates
- Always add: "_Not financial advice_"
- Respond in English`;

const SYSTEM_PROMPT_BN = `আপনি InveStar AI — টেলিগ্রামে ২৪/৭ গ্লোবাল ফাইন্যান্সিয়াল অ্যানালিস্ট। উত্তর সংক্ষেপে দিন (২০০০ অক্ষরের মধ্যে) এবং মার্কডাউন ফরম্যাটিং ব্যবহার করুন।

আপনি সব গ্লোবাল মার্কেট কভার করেন: US (NYSE, NASDAQ), European (FTSE, DAX), Asian (Nikkei, SENSEX), বাংলাদেশ (DSE, সঞ্চয়পত্র), ক্রিপ্টো, ফরেক্স, কমোডিটি, ETF, বন্ড।

আপনাকে প্রতিটি প্রশ্নের আগে রিয়েল-টাইম ওয়েব সার্চ ফলাফল দেওয়া হবে। দাম, রেট এবং খবরের জন্য এগুলো প্রাথমিক ডেটা সোর্স হিসেবে ব্যবহার করুন।

নিয়ম:
- সরাসরি ও সংক্ষেপে উত্তর দিন — এটা টেলিগ্রাম
- বুলেট পয়েন্ট ও বোল্ড ব্যবহার করুন
- দাম/রেটের জন্য ওয়েব সার্চ ডেটা অগ্রাধিকার দিন
- সবসময় যোগ করুন: "_এটি আর্থিক পরামর্শ নয়_"
- বাংলায় উত্তর দিন`;

Deno.serve(async () => {
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 55_000;
  const MIN_REMAINING_MS = 5_000;

  const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
  if (!AI_GATEWAY_API_KEY) throw new Error("AI gateway API key is not configured");

  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;

  // Read initial offset
  const { data: state, error: stateErr } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500 });
  }

  let currentOffset = state.update_offset;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ["message"],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 502 });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    // Process each message
    for (const update of updates) {
      if (!update.message?.text) continue;

      const chatId = update.message.chat.id;
      const userText = update.message.text.trim();
      const userName = update.message.from?.first_name || "User";

      // Handle /start
      if (userText === "/start") {
        await sendTelegramMessage(chatId,
          `আসসালামু আলাইকুম / Good day, ${userName}! 👋\n\nI'm *InveStar AI* — your 24/7 global financial analyst.\n\n🇧🇩 *বাংলায় জিজ্ঞেস করুন* — বাংলায় উত্তর পাবেন\n🇬🇧 *Ask in English* — get answers in English\n\n📈 US, European & Asian stocks\n🪙 Crypto (BTC, ETH, XLM)\n💱 Forex & commodities\n🇧🇩 DSE stocks & Sanchaypatra\n\nUse /lang to switch language\n\n_Type any question to start!_`,
          AI_GATEWAY_API_KEY, TELEGRAM_API_KEY
        );
        continue;
      }

      // Handle /lang command
      if (userText === "/lang") {
        // Get current lang
        const { data: pref } = await supabase
          .from("telegram_chat_prefs")
          .select("lang")
          .eq("chat_id", chatId)
          .single();

        const currentLang = pref?.lang || "en";
        await sendTelegramMessage(chatId,
          `🌐 *Language / ভাষা*\n\nCurrent: ${currentLang === "bn" ? "🇧🇩 বাংলা" : "🇬🇧 English"}\n\nChoose:\n/lang\\_en — 🇬🇧 English\n/lang\\_bn — 🇧🇩 বাংলা`,
          AI_GATEWAY_API_KEY, TELEGRAM_API_KEY
        );
        continue;
      }

      if (userText === "/lang_en" || userText === "/lang_bn") {
        const newLang = userText === "/lang_bn" ? "bn" : "en";
        await supabase
          .from("telegram_chat_prefs")
          .upsert({ chat_id: chatId, lang: newLang, updated_at: new Date().toISOString() }, { onConflict: "chat_id" });

        const msg = newLang === "bn"
          ? "✅ ভাষা বাংলায় পরিবর্তন করা হয়েছে। এখন থেকে বাংলায় উত্তর পাবেন!"
          : "✅ Language switched to English. You'll now get responses in English!";
        await sendTelegramMessage(chatId, msg, AI_GATEWAY_API_KEY, TELEGRAM_API_KEY);
        continue;
      }

      // Get user's language preference (fire-and-forget style, cached inline)
      let userLang = "en";
      const { data: langPref } = await supabase
        .from("telegram_chat_prefs")
        .select("lang")
        .eq("chat_id", chatId)
        .single();
      if (langPref?.lang) userLang = langPref.lang;

      const systemPrompt = userLang === "bn" ? SYSTEM_PROMPT_BN : SYSTEM_PROMPT_EN;

      try {
        console.log(`Processing message from ${userName} (${chatId}): ${userText}`);

        // Send "typing..." immediately so user sees activity
        await sendChatAction(chatId, "typing", AI_GATEWAY_API_KEY, TELEGRAM_API_KEY);

        // Search web for real-time data via Firecrawl (with 8s timeout)
        let searchContext = "";
        const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
        if (firecrawlKey) {
          try {
            const abortCtrl = new AbortController();
            const searchTimeout = setTimeout(() => abortCtrl.abort(), 8000);
            const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${firecrawlKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ query: userText, limit: 3 }),
              signal: abortCtrl.signal,
            });
            clearTimeout(searchTimeout);
            if (searchResp.ok) {
              const searchData = await searchResp.json();
              const results = (searchData.data || []).map((r: any) =>
                `**${r.title}** (${r.url})\n${r.description || r.markdown?.substring(0, 300) || ""}`
              ).join("\n\n");
              if (results) {
                searchContext = `\n\n--- WEB SEARCH RESULTS ---\n${results}\n--- END ---`;
              }
              console.log(`Firecrawl returned ${searchData.data?.length || 0} results`);
            } else {
              console.error("Firecrawl error:", searchResp.status, await searchResp.text());
            }
          } catch (e) {
            console.error("Firecrawl search error (timeout or network):", e instanceof Error ? e.message : e);
          }
        }

        // Refresh typing indicator after search
        await sendChatAction(chatId, "typing", AI_GATEWAY_API_KEY, TELEGRAM_API_KEY);

        // Call AI with search context
        console.log("Calling AI gateway...");
        const aiResp = await fetch(AI_GATEWAY_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userText + searchContext },
            ],
            stream: false,
            max_tokens: 1500,
          }),
        });

        if (!aiResp.ok) {
          const errBody = await aiResp.text();
          console.error("AI error:", aiResp.status, errBody);
          await sendTelegramMessage(chatId, "⚠️ Sorry, I'm having trouble right now. Please try again.", AI_GATEWAY_API_KEY, TELEGRAM_API_KEY);
          continue;
        }

        const aiData = await aiResp.json();
        const reply = aiData.choices?.[0]?.message?.content;
        console.log("AI reply length:", reply?.length || 0);

        if (reply) {
          const cleanReply = sanitizeForTelegram(reply);
          const chunks = splitMessage(cleanReply, 4000);
          for (const chunk of chunks) {
            const sendResult = await sendTelegramMessage(chatId, chunk, AI_GATEWAY_API_KEY, TELEGRAM_API_KEY);
            console.log("Send message result:", sendResult?.ok ? "success" : "failed");
          }
        } else {
          console.error("No AI reply content. Full response:", JSON.stringify(aiData));
          await sendTelegramMessage(chatId, "⚠️ I couldn't generate a response. Please try again.", AI_GATEWAY_API_KEY, TELEGRAM_API_KEY);
        }
      } catch (e) {
        console.error("Error processing message:", e);
        await sendTelegramMessage(chatId, "⚠️ An error occurred. Please try again.", AI_GATEWAY_API_KEY, TELEGRAM_API_KEY);
      }
    }

    // Store messages
    const rows = updates
      .filter((u: any) => u.message)
      .map((u: any) => ({
        update_id: u.update_id,
        chat_id: u.message.chat.id,
        text: u.message.text ?? null,
        raw_update: u,
      }));

    if (rows.length > 0) {
      await supabase.from("telegram_messages").upsert(rows, { onConflict: "update_id" });
      totalProcessed += rows.length;
    }

    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    await supabase
      .from("telegram_bot_state")
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);
    currentOffset = newOffset;
  }

  return new Response(JSON.stringify({ ok: true, processed: totalProcessed }));
});

async function sendTelegramMessage(chatId: number, text: string, gatewayKey: string, telegramKey: string) {
  try {
    // Try with Markdown first
    let resp = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        "X-Connection-Api-Key": telegramKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    let data = await resp.json();

    // If Markdown parsing fails, retry as plain text
    if (!resp.ok && data?.description?.includes("can't parse entities")) {
      console.log("Markdown failed, retrying as plain text");
      resp = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gatewayKey}`,
          "X-Connection-Api-Key": telegramKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      data = await resp.json();
    }

    if (!resp.ok) {
      console.error("sendMessage failed:", resp.status, JSON.stringify(data));
    }
    return data;
  } catch (e) {
    console.error("sendMessage exception:", e);
    return { ok: false };
  }
}

async function sendChatAction(chatId: number, action: string, gatewayKey: string, telegramKey: string) {
  await fetch(`${GATEWAY_URL}/sendChatAction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx === -1) splitIdx = maxLen;
    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }
  return chunks;
}

function sanitizeForTelegram(text: string): string {
  // Convert markdown bullet lists (* item) to emoji bullets
  let sanitized = text.replace(/^\*\s+/gm, "• ");
  // Convert **bold** to *bold* (Telegram Markdown v1)
  sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, "*$1*");
  // Remove leftover triple asterisks
  sanitized = sanitized.replace(/\*{3,}/g, "*");
  return sanitized;
}
