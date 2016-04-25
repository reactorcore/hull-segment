import { reduce, isEmpty, values, map, throttle } from 'lodash'
import Promise from 'bluebird';

const BATCH_HANDLERS = {};
const MAX_BATCH_SIZE = parseInt(process.env.MAX_BATCH_SIZE || 100, 10);
const BATCH_THROTTLE = parseInt(process.env.BATCH_THROTTLE || 5000, 10);

const noop = function() {};

export class GroupBatchHandler {

  constructor({ hull, ship, measure, log }) {
    this.hull = hull;
    this.ship = ship;
    this.measure = (metric, value) => {
      if (typeof(measure) === 'function') {
        measure(`request.group.${metric}`, value)
      }
    };

    this.log = log || noop;
    this.groups = {};
    this.status = 'idle';
    this.flushLater = throttle(this.flush.bind(this), BATCH_THROTTLE);
    this.stats = { flush: 0, add: 0, flushing: 0, success: 0, error: 0 };
  }

  static handle(event, { hull, ship, measure, log }) {
    const handler = BATCH_HANDLERS[ship.id] = BATCH_HANDLERS[ship.id] || new GroupBatchHandler({ hull, ship, measure, log });
    handler.add(event, { hull, ship });

    if (Object.keys(handler.groups).length > MAX_BATCH_SIZE) {
      handler.flush();
    } else {
      handler.flushLater();
    }

    return handler;
  }

  add(event, { hull, ship }) {
    this.stats.add += 1;
    this.hull = hull;
    this.ship = ship;
    const { userId, groupId, traits } = event;
    const group = this.groups[groupId] || { groupId, userIds: [], traits: {} };
    group.traits = Object.assign({}, group.traits || {}, traits, { id: groupId });
    if (userId && !group.userIds.includes(userId)) {
      group.userIds.push(userId)
    }

    this.groups[groupId] = group;

    return this;
  }

  searchUsers(groupIds) {
    const params = {
      query: {
        filtered: {
          query: { match_all: {} },
          filter: {
            terms: { 'traits_group/id' : groupIds }
          }
        }
      },
      raw: true,
      per_page: 250,
      include: ["id", "email", "external_id", "created_at", "traits_group/*"]
    };

    const { hull, measure } = this;

    return new Promise((resolve, reject) => {
      const users = {};

      (function fetch(page = 1) {
        const pageParams = Object.assign({}, params, { page });
        const startTime = new Date();
        return hull.post('search/user_reports', pageParams).then(({ data, pagination }) => {
          measure('searchResponseTime', new Date() - startTime);
          data.map(u => users[u.id] = u)
          if (pagination.page >= pagination.pages) {
            resolve(values(users));
          } else {
            fetch(page + 1);
          }
        });
      })();
    })
  }

  getUsersByGroup(groupIds = []) {
    return this.searchUsers(groupIds).then(users => {
      return users.reduce((groups, user) => {
        const groupId = user['traits_group/id'];
        groups[groupId] = groups[groupId] || {};
        if (user.external_id) {
          groups[groupId][user.external_id] = user;
        }
        return groups;
      }, groupIds.reduce((g,i) => { g[i] = {}; return g }, {}));
    });
  }

  updateUsers(users, traits) {
    return Promise.all(users.map(user => this.updateUser(user, traits)));
  }

  updateUser(user, traits) {
    const diff = reduce(traits, (t, v, k) => {
      // drop nested properties
      if (v !== user[`traits_group/${k}`] && typeof(v) !== 'object') {
        t[`group/${k}`] = v;
      }
      return t;
    }, {});

    if (!isEmpty(diff)) {
      this.measure('updateUser');
      return this.hull.as(user.id).traits(diff).then(() => {
        return { as: user.id, traits: diff };
      });
    } else {
      return Promise.resolve({ as: user.id });
    }
  }

  flush() {
    this.measure('flush');
    this.stats.flush += 1;
    this.stats.flushing += 1;
    const groupIds = Object.keys(this.groups);
    const groups = this.groups;
    this.groups = {};
    var ret = this.getUsersByGroup(groupIds).then((usersByGroup) => {
      return Promise.all(map(usersByGroup, (groupUsers, groupId) => {
        const { traits, userIds } = groups[groupId] || {};
        const currentUsers = (userIds || []).reduce((cids, id) => {
          cids[id]  = { id: { external_id: id } };
          return cids;
        }, {});

        const users = values(Object.assign({}, currentUsers, groupUsers));

        this.log('group.flush', { stats: this.stats, shipId: this.ship.id, groupId, users: users.length, traits });

        return this.updateUsers(users, traits).then((res) => {
          this.status = 'idle';
          return { users: res, groupId };
        });
      }));
    });

    ret.then(() => {
      this.stats.success += 1;
      this.stats.flushing -= 1;
    }, (err) => {
      this.stats.error += 1;
      this.stats.flushing -= 1;
    })
    return ret;
  }
}

let exiting = false;

function group(event, { hull, ship, measure }) {
  const { handle_groups } = ship.settings || {};
  if (exiting) {
    const err = new Error('Exiting...');
    err.status = 503;
    return Promise.reject(err);
  } else if (event && event.groupId && handle_groups === true) {
    return GroupBatchHandler.handle(event, { hull, ship, measure });
  }
}

group.flush = function() {
  if (!exiting) {
    exiting = true;
    return Promise.all(map(BATCH_HANDLERS, (h) => h.flush()));
  }
}

export default group;
