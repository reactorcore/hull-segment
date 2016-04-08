import { reduce, isEmpty } from 'lodash'
import { inspect } from 'util'

function searchUsers(userId, groupId, hull) {
  const params = {
    query: {
      filtered: {
        query: { match_all: {} },
        filter: {
          or: {
            filters: [
              { terms: { traits_group__id: [groupId] } },
              { terms: { id: [userId] } },
              { terms: { external_id: [userId] } }
            ]
          }
        }
      }
    },
    raw: true,
    per_page: 250,
    include: ["id", "email", "external_id", "created_at", "traits_group__*"]
  };
  return hull.post('search/user_reports', params);
}

function updateUser(hull, traits, user) {
  const diff = reduce(traits, (t, v, k) => {
    if (v !== user[`traits_group__${k}`]) {
      t[`group__${k}`] = v;
    }
    return t;
  }, {});

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
      return Promise.all(res.data.map(doUpdate));
    });
  }
}
