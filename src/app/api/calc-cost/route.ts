import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // Pricing Constants
  const INPUT_TOKEN_RATE = 0.005; 
  const OUTPUT_TOKEN_RATE = 0.015;

  try {
    // Fetch the latest 5 articles
    const articles = await prisma.generated_articles.findMany({
      orderBy: {
        created_at: "desc", // Assuming you have a `created_at` column to sort by latest
      },
    });

    // Calculate and update total cost for each article
    for (const article of articles) {
      const { id, prompt_tokens, completion_tokens } = article;

      // Calculate costs
      const inputCost = (prompt_tokens! / 1000) * INPUT_TOKEN_RATE;
      const outputCost = (completion_tokens! / 1000) * OUTPUT_TOKEN_RATE;
      const totalCost = inputCost + outputCost;
      console.log(inputCost, outputCost, totalCost);
      // Update the total_cost column in the database
      await prisma.generated_articles.update({
        where: { id },
        data: { total_cost: totalCost },
      });
    }

    return NextResponse.json({
      message: "Costs calculated and updated successfully!",
    });
  } catch (error) {
    console.error("Error updating costs:", error);
    return NextResponse.json(
      { error: "Failed to calculate and update costs." },
      { status: 500 }
    );
  }
}
