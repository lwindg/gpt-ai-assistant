import config from '../../config/index.js';
import { t } from '../../locales/index.js';
import { ROLE_AI, ROLE_HUMAN } from '../../services/openai.js';
import { fetchAnswer, generateCompletion } from '../../utils/index.js';
import { COMMAND_BOT_CONTINUE, COMMAND_BOT_SEARCH } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
import { getPrompt, setPrompt } from '../prompt/index.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => {
  const hasCmd = context.hasCommand(COMMAND_BOT_SEARCH);
  if (config.APP_DEBUG) {
    console.log('[DEBUG] Search Handler Check:');
    console.log('  - trimmedText:', context.trimmedText);
    console.log('  - COMMAND_BOT_SEARCH.text:', COMMAND_BOT_SEARCH.text);
    console.log('  - COMMAND_BOT_SEARCH.aliases:', COMMAND_BOT_SEARCH.aliases);
    console.log('  - hasCommand result:', hasCmd);
  }
  return hasCmd;
};

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    if (config.APP_DEBUG) console.log('[DEBUG] Search Handler Executing...');
    let trimmedText = context.trimmedText.replace(COMMAND_BOT_SEARCH.text, '');
    const prompt = getPrompt(context.userId);
    if (!config.SERPAPI_API_KEY) {
      if (config.APP_DEBUG) console.log('[DEBUG] Missing SERPAPI_API_KEY');
      return context.pushText(t('__ERROR_MISSING_ENV')('SERPAPI_API_KEY'));
    }
    if (config.APP_DEBUG) console.log('[DEBUG] Fetching answer for query:', trimmedText);
    try {
      const { answer } = await fetchAnswer(trimmedText);
      if (config.APP_DEBUG) console.log('[DEBUG] Search answer received:', answer);
      trimmedText = `${t('__COMPLETION_SEARCH')(answer || t('__COMPLETION_SEARCH_NOT_FOUND'), trimmedText)}`;
      if (config.APP_DEBUG) console.log('[DEBUG] Formatted search prompt:', trimmedText);
    } catch (err) {
      if (config.APP_DEBUG) console.log('[DEBUG] Search error:', err.message);
      return context.pushError(err);
    }
    prompt.write(ROLE_HUMAN, `${trimmedText}`).write(ROLE_AI);
    if (config.APP_DEBUG) {
      console.log('[DEBUG] Prompt before generateCompletion:');
      console.log(prompt.toString());
    }
    try {
      const { text, isFinishReasonStop } = await generateCompletion({ prompt, verbosity: 'low' });
      if (config.APP_DEBUG) console.log('[DEBUG] Generated text:', text);
      prompt.patch(text);
      setPrompt(context.userId, prompt);
      updateHistory(context.id, (history) => history.write(config.BOT_NAME, text));
      const actions = isFinishReasonStop ? [] : [COMMAND_BOT_CONTINUE];
      if (config.APP_DEBUG) console.log('[DEBUG] Pushing response to context...');
      context.pushText(text, actions);
    } catch (err) {
      if (config.APP_DEBUG) console.log('[DEBUG] Generation error:', err.message);
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
