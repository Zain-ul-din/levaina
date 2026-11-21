# Gut Coach

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
