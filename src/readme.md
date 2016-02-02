This ship integrates Hull and Segment together to simplify your analytics setup.

# Client-Side
- Forwards `Hull.track()`, `Hull.trait()` and identity events to Segments.
- If you use Hull to handle your user identities, everything is automatic. Login, Logout, Signup events will be tracked properly.

# Server-Side
Sends Segment updates to Segment. Whenever a customer enters or leaves a Segment you defined in the Hull Dashboard, or changes, it will send the updated User profile to Segment. The new profile will contain an updated list of segments which the user belongs to.

It will also trigger a "User Updated" event containing the same data for use in your other tools.
