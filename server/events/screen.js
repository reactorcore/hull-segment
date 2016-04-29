import track from './track';

export default function handleScreen(payload={}, context={}) {

  const { ship={} } = context;
  const { handle_screen } = ship.settings || {}
  if (!handle_screen) { return false }

  const { path, search, title } = payload.properties || {}
  const screen = {
    ...payload,
    event: 'screen',
    properties: {
      path,
      search,
      title,
      name: payload.name
    }
  }
  track(screen, context);
}
