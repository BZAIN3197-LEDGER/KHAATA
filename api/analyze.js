const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

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
You are Khaata, an AI personal budgeting assistant.

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

Consider realistic spending for the family size and location, including:
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

Adjust the budget according to the family structure.

Available money must influence how realistic the allocations are.

Do not invent precise current prices.

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
  "overview": "short explanation of the overall budget and financial situation",
"recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3"
],
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

        text = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const data = JSON.parse(text);

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

        for (const category of requiredCategories) {
            if (typeof data.categories[category] !== "number") {
                data.categories[category] = 0;
            }
        }

        let totalPercentage = requiredCategories.reduce(
            (sum, category) =>
                sum + Number(data.categories[category] || 0),
            0
        );

        if (totalPercentage !== 100) {
            const difference = 100 - totalPercentage;

            data.categories["Other"] =
                Number(data.categories["Other"] || 0) + difference;
        }

        for (const category of requiredCategories) {
            if (data.categories[category] < 0) {
                data.categories[category] = 0;
            }

            if (data.categories[category] > 100) {
                data.categories[category] = 100;
            }
        }

        res.status(200).json(data);

    } catch (error) {
        console.error("Khaata AI error:", error);

        res.status(500).json({
            error: "Failed to generate the budget."
        });
    }
};
