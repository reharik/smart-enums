/**
 * Best-effort stack-trace parsing for diagnostics (duplicate-install
 * detection, enum-name collision warnings).
 *
 * A literal `import.meta.url` would be the obvious way to ask "where is this
 * file", but some consumer toolchains (babel-based test transforms) fail to
 * *parse* files containing `import.meta` when compiling to CJS; a stack trace
 * works in both module systems with no special syntax. Parsing can fail on
 * exotic engines or formats — callers must treat an empty result as "unknown"
 * and stay silent rather than guess.
 */

export type StackFrame = { fn: string | undefined; file: string };

const FRAME_RE = /^\s*at (?:(.+?) )?\(?(?:file:\/\/)?(.+?):\d+:\d+\)?\s*$/;

/**
 * Parses a V8-style stack string into frames, skipping the message line.
 * Unparseable lines are dropped.
 */
export const parseStackFrames = (stack: string | undefined): StackFrame[] => {
  if (!stack) return [];
  const frames: StackFrame[] = [];
  for (const line of stack.split('\n').slice(1)) {
    const match = FRAME_RE.exec(line);
    if (match) frames.push({ fn: match[1], file: match[2] });
  }
  return frames;
};

/** Directory portion of a file path; handles both separators. */
export const dirOf = (filePath: string): string => {
  const cut = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return cut >= 0 ? filePath.slice(0, cut) : filePath;
};
