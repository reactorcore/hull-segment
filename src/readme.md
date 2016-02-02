This ship sends Hull data to Segment.

# Client-Side

Sends `Hull.track()`, `Hull.trait()` to Segment and performs `analytics.identify` for you. If you use Hull to handle your user identities, everything is automatic. Login, Logout, Signup events will be tracked properly.

# Server-Side

Sends Hull User Updates and Segment changes to __Segment.com__. Whenever a user changes, or enters or leaves a Hull Segment, it will send the updated User profile to Segment. The new profile will contain an updated list of segments which the user belongs to.

It will also trigger a "User Updated" event containing the same data for use in your other tools.

# Setup

- Go to your Segment dashboard. Click `Setup > Install a library`
- In the __Browser__ tab, select the write key, and paste it in the Hull Dashboard
