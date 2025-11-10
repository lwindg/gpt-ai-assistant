import config from '../config/index.js';
import { MOCK_TEXT_OK } from '../constants/mock.js';
import { createChatCompletion, FINISH_REASON_STOP } from '../services/openai.js';

class Completion {
  text;

  finishReason;

  constructor({
    text,
    finishReason,
  }) {
    this.text = text;
    this.finishReason = finishReason;
  }

  get isFinishReasonStop() {
    return this.finishReason === FINISH_REASON_STOP;
  }
}

/**
 * @param {Object} param
 * @param {Prompt} param.prompt
 * @param {string} param.verbosity - Optional verbosity level for GPT-5 models (low, medium, high)
 * @returns {Promise<Completion>}
 */
const generateCompletion = async ({
  prompt,
  verbosity,
}) => {
  if (config.APP_DEBUG) {
    console.log('[DEBUG] generateCompletion called with messages:');
    console.log(JSON.stringify(prompt.messages, null, 2));
    if (verbosity) console.log('[DEBUG] Using verbosity:', verbosity);
  }
  const { data } = await createChatCompletion({
    messages: prompt.messages,
    verbosity,
  });
  const [choice] = data.choices;
  if (config.APP_DEBUG) {
    console.log('[DEBUG] OpenAI response:');
    console.log('  - content:', choice.message.content);
    console.log('  - finish_reason:', choice.finish_reason);
  }
  return new Completion({
    text: choice.message.content.trim(),
    finishReason: choice.finish_reason,
  });
};

export default generateCompletion;
