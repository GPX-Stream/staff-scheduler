# Session Recap Command

Generate a comprehensive recap of this conversation session for future context, including critical analysis of working patterns.

## Instructions

1. **Analyze the entire conversation** from the beginning of this session
2. **Create a structured summary** that captures:
   - What was discussed
   - What decisions were made
   - What was created, modified, or deleted
   - Any open questions or next steps
   - Key context that future sessions should know
   - **Critical analysis of the user's working patterns, judgment, and knowledge**

3. **Save the recap** to `.claude/session-recaps/` with filename format:
   `YYYY-MM-DD-HH-MM-[brief-topic].md`

4. **Use this template** for the recap:

```markdown
# Session Recap: [Brief Topic Description]

**Date:** [Date and time]
**Duration Context:** [Short/Medium/Long session]

## Summary
[2-3 sentence overview of what was accomplished]

## Topics Discussed
- [Topic 1]
- [Topic 2]
- ...

## Decisions Made
- [Decision 1 with rationale if relevant]
- [Decision 2]
- ...

## Files Created/Modified
| File | Action | Description |
|------|--------|-------------|
| path/to/file | Created/Modified/Deleted | Brief description |

## Key Context for Future Sessions
[Important information that should be remembered - business rules established, preferences expressed, constraints identified]

## Open Items / Next Steps
- [ ] [Item 1]
- [ ] [Item 2]
- ...

---

## User Working Pattern Analysis

### Observed Strengths
[What the user did well - decision-making patterns, knowledge demonstrated, effective approaches]

### Areas for Growth
[Honest, constructive observations about patterns that could be improved - be specific and actionable]

### Knowledge Assessment
| Domain | Level | Notes |
|--------|-------|-------|
| [Domain 1] | Novice/Developing/Competent/Proficient/Expert | [Specific observations] |
| [Domain 2] | ... | ... |

### Decision-Making Patterns
- **Risk tolerance:** [Observations about how they approach risk]
- **Information gathering:** [Do they ask enough questions? Too many? Right ones?]
- **Delegation style:** [How do they delegate to Claude? Effective? Could improve?]
- **Clarity of requirements:** [How clear are their requests? What patterns emerge?]

### Suggested Improvements
[Specific, actionable suggestions for the user to consider - be direct but constructive]

1. **[Suggestion]**: [Why this would help and how to implement]
2. **[Suggestion]**: [Why this would help and how to implement]

### Communication Style Notes
[How does the user communicate? What works well? What could be clearer? Preferences to remember for future sessions]

### Collaboration Effectiveness
[How well did we work together? What could improve the collaboration?]

---

## Claude Self-Assessment

### What Went Well
[What Claude did effectively this session]

### What Could Be Improved
[Where Claude could have done better - missed context, wrong assumptions, inefficiencies]

### Adjustments for Next Session
[Specific changes to make based on this session's learnings]
```

5. **Critical Analysis Guidelines:**
   - Be **honest and direct** - flattery is not helpful
   - Focus on **patterns**, not isolated incidents
   - Make observations **specific and actionable**
   - Note both strengths AND growth areas - balance is key
   - Consider: decision quality, communication clarity, domain knowledge, process efficiency
   - Track **changes over time** if previous recaps exist
   - Include **self-assessment** of Claude's performance too

6. **After saving the recap**, update `.claude/CLAUDE.md`:
   - Add any new learnings to the `## Learnings & Adjustments` section
   - Include specific improvements Claude should make going forward
   - Remove outdated adjustments that have been integrated
   - Keep this section concise (5-10 bullet points max, prune old ones)

7. **Report to user** with:
   - The recap filename created
   - A brief summary of what was captured
   - **Key improvements identified** (from "What Could Be Improved" and "Adjustments")
   - Any updates made to CLAUDE.md
   - Reminder that they can use `/recap` anytime to save session context
