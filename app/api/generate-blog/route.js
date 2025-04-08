import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API,
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional blog writer. Generate a blog post based on the given prompt.
          Write a detailed, SEO-optimized blog article of at least 2200 words for Nexy, a power bank rental service based in Vancouver, Canada (website: nexy.ca). The article should be informative, engaging, and written in a professional but friendly tone.
                The topic is: ${prompt}
                The article should highlight the benefits of using Nexy’s power bank rental stations, including convenience, accessibility, and eco-friendliness. Mention how Nexy works (rent a power bank, return it at any station), and include use cases for events, travelers, students, and businesses.
                Make sure to naturally include relevant SEO keywords such as:
                "power bank rental Vancouver"   
                "portable phone charger"
                "rent a power bank"
                "charging station for events"
                "Nexy power bank"
                "mobile charging solutions"
                Use subheadings (H2, H3), bulleted lists, and a clear introduction and conclusion. Include a call to action at the end, inviting readers to visit nexy.ca or try a Nexy station near them.
          The response should be in JSON format with the following structure:
          {
            "title": "Blog post title",
            "description": "A brief description of the blog post",
            "content": "The main content of the blog post in HTML format with proper paragraphs and formatting",
            "category": "A relevant category for the blog post"
          }`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response);

    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate content" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
