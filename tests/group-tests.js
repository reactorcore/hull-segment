const _ = require('lodash');
const GroupBatchHandler = require('../server/events/group').GroupBatchHandler;
const assert = require('assert');
const sinon = require('sinon');

function makeGroupId(num) {
  return `groupId-${num || Math.round(Math.random() * 10 / 2)}`;
}

function makeUser(user, groupIds) {
  const groupId = _.sample(groupIds || []) || makeGroupId();
  return Object.assign({
    'id': _.uniqueId('userId-'),
    'external_id':  _.uniqueId('externalId-'),
    'traits_group/id':  groupId
  }, user || {});
}

function makeUsers(count, user, groupIds) {
  return _.range(count).map(makeUser.bind(undefined, user, groupIds));
}

const Mocks = {
  Hull(options = {}) {

    this.options = options;

    this.post = (path, params={})=> {
      try {
        const { page } = params;
        const result = {
          pagination: { page: page, pages: this.options.pages || 2 },
          data: makeUsers(this.options.makeUsers || 10, {}, this.options.groupIds)
        };
        return Promise.resolve(result);
      } catch(err) {
        return Promise.reject(err);
      }
    }

    this.as = (asUser) => {
      this.options.as = asUser;
      return this;
    }

    this.traits = (traits) => {
      return Promise.resolve({});
    }
  }
}

describe('GroupBatchHandler', () => {
  const ship = { id: 'shipId' };
  const users = makeUsers(10);

  it('should make users', () => {
    assert(users.length === 10)
  });

  it('GroupBatchHandler.add', (done) => {
    const hull = new Mocks.Hull();
    const handler = new GroupBatchHandler(hull, ship);
    const groupId = makeGroupId(1);
    const userId = _.uniqueId('externalId-');

    handler.add({ userId, groupId, traits: { bim: 'bam' } }, { hull, ship });
    handler.add({ userId, groupId, traits: { chick: 'chack' } }, { hull, ship });
    handler.add({ userId, groupId, traits: { bim: 'boum' } }, { hull, ship });
    handler.add({ userId: '123', groupId: makeGroupId(2), traits: { bim: 'boum' } }, { hull, ship });

    assert.deepEqual(Object.keys(handler.groups), [makeGroupId(1), makeGroupId(2)]);

    assert.deepEqual(handler.groups[groupId].userIds, [userId]);

    assert.deepEqual(handler.groups[groupId].traits, { id: groupId, bim: 'boum', chick: 'chack' });

    done();
  });

  it('GroupBatchHandler.searchUsers', (done) => {
    const hull = new Mocks.Hull();
    hull.post = sinon.spy(hull.post);

    const handler = new GroupBatchHandler(hull, ship);
    handler.searchUsers().then((users) => {
      assert.equal(users.length, 20);
      assert.equal(hull.post.callCount, 2);
    }).then(done);
  });

  it('GroupBatchHandler.getUsersByGroup', (done) => {
    const hull = new Mocks.Hull();
    hull.post = sinon.spy(hull.post);
    const handler = new GroupBatchHandler(hull, ship);
    handler.getUsersByGroup([]).then((groups) => {
      const groupId = Object.keys(groups)[0];
      const group = groups[groupId];
      const userId = Object.keys(group)[0];
      const user = group[userId];
      assert.deepEqual(user['external_id'], userId);
      assert.deepEqual(user['traits_group/id'], groupId);
    }).then(done);
  });

  it('GroupBatchHandler.flush', (done) => {
    const hull = new Mocks.Hull({ makeUsers: 1, groupIds: [makeGroupId(1)] });
    hull.as = sinon.spy(hull.as);
    hull.traits = sinon.spy(hull.traits);
    const handler = new GroupBatchHandler(hull, ship);
    const groupId = makeGroupId(1);
    const userId = _.uniqueId('externalId-');

    handler.add({ userId, groupId, traits: { bim: 'bam' } }, { hull, ship });
    handler.add({ userId, groupId, traits: { chick: 'chack' } }, { hull, ship });
    handler.add({ userId, groupId, traits: { bim: 'boum' } }, { hull, ship });


    handler.flush().then((res) => {
      const { users, groupId } = res[0];

      assert.equal(res.length, 1);
      assert.equal(hull.as.callCount, 3);
      assert.equal(hull.traits.callCount, 3);

      const currentUser = users[0];
      const groupUser = users[1];

      assert(hull.as.calledWith(currentUser.as));
      assert(hull.as.calledWith(groupUser.as));
      assert(hull.traits.calledWith({ 'group/id': groupId, 'group/bim' : 'boum', 'group/chick' : 'chack' }));
      assert(hull.traits.calledWith({ 'group/bim' : 'boum', 'group/chick' : 'chack' }));
    }, done).then(done).catch(done);

  });

});
