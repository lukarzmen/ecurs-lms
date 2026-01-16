const EMPTY_NESTED_EDITOR_STATE_JSON = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

function migrateInlineImageNode(node: any): any {
  // Legacy payloads can be incomplete; ImageNode.importJSON expects `caption.editorState`.
  const migrated: any = {...node, type: 'image'};

  if (migrated.position !== undefined) {
    delete migrated.position;
  }

  if (typeof migrated.altText !== 'string') {
    migrated.altText = '';
  }

  if (typeof migrated.src !== 'string') {
    migrated.src = '';
  }

  if (typeof migrated.showCaption !== 'boolean') {
    migrated.showCaption = false;
  }

  if (!migrated.caption || typeof migrated.caption !== 'object') {
    migrated.caption = {editorState: EMPTY_NESTED_EDITOR_STATE_JSON};
  } else if (typeof migrated.caption.editorState !== 'string') {
    migrated.caption = {editorState: EMPTY_NESTED_EDITOR_STATE_JSON};
  }

  return migrated;
}

function deepMigrate(value: any): any {
  if (Array.isArray(value)) {
    return value.map(deepMigrate);
  }

  if (value && typeof value === 'object') {
    // Most Lexical nodes are plain objects. If it's a legacy inline image, migrate it.
    if (value.type === 'inline-image') {
      return deepMigrate(migrateInlineImageNode(value));
    }

    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepMigrate(v);
    }
    return out;
  }

  return value;
}

export function migrateLexicalStateJSON(input: string): string {
  try {
    const parsed = JSON.parse(input);
    const migrated = deepMigrate(parsed);
    return JSON.stringify(migrated);
  } catch {
    return input;
  }
}
