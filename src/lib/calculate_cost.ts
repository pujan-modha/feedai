export const calculateCost = (
  completion_tokens: number,
  prompt_tokens: number
) => {
  const INPUT_TOKEN_RATE = 0.005;
  const OUTPUT_TOKEN_RATE = 0.015;
  const inputCost = (prompt_tokens! / 1000) * INPUT_TOKEN_RATE;
  const outputCost = (completion_tokens! / 1000) * OUTPUT_TOKEN_RATE;
  const totalCost = inputCost + outputCost;
  return totalCost
};
