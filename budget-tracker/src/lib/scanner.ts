import { ScanResult } from "@/types"
import { CATEGORIES, CategoryId } from "@/lib/constants"

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""

export async function scanBankStatement(file: File): Promise<{
  results: ScanResult[]
  unknowns: ScanResult[]
}> {
  const base64 = await fileToBase64(file)
  const mimeType = file.type || "application/pdf"

  const categoryList = CATEGORIES.map((c) => `"${c.id}" (${c.label})`).join(", ")

  const prompt = `You are a bank statement parser. Extract ALL spending transactions from this bank statement PDF.

For each transaction, determine:
1. date (YYYY-MM-DD format)
2. amount (positive number in MYR)
3. desc (short merchant/description)
4. category: one of ${categoryList}
5. confidence: "high" if category is obvious, "medium" if reasonable guess, "low" if unsure

RULES:
- EXCLUDE transfers between own accounts (e.g. Wise to Maybank transfers, savings transfers)
- EXCLUDE credit card bill payments (paying off Amex, Mastercard etc)
- EXCLUDE tax payments (LHDN)
- EXCLUDE salary/income deposits
- INCLUDE all merchant purchases, food, transport, subscriptions, shopping etc
- For Grab transactions categorized as "Groceries" in Wise, these are likely food delivery (GrabFood) - categorize as "food"
- For Grab/Bolt ride transactions, categorize as "transport"
- Parking transactions = "transport"
- Coffee shops, restaurants, food courts = "food"
- KK Mart, 7-Eleven, Aeon = "groceries"
- Massage, spa, Watsons, LAC = "personal_care"
- Subscriptions, internet, phone bills = "bills"

Return ONLY a JSON array, no markdown, no explanation:
[{"date":"2026-02-01","amount":25.50,"desc":"Zus Coffee","category":"food","confidence":"high"}]`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

  // Clean up response - remove markdown fences if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  let parsed: ScanResult[]
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Failed to parse AI response")
  }

  // Validate categories
  const validIds = CATEGORIES.map((c) => c.id)
  parsed = parsed.map((r) => ({
    ...r,
    category: validIds.includes(r.category as CategoryId) ? r.category : ("other" as CategoryId),
  }))

  const results = parsed.filter((r) => r.confidence !== "low")
  const unknowns = parsed.filter((r) => r.confidence === "low")

  return { results, unknowns }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
