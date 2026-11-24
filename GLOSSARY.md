# Levaina

An AI coach that helps people with digestive problems find foods that agree with them and reach a healthy weight, by remembering their situation and working from it over time.

## Memory

**Memory**:
Something the coach keeps about a user across conversations. Every memory is either a Fact or an Episode.
_Avoid_: Note, profile entry, context

**Fact**:
A memory that is true about the user now, such as a diagnosis, a doctor's instruction or a goal weight. When it changes, it is superseded rather than edited.
_Avoid_: Attribute, setting

**Episode**:
A memory of something that happened on a specific day, such as a meal that caused bloating.
_Avoid_: Event, log entry

**Category**:
What a memory is about (condition, doctor instruction, medication, goal, body metric, symptom, food reaction, preference, constraint, other). Used to group memories, not to change how they behave.
_Avoid_: Type, tag

**Supersede**:
Replacing a Fact with a newer version while keeping the old one as history.
_Avoid_: Edit, overwrite

**Forget**:
Removing a memory at the user's request. It stops being used but can be recovered.
_Avoid_: Delete

## Log

**Log**:
The user's record of what happened, each item with the date and time it happened: meals, symptoms, stools, weigh-ins and notes. Unlike memory, the log is about events, not lasting truths.
_Avoid_: Diary, journal, history

**Log entry**:
One item in the log, of one kind (meal, symptom, stool, weight or note). Corrected by removing it and adding the right one.
_Avoid_: Record, event

**Red flag**:
Something that needs a doctor (blood or black stool, unexplained weight loss, persistent vomiting). The coach says so first and calmly; a red or black stool entry also raises a safety note.
_Avoid_: Alert, emergency (unless it is one)

## Research

**Research lookup**:
The coach searching trusted medical sources when someone asks about a study, a treatment or supplement claim, or something newer than it knows. Not used for routine advice.
_Avoid_: Web search, googling

**Trusted sources**:
The only sites a research lookup can reach: research databases and public-health bodies (PubMed, Cochrane, NHS, NIH, WHO and major journals).
_Avoid_: The web, the internet

## Evals

**Golden case**:
A situation with the behaviour a person has agreed is right ("had dal at 1" is a meal logged at 13:00 today). Golden cases are the answer key the coach is measured against; change one only on purpose.
_Avoid_: Test, example, fixture

**Tier**:
How hard a golden case is: easy, medium, hard, extreme (safety), research or ambiguous (the right move is to ask).
_Avoid_: Level, priority

**Experience case**:
A situation with real history (memories and a log), used to score how a reply feels: care, tone, being specific, showing progress.
_Avoid_: Scenario, persona

**Rubric**:
The pass/fail questions a reply is scored on (empathy and care, warm and light, specific, accurate, progress, next step, reason to come back), each with what passing means.
_Avoid_: Checklist, criteria

**Judge**:
A model that scores a reply in place of a person. Trusted for a check only after its verdicts and reasons agree with human scores.
_Avoid_: Grader, evaluator

