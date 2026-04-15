

# Update Backend URL to ngrok Tunnel

## Change

Update `src/lib/api.ts` to point `BACKEND_VERIFY_URL` fallback to `https://lushier-rosalia-superearthly.ngrok-free.dev/verify-proof` instead of `http://localhost:3001/verify-proof`.

## File: `src/lib/api.ts`

Change the default URL on line ~25 from:
```
"http://localhost:3001/verify-proof"
```
to:
```
"https://lushier-rosalia-superearthly.ngrok-free.dev/verify-proof"
```

This single change will wire all API calls (profile, admin, verifier, proof-count, etc.) through ngrok since `getBaseUrl()` derives the base from this URL.

