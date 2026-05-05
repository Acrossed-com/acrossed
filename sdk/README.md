# acrossed

Tiny SDK for the Acrossed rule enforcement engine.

```ts
import { createClient } from "acrossed";

const ack = createClient({
  apiKey: process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
});

const result = await ack.checkRequest({
  ip: "1.2.3.4",
  method: "POST",
  path: "/login",
  headers: { "x-auth-token": "abc" },
  query: {},
});

if (result.decision === "deny") {
  console.log("blocked:", result.reason);
}
```

Every request is HMAC-SHA256 signed with a 10-second clock tolerance.
