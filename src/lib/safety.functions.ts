import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PanicInput = z.object({ text: z.string().min(1).max(2000) });

/**
 * AI panic-likelihood classifier.
 * Returns a 0..1 probability that the input text/transcript indicates distress.
 * Uses Lovable AI Gateway with a small free-tier model.
 */
export const classifyPanicText = createServerFn({ method: "POST" })
  .inputValidator((input) => PanicInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { score: 0, label: "unknown", error: "Missing LOVABLE_API_KEY" };
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                'You are a safety-signal classifier. Read a short message a user sent or spoke and respond with ONLY a JSON object of the form {"score": <0..1 number>, "label": "calm"|"unsure"|"distress"} indicating likelihood the speaker is in distress, fear, or being followed/harassed. No prose.',
            },
            { role: "user", content: data.text },
          ],
          temperature: 0,
        }),
      });

      if (res.status === 429) return { score: 0, label: "rate_limited", error: "Rate limit. Try later." };
      if (res.status === 402) return { score: 0, label: "no_credits", error: "AI credits exhausted." };
      if (!res.ok) return { score: 0, label: "error", error: `Gateway ${res.status}` };

      const json = await res.json();
      const raw: string = json?.choices?.[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return { score: 0, label: "unparsable" };
      const parsed = JSON.parse(match[0]) as { score?: number; label?: string };
      const score = Math.max(0, Math.min(1, Number(parsed.score ?? 0)));
      return { score, label: parsed.label ?? "unsure" };
    } catch (err) {
      console.error("[classifyPanicText]", err);
      return { score: 0, label: "error", error: "Network failure" };
    }
  });
