import config from '../config/index.js';
import { search } from '../services/serpapi.js';

class OrganicResult {
  answer;

  constructor({
    answer,
  } = {}) {
    this.answer = answer;
  }
}

const fetchAnswer = async (q) => {
  if (!config.SERPAPI_API_KEY) return new OrganicResult();
  const res = await search({ q });
  const { answer_box: answerBox, knowledge_graph: knowledgeGraph, organic_results: organicResults } = res.data;
  let answer = '';
  // Check organic results first
  if (organicResults && organicResults.length > 0 && organicResults[0].snippet) {
    answer = organicResults[0].snippet;
  }
  // Append additional answer sources if available
  if (answerBox?.answer) answer += answerBox.answer;
  if (answerBox?.result) answer += answerBox.result;
  if (answerBox?.snippet) answer += answerBox.snippet;
  if (knowledgeGraph?.description) answer += `${knowledgeGraph.title} - ${knowledgeGraph.description}`;
  return new OrganicResult({ answer: answer || null });
};

export default fetchAnswer;
