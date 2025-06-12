/**
 * AnGear Language Extension - Test Data Generator
 * Generates comprehensive test data for FSRS algorithm validation
 */

import type { Note, Deck } from '../types';

export interface TestDataConfig {
  cardCount: number;
  deckName: string;
  includeVariedDifficulty: boolean;
  includeGrammarPatterns: boolean;
}

/**
 * HSK Level 1-6 vocabulary with translations and example sentences
 */
const HSK_VOCABULARY = {
  // HSK Level 1 (Basic)
  level1: [
    { chinese: "你好", pinyin: "nǐ hǎo", english: "hello", example: "你好，我是李明。", translation: "Hello, I am Li Ming." },
    { chinese: "谢谢", pinyin: "xiè xiè", english: "thank you", example: "谢谢你的帮助。", translation: "Thank you for your help." },
    { chinese: "再见", pinyin: "zài jiàn", english: "goodbye", example: "再见，明天见。", translation: "Goodbye, see you tomorrow." },
    { chinese: "学生", pinyin: "xué shēng", english: "student", example: "我是一个学生。", translation: "I am a student." },
    { chinese: "老师", pinyin: "lǎo shī", english: "teacher", example: "她是我们的老师。", translation: "She is our teacher." },
    { chinese: "朋友", pinyin: "péng yǒu", english: "friend", example: "他是我的好朋友。", translation: "He is my good friend." },
    { chinese: "家", pinyin: "jiā", english: "home/family", example: "我回家了。", translation: "I went home." },
    { chinese: "水", pinyin: "shuǐ", english: "water", example: "请给我一杯水。", translation: "Please give me a glass of water." },
    { chinese: "吃", pinyin: "chī", english: "to eat", example: "我想吃苹果。", translation: "I want to eat an apple." },
    { chinese: "睡觉", pinyin: "shuì jiào", english: "to sleep", example: "我要去睡觉了。", translation: "I'm going to sleep." }
  ],
  // HSK Level 2 (Elementary)
  level2: [
    { chinese: "身体", pinyin: "shēn tǐ", english: "body/health", example: "你的身体怎么样？", translation: "How is your health?" },
    { chinese: "运动", pinyin: "yùn dòng", english: "exercise/sports", example: "我喜欢做运动。", translation: "I like to exercise." },
    { chinese: "音乐", pinyin: "yīn yuè", english: "music", example: "这首音乐很好听。", translation: "This music sounds great." },
    { chinese: "工作", pinyin: "gōng zuò", english: "work/job", example: "我的工作很忙。", translation: "My work is very busy." },
    { chinese: "时间", pinyin: "shí jiān", english: "time", example: "现在几点了？", translation: "What time is it now?" },
    { chinese: "地方", pinyin: "dì fāng", english: "place", example: "这是一个美丽的地方。", translation: "This is a beautiful place." },
    { chinese: "颜色", pinyin: "yán sè", english: "color", example: "你喜欢什么颜色？", translation: "What color do you like?" },
    { chinese: "衣服", pinyin: "yī fú", english: "clothes", example: "这件衣服很漂亮。", translation: "This piece of clothing is beautiful." },
    { chinese: "天气", pinyin: "tiān qì", english: "weather", example: "今天天气很好。", translation: "The weather is nice today." },
    { chinese: "旅游", pinyin: "lǚ yóu", english: "travel", example: "我想去中国旅游。", translation: "I want to travel to China." }
  ],
  // HSK Level 3 (Intermediate)
  level3: [
    { chinese: "经济", pinyin: "jīng jì", english: "economy", example: "中国的经济发展很快。", translation: "China's economic development is rapid." },
    { chinese: "文化", pinyin: "wén huà", english: "culture", example: "我对中国文化很感兴趣。", translation: "I'm very interested in Chinese culture." },
    { chinese: "历史", pinyin: "lì shǐ", english: "history", example: "这座城市有悠久的历史。", translation: "This city has a long history." },
    { chinese: "环境", pinyin: "huán jìng", english: "environment", example: "保护环境很重要。", translation: "Protecting the environment is important." },
    { chinese: "科技", pinyin: "kē jì", english: "technology", example: "现代科技改变了我们的生活。", translation: "Modern technology has changed our lives." },
    { chinese: "教育", pinyin: "jiào yù", english: "education", example: "教育是社会发展的基础。", translation: "Education is the foundation of social development." },
    { chinese: "健康", pinyin: "jiàn kāng", english: "health", example: "健康的生活方式很重要。", translation: "A healthy lifestyle is important." },
    { chinese: "社会", pinyin: "shè huì", english: "society", example: "我们要为社会做贡献。", translation: "We should contribute to society." },
    { chinese: "发展", pinyin: "fā zhǎn", english: "development", example: "这个项目的发展前景很好。", translation: "This project has good development prospects." },
    { chinese: "机会", pinyin: "jī huì", english: "opportunity", example: "这是一个很好的机会。", translation: "This is a great opportunity." }
  ],
  // HSK Level 4-6 (Advanced)
  advanced: [
    { chinese: "责任", pinyin: "zé rèn", english: "responsibility", example: "作为父母，我们有教育孩子的责任。", translation: "As parents, we have the responsibility to educate our children." },
    { chinese: "创新", pinyin: "chuàng xīn", english: "innovation", example: "创新是企业发展的动力。", translation: "Innovation is the driving force of enterprise development." },
    { chinese: "挑战", pinyin: "tiǎo zhàn", english: "challenge", example: "面对挑战，我们要保持冷静。", translation: "When facing challenges, we should stay calm." },
    { chinese: "合作", pinyin: "hé zuò", english: "cooperation", example: "国际合作有利于世界和平。", translation: "International cooperation is beneficial to world peace." },
    { chinese: "传统", pinyin: "chuán tǒng", english: "tradition", example: "我们要保护和传承传统文化。", translation: "We should protect and inherit traditional culture." },
    { chinese: "现象", pinyin: "xiàn xiàng", english: "phenomenon", example: "这是一个很有意思的现象。", translation: "This is a very interesting phenomenon." },
    { chinese: "影响", pinyin: "yǐng xiǎng", english: "influence/impact", example: "科技对我们的生活有很大影响。", translation: "Technology has a great impact on our lives." },
    { chinese: "观念", pinyin: "guān niàn", english: "concept/idea", example: "我们要改变传统的观念。", translation: "We need to change traditional concepts." },
    { chinese: "质量", pinyin: "zhì liàng", english: "quality", example: "产品质量是企业的生命。", translation: "Product quality is the life of an enterprise." },
    { chinese: "效率", pinyin: "xiào lǜ", english: "efficiency", example: "提高工作效率很重要。", translation: "Improving work efficiency is important." }
  ]
};

/**
 * Grammar patterns for varied sentence structures
 */
const GRAMMAR_PATTERNS = [
  {
    pattern: "Subject + 是 + Object",
    examples: [
      { chinese: "我是学生。", english: "I am a student.", grammar: "Simple identification with 是" },
      { chinese: "这是我的书。", english: "This is my book.", grammar: "Demonstrative + 是 + possessive" }
    ]
  },
  {
    pattern: "Subject + 有 + Object",
    examples: [
      { chinese: "我有一个弟弟。", english: "I have a younger brother.", grammar: "Possession with 有" },
      { chinese: "他们有很多朋友。", english: "They have many friends.", grammar: "有 + quantity + noun" }
    ]
  },
  {
    pattern: "Subject + 在 + Location + Verb",
    examples: [
      { chinese: "我在图书馆看书。", english: "I am reading in the library.", grammar: "Location + activity" },
      { chinese: "孩子们在公园里玩。", english: "The children are playing in the park.", grammar: "在 + location + action" }
    ]
  },
  {
    pattern: "Time + Subject + Verb + Object",
    examples: [
      { chinese: "明天我要去北京。", english: "Tomorrow I will go to Beijing.", grammar: "Time-subject-verb-object order" },
      { chinese: "昨天他买了一本书。", english: "Yesterday he bought a book.", grammar: "Past tense with 了" }
    ]
  },
  {
    pattern: "Subject + 觉得 + Adjective/Clause",
    examples: [
      { chinese: "我觉得这个电影很好看。", english: "I think this movie is very good.", grammar: "Opinion expression with 觉得" },
      { chinese: "她觉得学中文不难。", english: "She thinks learning Chinese is not difficult.", grammar: "觉得 + negative assessment" }
    ]
  }
];



/**
 * Generate test data for FSRS validation
 */
export class TestDataGenerator {
  
  /**
   * Generate 100 comprehensive test cards
   */
  static generateTestData(config: TestDataConfig): { deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>, notes: Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] } {
    const notes: Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] = [];
    
    // Generate vocabulary cards (60% of total)
    const vocabCards = this.generateVocabularyCards(Math.floor(config.cardCount * 0.6));
    notes.push(...vocabCards);
    
    // Generate grammar pattern cards (25% of total)
    if (config.includeGrammarPatterns) {
      const grammarCards = this.generateGrammarCards(Math.floor(config.cardCount * 0.25));
      notes.push(...grammarCards);
    }
    
    // Generate contextual cards (15% of total)
    const contextCards = this.generateContextualCards(Math.floor(config.cardCount * 0.15));
    notes.push(...contextCards);

    // Fill remaining slots if needed
    while (notes.length < config.cardCount) {
      const additional = this.generateVocabularyCards(1);
      notes.push(...additional);
    }

    // Trim to exact count
    notes.splice(config.cardCount);

    const deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'> = {
      name: config.deckName,
      fsrsConfig: {
        requestRetention: 0.9,
        maximumInterval: 36500,
        easyBonus: 1.3,
        hardFactor: 1.2
      }
    };

    return { deck, notes };
  }

  /**
   * Generate vocabulary-based cards from HSK levels
   */
  private static generateVocabularyCards(count: number): Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] {
    const cards: Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] = [];
    const allVocab = [
      ...HSK_VOCABULARY.level1.map(v => ({ ...v, level: 'HSK1', difficulty: 'beginner' })),
      ...HSK_VOCABULARY.level2.map(v => ({ ...v, level: 'HSK2', difficulty: 'beginner' })),
      ...HSK_VOCABULARY.level3.map(v => ({ ...v, level: 'HSK3', difficulty: 'intermediate' })),
      ...HSK_VOCABULARY.advanced.map(v => ({ ...v, level: 'HSK4-6', difficulty: 'advanced' }))
    ];

    for (let i = 0; i < count; i++) {
      const vocab = allVocab[i % allVocab.length];
      
      cards.push({
        noteType: 'CtoE',
        fields: {
          CtoE: {
            chinese: vocab.chinese,
            english: vocab.translation,
            pinyin: vocab.pinyin,
            notes: `Vocabulary: ${vocab.chinese} (${vocab.pinyin}) - ${vocab.english}`
          }
        },
        tags: [vocab.level, vocab.difficulty, 'vocabulary', 'test-data']
      });
    }

    return cards;
  }

  /**
   * Generate grammar pattern focused cards
   */
  private static generateGrammarCards(count: number): Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] {
    const cards: Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 0; i < count; i++) {
      const pattern = GRAMMAR_PATTERNS[i % GRAMMAR_PATTERNS.length];
      const example = pattern.examples[i % pattern.examples.length];
      
      cards.push({
        noteType: 'CtoE',
        fields: {
          CtoE: {
            chinese: example.chinese,
            english: example.english,
            notes: `Grammar Pattern: ${pattern.pattern} | Usage: ${example.grammar}`
          }
        },
        tags: ['grammar', 'pattern', 'intermediate', 'test-data']
      });
    }

    return cards;
  }

  /**
   * Generate contextual conversation cards
   */
  private static generateContextualCards(count: number): Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] {
    const cards: Omit<Note, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] = [];
    const contexts = [
      { chinese: "请问，地铁站怎么走？", english: "Excuse me, how do I get to the subway station?", topic: "daily", situation: "asking for directions" },
      { chinese: "我想预订一张明天去上海的火车票。", english: "I'd like to book a train ticket to Shanghai for tomorrow.", topic: "travel", situation: "booking tickets" },
      { chinese: "这个项目的预算大概是多少？", english: "What's the approximate budget for this project?", topic: "business", situation: "project discussion" },
      { chinese: "请帮我安排一下明天上午的会议。", english: "Please help me arrange tomorrow morning's meeting.", topic: "business", situation: "scheduling" },
      { chinese: "你能推荐几本关于中国历史的书吗？", english: "Can you recommend some books about Chinese history?", topic: "academic", situation: "seeking recommendations" },
      { chinese: "春节是中国最重要的传统节日。", english: "Spring Festival is China's most important traditional holiday.", topic: "cultural", situation: "cultural explanation" },
      { chinese: "我们应该如何保护环境？", english: "How should we protect the environment?", topic: "social", situation: "discussing issues" },
      { chinese: "现在的年轻人喜欢用手机支付。", english: "Young people nowadays like to pay with their phones.", topic: "technology", situation: "social observation" },
      { chinese: "这家餐厅的川菜做得很地道。", english: "This restaurant makes very authentic Sichuan cuisine.", topic: "food", situation: "restaurant review" },
      { chinese: "学习语言需要每天坚持练习。", english: "Learning a language requires daily practice and persistence.", topic: "education", situation: "learning advice" }
    ];

    for (let i = 0; i < count; i++) {
      const context = contexts[i % contexts.length];
      
      cards.push({
        noteType: 'CtoE',
        fields: {
          CtoE: {
            chinese: context.chinese,
            english: context.english,
            notes: `Context: ${context.topic} | Scenario: ${context.situation}`
          }
        },
        tags: ['contextual', context.topic, 'conversation', 'test-data']
      });
    }

    return cards;
  }

  /**
   * Generate FSRS testing scenarios
   */
  static generateFSRSTestScenarios() {
    return {
      // Test all rating scenarios
      ratings: [
        { rating: 1, name: 'Again', description: 'Completely forgot or very difficult' },
        { rating: 2, name: 'Hard', description: 'Remembered with difficulty' },
        { rating: 3, name: 'Good', description: 'Remembered correctly' },
        { rating: 4, name: 'Easy', description: 'Remembered easily and quickly' }
      ],
      
      // Test state transitions
      stateTransitions: [
        { from: 'New', to: 'Learning', trigger: 'First review (any rating)' },
        { from: 'Learning', to: 'Review', trigger: 'Good/Easy rating after learning' },
        { from: 'Learning', to: 'Learning', trigger: 'Again/Hard rating during learning' },
        { from: 'Review', to: 'Review', trigger: 'Good/Easy rating in review' },
        { from: 'Review', to: 'Relearning', trigger: 'Again rating in review' }
      ],
      
      // Performance test scenarios
      performanceTests: [
        { name: 'Rapid Reviews', description: 'Process 50 cards in quick succession' },
        { name: 'Mixed Ratings', description: 'Alternate between all rating types' },
        { name: 'Extended Session', description: 'Review session lasting 30+ minutes' },
        { name: 'Memory Stress', description: 'Handle 100+ cards without memory issues' }
      ]
    };
  }
} 