import assign from 'object-assign';
import { resolve } from 'path';
import { readFileSync } from 'fs';

export function config(env={}, options={}) {
  var defaults = {
    globalSecret: env.GLOBAL_SECRET || 'CHANGE_ME',
    hull: {
      appId: env.HULL_APP_ID,
      orgUrl: env.HULL_ORG_URL,
      appSecret: env.HULL_APP_SECRET
    },
    "ship": {
      "private_settings": {
        "write_key": env.SEGMENT_WRITE_KEY
      }
    },
    mappings: {
    }
  };

  var cfg = {}, filename = options.f || env.CONFIG_FILE;

  if (filename) {
    cfg = JSON.parse(readFileSync(resolve(filename)));
  }


  return assign({}, defaults, cfg);
}
