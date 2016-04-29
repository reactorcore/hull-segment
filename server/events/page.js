import track from './track';

export default function handlePage(payload={}, context) {
  const { path, search, title } = payload.properties || {}

  const page = {
    ...payload,
    event: 'page',
    properties: {
      path,
      search,
      title,
      name: payload.name
    }
  }

  track(page, context);
}
