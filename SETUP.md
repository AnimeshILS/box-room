# Box Room — installable app

Five files make the app, plus `Code.gs` which replaces the backend on the sheet.

```
index.html              the app
manifest.webmanifest    makes Android offer "Install app"
sw.js                   caches the app on the phone, so it opens with no network
logo.png                header logo  (placeholder — swap in the real ILS logo)
icon-192.png            home screen icon
icon-512.png            home screen icon
icon-maskable-512.png   home screen icon, Android adaptive shape
.nojekyll               tells GitHub Pages to serve the files as-is
Code.gs                 → paste into Apps Script, not into GitHub
```

## 1. Backend

1. Open the Box Room sheet → Extensions → Apps Script.
2. Replace all of `Code.gs` with the new one.
3. Set `TOKEN` on line 27 to a passphrase of your choosing. This is what each
   phone types once. It is the only thing protecting the sheet, so make it
   awkward to guess — three or four unrelated words is plenty.
4. Deploy → Manage deployments → pencil icon → Version: **New version** → Deploy.
   Keep the same deployment so the URL does not change.

The old `Data` sheet migrates into new `Inventory` and `Sessions` sheets on the
first run and is left untouched as a backup.

## 2. Host the app

Upload everything except `Code.gs` to a GitHub repo, then Settings → Pages →
Source: *Deploy from a branch* → `main` / root. The app lands at
`https://<user>.github.io/<repo>/`.

Optional: paste the `/exec` URL into `index.html` where it says `__EXEC_URL__`
(line 2 of the script block). Then phones only ever ask for the passphrase.
Leave it alone and the first screen asks for the URL as well — both work.

## 3. Install on each Android phone

1. Open the Pages URL in Chrome.
2. Menu (⋮) → **Add to Home screen** → Install.
3. Open it from the home screen, type the passphrase once.

From then on it opens from the phone's own storage. No address bar, no wait,
and it keeps working with the wifi off — taps and commits queue up and go to
the sheet when the signal comes back.

## Updating the app later

Change the files, bump `SHELL_CACHE` in `sw.js` (e.g. `v2.0.1`), re-upload.
Phones show a "new version ready" bar the next time they open it.
