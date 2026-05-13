# KIXIZZ STUDIO Portfolio — TODO

- [x] Custom plumeria flower cursor (dot + ring with hover spin effect)
- [x] Site title/meta updated to "KIXIZZ STUDIO" with description "designing the world of my dreams"
- [x] UI Design page with Budget App and Tarot Arcana project cards
- [x] Budget App page: fully rebuilt as native React component library showcase (BudgetApp.tsx)
- [x] Tarot Arcana page: Express backend route /tarot-static serving self-contained standalone HTML
- [x] Fix TypeScript error in Home.tsx (removed incorrectly injected useAuth line)
- [x] TarotApp.tsx updated to use /tarot-static as iframe src
- [x] Removed old tarot files from client/public/ (tarot-app.txt, tarot/) to prevent deployment timeouts
- [x] Verified /tarot-static returns text/html with correct 1.28MB content
- [x] Fixed actual root cause: original tarot export uses wouter with base="" — router couldn't match /tarot-app/ path
- [x] Served original tarot export (index.html + assets/) under /tarot-app/ via Express static middleware
- [x] Patched asset paths in index.html from /assets/ to ./assets/ (relative)
- [x] Patched wouter base in index-CITzkABF.js from "" to "/tarot-app" so router matches correctly
- [x] Removed ugly generated tarot thumbnail from UIDesign page
- [x] Verified tarot app renders correctly: full arc card spread, all 78 cards, dark mystical design
