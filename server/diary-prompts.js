// server/diary-prompts.js
// A large bank of couple journal prompts. Built from curated questions plus
// natural-language templates, de-duplicated. Categories drive the diary UI:
//   about_partner (APPRECIATION), about_self (REFLECTION), about_us (CONNECTION)
// The daily picker (server/clock.js) never repeats a prompt until the whole
// bank is exhausted, so a big unique bank = years of fresh questions.

const out = [];
const seen = new Set();
function add(category, text) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t && !seen.has(t)) {
    seen.add(t);
    out.push({ category, text: t });
  }
}
function gen(category, list, ...tmpls) {
  for (const x of list) for (const tmpl of tmpls) add(category, tmpl(x));
}
const aan = (w) => (/^[aeiou]/i.test(String(w)) ? 'an' : 'a');

// ─────────────── CURATED ───────────────
const CURATED_PARTNER = [
  "What's one small thing your partner did recently that made you smile?",
  "What's a quality in your partner you admire but rarely say out loud?",
  'If you could relive one day with your partner, which would it be?',
  'What does your partner do that instantly comforts you?',
  "What's something new you learned about your partner this month?",
  'When did you last feel really proud of your partner?',
  "What's your favorite physical feature of your partner, and why?",
  "What's a habit of your partner's you've grown to love?",
  'What is your partner better at than they give themselves credit for?',
  'What is a look your partner gives you that you love?',
  'What is something your partner does that always makes you laugh?',
  'What is a way your partner has changed for the better since you met?',
  'What is a sacrifice your partner made that you never properly thanked them for?',
  'What is your partner’s most underrated strength?',
  'When has your partner been brave in a way that stayed with you?',
  'What is a tiny gesture from your partner that means the world to you?',
  'What is something about your partner you hope never changes?',
  'What is a talent of your partner’s you wish they used more?',
  'What is the kindest thing you have watched your partner do for someone else?',
  'What does your partner do when you are sad that helps the most?',
  'What is a story about your partner you love to tell other people?',
  'What is something your partner believes in that inspires you?',
  'What is a way your partner makes ordinary days feel special?',
  'What is your partner’s laugh like, and when do you hear it most?',
  'What is a fear of your partner’s you wish you could take away?',
];
const CURATED_SELF = [
  "What's something you want your partner to know about how you're feeling today?",
  "What's a fear you have about the relationship you haven't voiced?",
  'What made you feel most loved this week?',
  "What's something you're working on becoming better at?",
  "What's a way you like to receive love that you wish you asked for more?",
  "What's been on your mind lately that you haven't shared?",
  'When do you feel most like yourself?',
  'What is something you need more of right now?',
  'What is a worry you have been carrying quietly?',
  'What is something you are proud of yourself for lately?',
  'What is a way you have grown this year that surprised you?',
  'What do you need to feel more at peace this week?',
  'What is something you find hard to ask for?',
  'When do you feel most confident?',
  'What is a memory from before us that shaped who you are?',
  'What is something you are looking forward to?',
  'What helps you feel calm after a hard day?',
  'What is a dream you have just for yourself?',
  'What is a boundary you are learning to hold?',
  'What is something you wish you were braver about?',
  'What does a really good day look like for you right now?',
  'What is something you are grateful for in your own life today?',
  'What is a part of yourself you are still getting to know?',
  'When did you last feel truly rested?',
  'What is something small that would make this week feel lighter?',
];
const CURATED_US = [
  "What's a tradition, big or small, that you love that we have?",
  'Where do you see us a year from now?',
  "What's the best decision we've made together?",
  "What's a challenge we overcame that made us stronger?",
  "What's a dream you want us to chase together?",
  "What's our funniest inside joke and how did it start?",
  "What's something we should do more of?",
  'Describe us as a team in three words and why.',
  "What's a moment you knew this was special?",
  'What does home feel like with us?',
  'What is a small ritual of ours that you would miss the most?',
  'What is something we are really good at as a couple?',
  'What is a season of us you would love to go back to for a day?',
  'What is a promise you would like us to make to each other?',
  'What is something we disagree on that you actually appreciate?',
  'What is a way we balance each other out?',
  'What is a memory of us that still makes you smile out of nowhere?',
  'What is something you hope people feel when they are around us?',
  'What is a hard conversation that brought us closer?',
  'What is our love like on an ordinary Tuesday?',
  'What is something we started together that you are proud of?',
  'What is a place that feels like ours, and why?',
  'What is a way our relationship has surprised you?',
  'What is something you want to build with me over the next ten years?',
  'What is the first thing you would want to do together after time apart?',
];
CURATED_PARTNER.forEach((t) => add('about_partner', t));
CURATED_SELF.forEach((t) => add('about_self', t));
CURATED_US.forEach((t) => add('about_us', t));

// ─────────────── TEMPLATE FILLS ───────────────
const FEELINGS = [
  'happy', 'safe', 'truly seen', 'completely understood', 'proud of us', 'giddy', 'calm', 'adored',
  'at peace', 'excited about the future', 'grateful', 'butterflies', 'at home', 'cherished', 'playful',
  'brave', 'inspired', 'comforted', 'desired', 'hopeful', 'content', 'fully alive', 'cared for',
  'free to be yourself', 'deeply loved', 'reassured', 'special', 'light', 'held', 'curious about life',
  'like the best version of yourself', 'wanted', 'appreciated', 'secure', 'lucky', 'understood without words',
];
gen('about_us', FEELINGS, (f) => `When did you last feel ${f} with me?`);
gen('about_self', FEELINGS, (f) => `Describe a moment you felt ${f} because of me.`);
gen('about_partner', FEELINGS, (f) => `What do I do that makes you feel ${f}?`);

const WAYS_I = [
  'laugh', 'listen to you', 'hug you', 'say good morning', 'make plans', 'handle a bad day', 'comfort you',
  'tease you', 'support your dreams', 'show up for you', 'hold your hand', 'look at you', 'cheer you on',
  'apologize', 'celebrate you', 'take care of you', 'surprise you', 'calm you down', 'make you laugh',
  'remember the little things', 'show you love', 'talk through problems', 'dance', 'cook for you',
  'fall asleep next to you', 'text you', 'greet you after time apart', 'forgive', 'dream out loud',
  'keep you company', 'say your name', 'notice when something is wrong', 'make a fuss over you', 'slow down with you',
  'get excited about things', 'protect your feelings',
];
gen('about_partner', WAYS_I, (w) => `What do you love about the way I ${w}?`);
gen('about_partner', WAYS_I, (w) => `What would you miss about the way I ${w}?`);

const FAV_NOUNS = [
  'memory', 'tradition', 'inside joke', 'ritual', 'adventure', 'song', 'photo', 'trip', 'conversation',
  'nickname', 'celebration', 'routine', 'habit', 'moment', 'night in', 'road trip', 'meal', 'holiday',
  'quiet evening', 'small win', 'silly moment', 'comfort show', 'playlist', 'joke', 'weekend', 'date',
];
gen('about_us', FAV_NOUNS, (n) => `What's your favorite ${n} of ours, and why?`);
gen('about_us', FAV_NOUNS, (n) => `Tell me about ${aan(n)} ${n} of ours that means a lot to you.`);

const TOPICS = [
  'our future', 'starting a family', 'where we want to live', 'money and dreams', 'our careers',
  'how we handle conflict', 'our love languages', 'what commitment means to us', 'travel we want to do',
  'how we support each other', 'our friendships', 'family and holidays', 'our health and habits',
  'what makes us feel connected', 'boundaries and needs', 'how we have grown', 'our fears', 'our proudest moments',
  'the next chapter', 'what we value most', 'how we recharge', 'what we want more of', 'our routines',
  'the hard days', 'what makes us us', 'how we say sorry', 'what feels like home', 'our little world',
];
gen('about_us', TOPICS, (t) => `What's something about ${t} you'd love us to talk about more?`);
gen('about_us', TOPICS, (t) => `Where do you stand on ${t} these days?`);

const MEANING = [
  'home', 'love', 'commitment', 'family', 'success', 'a good life', 'forgiveness', 'trust', 'intimacy',
  'partnership', 'growing old together', 'feeling safe', 'being truly known', 'romance', 'loyalty', 'us',
  'comfort', 'adventure', 'peace', 'a good day', 'belonging', 'devotion', 'friendship in love', 'quality time',
];
gen('about_self', MEANING, (m) => `What does ${m} mean to you?`);
gen('about_self', MEANING, (m) => `How has your idea of ${m} changed since we met?`);

const MEMORY_CTX = [
  'on our first date', 'laughing until it hurt', 'when things got hard', 'on a trip', 'doing nothing at all',
  'in the kitchen', 'late at night', 'when I surprised you', 'meeting each other’s people', 'during a holiday',
  'on an ordinary Tuesday', 'when we made up after a fight', 'dancing', 'the first time you knew', 'on a long drive',
  'when we were apart and reunited', 'celebrating something', 'being silly', 'early on', 'just recently',
  'when you were stressed', 'in the middle of a normal day', 'when I was struggling', 'on a slow morning',
];
gen('about_us', MEMORY_CTX, (c) => `What's a happy memory of us ${c}?`);

const PERFECT = [
  'day', 'date night', 'weekend', 'morning', 'vacation', 'lazy Sunday', 'evening in', 'anniversary',
  'road trip', 'celebration', 'ordinary day', 'holiday', 'adventure', 'night out', 'reunion', 'staycation',
  'quiet afternoon', 'birthday', 'winter night', 'summer day',
];
gen('about_us', PERFECT, (p) => `What would your perfect ${p} with me look like?`);

const MORE_X = [
  'loved', 'supported', 'desired', 'understood', 'appreciated', 'secure', 'free', 'seen', 'relaxed',
  'adventurous', 'connected', 'cared for', 'confident', 'prioritized', 'listened to', 'romanced', 'at ease',
  'encouraged', 'chosen', 'safe',
];
gen('about_self', MORE_X, (x) => `What's a way I could help you feel more ${x}?`);

const FUTURE = [
  'excites you most', 'you’re most hopeful about', 'you want to plan first', 'scares you a little',
  'you can’t wait for', 'you picture on an ordinary day', 'you dream about', 'you want to protect',
  'you’d change nothing about', 'makes you smile', 'you want us to prepare for', 'feels closest',
  'you want to say yes to', 'you keep coming back to', 'you want us to promise',
];
gen('about_us', FUTURE, (f) => `When you think about our future, what ${f}?`);

const GRATEFUL = [
  'quality', 'habit', 'moment', 'strength', 'difference between us', 'similarity', 'small thing', 'memory',
  'choice we made', 'way we communicate', 'kind of support', 'part of our day', 'comfort', 'ritual',
  'lesson we learned', 'thing you do', 'thing I do', 'part of our home',
];
gen('about_us', GRATEFUL, (g) => `What's ${aan(g)} ${g} you're grateful for in us?`);

const HELPED = [
  'grow', 'feel more confident', 'chase a dream', 'get through something hard', 'see yourself differently',
  'become kinder to yourself', 'take a risk', 'heal', 'feel less alone', 'believe in us', 'slow down',
  'open up', 'feel understood', 'trust more', 'rest', 'forgive yourself', 'find your footing', 'feel brave',
];
gen('about_partner', HELPED, (h) => `How have I helped you ${h}?`);

const TRY = [
  'new hobby', 'trip', 'recipe', 'tradition', 'adventure', 'challenge', 'date idea', 'goal', 'project',
  'class', 'game', 'ritual', 'habit', 'place to explore', 'little experiment', 'skill', 'routine',
  'kind of vacation', 'weekend plan', 'way to celebrate', 'act of service for someone else', 'fitness thing',
];
gen('about_us', TRY, (t) => `What's ${aan(t)} ${t} you want us to try together?`);

const NEVER_TOLD = [
  'your childhood', 'a fear', 'a dream', 'your day', 'how you really felt', 'a memory', 'what you need',
  'something you’re proud of', 'a worry', 'a hope for us', 'your past', 'what makes you feel loved',
  'a regret', 'a wish', 'something that hurt', 'something that healed you', 'a secret joy', 'a hard season',
];
gen('about_self', NEVER_TOLD, (n) => `What's something you've never told me about ${n}?`);

const MOST_ADJ = [
  'romantic', 'surprising', 'comforting', 'fun', 'unexpected', 'steady', 'playful', 'meaningful', 'effortless',
  'hard-won', 'beautiful', 'real', 'unusual', 'grounding', 'joyful', 'tender', 'grown-up', 'adventurous',
  'peaceful', 'us',
];
gen('about_us', MOST_ADJ, (a) => `What's the most ${a} thing about us?`);

const REMEMBER = [
  'day', 'moment', 'conversation', 'kindness', 'surprise', 'adventure', 'ordinary evening', 'milestone',
  'laugh', 'comfort', 'trip', 'first', 'goodbye', 'hello', 'gift', 'gesture', 'night', 'morning',
];
gen('about_us', REMEMBER, (r) => `What's ${aan(r)} ${r} with me you'll always remember?`);

const TIME2 = [
  'morning', 'evening', 'weekend', 'rainy day', 'holiday', 'quiet night', 'road trip', 'meal', 'adventure',
  'season', 'celebration', 'ordinary day', 'reunion', 'slow afternoon', 'first', 'late night', 'early morning',
  'day off', 'snow day', 'summer evening',
];
gen('about_us', TIME2, (t) => `What's your favorite ${t} with me?`);

const LOVE_ABOUT = [
  'me', 'us', 'our life together', 'the way we love', 'our home', 'our routine', 'how we handle hard days',
  'our quiet moments', 'our adventures', 'the person you’re becoming', 'how we’ve grown', 'our little world',
  'our mornings', 'our nights', 'the way we talk', 'the way we make up',
];
gen('about_us', LOVE_ABOUT, (l) => `What do you love most about ${l}?`);

const FIRST_TIME = [
  'feel butterflies about me', 'know you could trust me', 'feel truly at home with me', 'think we might last',
  'feel proud to be with me', 'want to introduce me to your people', 'imagine a future with me',
  'feel safe being vulnerable with me', 'realize you loved me', 'feel completely yourself around me',
  'miss me when I was gone', 'want to take care of me', 'feel like we were a team', 'let your guard down with me',
  'picture growing old with me', 'feel understood by me', 'know I was different', 'feel chosen by me',
];
gen('about_partner', FIRST_TIME, (x) => `When did you first ${x}?`);

const IF_YOU_COULD = [
  'give me one perfect day', 'freeze one moment of ours forever', 'plan our dream trip', 'relive our first year',
  'design our future home', 'add one new tradition', 'change one thing about our routine', 'surprise me with anything',
  'spend a whole day just us', 'write me a letter from the future', 'show me one memory through your eyes',
  'give us one superpower as a couple', 'take a year off together', 'redo one day of ours', 'grant us one wish',
  'trade lives for a day', 'plan our perfect anniversary', 'build us a bucket list of one thing',
];
gen('about_us', IF_YOU_COULD, (x) => `If you could ${x}, what would it be and why?`);

const GROWN_IN = [
  'trust', 'communication', 'patience', 'affection', 'honesty', 'teamwork', 'forgiveness', 'independence',
  'closeness', 'handling conflict', 'showing up', 'being vulnerable', 'making decisions', 'having fun',
  'supporting each other', 'saying sorry', 'setting goals', 'letting go',
];
gen('about_us', GROWN_IN, (x) => `How have we grown in ${x}, and where could we grow more?`);

const WISH_MORE = [
  'quality time', 'adventure', 'rest', 'deep talks', 'playfulness', 'romance', 'affection', 'spontaneity',
  'planning', 'appreciation', 'checking in', 'trying new things', 'slowing down', 'celebrating small wins',
  'physical closeness', 'time with friends', 'time just us', 'dreaming out loud',
];
gen('about_us', WISH_MORE, (x) => `What's one thing you wish we did more of when it comes to ${x}?`);

const SMALL_THINGS = [
  'our mornings', 'the way we text', 'our goodnights', 'how we eat together', 'our little errands',
  'how we greet each other', 'our quiet nights', 'the way we plan', 'our weekends', 'how we relax',
  'the way we argue', 'our drives', 'how we celebrate', 'the way we say I love you', 'our chores together',
  'how we make decisions', 'our shared playlists', 'the way we make up',
];
gen('about_self', SMALL_THINGS, (x) => `What's a small thing about ${x} that means a lot to you?`);

const DESCRIBE = [
  'us in one word', 'our love in a color', 'our home in a smell', 'our relationship as a season',
  'a perfect us-day', 'the way you feel with me', 'our future in a sentence', 'me in three words',
  'our first year', 'our best week ever', 'us as a song', 'our little world to a stranger', 'our comfort',
  'the sound of us', 'our love as a place', 'our mornings', 'us on a good day', 'us on a hard day',
];
gen('about_us', DESCRIBE, (x) => `How would you describe ${x}?`);

const THANK_FOR = [
  'a hard time you helped me through', 'something you do every day', 'a sacrifice you made', 'a kindness I never repaid',
  'the way you love me', 'something you fixed without being asked', 'your patience with me', 'a time you believed in me',
  'the way you take care of us', 'something small you always do', 'a moment you were exactly what I needed',
  'the way you forgive me', 'your support with a dream', 'a time you put me first',
];
gen('about_partner', THANK_FOR, (x) => `What's something you'd like to thank me for: ${x}?`);

const GRATITUDE_TODAY = [
  'me', 'us', 'our home', 'your day', 'this season of life', 'our health', 'a small comfort', 'our routine',
  'something that made you laugh', 'a person in our life', 'something you accomplished', 'a quiet moment',
  'the weather', 'a favorite thing', 'our future', 'your own growth',
];
gen('about_self', GRATITUDE_TODAY, (x) => `What are you grateful for about ${x} today?`);

const REMINDS = ['a song', 'a smell', 'a place', 'a taste', 'a season', 'a word', 'a color', 'a movie', 'a time of day', 'a kind of weather', 'a meal', 'a sound', 'a city', 'a small object'];
gen('about_us', REMINDS, (x) => `What ${x} reminds you of us, and why?`);

gen('about_partner', WAYS_I, (w) => `What's something about the way I ${w} that you noticed early on?`);

const PROMISE_X = ['us', 'our future', 'the hard days', 'keeping romance alive', 'always being honest', 'making time for each other', 'growing together', 'our home', 'forgiveness', 'adventure', 'rest', 'never taking each other for granted', 'really listening', 'showing up', 'celebrating each other', 'saying sorry first', 'dreaming together', 'staying playful'];
gen('about_us', PROMISE_X, (x) => `What's a promise about ${x} you'd like us to keep?`);

const HARD = ['you’re stressed', 'you’re sad', 'you’re overwhelmed', 'you’re anxious', 'you’re tired', 'you’re excited', 'you’re disappointed', 'you’re angry', 'you’re unsure', 'you’re grieving', 'you’re celebrating', 'you’re scared', 'you’re proud', 'you’re homesick', 'you’re unwell', 'you’re busy', 'you’re overthinking', 'you shut down'];
gen('about_self', HARD, (x) => `How can I better support you when ${x}?`);

const MOMENTS = ['a weeknight', 'a Sunday', 'a morning', 'dinner', 'a rainy day', 'a busy week', 'an anniversary', 'a normal day', 'bedtime', 'a reunion', 'a celebration', 'a lazy afternoon', 'a road trip', 'a night in'];
gen('about_us', MOMENTS, (x) => `What's something small that would make ${x} feel special?`);

const CARE = ['our relationship', 'each other', 'our home', 'our health', 'our finances', 'our friendships', 'our time', 'our future', 'our romance', 'our rest', 'our dreams', 'our peace'];
gen('about_us', CARE, (x) => `What's a way you'd like us to take better care of ${x}?`);

const DONE = ['said to you', 'done for you', 'made for you', 'planned for us', 'surprised you with', 'written to you', 'cooked for you', 'given you', 'helped you with', 'remembered about you'];
gen('about_partner', DONE, (x) => `What's your favorite thing I've ever ${x}?`);

const WE_DO = ['reunite after time apart', 'fall asleep together', 'laugh at the same thing', 'get through something hard', 'make plans', 'are quiet together', 'cook together', 'travel', 'make up after a fight', 'celebrate', 'wake up together', 'hold hands', 'dance in the kitchen', 'say goodbye', 'say I love you', 'are silly together', 'take care of each other', 'dream out loud'];
gen('about_us', WE_DO, (x) => `What does it feel like when we ${x}?`);

const MORE2 = ['romance', 'laughter', 'calm', 'adventure', 'tenderness', 'fun', 'gratitude', 'connection', 'play', 'affection', 'spontaneity', 'rest', 'wonder', 'kindness'];
gen('about_us', MORE2, (x) => `What's a way we could bring more ${x} into everyday life?`);

const BEST_WHEN = ['at your best', 'most relaxed', 'most yourself', 'most excited', 'most tender', 'happiest', 'most confident', 'most playful', 'most affectionate', 'most at peace'];
gen('about_partner', BEST_WHEN, (x) => `When are you ${x}, and how can I help you get there more often?`);

const CHILDHOOD = ['a favorite childhood memory', 'a family tradition you loved', 'who you were as a kid', 'a dream you had growing up', 'something that shaped you', 'a place from your childhood', 'a lesson from your family', 'a fear you outgrew', 'a comfort from back then', 'a story about young you'];
gen('about_self', CHILDHOOD, (x) => `Will you share ${x} with me?`);

const APPRECIATE = ['patience', 'sense of humor', 'kindness', 'strength', 'honesty', 'way of loving', 'mind', 'heart', 'ambition', 'gentleness', 'loyalty', 'warmth', 'calm', 'courage', 'creativity', 'generosity'];
gen('about_partner', APPRECIATE, (x) => `What's something you appreciate about my ${x} that you don't say enough?`);

const HOPES = ['this month', 'this year', 'the next five years', 'when we’re old', 'after a big change', 'once things settle', 'in our home', 'on our next trip', 'for our family', 'for us as a team', 'for our romance', 'for our friendship'];
gen('about_us', HOPES, (x) => `What's something you're hoping for ${x}?`);
gen('about_us', HOPES, (x) => `What would you love us to be doing ${x}?`);

// a final curated round to round out the bank
const CURATED2 = [
  ['about_partner', 'What is one thing you would love to hear me say more often?'],
  ['about_partner', 'What is a way I make you feel safe that I might not realize?'],
  ['about_partner', 'What is the smallest gesture from me that makes the biggest difference?'],
  ['about_partner', 'What is something I do when no one is watching that you love?'],
  ['about_partner', 'What is a compliment you have been meaning to give me?'],
  ['about_partner', 'What is something about my past that made you understand me better?'],
  ['about_partner', 'What is a moment I made you feel truly chosen?'],
  ['about_partner', 'What do you hope I never doubt about myself?'],
  ['about_partner', 'What is a way I have surprised you since we got together?'],
  ['about_partner', 'What is something I am afraid of that you wish I would let you help with?'],
  ['about_partner', 'What is your favorite thing about coming home to me?'],
  ['about_partner', 'What is a way I show love that is uniquely mine?'],
  ['about_partner', 'What is something I said once that has stayed with you?'],
  ['about_partner', 'What is a dream of mine you would love to help come true?'],
  ['about_partner', 'What is a hard thing you have watched me handle well?'],
  ['about_self', 'What is something you need to forgive yourself for?'],
  ['about_self', 'What is a version of yourself you are proud to have become?'],
  ['about_self', 'What is a fear you would feel lighter for saying out loud?'],
  ['about_self', 'What is something you want to try that scares you a little?'],
  ['about_self', 'What is a way you would like to grow in the next year?'],
  ['about_self', 'What is something you are learning to accept about yourself?'],
  ['about_self', 'What does your ideal ordinary day look like right now?'],
  ['about_self', 'What is a small pleasure you never want to give up?'],
  ['about_self', 'What is something you wish you asked for more often?'],
  ['about_self', 'When did you last feel really proud of yourself?'],
  ['about_self', 'What is a memory that always makes you feel grounded?'],
  ['about_self', 'What is something weighing on you that would help to name?'],
  ['about_self', 'What is a hope you hold quietly?'],
  ['about_self', 'What helps you feel most loved when you are down?'],
  ['about_self', 'What is a way you have been brave lately?'],
  ['about_us', 'What is a season of our relationship you are most grateful for?'],
  ['about_us', 'What is a small everyday moment of ours you treasure?'],
  ['about_us', 'What is a way we have made a house feel like a home?'],
  ['about_us', 'What is something we should never stop doing?'],
  ['about_us', 'What is a hard truth that made us stronger?'],
  ['about_us', 'What is a tradition you would love to start with me?'],
  ['about_us', 'What is the bravest thing our love has asked of you?'],
  ['about_us', 'What is a moment you felt certain about us?'],
  ['about_us', 'What is a way we could love each other better this month?'],
  ['about_us', 'What do you think is the secret ingredient of us?'],
  ['about_us', 'What is a memory you would put in a time capsule for us?'],
  ['about_us', 'What is something about our future you can not wait for?'],
  ['about_us', 'What is a way we make each other braver?'],
  ['about_us', 'What is a fight we had that you are secretly glad about?'],
  ['about_us', 'What is a promise we have kept that you are proud of?'],
  ['about_us', 'What is a tiny ritual that keeps us close?'],
  ['about_us', 'What is something you would want our kids or friends to learn from us?'],
  ['about_us', 'What is the most us thing we have ever done?'],
  ['about_us', 'What is a way I could make your everyday life lighter?'],
  ['about_us', 'What is a memory of us you hope we tell for years?'],
];
CURATED2.forEach(([c, t]) => add(c, t));

module.exports = out;
