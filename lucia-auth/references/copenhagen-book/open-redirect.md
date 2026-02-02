<!--
Source: https://github.com/pilcrowOnPaper/copenhagen/blob/main/pages/open-redirect.md
Commit: 39f2f9da54b922101d2024199cbb207e070e1c12
Fetched: 2026-02-02
-->

---
title: "Open redirect"
---

# Open redirect

Open redirect is a vulnerability where your application allows a user to control a redirect.

For example, you may want to redirect the user back to their original page after they sign in. To achieve this, you add a `redirect_to` URL query parameter to the login page and form. When a user signs in, the user is redirected to the location defined in `redirect_to`.

```
https://example.com/login?redirect_to=%2Fhome
```

But what if you accept any redirect location without validating it?

```
https://example.com/login?redirect_to=https%3A%2F%2Fscam.com
```

This may seem harmless at first, but it makes it significantly easier to scam users. The user could be redirected to an identical site made by an attacker and be prompted to enter their password again.
