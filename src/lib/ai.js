export const summarizeNotes = async (text, onChunk) => {
  if (!text || text.trim().length < 10) {
    throw new Error(
      "Text is too short to summarize."
    );
  }

  try {
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(
        data.error || "Failed to summarize"
      );
    }

    if (!response.body) {
      throw new Error("No readable stream in response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullSummary = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.content) {
              fullSummary += data.content;
              if (onChunk) onChunk(data.content);
            }
          } catch (e) {
            // Ignore parse errors on partial chunks
            if (e.message !== "Unexpected end of JSON input" && !e.message.includes("Unexpected token")) {
              console.error("Parse error on chunk:", e);
            }
          }
        }
      }
    }

    return fullSummary;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

export const generateQuizFromSummary = async (text) => {
  if (!text || text.trim().length < 10) {
    throw new Error("Summary text is too short to generate a quiz.");
  }

  try {
    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate quiz");
    }

    return data.quiz;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};