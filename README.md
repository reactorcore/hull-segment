
# Hull Segment Ship.

Integrates [Segment](http://segment.com) in your site without any code.

---

### Using :
- Go to your Hull dashboard > Ships > Add new
- Paste the following URL : `https://hull-ships.github.io/hull-segment/`
- Configure your selectors in the customize panel
- Add your ship to a Platform.

### Developing : 

- Fork
- Install

```sh
npm install -g gulp
npm install
gulp
```

# Secret Exchange: 

Go to your console and type: 

```
Hull.api({
  path: '563b8caf99585f7a30000077/secret',
  provider:'admin',
  organization:'a239c5b2'
})
```

Get the secret, paste in there: 

`CURL http://ship.dev/install?org=a239c5b2.hullbeta.io&shipId=563b8caf99585f7a30000077&shipSecret=XXX`
