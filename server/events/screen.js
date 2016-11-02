import track from "./track";

export default function handleScreen(payload = {}, context = {}) {
  const { ship = {} } = context;
  const { handle_screens } = ship.settings || {};
  if (!handle_screens) { return false; }

  const { path, search, title } = payload.properties || {};
  const screen = {
    ...payload,
    event: "screen",
    properties: {
      name: payload.name,
      ...properties
    }
  };
  return track(screen, context);
}
