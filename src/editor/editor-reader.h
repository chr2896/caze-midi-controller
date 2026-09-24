#ifndef EDITOR_READER_H
#define EDITOR_READER_H

// USB editor protocol: snapshots and checked, sequential configuration writes.
void updateEditorReader(bool allowWrites);
bool editorStoragePending();
bool editorTakeSaved();

#endif
