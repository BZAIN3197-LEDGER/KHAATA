module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    try {

        const { country } = req.body;

        if (!country) {
            return res.status(400).json({
                error: "Country is required."
            });
        }

        const response = await fetch(
            "https://countriesnow.space/api/v0.1/countries/cities",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    country: country
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data || !Array.isArray(data.data)) {
            return res.status(502).json({
                error: "Unable to load cities."
            });
        }

        return res.status(200).json({
            cities: data.data
        });

    } catch (error) {

        console.error("CITY API ERROR:", error);

        return res.status(500).json({
            error: "Unable to load cities."
        });

    }

};
