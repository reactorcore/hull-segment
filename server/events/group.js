import { reduce, isEmpty } from 'lodash'
import { inspect } from 'util'

function searchUsers(userId, groupId, hull) {
  const params = {
    query: {
      filtered: {
        query: { match_all: {} },
        filter: {
          terms: { 'traits_group/id' : [groupId] }
        }
      }
    },
    raw: true,
    per_page: 250,
    include: ["id", "email", "external_id", "created_at", "traits_group/*"]
  };
  return hull.post('search/user_reports', params);
}

function updateUser(hull, traits, user) {
  const diff = reduce(traits, (t, v, k) => {
    // drop nested properties
    if (v !== user[`traits_group/${k}`] && typeof(v) !== 'object') {
      t[`group/${k}`] = v;
    }
    return t;
  }, {});

  if (process.env.DEBUG) {
    console.warn('[group]', { user, traits, diff });
  }

  if (!isEmpty(diff)) {
    return hull.as(user.id).traits(diff);
  }
}

export default function group(event, { hull, ship }) {
  const { handle_groups } = ship.settings || {};
  if (handle_groups === true) {
    const { userId, groupId, traits } = event;
    const doUpdate = updateUser.bind(null, hull, { ...traits, id: groupId });
    return searchUsers(userId, groupId, hull).then((res) => {
      const current_user = res.data.reduce((current, user) => {
        return user.external_id == userId ? user : current;
      }, { id: { external_id: userId } });
      const other_group_users = res.data.filter(u => u.external_id !== userId);
      const users = [current_user].concat(other_group_users);
      return Promise.all(users.map(doUpdate));
    });
  }
}
