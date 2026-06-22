# TODO - Officers Roster Card Dynamics Fix



## Plan summary (approved steps)
1. Inspect current Officer card rendering for missing/incorrect fields and styling issues.
2. Inspect admin/officers roster pages that reuse the same OfficerCard.
3. Update `OfficerCard.jsx` to fix dynamic layout so cards have consistent height and show available officer fields reliably (no missing AY/office/username due to naming).
4. Update `OfficersCarousel.jsx` (and any admin roster grid if needed) so the `OfficerCard` receives normalized officer props (academicYear naming, avatar URL, activity status).
5. Verify basic UI behavior: image fallback, initials fallback, edit/delete menu positioning, text lines wrapping without overflow.
6. Run frontend lint/build (if available) or at least `npm test`/`npm run build` depending on project scripts.

## Progress
- [x] Step 1: Inspect current Officer card rendering
- [x] Step 2: Inspect admin/officers roster pages
- [x] Step 3: Update `OfficerCard.jsx`
- [x] Step 4: Update `OfficersCarousel.jsx` and/or admin grid for prop normalization
- [ ] Step 5: Verify UI behavior
- [ ] Step 6: Run frontend build/test



