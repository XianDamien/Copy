# AnGear Phase 2: Task-Driven Learning Transformation

## Philosophy: From Passive Review to Active Creation

AnGear represents a fundamental shift in language learning methodology. While traditional spaced repetition systems (like Anki) focus on **passive recognition** through time-based intervals, AnGear embraces **active creation** through task completion.

### Core Principle: Task Completion as Graduation

**"Once a user successfully completes a translation or retelling task, that card should be considered graduated."**

This principle recognizes that successful active language production (translation/retelling) is a much stronger indicator of mastery than passive recognition. From a cognitive science perspective, the act of successfully translating or retelling demonstrates:

1. **Comprehension**: Understanding the source material
2. **Retrieval**: Accessing relevant vocabulary and grammar
3. **Production**: Actively constructing language output
4. **Validation**: Self-assessment of the result

This single successful act represents a more robust memory consolidation event than multiple passive reviews.

## Architecture: Two-Phase Learning System

### Phase 1: Task Phase (Active Learning)
- **Applies to**: New cards and lapsed cards (failed reviews)
- **Goal**: Complete one successful translation/retelling task
- **Duration**: Until task completion (no time-based steps)
- **Graduation**: Immediate upon successful task completion
- **Philosophy**: "Learn by doing, not by waiting"

### Phase 2: Review Phase (Long-term Retention)
- **Applies to**: Graduated cards
- **Goal**: Long-term memory consolidation
- **Management**: Entirely FSRS-driven scheduling
- **Philosophy**: "Optimize retention through scientific spacing"

## User Experience Models

### Default Mode: Task-Driven Learning (Recommended)

**For New/Lapsed Cards:**
- No traditional rating buttons (Again, Hard, Good, Easy)
- Task-focused interface (translation/retelling input)
- Single action: "Submit Task" or "Mark Complete"
- Immediate graduation upon successful completion

**For Review Cards:**
- Standard four-button interface (Again, Hard, Good, Easy)
- FSRS-calculated intervals for optimal retention
- "Again" returns card to Task Phase for re-learning

### Advanced Mode: Traditional Learning Steps (Optional)

For users who prefer Anki-style learning:
- Configurable learning steps (e.g., "1m 10m")
- Time-based repetition within learning phase
- Traditional graduation rules (complete all steps)
- FSRS takes over after graduation

## Technical Implementation Strategy

### State Machine Design

```
New Card → [Task Phase] → Task Complete → [Review Phase] → FSRS Scheduling
    ↑                                           ↓
    └─────────── Review Failed (Again) ←────────┘
```

### Button Behavior Logic

**Task Phase (New/Lapsed):**
- Interface: Task completion UI
- Action: Submit task → Auto-rate as "Good" → Graduate to Review
- No manual rating required

**Review Phase (Graduated):**
- Interface: Standard rating buttons
- Actions:
  - Again: Return to Task Phase
  - Hard/Good/Easy: FSRS scheduling

### Configuration Flexibility

**Default Settings:**
- `enableTraditionalLearningSteps: false`
- Task-driven learning active
- FSRS handles all post-graduation scheduling

**Advanced Settings:**
- `enableTraditionalLearningSteps: true`
- Traditional learning steps active
- User-configurable step intervals

## Benefits of Task-Driven Approach

### Cognitive Advantages
1. **Stronger Memory Encoding**: Active production creates more robust memory traces
2. **Contextual Learning**: Tasks provide meaningful language use contexts
3. **Immediate Feedback**: Success/failure is immediately apparent
4. **Reduced Cognitive Load**: No need to self-assess difficulty levels during learning

### User Experience Advantages
1. **Clear Objectives**: "Complete the task" vs. "rate your performance"
2. **Natural Progression**: Task completion feels like genuine achievement
3. **Reduced Decision Fatigue**: Fewer rating decisions required
4. **Authentic Practice**: Real language use rather than recognition testing

### System Advantages
1. **Simplified Logic**: Binary task completion vs. multi-step progression
2. **Consistent Graduation**: All cards graduate through the same mechanism
3. **FSRS Optimization**: Algorithm handles what it does best (long-term scheduling)
4. **Flexible Architecture**: Easy to add new task types

## Implementation Phases

### Phase 2.3.1: Core Architecture
- Database schema updates (learningStep field)
- State machine implementation in fsrsService
- User settings for mode selection

### Phase 2.3.2: UI Transformation
- Task-driven review interface
- Conditional button rendering
- Settings page updates

### Phase 2.3.3: Testing & Validation
- Comprehensive test coverage
- User experience validation
- Performance optimization

## Compatibility & Migration

### Backward Compatibility
- Existing cards automatically get `learningStep: 0`
- Current review functionality remains intact
- Gradual migration path for users

### Advanced User Support
- Traditional mode preserves Anki-like experience
- Full configurability of learning steps
- Expert settings for fine-tuning

## Success Metrics

### Learning Effectiveness
- Task completion rates
- Long-term retention (FSRS metrics)
- User engagement and session duration

### User Satisfaction
- Preference for task-driven vs. traditional mode
- Perceived learning progress
- System usability scores

### Technical Performance
- Response times for task evaluation
- Database query efficiency
- Memory usage optimization

---

This transformation represents AnGear's evolution from a traditional SRS tool to an innovative, task-driven language learning platform that prioritizes active language production over passive recognition, while maintaining the scientific rigor of modern spaced repetition algorithms. 