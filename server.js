const express = require("express");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.use(express.json());

// Serve Ledger frontend
app.use(express.static(__dirname));

// AI budget route
app.post("/api/analyze", async (req, res) => {
    try {
        const {
            country,
            city,
            start,
            end,
            income,
            money,
            family,
            suggestion
        } = req.body;

        if (!country || !city || !start || !end) {
            return res.status(400).json({
                error: "Country, city, start date and end date are required."
            });
        }

        const familyData = family || {};

        const infants = Number(familyData.infants) || 0;
        const toddlers = Number(familyData.toddlers) || 0;
        const kids = Number(familyData.kids) || 0;
        const teenagers = Number(familyData.teenagers) || 0;
        const adults = Number(familyData.adults) || 0;
        const olderAdults = Number(familyData.olderAdults) || 0;

        const totalFamilyMembers =
            infants +
            toddlers +
            kids +
            teenagers +
            adults +
            olderAdults;

        const availableMoney = money || income || "Not provided";

        const prompt = `
You are Ledger, an AI personal budgeting assistant.

Create a realistic, location-specific personal budget.

USER LOCATION
Country: ${country}
City: ${city}

BUDGET PERIOD
Start date: ${start}
End date: ${end}

AVAILABLE MONEY
${availableMoney}

FAMILY
Infants: ${infants}
Toddlers: ${toddlers}
Kids: ${kids}
Teenagers: ${teenagers}
Adults: ${adults}
Older Adults: ${olderAdults}
Total family members: ${totalFamilyMembers}

USER SUGGESTION
${suggestion || "No additional suggestion provided."}

IMPORTANT LOCATION ANALYSIS

Use the specific CITY and COUNTRY to make the budget realistic.

Consider:

- Typical housing costs
- Local transportation costs
- Local healthcare costs
- Local education costs
- Local entertainment costs
- Local shopping costs
- General cost of living
- Local currency and purchasing power

Do NOT claim that you performed Google Search or accessed live prices.

Use your existing knowledge of the country and city to provide reasonable estimates.

FOOD

Consider realistic spending for the family size and location, including common staples such as:

- Flour / wheat flour
- Rice
- Lentils / daal
- Sugar
- Cooking oil
- Milk
- Eggs
- Chicken
- Potatoes
- Onions
- Tomatoes

UTILITIES

Consider realistic household costs for:

- Electricity
- Gas
- Water
- Other common household utilities

FAMILY NEEDS

Adjust the budget according to the family structure.

For example:

- Larger families generally need more food.
- Larger households generally use more utilities.
- Children and teenagers may require education-related spending.
- Infants and toddlers may require additional household spending.
- Available money must influence how realistic the allocations are.

IMPORTANT

Do not invent precise current prices.

Use reasonable estimates.

Return ONLY valid JSON.

Use exactly this structure:

{
  "currency": "ISO currency code",
  "total": 0,
  "categories": {
    "Food": 0,
    "Transport": 0,
    "Housing": 0,
    "Utilities": 0,
    "Health": 0,
    "Schooling / Education": 0,
    "Entertainment": 0,
    "Shopping": 0,
    "Other": 0
  },
  "economicSnapshot": "short explanation",
  "tradeOffs": [
    "trade-off 1",
    "trade-off 2",
    "trade-off 3"
  ],
  "insight": "short personalized recommendation",
  "metrics": {
    "inflation": 0,
    "growth": 0,
    "unemployment": 0,
    "gdpPerCapita": 0
  }
}

Each category value MUST be a percentage number between 0 and 100.

All category values combined MUST add up to exactly 100.

Do not include markdown.
Do not include anything outside the JSON.
`;

        // Groq AI request
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3
        });

        let text = response.choices[0].message.content;

        // Remove accidental markdown code fences
        text = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const data = JSON.parse(text);

        // Make sure categories exist
        if (!data.categories) {
            throw new Error("AI response is missing categories.");
        }

        const requiredCategories = [
            "Food",
            "Transport",
            "Housing",
            "Utilities",
            "Health",
            "Schooling / Education",
            "Entertainment",
            "Shopping",
            "Other"
        ];

        // Add missing categories as zero
        for (const category of requiredCategories) {
            if (typeof data.categories[category] !== "number") {
                data.categories[category] = 0;
            }
        }

        // Ensure category percentages total exactly 100
        let totalPercentage = requiredCategories.reduce(
            (sum, category) => sum + Number(data.categories[category] || 0),
            0
        );

        if (totalPercentage !== 100) {
            const difference = 100 - totalPercentage;

            data.categories["Other"] =
                Number(data.categories["Other"] || 0) + difference;
        }

        // Prevent invalid negative percentages
        for (const category of requiredCategories) {
            if (data.categories[category] < 0) {
                data.categories[category] = 0;
            }

            if (data.categories[category] > 100) {
                data.categories[category] = 100;
            }
        }

        res.json(data);

    } catch (error) {
        console.error("Ledger AI error:", error);

        res.status(500).json({
            error: "Failed to generate the budget."
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ledger backend running on port ${PORT}`);
});