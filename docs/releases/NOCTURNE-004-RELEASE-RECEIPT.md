# Nocturne Tokyo Photo Release Receipt

- Production site: `https://nocturne.shinpei.cc.cd`
- Deployment source commit:
  `3d40b750ced24fc1871734d81968a4f152cdf6f0`
- Sites version: 4
- Sites deployment:
  `https://nocturne-tokyo-2026.xlbljz698876.chatgpt.site`
- Previous production rollback: Sites version 3 at commit
  `ff69adaa1d06aeef38b23894748b00cf2f006f70`
- Release authorization: the Human Owner confirmed that the photographed
  people are adults and that the supplied images may be published on this site.

## Released scope

1. Added 21 supplied photographs to seven temporary cast profiles.
2. Rebuilt the home hero as a four-photo grid while retaining the established
   black, white, hot-pink and orange catalogue identity.
3. Added real multi-image profile galleries for Aika, Ren, Mio, Sora, Yuna,
   Kei and Nami.
4. Kept the remaining five profiles on the existing original placeholder
   portraits.
5. Replaced claims that all photographs depict fictional characters with
   explicit temporary-profile-copy language.
6. Fixed profile numbering on server-rendered profile routes.

## Privacy and asset handling

- Published filenames contain no original Telegram identifiers.
- JPEG application metadata was removed with a lossless `jpegtran -copy none`
  pass before committing the release assets.
- Download-source extended attributes are not part of the Git blobs or the
  packaged Sites archive.

## Release gates

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/rendered-html.test.mjs`: 2 passed, 0 failed.
- Desktop visual validation: passed.
- 390-pixel mobile validation: passed with no horizontal overflow.
- Local and production image checks: no broken photo assets.
- Public home route: HTTP 200.
- Public `/profile/yuna` route: HTTP 200.
- Public `/photos-preview/yuna-01.jpg` asset: HTTP 200, `image/jpeg`.
- Public `/favicon.svg` asset: HTTP 200, `image/svg+xml`.
- Custom domain: active.
- Custom-domain SSL: active.
- Recent Sites Worker invocations: no application execution failure.

## Rollback boundary

Sites version 3 remains the immediate rollback version. It contains the
previous reference-fidelity design with generated placeholder portraits and
was validated on the same custom domain.
