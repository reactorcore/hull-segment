import track from './track';

export default function handlePage(payload={}, context={}) {
  const { ship={} } = context;
  const { handle_page } = ship.settings || {}
  if (!handle_page) { return false }
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
