import { recommendMoods } from "../lib/openai";

type MoodInput = {
  industry: string;
  item: string;
  extraDescription?: string;
};

export const getMoodRecommendations = async (input: MoodInput) => {
  const moods = await recommendMoods(input);
  return { moods };
};
