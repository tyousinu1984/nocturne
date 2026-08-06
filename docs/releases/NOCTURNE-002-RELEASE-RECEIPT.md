# NOCTURNE TOKYO Visual-Fidelity Release Receipt

## Release status

- Prepared: 2026-08-06
- Production site: `https://nocturne.shinpei.cc.cd`
- Source branch: `main`
- Release source commit:
  `ff69adaa1d06aeef38b23894748b00cf2f006f70`
- Sites version: 3
- Deployment result: succeeded
- Deployment URL:
  `https://nocturne-tokyo-2026.xlbljz698876.chatgpt.site`
- Custom-domain result: active with HTTPS
- Rollback boundary: Sites version 1 at commit
  `d265405ec3825c3a92251ef0242f817bf2e6e810`

## Human Owner authorization and rights boundary

On 2026-08-06, the Human Owner instructed the project to maximize the public
reference site's visual recognition, rebuild the candidate and publish it to
the existing `nocturne.shinpei.cc.cd` domain for sharing.

This authorization covers the original project implementation and
task-generated substitute imagery. It does not claim ownership of the public
reference site, its trademark, source code, written copy, fonts or media.
None of those source assets are included in this release.

## Generated asset provenance

Portrait generation used the built-in ImageGen workflow. The source generation
created a 4×3 contact sheet of twelve clearly adult, fully clothed fictional
Japanese women, aged 28 to 38, in commercial studio portrait lighting on a
black background with pink and orange rim light.

- Original generation file:
  `/Users/shinpei/.codex/generated_images/019fd62a-e141-7852-a50e-9ae3d2dd82e7/call_b8USCyzlR8CuDvLQkqZOBEAL.png`
- Original generation SHA-256:
  `511af6b46afe7f9d3476638e8b7e21800a61b48a14b30a105d9df8fc3ab6457c`
- Production derivatives: twelve square profile portraits and one four-person
  lineup image under `public/portraits/`

The social preview was generated once from the original lineup image using
the built-in ImageGen edit workflow.

- Original social-card generation file:
  `/Users/shinpei/.codex/generated_images/019fd62a-e141-7852-a50e-9ae3d2dd82e7/call_0ldDlIEL96purDp8BRIeFpem.png`
- Source and production SHA-256:
  `538f93d970179e358c14a4d27e7fa972bb39b4c2d6de9a8898f0e83ff7d21fbf`
- Production file: `public/og.png`
- Prompt direction: 1536×1024 black, white, hot-pink and orange social card;
  heavy condensed sans-serif type; exact `NOCTURNE TOKYO`, `CAST DIRECTORY`,
  district and fictional-adult labels; four fully clothed adult women;
  no source brand, transaction details, explicit content, astrology, serif
  type or purple styling

## Production asset hashes

| Asset | SHA-256 |
| --- | --- |
| `public/portraits/aika.jpg` | `632ebf3f819331bd476226c38ef4b1389c6ee13c6d5ba6ebaab1f8c9c44cae02` |
| `public/portraits/ema.jpg` | `e929c2e43369a131542cd7759ea60c38131c75cb6f73d7df3c520fc693a1681d` |
| `public/portraits/hana.jpg` | `8b2ad607c46d6370912cef5ba85ed864783b80a9057ef445e578f2ee6bf191b1` |
| `public/portraits/hero-lineup.jpg` | `68f8b8bdde250b32c4804a41c2cb1adf63640d18e693177aeb78aa0e43d99dfb` |
| `public/portraits/kei.jpg` | `94446ce1bec50febcdd95dd66e3d9cf47406b6189dec061b8d2ba4988ccd4cb0` |
| `public/portraits/mei.jpg` | `f3575507898fa006803a451c3f6b569a3e5960ae556577cf25fbeaa7675e7ffd` |
| `public/portraits/mio.jpg` | `1e4fc35a018a396ff4f84da510358e6d55329e811d943964d084e3cccf5c2c9e` |
| `public/portraits/nami.jpg` | `731af0a28962a02b7ae518acd1e09c97d9fdcc7e5796b92ff3ab2b2d3ee2f216` |
| `public/portraits/noa.jpg` | `cb64a3168d31fc799e731b7b405669a25e5630ce69de7dcb0ac2c5a072d92990` |
| `public/portraits/ren.jpg` | `645191c9491e2f1e6a675e8a27f0003b0078fd98950b4326874bea88bfbc4d4b` |
| `public/portraits/rin.jpg` | `14029c69e7d0da9fd8563be718daa920f9305afb15a722e614a5a3f9820761cb` |
| `public/portraits/sora.jpg` | `089d34cfd6ffdf0f21881109f53c30e5eabdadb06d72b8e30715993305c2510f` |
| `public/portraits/yuna.jpg` | `2c0c2770f7f554ba0ef66b0c5f7d7c58f2b6e2a1b5e272427cab8f20923392f9` |
| `public/og.png` | `538f93d970179e358c14a4d27e7fa972bb39b4c2d6de9a8898f0e83ff7d21fbf` |

## Validation record

- ESLint: pass
- Production build: pass
- Rendered HTML tests: 2 pass
- Production dependency audit: 0 vulnerabilities
- Final UI hygiene: pass
- Desktop browser: five entry tiles, ten navigation links, 400px hero and four
  directory columns; no overflow
- Mobile browser: two directory columns, ten-link drawer and no overflow
- Accessibility: age gate and mobile drawer isolate their background, retain
  keyboard focus and restore focus on close
- Independent review: conditionally passed; remaining conditions are commit,
  versioned deployment and public HTTPS smoke checks

## Production result

Sites version 2 first published the visual rebuild at commit
`b8ea5b525862ec58e290fe44caff03c4d8b146df`. Browser validation found a
Vinext client-side RSC prefetch error caused by framework links. That version
was immediately superseded.

The hotfix replaces framework-prefetched links with normal same-origin anchors
and was released as Sites version 3 from commit
`ff69adaa1d06aeef38b23894748b00cf2f006f70`.

Post-release evidence:

- `/`: HTTP 200, new age gate and NOCTURNE TOKYO metadata
- `/profile/aika`: HTTP 200, new image-forward profile dossier
- `/favicon.svg`: HTTP 200
- `/og.png`: HTTP 200, 1536×1024, production hash matches the source asset
- Public browser: no ChatGPT sign-in surface
- Public browser console: no warnings or errors on home or profile
- Sites Worker error logs: no events in the release validation window
- Custom domain: active, SSL active and serving Sites version 3

Release status: completed. Human Owner visual acceptance remains a separate
product-review decision.
