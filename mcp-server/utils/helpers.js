/**
 * Common helper functions used across handlers
 */

// Calculate average sentence length and other metrics
function calculateSentenceMetrics(text) {
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  const sentenceLengths = sentences.map(sentence => sentence.split(/\s+/).filter(Boolean).length);
  const avgLength = sentenceLengths.reduce((sum, length) => sum + length, 0) / sentences.length || 0;

  // Calculate length distribution
  const shortSentences = sentenceLengths.filter(len => len <= 10).length;
  const mediumSentences = sentenceLengths.filter(len => len > 10 && len <= 20).length;
  const longSentences = sentenceLengths.filter(len => len > 20).length;

  return {
    avg_length: avgLength,
    length_distribution: {
      short: shortSentences / sentences.length || 0,
      medium: mediumSentences / sentences.length || 0,
      long: longSentences / sentences.length || 0
    },
    complexity_score: Math.min(1, avgLength / 25),
    question_frequency: (text.match(/\?/g) || []).length / sentences.length || 0,
    fragment_frequency: sentences.filter(s => s.split(/\s+/).filter(Boolean).length < 5).length / sentences.length || 0
  };
}

// Calculate vocabulary metrics
function calculateVocabularyMetrics(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  return {
    lexical_diversity: uniqueWords.size / words.length || 0,
    formality_score: 0.65, // Placeholder
    unusual_word_frequency: 0.05, // Placeholder
    part_of_speech_distribution: {
      nouns: 0.25,
      verbs: 0.2,
      adjectives: 0.15,
      adverbs: 0.08
    }
  };
}

// Analyze narrative characteristics
function analyzeNarrativeCharacteristics(text) {
  // Simple POV detection
  const firstPersonIndicators = (text.match(/\b(I|me|my|mine|we|us|our|ours)\b/gi) || []).length;
  const thirdPersonIndicators = (text.match(/\b(he|him|his|she|her|hers|they|them|their|theirs)\b/gi) || []).length;
  
  let pov = "unknown";
  if (firstPersonIndicators > thirdPersonIndicators * 2) {
    pov = "first_person";
  } else if (thirdPersonIndicators > firstPersonIndicators) {
    pov = "third_person";
  }

  // Tense detection
  const presentTenseIndicators = (text.match(/\b(is|are|am|being|do|does|has|have)\b/gi) || []).length;
  const pastTenseIndicators = (text.match(/\b(was|were|had|did)\b/gi) || []).length;

  let tense = "unknown";
  if (presentTenseIndicators > pastTenseIndicators * 1.5) {
    tense = "present";
  } else if (pastTenseIndicators > presentTenseIndicators) {
    tense = "past";
  }

  return {
    pov,
    tense,
    description_density: 0.4, // Placeholder
    action_to_reflection_ratio: 1.5,
    show_vs_tell_balance: 0.65
  };
}

// Analyze stylistic devices
function analyzeStyleDevices(text) {
  return {
    metaphor_frequency: 0.02, // Placeholder
    simile_frequency: 0.015,
    alliteration_frequency: 0.008,
    repetition_patterns: 0.03
  };
}

// Analyze tone
function analyzeTone(text) {
  // Simplified tone analysis
  const positiveWords = ['happy', 'joy', 'love', 'excellent', 'good', 'great'];
  const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'bad', 'awful'];
  const formalWords = ['therefore', 'furthermore', 'consequently', 'nevertheless'];

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  const formalCount = words.filter(word => formalWords.includes(word)).length;

  let emotionalTone = [];
  if (positiveCount > negativeCount * 2) {
    emotionalTone.push('optimistic');
  } else if (negativeCount > positiveCount * 2) {
    emotionalTone.push('pessimistic');
  } else {
    emotionalTone.push('neutral');
  }

  // Add more tones based on other heuristics
  const formality = formalCount / words.length > 0.01 ? 'formal' : 'casual';

  return {
    emotional_tone: emotionalTone,
    formality_level: formality,
    humor_level: 0.2, // Placeholder
    sarcasm_level: 0.1 // Placeholder
  };
}

// Create excerpt from text (first 200 characters)
function createExcerpt(text) {
  // Get first 200 characters, but try to end at a sentence boundary
  const excerpt = text.slice(0, 200);
  const lastPeriod = excerpt.lastIndexOf('.');
  if (lastPeriod > 100) {
    return excerpt.slice(0, lastPeriod + 1);
  }
  return excerpt + '...';
}

// Generate a summary description of the style
function generateDescription(
  sentenceMetrics,
  vocabularyMetrics,
  narrativeCharacteristics,
  stylistic,
  tone
) {
  const sentenceLength = sentenceMetrics.avg_length < 12 ? 'short' :
    sentenceMetrics.avg_length < 20 ? 'moderate' : 'long';
  
  const complexity = sentenceMetrics.complexity_score < 0.4 ? 'simple' :
    sentenceMetrics.complexity_score < 0.7 ? 'moderately complex' : 'complex';
  
  const diversity = vocabularyMetrics.lexical_diversity < 0.4 ? 'limited' :
    vocabularyMetrics.lexical_diversity < 0.6 ? 'varied' : 'highly diverse';
  
  const formality = tone.formality_level === 'formal' ? 'formal' : 'conversational';
  
  const povText = narrativeCharacteristics.pov === 'first_person' ? 'first-person' :
    narrativeCharacteristics.pov === 'third_person' ? 'third-person' : 'mixed perspective';
  
  const tenseText = narrativeCharacteristics.tense === 'present' ? 'present tense' :
    narrativeCharacteristics.tense === 'past' ? 'past tense' : 'mixed tense';

  return `This writing features ${sentenceLength}, ${complexity} sentences with ${diversity} vocabulary. The style is ${formality}, written in ${povText} ${tenseText}. ${tone.emotional_tone.join(' and ')} in tone, with a ${narrativeCharacteristics.action_to_reflection_ratio > 1 ? 'focus on action over reflection' : 'balance of action and reflection'}.`;
}

// Format style guidance based on parameters
function formatStyleGuidance(styleParameters) {
  let guidance = "# Style Guidance\n\n";

  // Sentence structure
  if (styleParameters.sentence) {
    const sentenceLength = styleParameters.sentence.avg_length < 12 ? 'short' :
      styleParameters.sentence.avg_length < 20 ? 'moderate' : 'long';
    
    guidance += `## Sentence Structure\n`;
    guidance += `- Use predominantly ${sentenceLength} sentences (average ${Math.round(styleParameters.sentence.avg_length)} words per sentence)\n`;
    if (styleParameters.sentence.length_distribution) {
      guidance += `- Sentence variety: ${Math.round(styleParameters.sentence.length_distribution.short * 100)}% short, ${Math.round(styleParameters.sentence.length_distribution.medium * 100)}% medium, ${Math.round(styleParameters.sentence.length_distribution.long * 100)}% long\n`;
    }
    guidance += `- Complexity: ${styleParameters.sentence.complexity < 0.4 ? 'simple and direct' : styleParameters.sentence.complexity < 0.7 ? 'moderately complex' : 'complex with multiple clauses'}\n`;
    guidance += `- Question frequency: ${styleParameters.sentence.questions ? 'Include occasional questions' : 'Rarely use questions'}\n\n`;
  }

  // Vocabulary
  if (styleParameters.vocabulary) {
    guidance += `## Vocabulary\n`;
    guidance += `- Lexical diversity: ${styleParameters.vocabulary.diversity < 0.4 ? 'Limited - use repetition and simple words' : styleParameters.vocabulary.diversity < 0.6 ? 'Moderate - mix familiar words with occasional distinctive ones' : 'High - use varied, precise vocabulary'}\n`;
    guidance += `- Formality: ${styleParameters.vocabulary.formality === 'formal' ? 'Formal academic tone' : styleParameters.vocabulary.formality === 'neutral' ? 'Balanced, professional tone' : 'Conversational, casual tone'}\n`;
    
    if (styleParameters.vocabulary.avoid) {
      guidance += `- Avoid these terms: ${styleParameters.vocabulary.avoid.join(', ')}\n`;
    }
    if (styleParameters.vocabulary.prefer) {
      guidance += `- Preferred terms: ${styleParameters.vocabulary.prefer.join(', ')}\n`;
    }
    guidance += '\n';
  }

  // Narrative
  if (styleParameters.narrative) {
    guidance += `## Narrative Approach\n`;
    guidance += `- Point of view: ${styleParameters.narrative.pov === 'first_person' ? 'First person' : styleParameters.narrative.pov === 'second_person' ? 'Second person' : 'Third person'}\n`;
    guidance += `- Tense: ${styleParameters.narrative.tense === 'present' ? 'Present tense' : 'Past tense'}\n`;
    guidance += `- Description vs. action balance: ${styleParameters.narrative.description_heavy ? 'Favor rich description' : 'Favor action and plot movement'}\n\n`;
  }

  // Tone
  if (styleParameters.tone) {
    guidance += `## Tone\n`;
    if (styleParameters.tone.emotional && styleParameters.tone.emotional.length > 0) {
      guidance += `- Emotional tone: ${styleParameters.tone.emotional.join(', ')}\n`;
    }
    if (styleParameters.tone.formality) {
      guidance += `- Formality: ${styleParameters.tone.formality}\n`;
    }
    if (styleParameters.tone.humor) {
      guidance += `- Humor level: ${styleParameters.tone.humor === 'high' ? 'Include humor and wit' : styleParameters.tone.humor === 'medium' ? 'Occasional light humor' : 'Serious, minimal humor'}\n\n`;
    }
  }

  // Stylistic devices
  if (styleParameters.devices) {
    guidance += `## Stylistic Devices\n`;
    const devices = [];
    if (styleParameters.devices.metaphors) devices.push('metaphors');
    if (styleParameters.devices.similes) devices.push('similes');
    if (styleParameters.devices.alliteration) devices.push('alliteration');
    if (styleParameters.devices.repetition) devices.push('repetition');
    
    if (devices.length > 0) {
      guidance += `- Use these devices: ${devices.join(', ')}\n`;
    }
    if (styleParameters.devices.avoid) {
      guidance += `- Avoid these devices: ${styleParameters.devices.avoid.join(', ')}\n`;
    }
    guidance += '\n';
  }

  // Comparable authors
  if (styleParameters.comparable_authors && styleParameters.comparable_authors.length > 0) {
    guidance += `## Similar Authors\n`;
    guidance += `- Emulate the style of: ${styleParameters.comparable_authors.join(', ')}\n\n`;
  }

  // User comments
  if (styleParameters.user_comments) {
    guidance += `## Additional Notes\n`;
    guidance += styleParameters.user_comments + '\n\n';
  }

  return guidance;
}

// Helper to combine metrics from multiple analyses
function combineMetrics(analyses) {
  if (!analyses || analyses.length === 0) {
    return null;
  }

  // For sentence metrics
  const avgSentenceLength = analyses.reduce((sum, a) => sum + (a.sentence_metrics?.avg_length || 0), 0) / analyses.length;

  // Distribution calculations
  let shortTotal = 0, mediumTotal = 0, longTotal = 0;
  analyses.forEach(a => {
    if (a.sentence_metrics?.length_distribution) {
      shortTotal += a.sentence_metrics.length_distribution.short || 0;
      mediumTotal += a.sentence_metrics.length_distribution.medium || 0;
      longTotal += a.sentence_metrics.length_distribution.long || 0;
    }
  });

  // Average complexity
  const complexityScore = analyses.reduce((sum, a) => sum + (a.sentence_metrics?.complexity_score || 0), 0) / analyses.length;

  // Question frequency
  const questionFrequency = analyses.reduce((sum, a) => sum + (a.sentence_metrics?.question_frequency || 0), 0) / analyses.length;

  // Combine vocabulary metrics
  const lexicalDiversity = analyses.reduce((sum, a) => sum + (a.vocabulary_metrics?.lexical_diversity || 0), 0) / analyses.length;
  const formalityScore = analyses.reduce((sum, a) => sum + (a.vocabulary_metrics?.formality_score || 0), 0) / analyses.length;

  // Determine POV
  const povCounts = {};
  analyses.forEach(a => {
    const pov = a.narrative_characteristics?.pov;
    if (pov) {
      povCounts[pov] = (povCounts[pov] || 0) + 1;
    }
  });
  let dominantPov = "unknown";
  let maxCount = 0;
  Object.keys(povCounts).forEach(pov => {
    if (povCounts[pov] > maxCount) {
      dominantPov = pov;
      maxCount = povCounts[pov];
    }
  });

  // Determine tense
  const tenseCounts = {};
  analyses.forEach(a => {
    const tense = a.narrative_characteristics?.tense;
    if (tense) {
      tenseCounts[tense] = (tenseCounts[tense] || 0) + 1;
    }
  });
  let dominantTense = "unknown";
  maxCount = 0;
  Object.keys(tenseCounts).forEach(tense => {
    if (tenseCounts[tense] > maxCount) {
      dominantTense = tense;
      maxCount = tenseCounts[tense];
    }
  });

  // Calculate action to reflection ratio
  const actionRatio = analyses.reduce((sum, a) => sum + (a.narrative_characteristics?.action_to_reflection_ratio || 1), 0) / analyses.length;

  // Collect emotional tones
  const tones = new Set();
  analyses.forEach(a => {
    if (a.tone_attributes?.emotional_tone) {
      a.tone_attributes.emotional_tone.forEach(tone => tones.add(tone));
    }
  });

  // Determine formality level
  const formalityLevels = {};
  analyses.forEach(a => {
    const level = a.tone_attributes?.formality_level;
    if (level) {
      formalityLevels[level] = (formalityLevels[level] || 0) + 1;
    }
  });
  let dominantFormality = "neutral";
  maxCount = 0;
  Object.keys(formalityLevels).forEach(level => {
    if (formalityLevels[level] > maxCount) {
      dominantFormality = level;
      maxCount = formalityLevels[level];
    }
  });

  // Extract most frequent literary devices
  const deviceFrequencies = {
    metaphor: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.metaphor_frequency || 0), 0) / analyses.length,
    simile: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.simile_frequency || 0), 0) / analyses.length,
    alliteration: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.alliteration_frequency || 0), 0) / analyses.length,
    repetition: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.repetition_patterns || 0), 0) / analyses.length
  };

  // Collect authors
  const authors = new Set();
  analyses.forEach(a => {
    if (a.comparable_authors) {
      a.comparable_authors.forEach(author => authors.add(author));
    }
  });

  // Build the consolidated metrics
  return {
    sentence: {
      avg_length: avgSentenceLength,
      short: shortTotal / analyses.length,
      medium: mediumTotal / analyses.length,
      long: longTotal / analyses.length,
      complexity: complexityScore,
      questions: questionFrequency > 0.05
    },
    vocabulary: {
      diversity: lexicalDiversity,
      formality: formalityScore > 0.6 ? 'formal' : formalityScore > 0.4 ? 'neutral' : 'casual',
    },
    narrative: {
      pov: dominantPov,
      tense: dominantTense,
      description_heavy: actionRatio < 1,
      action_ratio: actionRatio
    },
    tone: {
      emotional: Array.from(tones),
      formality: dominantFormality,
      humor: "low" // Default, would be more sophisticated in real implementation
    },
    devices: {
      metaphors: deviceFrequencies.metaphor > 0.01,
      similes: deviceFrequencies.simile > 0.01,
      alliteration: deviceFrequencies.alliteration > 0.01,
      repetition: deviceFrequencies.repetition > 0.01
    },
    comparable_authors: Array.from(authors)
  };
}

// Check if an event exists
async function checkEventExists(supabase, eventId) {
  const { data, error } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();
  
  if (error) return false;
  return true;
}

// Check if a character exists
async function checkCharacterExists(supabase, characterId) {
  const { data, error } = await supabase
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .single();
  
  if (error) return false;
  return true;
}

// Check if a story exists
async function checkStoryExists(supabase, storyId) {
  const { data, error } = await supabase
    .from('stories')
    .select('id')
    .eq('id', storyId)
    .single();
  
  if (error) return false;
  return true;
}

// Word count utility
function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

module.exports = {
  calculateSentenceMetrics,
  calculateVocabularyMetrics,
  analyzeNarrativeCharacteristics,
  analyzeStyleDevices,
  analyzeTone,
  createExcerpt,
  generateDescription,
  formatStyleGuidance,
  combineMetrics,
  checkEventExists,
  checkCharacterExists,
  checkStoryExists,
  countWords
};
