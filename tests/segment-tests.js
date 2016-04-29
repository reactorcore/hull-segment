const request = require('supertest');
const app = require('../server/index');
const { track, identify, group, page, screen } = require('./fixtures');
const sinon = require('sinon');
const assert = require('assert');
const jwt = require('jwt-simple');

const API_RESPONSES = {
  'default': {
    settings: { 
      handle_page: false,
      handle_screen: false
    }    
  },
  page: {
    settings: { 
      handle_page: true,
      handle_screen: false
    }    
  },
  screen: {
    settings: { 
      handle_page: false,
      handle_screen: true
    }    
  }
}

const Mocks = {
  Hull() {
    this.get = (id, params)=> {
      if (id === 'not_found') {
        return Promise.reject(new Error('Not found'));
      } else {
        return Promise.resolve(API_RESPONSES.default);
      }
    }
    this.post = ()=> {
      return Promise.resolve({})
    }
    this.put = ()=> {
      return Promise.resolve({})
    }
    this.as = () => {
      return this;
    }
  }
}

describe('Segment Ship', () => {

  const secret = 'shuut';

  const config = {
    organization: 'abc.hullapp.dev',
    ship: '56f3d53ef89a8791cb000004',
    secret
  };

  function sendRequest({ query, body, headers, Hull, measure, log }) {
    const MockedHull = Hull || Mocks.Hull;
    MockedHull.NotifHandler = () => { return () => {} };
    const client = request(app({ secret, Hull: MockedHull, measure, log }));
    return client .post('/segment')
                  .query(query || config)
                  .set(headers || {})
                  .type('json')
                  .send(body || track);
  }

  describe('Error payloads', () => {
    it('Invalid body', (done) => {
      sendRequest({ body: 'boom' })
          .expect({ message: 'Invalid body' })
          .expect(400, done)
    });

    it('Missing credentials', (done) => {
      sendRequest({ body: track, query: {} })
          .expect({ message: 'Missing credentials' })
          .expect(400, done)
    });
  })

  describe('With credentials - webhook style', () => {
    it('should return 200 with valid claims', (done) => {
      sendRequest({ body: track, query: config })
          .expect({ message: 'thanks' })
          .expect(200, done)
    });
  })

  describe('With credentials - direct style', () => {
    it('should return 200 with a valid token', (done) => {
      const token = jwt.encode(config, secret);
      sendRequest({ body: track, headers: { authorization: `Basic ${new Buffer(token).toString('base64')}`  } })
          .expect({ message: 'thanks' })
          .expect(200, done)
    });

    it('should return Invalid token with a token signed with a bogus signature', (done) => {
      const token = jwt.encode(config, secret + 'boom');
      sendRequest({ body: track, headers: { authorization: `Basic ${token}`  } })
          .expect({ message: 'Invalid token' })
          .expect(401, done)
    });

    it('should return Missing credentials with a token with missing claims', (done) => {
      const token = jwt.encode({ organization: 'abc.boom', secret: 'shuuttt' }, secret);
      sendRequest({ body: track, headers: { authorization: `Basic ${new Buffer(token).toString('base64')}`  } })
          .expect({ message: 'Missing credentials' })
          .expect(400, done)
    });
  })

  describe('Ship not found', () => {
    it('should return 401 if ship is not found', (done) => {
      sendRequest({ body: track, query: { ...config, ship: 'not_found'} })
          .expect({ message: "Not found" })
          .expect(401, done)
    })
  });

  describe('Call type not supported', () => {
    it('should return 401 if ship is not found', (done) => {
      sendRequest({ body: { type: 'bogus' }, query: config })
          .expect({ message: "Not supported" })
          .expect(501, done);
    })
  });


  describe('Handling events', () => {

    it('call Hull.track on track event', (done) => {
      const postSpy = sinon.spy();
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.default)
        this.as = () => this;
        this.post = (path, params) => {
          postSpy(path, params.event);
          return Promise.resolve();
        }
      }
      sendRequest({ body: track, query: config, Hull: MockHull })
          .expect({ message: 'thanks' })
          .expect(200)
          .end((err, res) => {
            assert(postSpy.withArgs('t', 'Viewed Checkout Step').calledOnce)
            done()
          })
    })


    it('call Hull.track on page event', (done) => {
      const postSpy = sinon.spy();
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.page)
        this.as = () => {
          return this
        };
        this.post = (path, params) => {
          postSpy(path, params.event);
          return Promise.resolve();
        }
      }
      sendRequest({ body: page, query: config, Hull: MockHull })
        .expect({ message: 'thanks' })
        .expect(200)
        .end((err, res) => {
          assert(postSpy.withArgs('t','page').calledOnce)
          done()
        })
    })

    it('should not Hull.track on page event by default', (done) => {
      const postSpy = sinon.spy();
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.default)
        this.as = () => {
          return this
        };
        this.post = (path, params) => {
          postSpy(path, params.event);
          return Promise.resolve();
        }
      }
      sendRequest({ body: page, query: config, Hull: MockHull })
        .expect({ message: 'thanks' })
        .expect(200)
        .end((err, res) => {
          assert.equal(postSpy.callCount, 0)
          done()
        })
    })


    it('call Hull.track on screen event', (done) => {
      const postSpy = sinon.spy();
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.screen)
        this.as = () => this;
        this.post = (path, params) => {
          postSpy(path, params.event);
          return Promise.resolve();
        }
      }
      sendRequest({ body: screen, query: config, Hull: MockHull })
          .expect({ message: 'thanks' })
          .expect(200)
          .end((err, res) => {
            assert(postSpy.withArgs('t', 'screen').calledOnce)
            done()
          })
    })    

    it('should not Hull.track on screen event by default', (done) => {
      const postSpy = sinon.spy();
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.default)
        this.as = () => {
          return this
        };
        this.post = (path, params) => {
          postSpy(path, params.event);
          return Promise.resolve();
        }
      }
      sendRequest({ body: screen, query: config, Hull: MockHull })
        .expect({ message: 'thanks' })
        .expect(200)
        .end((err, res) => {
          assert.equal(postSpy.callCount, 0)
          done()
        })
    })

    it('call Hull.traits on identify event', (done) => {
      const putSpy = sinon.spy();
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.default)
        this.as = () => this;
        this.post = (url, params) => {
          putSpy(url, params);
          return Promise.resolve('');
        }
      }
      sendRequest({ body: identify, query: config, Hull: MockHull })
          .expect(200)
          .expect({ message: 'thanks' })
          .end((err, res) => {
            assert(putSpy.withArgs('firehose/traits').calledOnce)
            done()
          })
    })
  })

  describe('Collecting measure', () => {
    it('call measure collector', (done) => {
      const measure = sinon.spy();
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.default)
        this.as = () => this;
        this.post = (path, params) => {
          return Promise.resolve();
        }
      }
      sendRequest({ measure })
          .expect({ message: 'thanks' })
          .expect(200)
          .end((err, res) => {
            assert(measure.withArgs('segment.request.track', 1, { source: config.ship }).calledOnce)
            done()
          })
    })

  })

  describe('Collecting logs', () => {
    it('call logs collector', (done) => {
      const log = sinon.spy(function(msg, data) {
        console.warn('YOU SPYED ON MY LOGZ ?', {msg, data})
      });
      const MockHull = function() {
        this.get = (id) => Promise.resolve(API_RESPONSES.default)
        this.as = () => this;
        this.post = (path, params) => {
          return Promise.resolve();
        }
      }
      sendRequest({ log })
          .expect({ message: 'thanks' })
          .expect(200)
          .end((err, res) => {
            assert(log.calledOnce)
            done()
          })
    })

  })

})
