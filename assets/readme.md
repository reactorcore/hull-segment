## Getting Started

Once you’ve installed the Segment ship on your organization, turn on Hull from the Segment integrations page. Get your API Key from ship's settings page on Hull and add it to segment.

Hull supports the `identify`, `track`, and `group` methods.

### Identify

Every user identified on Segment with a `userId` will be created as a User on Hull.

Segment's `userId` will be mapped to Hull's `external_id` field.

#### First level user attributes

The following traits will be stored as first level fields on the User object

- address
- contact_email
- created_at
- description
- email
- first_name
- image
- last_name
- name
- phone
- picture
- username

#### Custom traits

All other traits from the `identify` call will be stored as [custom traits](http://www.hull.io/docs/references/hull_js/#traits) on Hull.

### Track

Every `track` in Segment will create a new Event on Hull with `source:'segment'`.

### Group

Each group call in Segment will apply the group's traits as traits on the users that belong to the group.

For example:

      identify.group('123', { name: 'Wonderful', city: 'Paris' });

will add the following traits on all users that belong to the group :

      {
        group: {
          id: '123',
          name: 'Wonderful',
          city: 'Paris'
        }
      }

_Note: Internally, we flatten objects and use '/' as a separator, meaning they're really stored as `trait_group/name`. Our Libraries handle nesting for you when you receive data coming from Hull_

__Note: This feature is optional and not enabled by default. You should only be enabled if your users can only belong to one group.__


## Publishing data back to Segment

If you enter your __Segment Write Key__ in the Ship's settings, then Hull will send customer data to Segment. When a user enters or leaves a Hull segment, a new `identify` call with be sent with the following traits :

    analytics.identify(userId, {
      hull_segments: #all matching segment names joined by a ','#
    })


