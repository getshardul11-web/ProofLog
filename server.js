import fetch from "node-fetch";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/report", async (req, res) => {

  const logs = req.body.logs;

  const prompt = `
Analyze these logs and produce:
1. Summary
2. Key accomplishments
3. Insights
4. Suggestions

Logs:
${JSON.stringify(logs)}
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3",
      prompt: prompt,
      stream: false
    })
  });

  const data = await response.json();

  res.json({ report: data.response });

});

app.listen(4000, () => {
  console.log("AI server running on port 4000");
});
