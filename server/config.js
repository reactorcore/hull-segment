import { resolve } from 'path';
import { readFileSync } from 'fs';

export function config(env={}, options={}) {
  var defaults = {
    globalSecret: env.SECRET || 'CHANGE_ME'
  };

  var cfg = {}, filename = options.f || env.CONFIG_FILE;

  if (filename) {
    cfg = JSON.parse(readFileSync(resolve(filename)));
  }


  return {...defaults, ...cfg};
}
