# URL Shortening Service

Simple Express + MongoDB URL shortener.

## Endpoints

- `POST /shortUrl`
  - Request body: `{ "longUrl": "https://example.com" }`
  - Response: created short URL object
- `GET /:shortId`
  - Redirects to the stored long URL and increments `accessCount`
- `PATCH /:shortId`
  - Request body can include `longUrl` and/or `accessCount`

## Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start MongoDB locally or set `MONGODB_URI`.
3. Run:
   ```bash
   npm start
   ```

## Notes

- Default MongoDB URI: `mongodb://127.0.0.1:27017/url_shortener`
- Port: `3000` by default
