import path from 'node:path';

const BACKEND_ROOT = path.resolve(__dirname, '../../..');

export const DATA_DIRECTORY = path.join(BACKEND_ROOT, 'data');
export const MEDIA_INDEX_FILE = path.join(DATA_DIRECTORY, 'media-index.json');
