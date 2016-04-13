const request = require('supertest');
const app = require('../index').default;
const { track, alias } = require('./fixtures');
const assert = require('assert')

describe('Segment Ship', () => {
  function sendRequest({ params, body, headers }) {
    const client = request(app({ secret: 'shuut' }));
    return client .post('/segment', params)
                  .set(headers || {})
                  .type('json')
                  .send(body);
  }

  it('should return Invalid body error', (done) => {
      sendRequest({ body: 'boom' })
          .expect({ message: 'Invalid body' })
          .expect(400, done)
  });

  it('should return Invalid body error', (done) => {
      sendRequest({ body: track })
          .expect({ message: 'Missing credentials' })
          .expect(400, done)
  });

  it('should return Missing cerdentials', (done) => {
      sendRequest({ body: track })
          .expect({ message: 'Missing credentials' })
          .expect(400, done)
  });

  it('should return Missing cerdentials', (done) => {
      sendRequest({ body: track })
          .expect({ message: 'Missing credentials' })
          .expect(400, done)
  });

})
